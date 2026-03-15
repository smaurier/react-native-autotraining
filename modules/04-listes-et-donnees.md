# 04 — Listes et donnees

| Difficulte | Duree estimee | Lab | Quiz |
|:----------:|:-------------:|:---:|:----:|
| 2/5        | 60 min        | [Lab 04](../labs/lab-04-listes-donnees/) | [Quiz 04](../quizzes/quiz-04-listes.html) |

## Objectifs pedagogiques

A la fin de ce module, vous serez capable de :

- Utiliser `FlatList` pour afficher des listes performantes avec `renderItem` et `keyExtractor`
- Personnaliser les listes avec `ListEmptyComponent`, `ListHeaderComponent` et `ListFooterComponent`
- Organiser les donnees en sections avec `SectionList`
- Implementer le pull-to-refresh et le scroll infini (pagination)
- Optimiser les performances de rendu avec `getItemLayout`, `windowSize` et `maxToRenderPerBatch`
- Comprendre le fonctionnement interne de `VirtualizedList`
- Connaître `FlashList` comme alternative performante

---

<details>
<summary>Rappel du module precedent</summary>

- **Composants de base** : `View`, `Text`, `Image`, `TextInput`, `Pressable`, `ScrollView`
- **Props communes** : `style`, `onPress`, `onChangeText`, `source`
- **Gestion des événements** : `onPress`, `onLongPress`, `onPressIn`, `onPressOut`
- **ScrollView** : pour les contenus courts et de taille connue
- **SafeAreaView** : gestion des zones securisees (notch, barre de statut)

</details>

---

## Le problème : ScrollView ne passe pas a l'echelle

Avant de plonger dans les listes, comprenons pourquoi `ScrollView` ne suffit pas :

```tsx
// ❌ Mauvaise approche : ScrollView avec 10 000 elements
import { ScrollView, View, Text } from 'react-native';

function BadList() {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: String(i),
    title: `Element ${i}`,
  }));

  return (
    <ScrollView>
      {items.map(item => (
        <View key={item.id} style={{ padding: 16 }}>
          <Text>{item.title}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

**Problème** : `ScrollView` rend **tous** les enfants d'un coup, même ceux hors ecran. Avec 10 000 éléments, cela signifie :
- 10 000 composants montes en mémoire
- Un temps de premier rendu très long
- Une consommation mémoire elevee

:::tip Regle d'or
Utilisez `ScrollView` pour des listes **courtes** (moins de ~50 éléments simples). Au-dela, passez a `FlatList` ou `SectionList`.
:::

---

## FlatList : la liste virtualisee standard

`FlatList` est le composant de liste principal de React Native. Il ne rend que les éléments visibles a l'ecran (plus quelques éléments de marge), ce qui permet d'afficher des milliers d'éléments sans problème de performance.

### Anatomie de base

```tsx
import { FlatList, View, Text, StyleSheet } from 'react-native';

interface Product {
  id: string;
  name: string;
  price: number;
}

const products: Product[] = [
  { id: '1', name: 'MacBook Pro', price: 2399 },
  { id: '2', name: 'iPhone 15 Pro', price: 1199 },
  { id: '3', name: 'iPad Air', price: 699 },
  { id: '4', name: 'AirPods Pro', price: 279 },
  { id: '5', name: 'Apple Watch', price: 449 },
];

function ProductList() {
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <View style={styles.item}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>{item.price} €</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 16, color: '#666' },
});
```

### Les 3 props essentielles

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Le tableau de donnees a afficher |
| `renderItem` | `({ item, index, separators }) => ReactElement` | Fonction qui rend chaque élément |
| `keyExtractor` | `(item, index) => string` | Fonction qui extrait une clé unique |

### renderItem en detail

L'objet recu par `renderItem` contient :

```tsx
renderItem={({ item, index, separators }) => {
  // item      → l'element courant du tableau data
  // index     → l'indice dans le tableau
  // separators → { highlight(), unhighlight(), updateProps() }
  //              pour gerer les separateurs visuels

  return <ItemComponent item={item} />;
}}
```

### keyExtractor : pourquoi c'est crucial

La `keyExtractor` fournit une clé unique à chaque élément pour le système de reconciliation de React :

```tsx
// ✅ Bonne pratique : utiliser un ID unique
keyExtractor={(item) => item.id}

// ✅ Alternative si pas d'ID
keyExtractor={(item) => `${item.name}-${item.createdAt}`}

// ⚠️ Eviter : utiliser l'index seul (problemes lors des reordonnements)
keyExtractor={(_, index) => String(index)}
```

:::warning Attention aux clés basees sur l'index
Si vous utilisez l'index comme clé et que la liste est reordonnee, les composants ne seront pas re-rendus correctement. Les états internes des composants seront associes aux mauvais éléments.
:::

---

## Personnalisation de FlatList

### ListEmptyComponent

Affiche un composant quand la liste est vide :

```tsx
<FlatList
  data={filteredProducts}
  renderItem={renderProduct}
  keyExtractor={item => item.id}
  ListEmptyComponent={
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyText}>Aucun produit trouve</Text>
      <Text style={styles.emptyHint}>
        Essayez avec d'autres criteres de recherche
      </Text>
    </View>
  }
/>
```

### ListHeaderComponent

Un composant affiche **avant** le premier élément (scrolle avec la liste) :

```tsx
<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={item => item.id}
  ListHeaderComponent={
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Nos produits</Text>
      <Text style={styles.headerCount}>
        {products.length} resultats
      </Text>
    </View>
  }
/>
```

### ListFooterComponent

Un composant affiche **après** le dernier élément :

```tsx
<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={item => item.id}
  ListFooterComponent={
    isLoading ? (
      <ActivityIndicator style={{ padding: 20 }} />
    ) : (
      <Text style={styles.footerText}>
        Fin de la liste
      </Text>
    )
  }
/>
```

### ItemSeparatorComponent

Un separateur entre chaque élément (pas avant le premier ni après le dernier) :

```tsx
<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={item => item.id}
  ItemSeparatorComponent={() => (
    <View style={{
      height: 1,
      backgroundColor: '#e0e0e0',
      marginHorizontal: 16,
    }} />
  )}
/>
```

### Exemple complet avec tous les composants

```tsx
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={[styles.todoItem, item.completed && styles.completed]}>
      <Text style={[
        styles.todoText,
        item.completed && styles.completedText,
      ]}>
        {item.title}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={todos}
      renderItem={renderTodo}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <Text style={styles.title}>Mes taches</Text>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          Aucune tache pour le moment
        </Text>
      }
      ListFooterComponent={
        loading ? <ActivityIndicator /> : null
      }
      ItemSeparatorComponent={() => (
        <View style={styles.separator} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  todoItem: {
    padding: 16,
    backgroundColor: '#fff',
  },
  completed: {
    backgroundColor: '#f0f0f0',
  },
  todoText: {
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 32,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});
```

---

## SectionList : listes avec sections

`SectionList` organise les donnees en groupes avec des en-tetes de section. C'est ideal pour les listes de contacts, les menus de restaurant, les paramètres, etc.

### Structure des sections

```tsx
import { SectionList, Text, View, StyleSheet } from 'react-native';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface Section {
  title: string;
  data: Contact[];
}

const sections: Section[] = [
  {
    title: 'A',
    data: [
      { id: '1', name: 'Alice Martin', phone: '06 12 34 56 78' },
      { id: '2', name: 'Antoine Dupont', phone: '06 23 45 67 89' },
    ],
  },
  {
    title: 'B',
    data: [
      { id: '3', name: 'Benoit Blanc', phone: '06 34 56 78 90' },
    ],
  },
  {
    title: 'C',
    data: [
      { id: '4', name: 'Camille Noir', phone: '06 45 67 89 01' },
      { id: '5', name: 'Charles Rouge', phone: '06 56 78 90 12' },
    ],
  },
];
```

### Rendu de la SectionList

```tsx
function ContactList() {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.contactItem}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
        </View>
      )}
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      )}
      renderSectionFooter={({ section }) => (
        <Text style={styles.sectionFooter}>
          {section.data.length} contact(s)
        </Text>
      )}
      stickySectionHeadersEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    backgroundColor: '#f4f4f4',
    padding: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
  },
  sectionFooter: {
    padding: 8,
    paddingHorizontal: 16,
    color: '#999',
    fontSize: 12,
  },
  contactItem: {
    padding: 16,
    backgroundColor: '#fff',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
```

### Transformer des donnees en sections

Souvent, vos donnees arrivent sous forme de tableau plat. Voici comment les transformer en sections :

```tsx
function groupContactsByLetter(contacts: Contact[]): Section[] {
  // 1. Trier par nom
  const sorted = [...contacts].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // 2. Grouper par premiere lettre
  const grouped = new Map<string, Contact[]>();
  for (const contact of sorted) {
    const letter = contact.name[0].toUpperCase();
    if (!grouped.has(letter)) {
      grouped.set(letter, []);
    }
    grouped.get(letter)!.push(contact);
  }

  // 3. Convertir en format SectionList
  return Array.from(grouped.entries()).map(([letter, data]) => ({
    title: letter,
    data,
  }));
}
```

### Props de SectionList

| Prop | Type | Description |
|------|------|-------------|
| `sections` | `{ title, data }[]` | Tableau de sections |
| `renderItem` | Comme FlatList | Rend chaque élément |
| `renderSectionHeader` | `({ section }) => ReactElement` | En-tete de section |
| `renderSectionFooter` | `({ section }) => ReactElement` | Pied de section |
| `stickySectionHeadersEnabled` | `boolean` | En-tetes fixes lors du scroll |
| `SectionSeparatorComponent` | `() => ReactElement` | Separateur entre sections |

---

## Pull-to-refresh

Le "tirer pour rafraichir" est un pattern mobile très courant. `FlatList` et `SectionList` le supportent nativement :

```tsx
function RefreshableList() {
  const [data, setData] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const freshData = await fetchProducts();
      setData(freshData);
    } catch (error) {
      console.error('Erreur de rafraichissement:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <FlatList
      data={data}
      renderItem={renderProduct}
      keyExtractor={item => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
}
```

### Personnalisation du RefreshControl

Pour plus de controle, utilisez `RefreshControl` directement :

```tsx
import { RefreshControl } from 'react-native';

<FlatList
  data={data}
  renderItem={renderProduct}
  keyExtractor={item => item.id}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#ff6b6b', '#4ecdc4']}   // Android
      tintColor="#ff6b6b"                 // iOS
      title="Chargement..."              // iOS
      titleColor="#666"                   // iOS
    />
  }
/>
```

### Les deux props clés

| Prop | Type | Description |
|------|------|-------------|
| `onRefresh` | `() => void` | Callback declenche quand l'utilisateur tire |
| `refreshing` | `boolean` | Si `true`, l'indicateur de chargement est visible |

:::warning Important
`onRefresh` ne sera pas actif si `refreshing` n'est pas défini. Les deux props vont ensemble.
:::

---

## Scroll infini (pagination)

Le scroll infini charge automatiquement plus de donnees quand l'utilisateur approche de la fin de la liste :

```tsx
function InfiniteList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    // Eviter les appels multiples
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newItems = await fetchProducts(page, 20);

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => [...prev, ...newItems]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erreur pagination:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  return (
    <FlatList
      data={products}
      renderItem={renderProduct}
      keyExtractor={item => item.id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? (
          <ActivityIndicator
            size="large"
            style={{ padding: 20 }}
          />
        ) : !hasMore ? (
          <Text style={styles.endText}>
            Plus aucun produit a charger
          </Text>
        ) : null
      }
    />
  );
}
```

### Les props de pagination

| Prop | Type | Description |
|------|------|-------------|
| `onEndReached` | `() => void` | Callback quand la fin est proche |
| `onEndReachedThreshold` | `number` | Distance en pourcentage de la hauteur visible (0.5 = 50%) |

### Schema de la detection de fin de liste

```
┌────────────────────────────┐
│    Viewport (ecran)        │
│                            │
│    Element 1               │
│    Element 2               │
│    Element 3               │
│    Element 4               │
│    Element 5               │
├────────────────────────────┤ ← Bas du viewport
│                            │
│    threshold = 0.5         │  ← 50% de la hauteur du viewport
│    (zone de declenchement) │
│                            │
├────────────────────────────┤ ← onEndReached() declenche
│    Element 6               │
│    Element 7               │
│    ...                     │
└────────────────────────────┘ ← Fin reelle de la liste
```

### Gestion de la pagination cote donnees

```tsx
// Fonction utilitaire de pagination
function paginateData<T>(
  items: T[],
  page: number,
  pageSize: number
): { data: T[]; hasMore: boolean; totalPages: number } {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = items.slice(start, end);
  const totalPages = Math.ceil(items.length / pageSize);

  return {
    data,
    hasMore: page < totalPages,
    totalPages,
  };
}

// Utilisation
const result = paginateData(allProducts, 1, 20);
// { data: [20 premiers produits], hasMore: true, totalPages: 5 }
```

---

## Optimisation des performances

### getItemLayout : éviter la mesure dynamique

Par defaut, `FlatList` doit mesurer chaque élément pour calculer les positions de scroll. Si tous vos éléments ont la même hauteur, vous pouvez fournir `getItemLayout` pour éviter cette mesure :

```tsx
const ITEM_HEIGHT = 72;
const SEPARATOR_HEIGHT = 1;

<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={item => item.id}
  getItemLayout={(_, index) => ({
    length: ITEM_HEIGHT,
    offset: (ITEM_HEIGHT + SEPARATOR_HEIGHT) * index,
    index,
  })}
  ItemSeparatorComponent={() => (
    <View style={{ height: SEPARATOR_HEIGHT }} />
  )}
/>
```

**Avantages** :
- `scrollToIndex()` fonctionne immediatement (pas besoin d'attendre la mesure)
- Meilleures performances de scroll car pas de calcul de layout asynchrone
- `initialScrollIndex` utilisable directement

### windowSize : la fenêtre de rendu

`windowSize` controle combien d'ecrans au-dessus et en dessous du viewport sont rendus :

```tsx
<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={item => item.id}
  windowSize={5}  // Defaut: 21
/>
```

```
windowSize = 5 signifie :
2 ecrans au-dessus + 1 ecran visible + 2 ecrans en dessous = 5 ecrans

┌────────────────┐
│ 2 ecrans       │  ← rendus mais hors ecran (au-dessus)
│ au-dessus      │
├────────────────┤
│ VIEWPORT       │  ← visible par l'utilisateur
│ (1 ecran)      │
├────────────────┤
│ 2 ecrans       │  ← rendus mais hors ecran (en dessous)
│ en dessous     │
└────────────────┘
```

:::tip Compromis windowSize
- **Petit windowSize** (ex: 3) : moins de mémoire, mais risque de "blancs" si scroll rapide
- **Grand windowSize** (ex: 21 defaut) : plus de mémoire, scroll fluide sans blanc
- Un bon compromis est entre 5 et 11
:::

### maxToRenderPerBatch

Nombre d'éléments rendus par cycle de rendu lors du scroll :

```tsx
<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={item => item.id}
  maxToRenderPerBatch={10}   // Defaut: 10
/>
```

- **Plus petit** : meilleure réactivité mais plus de cycles de rendu
- **Plus grand** : moins de cycles mais chaque cycle prend plus de temps

### initialNumToRender

Nombre d'éléments rendus lors du montage initial :

```tsx
<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={item => item.id}
  initialNumToRender={10}  // Defaut: 10
/>
```

:::tip Bonne pratique
Mettez `initialNumToRender` au nombre d'éléments qui remplissent l'ecran + 1 ou 2 de marge. Pas plus — le surplus serait invisible et ralentirait le premier rendu.
:::

### removeClippedSubviews

Active le retrait du DOM natif des éléments hors ecran (Android surtout) :

```tsx
<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={item => item.id}
  removeClippedSubviews={true}
/>
```

### Récapitulatif des props de performance

| Prop | Defaut | Recommandation | Impact |
|------|--------|----------------|--------|
| `windowSize` | 21 | 5-11 | Mémoire |
| `maxToRenderPerBatch` | 10 | 5-15 | Fluidite scroll |
| `initialNumToRender` | 10 | Éléments visibles + 2 | Temps premier rendu |
| `removeClippedSubviews` | false | true (Android) | Mémoire native |
| `getItemLayout` | undefined | Fournir si hauteur fixe | Evite la mesure |
| `updateCellsBatchingPeriod` | 50 | 50-100 | Frequence de mise a jour |

---

## VirtualizedList : comment ça marche

`FlatList` et `SectionList` sont construits au-dessus de `VirtualizedList`. Comprendre son fonctionnement aide a diagnostiquer les problèmes de performance.

### Le principe de la virtualisation

```
Donnees completes (10 000 elements)
┌──────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░ │ ████████ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ Non rendus│ Rendus   │ Non rendus                            │
│           │ (window) │                                       │
└──────────────────────────────────────────────────────────────┘
              ↑ viewport ↑

Les ░ sont remplaces par des View vides de la bonne hauteur
(spacers) pour maintenir la position de scroll correcte.
```

### Cycle de vie d'un élément

1. **Élément entre dans la fenêtre** : React créé le composant via `renderItem`
2. **Élément est visible** : le composant est dans l'arbre de rendu natif
3. **Élément sort de la fenêtre** : le composant est demonte (où cache si `removeClippedSubviews`)
4. **Spacer** : un `View` vide de la bonne hauteur remplace le composant

### CellRendererComponent

`VirtualizedList` rend chaque élément dans un wrapper appele "cell renderer" :

```tsx
// Structure interne simplifiee
<ScrollView>
  <View style={{ height: spacerTopHeight }} />  {/* Spacer haut */}

  {/* Elements rendus */}
  <CellRenderer key="item-5">
    {renderItem({ item: data[5], index: 5 })}
  </CellRenderer>
  <CellRenderer key="item-6">
    {renderItem({ item: data[6], index: 6 })}
  </CellRenderer>
  {/* ... */}

  <View style={{ height: spacerBottomHeight }} />  {/* Spacer bas */}
</ScrollView>
```

### Le problème des re-rendus

Un piege courant est de créer des fonctions anonymes dans `renderItem`, ce qui force un re-rendu à chaque cycle :

```tsx
// ❌ Nouvelle reference a chaque rendu
<FlatList
  data={products}
  renderItem={({ item }) => (
    <ProductCard
      product={item}
      onPress={() => handlePress(item.id)}  // ← Nouvelle fonction
    />
  )}
/>

// ✅ Composant stable avec React.memo
const ProductCard = React.memo(function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: (id: string) => void;
}) {
  return (
    <Pressable onPress={() => onPress(product.id)}>
      <Text>{product.name}</Text>
    </Pressable>
  );
});

function ProductList() {
  const handlePress = useCallback((id: string) => {
    navigation.navigate('ProductDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard product={item} onPress={handlePress} />
    ),
    [handlePress]
  );

  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={item => item.id}
    />
  );
}
```

---

## FlashList : l'alternative performante

`FlashList` de Shopify est une alternative a `FlatList` qui recycle les composants au lieu de les demonter/remonter :

```tsx
import { FlashList } from '@shopify/flash-list';

function FastProductList() {
  return (
    <FlashList
      data={products}
      renderItem={({ item }) => (
        <ProductCard product={item} />
      )}
      estimatedItemSize={72}   // ← Obligatoire
      keyExtractor={item => item.id}
    />
  );
}
```

### Differences clés avec FlatList

| Aspect | FlatList | FlashList |
|--------|----------|-----------|
| Stratégie | Monte/Demonte les composants | Recycle les composants |
| Performance | Bonne | Excellente (2-5x) |
| `estimatedItemSize` | Non requis | **Obligatoire** |
| Blank areas | Possibles | Très rares |
| Installation | Inclus dans RN | Package externe |
| `getItemLayout` | Optionnel | Remplace par `estimatedItemSize` |

### Quand utiliser FlashList ?

- Listes de plus de 100 éléments
- Animations de scroll complexes
- Éléments de taille variable
- Applications exigeantes en performance (e-commerce, réseaux sociaux)

:::tip Migration facile
`FlashList` à une API quasi-identique a `FlatList`. La migration est souvent aussi simple que de changer l'import et ajouter `estimatedItemSize`.
:::

---

## Grille avec FlatList

`FlatList` supporte l'affichage en grille via la prop `numColumns` :

```tsx
function ProductGrid() {
  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <View style={styles.gridItem}>
          <Image
            source={{ uri: item.image }}
            style={styles.gridImage}
          />
          <Text style={styles.gridName}>{item.name}</Text>
          <Text style={styles.gridPrice}>{item.price} €</Text>
        </View>
      )}
      keyExtractor={item => item.id}
      numColumns={2}
      columnWrapperStyle={{
        justifyContent: 'space-between',
        paddingHorizontal: 8,
      }}
    />
  );
}

const styles = StyleSheet.create({
  gridItem: {
    flex: 1,
    margin: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    maxWidth: '48%',
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  gridPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
```

:::warning numColumns et keyExtractor
Quand vous changez `numColumns` dynamiquement, React Native demandé un `key` différent sur le `FlatList` lui-même pour forcer le remontage :
```tsx
<FlatList key={`grid-${numColumns}`} numColumns={numColumns} ... />
```
:::

---

## Exemple pratique : ContactList avec alphabet

```tsx
import {
  SectionList,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
}

function ContactListScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const sectionListRef = useRef<SectionList>(null);

  // Filtrer par recherche
  const filtered = useMemo(() => {
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  }, [contacts, searchQuery]);

  // Grouper en sections
  const sections = useMemo(() => {
    return groupContactsByLetter(filtered);
  }, [filtered]);

  // Index alphabet pour navigation rapide
  const sectionTitles = sections.map(s => s.title);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const fresh = await fetchContacts();
    setContacts(fresh);
    setRefreshing(false);
  }, []);

  const scrollToSection = (letter: string) => {
    const index = sections.findIndex(s => s.title === letter);
    if (index >= 0 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex: index,
        itemIndex: 0,
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un contact..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.listContainer}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.contactRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name[0]}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                  {item.name}
                </Text>
                <Text style={styles.contactPhone}>
                  {item.phone}
                </Text>
              </View>
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLetter}>
                {section.title}
              </Text>
            </View>
          )}
          stickySectionHeadersEnabled={true}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Aucun contact trouve'
                : 'Aucun contact'}
            </Text>
          }
        />

        {/* Index lateral */}
        <View style={styles.sideIndex}>
          {sectionTitles.map(letter => (
            <Pressable
              key={letter}
              onPress={() => scrollToSection(letter)}
            >
              <Text style={styles.sideIndexLetter}>
                {letter}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchInput: {
    margin: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sectionHeader: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  sectionLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '500' },
  contactPhone: { fontSize: 14, color: '#666', marginTop: 2 },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 40,
    fontSize: 16,
  },
  sideIndex: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideIndexLetter: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A90D9',
    paddingVertical: 1,
  },
});
```

---

## Exemple pratique : ProductGrid avec pagination

```tsx
import {
  FlatList,
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 2;
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
}

function ProductGridScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadProducts = useCallback(async (
    pageNum: number,
    replace = false
  ) => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await fetchProducts(pageNum, 20);

      if (replace) {
        setProducts(result.data);
      } else {
        setProducts(prev => [...prev, ...result.data]);
      }

      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts(1, true);
    setRefreshing(false);
  }, [loadProducts]);

  const onEndReached = useCallback(() => {
    if (hasMore && !loading) {
      loadProducts(page + 1);
    }
  }, [hasMore, loading, page, loadProducts]);

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardBody}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>
            {'★'.repeat(Math.round(item.rating))}
          </Text>
          <Text style={styles.ratingValue}>
            {item.rating.toFixed(1)}
          </Text>
        </View>
        <Text style={styles.price}>{item.price} €</Text>
      </View>
    </View>
  ), []);

  return (
    <FlatList
      data={products}
      renderItem={renderProduct}
      keyExtractor={item => item.id}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <Text style={styles.header}>
          {products.length} produit(s)
        </Text>
      }
      ListFooterComponent={
        loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            style={{ paddingVertical: 20 }}
          />
        ) : !hasMore ? (
          <Text style={styles.endText}>
            Tous les produits sont affiches
          </Text>
        ) : null
      }
      ListEmptyComponent={
        !loading ? (
          <Text style={styles.emptyText}>
            Aucun produit disponible
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: ITEM_MARGIN },
  row: { justifyContent: 'space-between' },
  header: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  card: {
    width: ITEM_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: ITEM_MARGIN,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: ITEM_WIDTH,
  },
  cardBody: { padding: 10 },
  productName: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: { color: '#FFB800', fontSize: 12 },
  ratingValue: { color: '#666', fontSize: 12, marginLeft: 4 },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 4,
  },
  endText: {
    textAlign: 'center',
    color: '#999',
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 40,
    fontSize: 16,
  },
});
```

---

## Astuces et patterns courants

### Scroll vers un élément

```tsx
const flatListRef = useRef<FlatList>(null);

// Avec getItemLayout defini :
flatListRef.current?.scrollToIndex({ index: 42, animated: true });

// Sans getItemLayout (plus lent, necessite la mesure) :
flatListRef.current?.scrollToOffset({ offset: 3000, animated: true });
```

### Detecter le scroll vers le haut

```tsx
<FlatList
  data={messages}
  renderItem={renderMessage}
  keyExtractor={item => item.id}
  inverted={true}  // Pour les listes de chat (dernier element en bas)
  onScroll={(event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY <= 0) {
      // L'utilisateur est en haut de la liste
    }
  }}
/>
```

### Liste horizontale

```tsx
<FlatList
  data={categories}
  renderItem={renderCategory}
  keyExtractor={item => item.id}
  horizontal={true}
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 16 }}
/>
```

### Filtrage et recherche

```tsx
function searchFilter<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  keys: (keyof T)[]
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
    })
  );
}
```

### Tri multi-criteres

```tsx
type SortDirection = 'asc' | 'desc';
type SortCriterion<T> = {
  key: keyof T;
  direction: SortDirection;
};

function sortMultiCriteria<T>(
  items: T[],
  criteria: SortCriterion<T>[]
): T[] {
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
```

---

## Erreurs courantes

### 1. Oublier keyExtractor

```tsx
// ❌ Warning: Each child should have a unique "key" prop
<FlatList data={items} renderItem={renderItem} />

// ✅
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={item => item.id}
/>
```

### 2. Fonction renderItem recree à chaque rendu

```tsx
// ❌ Nouvelle reference a chaque rendu du parent
function Parent() {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <Item data={item} />}
    />
  );
}

// ✅ Stable avec useCallback
function Parent() {
  const renderItem = useCallback(
    ({ item }) => <Item data={item} />,
    []
  );
  return <FlatList data={items} renderItem={renderItem} />;
}
```

### 3. Modifier data sans créer un nouveau tableau

```tsx
// ❌ Mutation en place — FlatList ne detecte pas le changement
items.push(newItem);
setItems(items);

// ✅ Nouveau tableau
setItems(prev => [...prev, newItem]);
```

### 4. onEndReached appele en boucle

```tsx
// ❌ Pas de protection contre les appels multiples
const onEndReached = async () => {
  const newItems = await fetchMore();
  setItems(prev => [...prev, ...newItems]);
};

// ✅ Avec guard
const onEndReached = useCallback(async () => {
  if (loading || !hasMore) return;
  setLoading(true);
  // ...
}, [loading, hasMore]);
```

---

## Résumé

| Composant | Cas d'usage | Props clés |
|-----------|-------------|------------|
| `ScrollView` | Contenu court, taille connue | `contentContainerStyle` |
| `FlatList` | Listes longues, homogenes | `data`, `renderItem`, `keyExtractor` |
| `SectionList` | Listes groupees avec en-tetes | `sections`, `renderSectionHeader` |
| `FlashList` | Listes très longues, performance critique | `estimatedItemSize` |

### Checklist performance

- [ ] `keyExtractor` retourne un ID unique stable
- [ ] `renderItem` est memoize avec `useCallback`
- [ ] Les composants enfants utilisent `React.memo`
- [ ] `getItemLayout` est fourni si hauteur fixe
- [ ] `windowSize` est ajuste (pas 21 si inutile)
- [ ] Les fonctions passees en props ne sont pas recrees à chaque rendu
- [ ] `onEndReached` est protege contre les appels multiples
- [ ] `removeClippedSubviews={true}` sur Android

---

## Exercice pratique

Rendez-vous dans le [Lab 04](../labs/lab-04-listes-donnees/) pour implementer :
- Pagination de donnees
- Groupement en sections (format SectionList)
- Fenetre virtuelle de rendu
- Filtrage et recherche multi-champs
- Tri multi-criteres

```bash
cd labs/lab-04-listes-donnees
npx tsx exercise.ts
```

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 04 listes](../screencasts/screencast-04-listes.md)
2. **Lab** : [lab-04-listes-donnees](../labs/lab-04-listes-donnees/README)
3. **Quiz** : [quiz 04 listes](../quizzes/quiz-04-listes.html)
:::
