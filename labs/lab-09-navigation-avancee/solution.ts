// =============================================================================
// Lab 09 — Navigation avancee (Solution)
// =============================================================================
// Execution : npx tsx labs/lab-09-navigation-avancee/solution.ts
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
  assertLength,
} from '../test-utils.ts';

const { test, run } = createTestRunner('Lab 09 — Navigation avancee (Solution)');

// =============================================================================
// Types
// =============================================================================

interface DeepLinkConfig {
  screens: Record<string, string | DeepLinkScreenConfig>;
}

interface DeepLinkScreenConfig {
  path: string;
  screens?: Record<string, string | DeepLinkScreenConfig>;
}

interface DeepLinkMatch {
  routeName: string;
  params: Record<string, string>;
}

interface AuthRoute {
  name: string;
  requiresAuth: boolean;
  component?: string;
}

interface NestedNavigationState {
  routeName: string;
  params?: Record<string, unknown>;
  child?: NestedNavigationState;
}

interface TabBadgeManager {
  increment: (tab: string) => void;
  reset: (tab: string) => void;
  getCount: (tab: string) => number;
  getTabs: () => string[];
  getTotalCount: () => number;
}

// =============================================================================
// Exercice 1 : createDeepLinkConfig
// =============================================================================

function createDeepLinkConfig(
  screens: Record<string, string>
): DeepLinkConfig {
  return { screens: { ...screens } };
}

// =============================================================================
// Exercice 2 : createAuthNavigator
// =============================================================================

function createAuthNavigator(
  isLoggedIn: boolean,
  routes: AuthRoute[]
): AuthRoute[] {
  return routes.filter((route) => route.requiresAuth === isLoggedIn);
}

// =============================================================================
// Exercice 3 : buildNestedState
// =============================================================================

function buildNestedState(
  path: string,
  params?: Record<string, unknown>
): NestedNavigationState {
  const segments = path.split('/');

  if (segments.length === 1) {
    const state: NestedNavigationState = { routeName: segments[0] };
    if (params) {
      state.params = params;
    }
    return state;
  }

  // Construire de la fin vers le debut
  let current: NestedNavigationState = {
    routeName: segments[segments.length - 1],
  };
  if (params) {
    current.params = params;
  }

  for (let i = segments.length - 2; i >= 0; i--) {
    current = {
      routeName: segments[i],
      child: current,
    };
  }

  return current;
}

// =============================================================================
// Exercice 4 : createTabBadgeManager
// =============================================================================

function createTabBadgeManager(tabs: string[]): TabBadgeManager {
  const counts = new Map<string, number>();
  const tabList = [...tabs];

  for (const tab of tabList) {
    counts.set(tab, 0);
  }

  return {
    increment(tab: string) {
      if (!counts.has(tab)) {
        throw new Error(`Tab "${tab}" does not exist`);
      }
      counts.set(tab, counts.get(tab)! + 1);
    },

    reset(tab: string) {
      if (counts.has(tab)) {
        counts.set(tab, 0);
      }
    },

    getCount(tab: string): number {
      return counts.get(tab) ?? 0;
    },

    getTabs(): string[] {
      return [...tabList];
    },

    getTotalCount(): number {
      let total = 0;
      for (const count of counts.values()) {
        total += count;
      }
      return total;
    },
  };
}

// =============================================================================
// Exercice 5 : matchDeepLink
// =============================================================================

function matchDeepLink(
  url: string,
  config: Record<string, string>
): DeepLinkMatch | null {
  const urlSegments = url === '' ? [] : url.split('/');

  for (const [routeName, pattern] of Object.entries(config)) {
    const patternSegments = pattern === '' ? [] : pattern.split('/');

    // Le nombre de segments doit correspondre
    if (urlSegments.length !== patternSegments.length) {
      continue;
    }

    const params: Record<string, string> = {};
    let matches = true;

    for (let i = 0; i < patternSegments.length; i++) {
      const patSeg = patternSegments[i];
      const urlSeg = urlSegments[i];

      if (patSeg.startsWith(':')) {
        // Segment dynamique : extraire le parametre
        const paramName = patSeg.slice(1);
        params[paramName] = urlSeg;
      } else if (patSeg !== urlSeg) {
        // Segment statique qui ne correspond pas
        matches = false;
        break;
      }
    }

    if (matches) {
      return { routeName, params };
    }
  }

  return null;
}

// =============================================================================
// Tests
// =============================================================================

// --- Exercice 1 : createDeepLinkConfig ---

test('Ex1: cree une config de deep linking simple', () => {
  const config = createDeepLinkConfig({
    Home: '',
    Details: 'details/:id',
    Profile: 'profile/:userId',
  });
  assertDeepEqual(config, {
    screens: {
      Home: '',
      Details: 'details/:id',
      Profile: 'profile/:userId',
    },
  });
});

test('Ex1: config vide retourne un objet screens vide', () => {
  const config = createDeepLinkConfig({});
  assertDeepEqual(config, { screens: {} });
});

test('Ex1: config avec chemins complexes', () => {
  const config = createDeepLinkConfig({
    Search: 'search/:query',
    Settings: 'settings',
    EditProfile: 'profile/edit',
  });
  assertEqual(config.screens['Search'], 'search/:query');
  assertEqual(config.screens['Settings'], 'settings');
  assertEqual(config.screens['EditProfile'], 'profile/edit');
});

// --- Exercice 2 : createAuthNavigator ---

test('Ex2: utilisateur connecte voit les ecrans authentifies', () => {
  const routes: AuthRoute[] = [
    { name: 'Home', requiresAuth: true },
    { name: 'Profile', requiresAuth: true },
    { name: 'Login', requiresAuth: false },
    { name: 'Register', requiresAuth: false },
  ];
  const visible = createAuthNavigator(true, routes);
  assertLength(visible, 2);
  assertEqual(visible[0].name, 'Home');
  assertEqual(visible[1].name, 'Profile');
});

test('Ex2: utilisateur deconnecte voit les ecrans publics', () => {
  const routes: AuthRoute[] = [
    { name: 'Home', requiresAuth: true },
    { name: 'Profile', requiresAuth: true },
    { name: 'Login', requiresAuth: false },
    { name: 'Register', requiresAuth: false },
  ];
  const visible = createAuthNavigator(false, routes);
  assertLength(visible, 2);
  assertEqual(visible[0].name, 'Login');
  assertEqual(visible[1].name, 'Register');
});

test('Ex2: liste vide retourne un tableau vide', () => {
  const visible = createAuthNavigator(true, []);
  assertLength(visible, 0);
});

// --- Exercice 3 : buildNestedState ---

test('Ex3: chemin a un segment', () => {
  const state = buildNestedState('Home');
  assertDeepEqual(state, { routeName: 'Home' });
});

test('Ex3: chemin a trois segments', () => {
  const state = buildNestedState('MainTabs/HomeTab/Details');
  assertEqual(state.routeName, 'MainTabs');
  assertEqual(state.child!.routeName, 'HomeTab');
  assertEqual(state.child!.child!.routeName, 'Details');
  assertEqual(state.child!.child!.child, undefined);
});

test('Ex3: params attaches au dernier segment', () => {
  const state = buildNestedState('MainTabs/Details', { id: '42' });
  assertEqual(state.routeName, 'MainTabs');
  assertEqual(state.params, undefined);
  assertEqual(state.child!.routeName, 'Details');
  assertDeepEqual(state.child!.params, { id: '42' });
});

// --- Exercice 4 : createTabBadgeManager ---

test('Ex4: increment et getCount', () => {
  const mgr = createTabBadgeManager(['Home', 'Cart', 'Profile']);
  assertEqual(mgr.getCount('Cart'), 0);
  mgr.increment('Cart');
  mgr.increment('Cart');
  mgr.increment('Cart');
  assertEqual(mgr.getCount('Cart'), 3);
});

test('Ex4: reset remet a zero', () => {
  const mgr = createTabBadgeManager(['Home', 'Cart']);
  mgr.increment('Cart');
  mgr.increment('Cart');
  mgr.reset('Cart');
  assertEqual(mgr.getCount('Cart'), 0);
});

test('Ex4: increment sur tab inexistant leve une erreur', () => {
  const mgr = createTabBadgeManager(['Home', 'Cart']);
  assertThrows(() => mgr.increment('Unknown'));
});

test('Ex4: getTotalCount retourne la somme', () => {
  const mgr = createTabBadgeManager(['Home', 'Cart', 'Notif']);
  mgr.increment('Cart');
  mgr.increment('Cart');
  mgr.increment('Notif');
  assertEqual(mgr.getTotalCount(), 3);
});

test('Ex4: getTabs retourne la liste des tabs', () => {
  const mgr = createTabBadgeManager(['Home', 'Cart', 'Profile']);
  assertDeepEqual(mgr.getTabs(), ['Home', 'Cart', 'Profile']);
});

// --- Exercice 5 : matchDeepLink ---

test('Ex5: match route avec parametre', () => {
  const result = matchDeepLink('details/42', {
    Home: '',
    Details: 'details/:id',
  });
  assertDeepEqual(result, { routeName: 'Details', params: { id: '42' } });
});

test('Ex5: match route vide (home)', () => {
  const result = matchDeepLink('', { Home: '', Details: 'details/:id' });
  assertDeepEqual(result, { routeName: 'Home', params: {} });
});

test('Ex5: aucun match retourne null', () => {
  const result = matchDeepLink('unknown/path', {
    Home: '',
    Details: 'details/:id',
  });
  assertEqual(result, null);
});

test('Ex5: match avec plusieurs parametres', () => {
  const result = matchDeepLink('profile/abc/posts', {
    UserPosts: 'profile/:userId/posts',
    Home: '',
  });
  assertDeepEqual(result, { routeName: 'UserPosts', params: { userId: 'abc' } });
});

// =============================================================================
// Lancement
// =============================================================================

run();
