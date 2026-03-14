// ============================================================================
// LAB 01 — JSX et premiers composants (logique pure) — SOLUTIONS
// ============================================================================
// Lancez avec : npx tsx labs/lab-01-jsx-composants/solution.ts
// ============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
} from '../test-utils.ts';

const runner = createTestRunner('Lab 01 — JSX et composants (Solutions)');

// ============================================================================
// Types de base
// ============================================================================

interface ElementNode {
  type: string;
  props: Record<string, unknown>;
  children: Array<ElementNode | string>;
}

// ============================================================================
// Exercice 1 : createElement
// ============================================================================

function createElement(
  type: string,
  props: Record<string, unknown>,
  ...children: Array<ElementNode | string>
): ElementNode {
  return { type, props, children };
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

function renderToString(node: ElementNode | string, indent: number = 0): string {
  const pad = ' '.repeat(indent);

  if (typeof node === 'string') {
    return `${pad}${node}`;
  }

  const propsStr = Object.entries(node.props)
    .map(([key, value]) => ` ${key}={${JSON.stringify(value)}}`)
    .join('');

  // Element vide (pas d'enfants)
  if (node.children.length === 0) {
    return `${pad}<${node.type}${propsStr} />`;
  }

  // Element avec un seul enfant texte — inline
  if (node.children.length === 1 && typeof node.children[0] === 'string') {
    return `${pad}<${node.type}${propsStr}>${node.children[0]}</${node.type}>`;
  }

  // Element avec enfants — multi-ligne
  const childrenStr = node.children
    .map(child => renderToString(child, indent + 2))
    .join('\n');

  return `${pad}<${node.type}${propsStr}>\n${childrenStr}\n${pad}</${node.type}>`;
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

function flattenChildren(node: ElementNode | string): Array<ElementNode | string> {
  if (typeof node === 'string') {
    return [node];
  }

  const result: Array<ElementNode | string> = [node];
  for (const child of node.children) {
    result.push(...flattenChildren(child));
  }
  return result;
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
  assertEqual(flat.length, 5);
});

runner.test('flattenChildren — arbre profond', () => {
  const tree = createElement(
    'View', {},
    createElement('View', {},
      createElement('Text', {}, 'Deep'),
    ),
  );
  const flat = flattenChildren(tree);
  assertEqual(flat.length, 4);
  assertEqual(flat[3], 'Deep');
});

// ============================================================================
// Exercice 4 : extractTextContent
// ============================================================================

function extractTextContent(node: ElementNode | string): string {
  if (typeof node === 'string') {
    return node;
  }

  const texts: string[] = [];
  for (const child of node.children) {
    const text = extractTextContent(child);
    if (text) {
      texts.push(text);
    }
  }
  return texts.join(' ');
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

interface ConditionalItem {
  condition: boolean;
  element: ElementNode | string;
}

function conditionalRender(
  items: ConditionalItem[],
  wrapperProps: Record<string, unknown> = {},
): ElementNode {
  const visibleChildren = items
    .filter(item => item.condition)
    .map(item => item.element);

  return {
    type: 'View',
    props: wrapperProps,
    children: visibleChildren,
  };
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

function mapToElements<T>(
  items: T[],
  renderItem: (item: T, index: number) => ElementNode,
  keyExtractor: (item: T, index: number) => string,
): ElementNode {
  const children = items.map((item, index) => {
    const element = renderItem(item, index);
    return {
      ...element,
      props: { ...element.props, key: keyExtractor(item, index) },
    };
  });

  return {
    type: 'View',
    props: {},
    children,
  };
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

type StyleValue = string | number | Record<string, unknown>;
type StyleMap = Record<string, Record<string, StyleValue>>;

const FORBIDDEN_PROPS = ['float', 'boxShadow', 'gridTemplateColumns', 'gridTemplateRows'];
const RESTRICTED_VALUES: Record<string, string[]> = {
  display: ['flex', 'none'],
  position: ['relative', 'absolute'],
};

function buildStyleSheet<T extends StyleMap>(styles: T): T {
  for (const styleName of Object.keys(styles)) {
    const style = styles[styleName];
    for (const prop of Object.keys(style)) {
      // Check forbidden props
      if (FORBIDDEN_PROPS.includes(prop)) {
        throw new Error(`Invalid CSS property: ${prop}`);
      }

      // Check restricted values
      if (RESTRICTED_VALUES[prop]) {
        const value = style[prop];
        if (typeof value === 'string' && !RESTRICTED_VALUES[prop].includes(value)) {
          throw new Error(`Invalid CSS property: ${prop}`);
        }
      }
    }
  }

  return styles;
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
