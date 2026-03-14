// ============================================================================
// LAB 01 — JSX et premiers composants (logique pure)
// ============================================================================
// Objectif : comprendre la logique derriere JSX sans runtime React Native
// On simule un arbre d'elements comme le fait React.createElement.
// Lancez avec : npx tsx labs/lab-01-jsx-composants/exercise.ts
// ============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
} from '../test-utils.ts';

const runner = createTestRunner('Lab 01 — JSX et composants (logique pure)');

// ============================================================================
// Types de base — arbre d'elements (comme React.createElement)
// ============================================================================

interface ElementNode {
  type: string;
  props: Record<string, unknown>;
  children: Array<ElementNode | string>;
}

// ============================================================================
// Exercice 1 : createElement
// ============================================================================
// Cree un noeud d'element. Similaire a React.createElement.
// - type: nom du composant (ex: "View", "Text")
// - props: objet de proprietes (peut etre vide {})
// - children: tableau de noeuds enfants ou strings

function createElement(
  type: string,
  props: Record<string, unknown>,
  ...children: Array<ElementNode | string>
): ElementNode {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createElement — element simple sans enfant', () => {
  const el = createElement('View', { style: { flex: 1 } });
  assertEqual(el.type, 'View');
  assertDeepEqual(el.props, { style: { flex: 1 } });
  assertDeepEqual(el.children, []);
});

runner.test('createElement — element avec enfant texte', () => {
  const el = createElement('Text', { style: { fontSize: 16 } }, 'Bonjour');
  assertEqual(el.type, 'Text');
  assertDeepEqual(el.children, ['Bonjour']);
});

runner.test('createElement — element avec enfants imbriques', () => {
  const el = createElement(
    'View', {},
    createElement('Text', {}, 'Premier'),
    createElement('Text', {}, 'Deuxieme'),
  );
  assertEqual(el.children.length, 2);
  assertEqual((el.children[0] as ElementNode).type, 'Text');
});

// ============================================================================
// Exercice 2 : renderToString
// ============================================================================
// Convertit un arbre d'elements en representation string indentee.
// Format :
//   <View style={...}>
//     <Text>Bonjour</Text>
//   </View>
// Regles :
// - Indenter de 2 espaces par niveau
// - Props affichees comme prop={value} (JSON.stringify pour les valeurs)
// - Props vides : juste le tag
// - Enfants texte : directement dans le tag
// - Si un element n'a qu'un enfant texte, sur une seule ligne : <Text>Bonjour</Text>

function renderToString(node: ElementNode | string, indent?: number): string {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('renderToString — texte simple', () => {
  assertEqual(renderToString('Hello'), 'Hello');
});

runner.test('renderToString — element avec texte inline', () => {
  const el = createElement('Text', {}, 'Bonjour');
  assertEqual(renderToString(el), '<Text>Bonjour</Text>');
});

runner.test('renderToString — element avec props', () => {
  const el = createElement('View', { flex: 1 });
  assertEqual(renderToString(el), '<View flex={1} />');
});

runner.test('renderToString — arbre imbrique', () => {
  const el = createElement(
    'View', {},
    createElement('Text', {}, 'Hello'),
    createElement('Text', {}, 'World'),
  );
  const expected = [
    '<View>',
    '  <Text>Hello</Text>',
    '  <Text>World</Text>',
    '</View>',
  ].join('\n');
  assertEqual(renderToString(el), expected);
});

runner.test('renderToString — element vide auto-fermant', () => {
  const el = createElement('View', {});
  assertEqual(renderToString(el), '<View />');
});

// ============================================================================
// Exercice 3 : flattenChildren
// ============================================================================
// Aplatit un arbre d'elements en un tableau plat de tous les noeuds (depth-first).
// Inclut le noeud racine + tous les descendants.
// Les strings sont aussi incluses.

function flattenChildren(node: ElementNode | string): Array<ElementNode | string> {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('flattenChildren — texte seul', () => {
  assertDeepEqual(flattenChildren('Hello'), ['Hello']);
});

runner.test('flattenChildren — arbre simple', () => {
  const tree = createElement(
    'View', {},
    createElement('Text', {}, 'A'),
    createElement('Text', {}, 'B'),
  );
  const flat = flattenChildren(tree);
  assertEqual(flat.length, 5); // View, Text, 'A', Text, 'B'
});

runner.test('flattenChildren — arbre profond', () => {
  const tree = createElement(
    'View', {},
    createElement('View', {},
      createElement('Text', {}, 'Deep'),
    ),
  );
  const flat = flattenChildren(tree);
  assertEqual(flat.length, 4); // View, View, Text, 'Deep'
  assertEqual(flat[3], 'Deep');
});

// ============================================================================
// Exercice 4 : extractTextContent
// ============================================================================
// Extrait tout le contenu textuel d'un arbre d'elements.
// Concatene tous les strings trouves dans l'arbre, separes par un espace.
// Ignore les noeuds Element, ne garde que les feuilles texte.

function extractTextContent(node: ElementNode | string): string {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('extractTextContent — texte simple', () => {
  assertEqual(extractTextContent('Hello'), 'Hello');
});

runner.test('extractTextContent — element avec texte', () => {
  const el = createElement('Text', {}, 'Bonjour');
  assertEqual(extractTextContent(el), 'Bonjour');
});

runner.test('extractTextContent — arbre complexe', () => {
  const tree = createElement(
    'View', {},
    createElement('Text', {}, 'Hello'),
    createElement('View', {},
      createElement('Text', {}, 'beautiful'),
      createElement('Text', {}, 'world'),
    ),
  );
  assertEqual(extractTextContent(tree), 'Hello beautiful world');
});

runner.test('extractTextContent — pas de texte', () => {
  const tree = createElement('View', {}, createElement('View', {}));
  assertEqual(extractTextContent(tree), '');
});

// ============================================================================
// Exercice 5 : conditionalRender
// ============================================================================
// Simule le rendu conditionnel JSX.
// Prend un tableau de { condition, element } et retourne un ElementNode
// qui ne contient que les elements dont la condition est true.
// Le wrapper est un "View" avec les props fournies.

interface ConditionalItem {
  condition: boolean;
  element: ElementNode | string;
}

function conditionalRender(
  items: ConditionalItem[],
  wrapperProps?: Record<string, unknown>,
): ElementNode {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('conditionalRender — toutes les conditions true', () => {
  const result = conditionalRender([
    { condition: true, element: createElement('Text', {}, 'A') },
    { condition: true, element: createElement('Text', {}, 'B') },
  ]);
  assertEqual(result.type, 'View');
  assertEqual(result.children.length, 2);
});

runner.test('conditionalRender — certaines conditions false', () => {
  const result = conditionalRender([
    { condition: true, element: createElement('Text', {}, 'Visible') },
    { condition: false, element: createElement('Text', {}, 'Cache') },
    { condition: true, element: createElement('Text', {}, 'Aussi visible') },
  ]);
  assertEqual(result.children.length, 2);
  assertEqual(extractTextContent(result.children[0] as ElementNode), 'Visible');
});

runner.test('conditionalRender — aucune condition true', () => {
  const result = conditionalRender([
    { condition: false, element: createElement('Text', {}, 'Nope') },
  ]);
  assertEqual(result.children.length, 0);
});

runner.test('conditionalRender — wrapper props', () => {
  const result = conditionalRender([], { style: { padding: 16 } });
  assertDeepEqual(result.props, { style: { padding: 16 } });
});

// ============================================================================
// Exercice 6 : mapToElements
// ============================================================================
// Transforme un tableau de donnees en elements, comme .map() en JSX.
// Prend un tableau d'items et une fonction qui transforme chaque item en ElementNode.
// Retourne un ElementNode "View" contenant tous les elements transformes.
// Chaque element doit avoir une prop "key" ajoutee automatiquement avec le keyExtractor.

function mapToElements<T>(
  items: T[],
  renderItem: (item: T, index: number) => ElementNode,
  keyExtractor: (item: T, index: number) => string,
): ElementNode {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('mapToElements — liste de produits', () => {
  const products = [
    { id: 'p1', name: 'iPhone', price: 999 },
    { id: 'p2', name: 'Galaxy', price: 899 },
  ];
  const result = mapToElements(
    products,
    (p) => createElement('Text', { testID: p.id }, `${p.name}: ${p.price} EUR`),
    (p) => p.id,
  );
  assertEqual(result.type, 'View');
  assertEqual(result.children.length, 2);
  const first = result.children[0] as ElementNode;
  assertEqual(first.props.key, 'p1');
  assertEqual(first.props.testID, 'p1');
});

runner.test('mapToElements — tableau vide', () => {
  const result = mapToElements(
    [],
    () => createElement('Text', {}, 'x'),
    (_item, i) => String(i),
  );
  assertEqual(result.children.length, 0);
});

runner.test('mapToElements — index disponible dans renderItem', () => {
  const items = ['a', 'b', 'c'];
  const result = mapToElements(
    items,
    (item, index) => createElement('Text', {}, `${index}:${item}`),
    (item) => item,
  );
  assertEqual(result.children.length, 3);
  assertEqual((result.children[1] as ElementNode).children[0], '1:b');
});

// ============================================================================
// Exercice 7 : buildStyleSheet
// ============================================================================
// Simule StyleSheet.create : prend un objet de styles nommes,
// le valide (pas de proprietes CSS web invalides), et le retourne tel quel.
// Lever une erreur si une propriete interdite est trouvee.
// Proprietes interdites : 'display' (sauf 'flex'/'none'), 'float', 'position' (sauf 'relative'/'absolute'),
//                         'boxShadow', 'gridTemplateColumns', 'gridTemplateRows'

type StyleValue = string | number | Record<string, unknown>;
type StyleMap = Record<string, Record<string, StyleValue>>;

const FORBIDDEN_PROPS = ['float', 'boxShadow', 'gridTemplateColumns', 'gridTemplateRows'];
const RESTRICTED_VALUES: Record<string, string[]> = {
  display: ['flex', 'none'],
  position: ['relative', 'absolute'],
};

function buildStyleSheet<T extends StyleMap>(styles: T): T {
  // TODO: Implementer cette fonction
  // Valider chaque propriete de chaque style.
  // Retourner l'objet tel quel si valide.
  // Lever une Error('Invalid CSS property: <prop>') si invalide.
  throw new Error('Non implemente');
}

runner.test('buildStyleSheet — styles valides passent', () => {
  const styles = buildStyleSheet({
    container: { flex: 1, backgroundColor: '#fff', padding: 16 },
    text: { fontSize: 16, color: '#000' },
  });
  assertEqual(styles.container.flex, 1);
  assertEqual(styles.text.fontSize, 16);
});

runner.test('buildStyleSheet — propriete interdite leve erreur', () => {
  assertThrows(() => {
    buildStyleSheet({ card: { float: 'left' } });
  });
});

runner.test('buildStyleSheet — display grid leve erreur', () => {
  assertThrows(() => {
    buildStyleSheet({ grid: { display: 'grid' } });
  });
});

runner.test('buildStyleSheet — display flex est accepte', () => {
  const styles = buildStyleSheet({ row: { display: 'flex', flexDirection: 'row' } });
  assertEqual(styles.row.display, 'flex');
});

runner.test('buildStyleSheet — position absolute est accepte', () => {
  const styles = buildStyleSheet({ overlay: { position: 'absolute', top: 0 } });
  assertEqual(styles.overlay.position, 'absolute');
});

// ============================================================================
runner.run();
