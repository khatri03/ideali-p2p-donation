import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { e2eEnv } from './e2eEnv';

interface SqlConnection {
  server: string;
  database: string;
  user: string;
  password: string;
}

/**
 * The credentials are read from the API's own gitignored secrets file rather than copied into a second
 * place, so the suite can never drift from the database the API is actually talking to, and no
 * connection string is duplicated into a file that might one day be committed.
 */
const readConnection = (): SqlConnection => {
  const raw = readFileSync(e2eEnv.apiSecretsFile, 'utf8');
  const match = raw.match(/"DefaultConnection"\s*:\s*"([^"]+)"/);

  if (!match) {
    throw new Error(`No DefaultConnection found in ${e2eEnv.apiSecretsFile}.`);
  }

  const parts = new Map<string, string>();
  for (const segment of match[1].split(';')) {
    const separator = segment.indexOf('=');
    if (separator < 1) continue;
    parts.set(segment.slice(0, separator).trim().toLowerCase(), segment.slice(separator + 1).trim());
  }

  const server = parts.get('server') ?? parts.get('data source');
  const database = parts.get('database') ?? parts.get('initial catalog');
  const user = parts.get('user id') ?? parts.get('uid');
  const password = parts.get('password') ?? parts.get('pwd');

  if (!server || !database || !user || !password) {
    throw new Error('DefaultConnection is missing server, database, user or password.');
  }

  return { server, database, user, password };
};

const connection = readConnection();

/**
 * Callers concatenate their own columns with SQL_COLUMN_SEPARATOR rather than relying on sqlcmd's
 * -s flag: a column value can contain a comma or a pipe, but never a unit separator, so a name with
 * punctuation in it can never be mistaken for a column boundary.
 */
const COLUMN_SEPARATOR = String.fromCharCode(31);
export const SQL_COLUMN_SEPARATOR = 'CHAR(31)';

/**
 * execFileSync puts the whole command line, password included, into the message of any error it
 * throws - and Playwright writes that message into the run output, the HTML report and the trace.
 * Every failure path therefore goes through here, so the credential never reaches a file on disk.
 */
const withoutCredentials = (text: string): string => text.split(connection.password).join('***');

/**
 * -I enables quoted identifiers, which sqlcmd leaves off by default. Without it every write to a
 * table carrying a filtered index - which CampaignFundraiser does - is refused outright.
 *
 * Runs a statement and returns one trimmed line per row. Failures are re-thrown carrying the server's
 * own message, which is what makes a broken query diagnosable from the test output.
 */
export const query = (sql: string): string[] => {
  let output: string;

  try {
    output = execFileSync(
      e2eEnv.sqlcmdPath,
      [
        '-S', connection.server,
        '-d', connection.database,
        '-U', connection.user,
        '-P', connection.password,
        '-C',
        '-b',
        '-I',
        '-h', '-1',
        '-W',
        '-Q', `SET NOCOUNT ON; ${sql}`,
      ],
      { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (failure) {
    const details = failure as { stdout?: string; stderr?: string };
    const reported = [details.stdout, details.stderr].filter(Boolean).join('\n').trim();

    throw new Error(withoutCredentials(reported || 'sqlcmd failed without producing any output.'));
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

export const queryColumns = (sql: string): string[][] =>
  query(sql).map((row) => row.split(COLUMN_SEPARATOR).map((column) => column.trim()));

export const querySingleValue = (sql: string): string => {
  const rows = query(sql);

  if (rows.length !== 1) {
    throw new Error(`Expected exactly one row, got ${rows.length}.`);
  }

  return rows[0];
};

export const execute = (sql: string): void => {
  query(sql);
};
