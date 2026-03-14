import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertGreaterThan,
  assertLessThan,
  assertLength,
} from '../test-utils.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaginationResult<T> {
  data: T[];
  hasMore: boolean;
  totalPages: number;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface Section<T> {
  title: string;
  data: T[];
}

interface VirtualWindow<T> {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
}

interface SortCriterion<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

// ─── Exercice 1 : paginateData ──────────────────────────────────────────────

function paginateData<T>(items: T[], page: number, pageSize: number): PaginationResult<T> {
  const totalPages = Math.ceil(items.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = items.slice(start, end);

  return {
    data,
    hasMore: page < totalPages,
    totalPages,
  };
}

// ─── Exercice 2 : groupBySection ────────────────────────────────────────────

function groupBySection(contacts: Contact[]): Section<Contact>[] {
  const grouped = new Map<string, Contact[]>();

  for (const contact of contacts) {
    const letter = contact.name[0].toUpperCase();
    if (!grouped.has(letter)) {
      grouped.set(letter, []);
    }
    grouped.get(letter)!.push(contact);
  }

  // Trier les contacts dans chaque section par nom
  for (const [, data] of grouped) {
    data.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Trier les sections par titre et retourner
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }));
}

// ─── Exercice 3 : createVirtualWindow ───────────────────────────────────────

function createVirtualWindow<T>(
  data: T[],
  scrollOffset: number,
  viewportHeight: number,
  itemHeight: number,
): VirtualWindow<T> {
  const startIndex = Math.max(0, Math.floor(scrollOffset / itemHeight));
  const endIndex = Math.min(
    data.length,
    Math.ceil((scrollOffset + viewportHeight) / itemHeight),
  );
  const visibleItems = data.slice(startIndex, endIndex);

  return { visibleItems, startIndex, endIndex };
}

// ─── Exercice 4 : searchFilter ──────────────────────────────────────────────

function searchFilter<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  keys: (keyof T)[],
): T[] {
  if (!query.trim()) return items;

  const normalized = query.toLowerCase().trim();

  return items.filter(item =>
    keys.some(key => {
      const value = item[key];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalized);
      }
      if (typeof value === 'number') {
        return String(value).includes(normalized);
      }
      return false;
    }),
  );
}

// ─── Exercice 5 : sortMultiCriteria ────────────────────────────────────────

function sortMultiCriteria<T>(items: T[], criteria: SortCriterion<T>[]): T[] {
  return [...items].sort((a, b) => {
    for (const { key, direction } of criteria) {
      const aVal = a[key];
      const bVal = b[key];
      let comparison = 0;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      }

      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

const runner = createTestRunner('Lab 04 — Listes et donnees');

// ─── Tests paginateData ─────────────────────────────────────────────────────

runner.test('paginateData: premiere page', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const result = paginateData(items, 1, 3);
  assertDeepEqual(result.data, [1, 2, 3]);
  assertTrue(result.hasMore);
  assertEqual(result.totalPages, 4);
});

runner.test('paginateData: derniere page partielle', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const result = paginateData(items, 4, 3);
  assertDeepEqual(result.data, [10]);
  assertFalse(result.hasMore);
  assertEqual(result.totalPages, 4);
});

runner.test('paginateData: page au-dela des donnees', () => {
  const items = [1, 2, 3];
  const result = paginateData(items, 5, 2);
  assertDeepEqual(result.data, []);
  assertFalse(result.hasMore);
  assertEqual(result.totalPages, 2);
});

// ─── Tests groupBySection ───────────────────────────────────────────────────

runner.test('groupBySection: groupe par premiere lettre', () => {
  const contacts: Contact[] = [
    { id: '1', name: 'Alice', phone: '0600000001' },
    { id: '2', name: 'Bob', phone: '0600000002' },
    { id: '3', name: 'Antoine', phone: '0600000003' },
  ];
  const sections = groupBySection(contacts);
  assertEqual(sections.length, 2);
  assertEqual(sections[0].title, 'A');
  assertEqual(sections[1].title, 'B');
});

runner.test('groupBySection: trie les contacts dans chaque section', () => {
  const contacts: Contact[] = [
    { id: '1', name: 'Charlie', phone: '01' },
    { id: '2', name: 'Camille', phone: '02' },
    { id: '3', name: 'Cedric', phone: '03' },
  ];
  const sections = groupBySection(contacts);
  assertEqual(sections.length, 1);
  assertEqual(sections[0].data[0].name, 'Camille');
  assertEqual(sections[0].data[1].name, 'Cedric');
  assertEqual(sections[0].data[2].name, 'Charlie');
});

runner.test('groupBySection: gere les minuscules', () => {
  const contacts: Contact[] = [
    { id: '1', name: 'alice', phone: '01' },
    { id: '2', name: 'Alice', phone: '02' },
  ];
  const sections = groupBySection(contacts);
  assertEqual(sections.length, 1);
  assertEqual(sections[0].title, 'A');
  assertLength(sections[0].data, 2);
});

// ─── Tests createVirtualWindow ──────────────────────────────────────────────

runner.test('createVirtualWindow: debut de liste', () => {
  const data = Array.from({ length: 100 }, (_, i) => `item-${i}`);
  const result = createVirtualWindow(data, 0, 500, 50);
  assertEqual(result.startIndex, 0);
  assertEqual(result.endIndex, 10);
  assertLength(result.visibleItems, 10);
  assertEqual(result.visibleItems[0], 'item-0');
});

runner.test('createVirtualWindow: milieu de liste', () => {
  const data = Array.from({ length: 100 }, (_, i) => `item-${i}`);
  const result = createVirtualWindow(data, 1000, 500, 50);
  assertEqual(result.startIndex, 20);
  assertEqual(result.endIndex, 30);
  assertLength(result.visibleItems, 10);
  assertEqual(result.visibleItems[0], 'item-20');
});

runner.test('createVirtualWindow: fin de liste (borne)', () => {
  const data = Array.from({ length: 10 }, (_, i) => `item-${i}`);
  const result = createVirtualWindow(data, 400, 500, 50);
  assertEqual(result.startIndex, 8);
  assertEqual(result.endIndex, 10);
  assertLength(result.visibleItems, 2);
});

// ─── Tests searchFilter ─────────────────────────────────────────────────────

runner.test('searchFilter: filtre sur un champ string', () => {
  const items = [
    { name: 'MacBook Pro', price: 2399 },
    { name: 'iPhone 15', price: 1199 },
    { name: 'iPad Air', price: 699 },
  ];
  const result = searchFilter(items, 'mac', ['name']);
  assertLength(result, 1);
  assertEqual(result[0].name, 'MacBook Pro');
});

runner.test('searchFilter: insensible a la casse', () => {
  const items = [
    { name: 'MacBook Pro', price: 2399 },
    { name: 'iPhone 15', price: 1199 },
  ];
  const result = searchFilter(items, 'IPHONE', ['name']);
  assertLength(result, 1);
  assertEqual(result[0].name, 'iPhone 15');
});

runner.test('searchFilter: query vide retourne tout', () => {
  const items = [
    { name: 'MacBook Pro', price: 2399 },
    { name: 'iPhone 15', price: 1199 },
  ];
  const result = searchFilter(items, '', ['name']);
  assertLength(result, 2);
});

runner.test('searchFilter: recherche sur nombre', () => {
  const items = [
    { name: 'MacBook Pro', price: 2399 },
    { name: 'iPhone 15', price: 1199 },
    { name: 'iPad Air', price: 699 },
  ];
  const result = searchFilter(items, '699', ['name', 'price']);
  assertLength(result, 1);
  assertEqual(result[0].name, 'iPad Air');
});

runner.test('searchFilter: recherche multi-champs', () => {
  const items = [
    { name: 'MacBook Pro', category: 'laptop' },
    { name: 'iPhone 15', category: 'phone' },
    { name: 'Galaxy S24', category: 'phone' },
  ];
  const result = searchFilter(items, 'phone', ['name', 'category']);
  assertLength(result, 2);
});

// ─── Tests sortMultiCriteria ────────────────────────────────────────────────

runner.test('sortMultiCriteria: tri simple ascendant', () => {
  const items = [
    { name: 'Charlie', age: 30 },
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 35 },
  ];
  const sorted = sortMultiCriteria(items, [{ key: 'name', direction: 'asc' }]);
  assertEqual(sorted[0].name, 'Alice');
  assertEqual(sorted[1].name, 'Bob');
  assertEqual(sorted[2].name, 'Charlie');
});

runner.test('sortMultiCriteria: tri descendant', () => {
  const items = [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 35 },
    { name: 'Charlie', age: 30 },
  ];
  const sorted = sortMultiCriteria(items, [{ key: 'age', direction: 'desc' }]);
  assertEqual(sorted[0].age, 35);
  assertEqual(sorted[1].age, 30);
  assertEqual(sorted[2].age, 25);
});

runner.test('sortMultiCriteria: multi-criteres avec egalite', () => {
  const items = [
    { name: 'Bob', age: 30 },
    { name: 'Alice', age: 30 },
    { name: 'Charlie', age: 25 },
  ];
  const sorted = sortMultiCriteria(items, [
    { key: 'age', direction: 'asc' },
    { key: 'name', direction: 'asc' },
  ]);
  assertEqual(sorted[0].name, 'Charlie');
  assertEqual(sorted[1].name, 'Alice');
  assertEqual(sorted[2].name, 'Bob');
});

runner.test('sortMultiCriteria: ne mute pas le tableau original', () => {
  const items = [
    { name: 'Charlie', age: 30 },
    { name: 'Alice', age: 25 },
  ];
  const original = [...items];
  sortMultiCriteria(items, [{ key: 'name', direction: 'asc' }]);
  assertEqual(items[0].name, original[0].name);
  assertEqual(items[1].name, original[1].name);
});

runner.run();
