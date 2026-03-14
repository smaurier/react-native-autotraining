// =============================================================================
// Lab 09 — Navigation avancee (Exercice)
// =============================================================================
// Execution : npx tsx labs/lab-09-navigation-avancee/exercise.ts
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

const { test, run } = createTestRunner('Lab 09 — Navigation avancee');

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
// Cree une configuration de deep linking a partir d'un mapping simple
// { routeName: urlPath }.
//
// createDeepLinkConfig(screens) -> DeepLinkConfig
//
// Exemple :
// createDeepLinkConfig({
//   Home: '',
//   Details: 'details/:id',
//   Profile: 'profile/:userId',
// })
// -> { screens: { Home: '', Details: 'details/:id', Profile: 'profile/:userId' } }
// =============================================================================

// TODO: Implementez createDeepLinkConfig

// =============================================================================
// Exercice 2 : createAuthNavigator
// Filtre les routes selon l'etat d'authentification.
//
// createAuthNavigator(isLoggedIn, routes) -> Route[]
//
// - Si isLoggedIn=true : retourne uniquement les routes avec requiresAuth=true
//   et celles sans requiresAuth (screens communes)
// - Si isLoggedIn=false : retourne uniquement les routes avec requiresAuth=false
//
// Chaque route a: { name: string, requiresAuth: boolean }
// =============================================================================

// TODO: Implementez createAuthNavigator

// =============================================================================
// Exercice 3 : buildNestedState
// Construit un etat de navigation imbrique a partir d'un chemin.
//
// buildNestedState('MainTabs/HomeTab/Details') ->
// {
//   routeName: 'MainTabs',
//   child: {
//     routeName: 'HomeTab',
//     child: {
//       routeName: 'Details',
//     }
//   }
// }
//
// Le chemin peut aussi contenir des params :
// buildNestedState('MainTabs/Details', { id: '42' }) ->
// {
//   routeName: 'MainTabs',
//   child: {
//     routeName: 'Details',
//     params: { id: '42' }
//   }
// }
// (les params sont attaches au dernier segment)
// =============================================================================

// TODO: Implementez buildNestedState

// =============================================================================
// Exercice 4 : createTabBadgeManager
// Gere les badges des onglets.
//
// createTabBadgeManager(tabs: string[]) -> TabBadgeManager
//
// - increment(tab) : incremente le compteur du tab (+1)
// - reset(tab) : remet le compteur a 0
// - getCount(tab) : retourne le compteur (0 si inconnu)
// - getTabs() : retourne la liste des tabs
// - getTotalCount() : retourne la somme de tous les compteurs
//
// Si le tab n'existe pas dans la liste initiale, increment leve une erreur.
// =============================================================================

// TODO: Implementez createTabBadgeManager

// =============================================================================
// Exercice 5 : matchDeepLink
// Fait correspondre une URL a une route en utilisant une config de deep linking.
//
// matchDeepLink(url, config) -> DeepLinkMatch | null
//
// La config est un objet { routeName: urlPattern } ou urlPattern peut contenir
// des segments dynamiques prefixes par ':'.
//
// Exemples :
// matchDeepLink('details/42', { Details: 'details/:id' })
//   -> { routeName: 'Details', params: { id: '42' } }
// matchDeepLink('unknown/path', { Details: 'details/:id' })
//   -> null
// matchDeepLink('', { Home: '' })
//   -> { routeName: 'Home', params: {} }
// matchDeepLink('profile/abc/posts', { UserPosts: 'profile/:userId/posts' })
//   -> { routeName: 'UserPosts', params: { userId: 'abc' } }
// =============================================================================

// TODO: Implementez matchDeepLink

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
