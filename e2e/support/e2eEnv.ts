import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_FILE = '.env.e2e.local';

/**
 * The suite reads one gitignored file rather than pulling in a dotenv dependency for six keys. Values
 * are taken verbatim after the first '=' so passwords containing '=' survive intact, and anything
 * already exported in the shell wins so CI can override without editing a file.
 */
const readEnvFile = (): Record<string, string> => {
  const entries: Record<string, string> = {};

  let contents: string;
  try {
    contents = readFileSync(resolve(process.cwd(), ENV_FILE), 'utf8');
  } catch {
    return entries;
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;

    entries[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim();
  }

  return entries;
};

const fileValues = readEnvFile();

/**
 * A missing entry fails the run immediately naming the variable, rather than surfacing later as a
 * login timeout nobody can diagnose.
 */
const required = (name: string): string => {
  const value = process.env[name] ?? fileValues[name];

  if (!value) {
    throw new Error(
      `${name} is missing. Copy .env.e2e.example to ${ENV_FILE} and fill it in before running the e2e suite.`,
    );
  }

  return value;
};

export const e2eEnv = {
  baseUrl: required('E2E_BASE_URL'),
  apiBaseUrl: required('E2E_API_BASE_URL'),
  organizerUsername: required('E2E_ORGANIZER_USERNAME'),
  organizerPassword: required('E2E_ORGANIZER_PASSWORD'),
  sqlcmdPath: required('E2E_SQLCMD'),
  apiSecretsFile: required('E2E_API_SECRETS_FILE'),
};

export const STORAGE_STATE_PATH = 'e2e/.auth/organizer.json';

/**
 * Where the organiser's access token is kept for the run. The sign-in endpoint allows five attempts
 * a minute per address - a real protection that this suite must not need relaxing - so the token is
 * produced once by the setup project and read by every api spec instead of each one signing in.
 */
export const API_TOKEN_PATH = 'e2e/.auth/organizer-token.txt';
