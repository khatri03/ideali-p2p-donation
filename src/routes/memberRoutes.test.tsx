import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MemberRoute = { name: string; path: string; navbarTitle?: string };

const loadRoutes = async (): Promise<MemberRoute[]> => {
  const module = await import('./memberRoutes');

  return module.memberRoutes as unknown as MemberRoute[];
};

const routeAt = (routes: MemberRoute[], path: string) => routes.find((route) => route.path === path);

const signedInAs = (role: string, modules: string[]) => {
  localStorage.setItem('currentRole', role);
  localStorage.setItem(
    'AuthToken',
    ['header', btoa(JSON.stringify({ userAllowedModules: modules.join(',') })), 'signature'].join('.'),
  );
};

describe('memberRoutes', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * The three screens were withdrawn from the menu, not deleted. Naming a route is what puts it in the
   * sidebar, so an empty name is the whole mechanism; if a name comes back the item comes back with it.
   */
  it.each([
    ['/dashboard'],
    ['/my-donations'],
    ['/discover'],
  ])('Sidebar_WithdrawnScreen_%s_IsNotNamedInTheMenu', async (path) => {
    signedInAs('Donor', ['Donation']);

    const route = routeAt(await loadRoutes(), path);

    expect(route).toBeDefined();
    expect(route.name).toBe('');
  });

  /**
   * A withdrawn menu item must still carry a title, because the navbar reads the title of whichever
   * route the address matches. Without one the screen would head itself with an empty string.
   */
  it.each([
    ['/dashboard', 'Dashboard'],
    ['/my-donations', 'Donations'],
    ['/discover', 'Discover'],
  ])('Sidebar_WithdrawnScreen_%s_StillTitlesItself', async (path, title) => {
    signedInAs('Donor', ['Donation']);

    expect(routeAt(await loadRoutes(), path).navbarTitle).toBe(title);
  });

  /**
   * Sign-in sends every supporter to /member/dashboard. A token that carries no allowed-modules claim
   * falls back to a role filter, and that filter used to pick the landing screen out by its menu label.
   * Withdrawing the label must not withdraw the screen, or the first thing a member sees is nothing.
   */
  it('Routing_TokenWithoutModuleClaim_StillRegistersTheScreenSignInLandsOn', async () => {
    localStorage.setItem('currentRole', 'Member');

    expect(routeAt(await loadRoutes(), '/dashboard')).toBeDefined();
  });

  /**
   * Withdrawing three items must leave the rest of the menu alone, or the change has quietly become a
   * redesign of the supporter's navigation.
   */
  it('Sidebar_OtherScreens_KeepTheirNames', async () => {
    signedInAs('Member', ['Donation,Membership']);

    const routes = await loadRoutes();

    expect(routeAt(routes, '/settings').name).toBe('Settings');
    expect(routeAt(routes, '/membership-history').name).toBe('Membership History');
    expect(routeAt(routes, '/documents').name).toBe('Documents');
  });
});
