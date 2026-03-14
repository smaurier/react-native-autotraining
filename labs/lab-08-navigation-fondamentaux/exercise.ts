// =============================================================================
// Lab 08 — React Navigation fondamentaux (Exercice)
// =============================================================================
// Execution : npx tsx labs/lab-08-navigation-fondamentaux/exercise.ts
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

const { test, run } = createTestRunner('Lab 08 — React Navigation fondamentaux');

// =============================================================================
// Types
// =============================================================================

interface Route {
  name: string;
  params?: Record<string, unknown>;
}

interface NavigationState {
  routes: Route[];
  index: number;
}

interface ScreenOptions {
  title?: string;
  headerShown?: boolean;
  headerStyle?: Record<string, string>;
  headerTintColor?: string;
  headerRight?: string;
  headerLeft?: string;
  animation?: string;
  presentation?: string;
}

interface TypedRoute<T extends Record<string, Record<string, unknown> | undefined>> {
  name: keyof T & string;
  params?: T[keyof T & string];
}

interface TypedRouter<T extends Record<string, Record<string, unknown> | undefined>> {
  navigate: <K extends keyof T & string>(
    name: K,
    ...args: T[K] extends undefined ? [] : [T[K]]
  ) => void;
  getRoutes: () => Array<{ name: keyof T & string; params?: T[keyof T & string] }>;
  getCurrentRoute: () => { name: keyof T & string; params?: T[keyof T & string] } | undefined;
}

// =============================================================================
// Exercice 1 : createNavigationStack
// Implementez une pile de navigation avec push, pop, replace, reset, canGoBack.
//
// - push(name, params?) : ajoute un ecran au sommet de la pile
// - pop() : retire l'ecran au sommet (erreur si un seul ecran)
// - replace(name, params?) : remplace l'ecran au sommet
// - reset(routes) : reinitialise la pile avec les routes donnees
// - canGoBack() : true si la pile contient plus d'un ecran
// - getCurrentRoute() : retourne la route au sommet
// - getState() : retourne l'etat complet { routes, index }
// =============================================================================

// TODO: Implementez createNavigationStack(initialRoute: Route)

// =============================================================================
// Exercice 2 : createTypedRouter
// Creez un routeur type-safe. Il valide que les noms de routes et les
// parametres correspondent a la definition.
//
// - navigate(name, params?) : ajoute la route (erreur si nom invalide)
// - getRoutes() : retourne la liste des routes visitees
// - getCurrentRoute() : retourne la derniere route visitee
//
// Le routeur recoit un objet de definition :
// { routeName: ['param1', 'param2'] | null }
// null = pas de parametres, tableau = parametres obligatoires
// =============================================================================

// TODO: Implementez createTypedRouter(routeDefinitions)

// =============================================================================
// Exercice 3 : serializeNavigationState / deserializeNavigationState
// Serialisez et deserialisez un etat de navigation vers/depuis JSON.
//
// serializeNavigationState(state) -> string JSON
// deserializeNavigationState(json) -> NavigationState (erreur si invalide)
//
// Validation : routes doit etre un tableau non vide, index doit etre valide
// =============================================================================

// TODO: Implementez serializeNavigationState et deserializeNavigationState

// =============================================================================
// Exercice 4 : createScreenOptions
// Cree des options d'ecran en fusionnant des defaults avec des overrides.
//
// createScreenOptions(defaults, overrides) -> ScreenOptions fusionnees
//
// Les overrides ecrasent les defaults. Les valeurs undefined dans overrides
// ne doivent PAS ecraser les defaults.
// =============================================================================

// TODO: Implementez createScreenOptions

// =============================================================================
// Exercice 5 : resolveHeaderTitle
// Determine le titre du header selon la priorite :
// 1. options.title (si defini)
// 2. options.headerTitle (si defini, string uniquement)
// 3. routeName en fallback
//
// resolveHeaderTitle(options, routeName) -> string
// =============================================================================

// TODO: Implementez resolveHeaderTitle

// =============================================================================
// Tests
// =============================================================================

// --- Exercice 1 : createNavigationStack ---

test('Ex1: push ajoute un ecran a la pile', () => {
  const nav = createNavigationStack({ name: 'Home' });
  nav.push('Details', { id: 42 });
  const state = nav.getState();
  assertLength(state.routes, 2);
  assertEqual(state.index, 1);
  assertEqual(state.routes[1].name, 'Details');
  assertDeepEqual(state.routes[1].params, { id: 42 });
});

test('Ex1: getCurrentRoute retourne le sommet de la pile', () => {
  const nav = createNavigationStack({ name: 'Home' });
  nav.push('Details', { id: 1 });
  nav.push('Profile', { userId: 'abc' });
  assertEqual(nav.getCurrentRoute().name, 'Profile');
  assertDeepEqual(nav.getCurrentRoute().params, { userId: 'abc' });
});

test('Ex1: pop retire le sommet de la pile', () => {
  const nav = createNavigationStack({ name: 'Home' });
  nav.push('Details');
  nav.push('Profile');
  nav.pop();
  assertEqual(nav.getCurrentRoute().name, 'Details');
  assertLength(nav.getState().routes, 2);
});

test('Ex1: pop sur un seul ecran leve une erreur', () => {
  const nav = createNavigationStack({ name: 'Home' });
  assertThrows(() => nav.pop());
});

test('Ex1: canGoBack', () => {
  const nav = createNavigationStack({ name: 'Home' });
  assertFalse(nav.canGoBack());
  nav.push('Details');
  assertTrue(nav.canGoBack());
  nav.pop();
  assertFalse(nav.canGoBack());
});

test('Ex1: replace remplace le sommet', () => {
  const nav = createNavigationStack({ name: 'Home' });
  nav.push('Login');
  nav.replace('Dashboard', { userId: '1' });
  assertEqual(nav.getCurrentRoute().name, 'Dashboard');
  assertDeepEqual(nav.getCurrentRoute().params, { userId: '1' });
  assertLength(nav.getState().routes, 2);
});

test('Ex1: reset reinitialise la pile', () => {
  const nav = createNavigationStack({ name: 'Home' });
  nav.push('A');
  nav.push('B');
  nav.push('C');
  nav.reset([{ name: 'NewHome' }, { name: 'NewDetails', params: { x: 1 } }]);
  assertLength(nav.getState().routes, 2);
  assertEqual(nav.getState().index, 1);
  assertEqual(nav.getCurrentRoute().name, 'NewDetails');
});

test('Ex1: reset avec tableau vide leve une erreur', () => {
  const nav = createNavigationStack({ name: 'Home' });
  assertThrows(() => nav.reset([]));
});

// --- Exercice 2 : createTypedRouter ---

test('Ex2: navigate ajoute une route valide', () => {
  const router = createTypedRouter({
    Home: null,
    Details: ['id', 'title'],
    Profile: ['userId'],
  });
  router.navigate('Home');
  router.navigate('Details', { id: 42, title: 'Article' });
  assertLength(router.getRoutes(), 2);
  assertEqual(router.getCurrentRoute()!.name, 'Details');
});

test('Ex2: navigate vers une route inexistante leve une erreur', () => {
  const router = createTypedRouter({
    Home: null,
    Details: ['id'],
  });
  assertThrows(() => router.navigate('Unknown' as any));
});

test('Ex2: navigate avec parametres manquants leve une erreur', () => {
  const router = createTypedRouter({
    Home: null,
    Details: ['id', 'title'],
  });
  assertThrows(() => router.navigate('Details', { id: 42 } as any));
});

test('Ex2: navigate sans params sur route sans params fonctionne', () => {
  const router = createTypedRouter({
    Home: null,
    About: null,
  });
  router.navigate('Home');
  router.navigate('About');
  assertEqual(router.getCurrentRoute()!.name, 'About');
});

// --- Exercice 3 : serializeNavigationState / deserializeNavigationState ---

test('Ex3: serialize puis deserialize donne le meme etat', () => {
  const state: NavigationState = {
    routes: [
      { name: 'Home' },
      { name: 'Details', params: { id: 42 } },
    ],
    index: 1,
  };
  const json = serializeNavigationState(state);
  const restored = deserializeNavigationState(json);
  assertDeepEqual(restored, state);
});

test('Ex3: deserialize JSON invalide leve une erreur', () => {
  assertThrows(() => deserializeNavigationState('not json'));
});

test('Ex3: deserialize etat sans routes leve une erreur', () => {
  assertThrows(() => deserializeNavigationState(JSON.stringify({ index: 0 })));
});

test('Ex3: deserialize etat avec routes vides leve une erreur', () => {
  assertThrows(() => deserializeNavigationState(JSON.stringify({ routes: [], index: 0 })));
});

test('Ex3: deserialize avec index hors limites leve une erreur', () => {
  const json = JSON.stringify({
    routes: [{ name: 'Home' }],
    index: 5,
  });
  assertThrows(() => deserializeNavigationState(json));
});

// --- Exercice 4 : createScreenOptions ---

test('Ex4: fusionne defaults et overrides', () => {
  const result = createScreenOptions(
    { title: 'Default', headerShown: true, headerTintColor: '#000' },
    { title: 'Custom', animation: 'fade' }
  );
  assertEqual(result.title, 'Custom');
  assertTrue(result.headerShown!);
  assertEqual(result.headerTintColor, '#000');
  assertEqual(result.animation, 'fade');
});

test('Ex4: undefined dans overrides ne remplace pas les defaults', () => {
  const result = createScreenOptions(
    { title: 'Default', headerShown: true },
    { title: undefined, headerShown: false }
  );
  assertEqual(result.title, 'Default');
  assertFalse(result.headerShown!);
});

// --- Exercice 5 : resolveHeaderTitle ---

test('Ex5: options.title a la priorite', () => {
  assertEqual(
    resolveHeaderTitle({ title: 'Mon Titre' }, 'HomeScreen'),
    'Mon Titre'
  );
});

test('Ex5: fallback sur routeName', () => {
  assertEqual(resolveHeaderTitle({}, 'HomeScreen'), 'HomeScreen');
});

test('Ex5: headerShown false ne change pas le titre', () => {
  // resolveHeaderTitle retourne toujours un titre meme si headerShown=false
  assertEqual(
    resolveHeaderTitle({ headerShown: false }, 'Details'),
    'Details'
  );
});

// =============================================================================
// Lancement
// =============================================================================

run();
