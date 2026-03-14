# Module 19 — Performance et optimisation

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 4/5        | 90 min        | [Lab 19](../labs/lab-19-performance/) | [Quiz 19](../quizzes/quiz-19-performance.html) |

## Objectifs

- Identifier les causes de re-renders inutiles et les eliminer avec React.memo, useMemo, useCallback
- Comprendre le moteur Hermes et sa precompilation en bytecode
- Migrer de FlatList vers FlashList pour des listes ultra-performantes
- Optimiser le chargement des images avec expo-image
- Reduire la taille du bundle avec tree-shaking et imports dynamiques
- Detecter et corriger les fuites memoire
- Decharger le JS thread avec des worklets Reanimated
- Profiler une app avec Flipper et React DevTools

---

## Pourquoi la performance compte en mobile

Sur mobile, la performance est directement liee a l'experience utilisateur. Un delai de 100ms est perceptible, 300ms est frustrant. Contrairement au web ou l'utilisateur attend un chargement, en natif les attentes sont celles d'une app parfaitement fluide a 60fps (voire 120fps sur les ecrans ProMotion).

React Native 0.76+ avec la New Architecture (JSI, Fabric, Turbo Modules) ameliore significativement les performances de base en eliminant le bridge asynchrone. Mais cela ne dispense pas d'optimiser le code applicatif.

> **Historique** : L'ancien bridge JSON serialisait chaque appel entre JS et natif de maniere asynchrone. La New Architecture (JSI) utilise des bindings C++ synchrones — le bridge n'existe plus.

Les trois axes d'optimisation :
1. **Render** : eviter les re-renders inutiles du Virtual DOM
2. **Layout** : minimiser les recalculs Fabric (anciennement Yoga)
3. **JS Thread** : ne pas bloquer le thread principal

---

## React.memo, useMemo, useCallback

### Le probleme des re-renders

En React, un composant re-render quand :
- Son state change
- Son parent re-render (meme si les props sont identiques)
- Le contexte qu'il consomme change

```tsx
// Ce composant re-render a CHAQUE render du parent
function ProductCard({ product }: { product: Product }) {
  return (
    <View style={styles.card}>
      <Text>{product.name}</Text>
      <Text>{product.price} EUR</Text>
    </View>
  );
}

function ProductList() {
  const [searchQuery, setSearchQuery] = useState('');
  const products = useProducts();

  // Chaque frappe dans le champ de recherche force le re-render
  // de TOUS les ProductCard, meme ceux dont les props n'ont pas change
  return (
    <View>
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher..."
      />
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </View>
  );
}
```

### React.memo

`React.memo` enveloppe un composant pour empecher le re-render si ses props n'ont pas change (comparaison shallow) :

```tsx
const ProductCard = React.memo(function ProductCard({
  product,
}: {
  product: Product;
}) {
  return (
    <View style={styles.card}>
      <Text>{product.name}</Text>
      <Text>{product.price} EUR</Text>
    </View>
  );
});
```

**Comparaison shallow** : elle compare les references des props, pas leur contenu profond. Pour les objets et tableaux, une nouvelle reference = un re-render.

```tsx
// Comparateur personnalise (rare, pour des cas specifiques)
const ProductCard = React.memo(
  function ProductCard({ product }: { product: Product }) {
    // ...
  },
  (prevProps, nextProps) => {
    // true = skip re-render, false = re-render
    return prevProps.product.id === nextProps.product.id
      && prevProps.product.price === nextProps.product.price;
  }
);
```

### useMemo

`useMemo` memorise le resultat d'un calcul couteux :

```tsx
function ProductList({ products, category }: Props) {
  // SANS useMemo : filtre recalcule a chaque render
  // const filtered = products.filter(p => p.category === category);

  // AVEC useMemo : filtre recalcule SEULEMENT si products ou category change
  const filtered = useMemo(
    () => products.filter((p) => p.category === category),
    [products, category]
  );

  // Tri couteux memorise
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.rating - a.rating),
    [filtered]
  );

  return (
    <FlashList
      data={sorted}
      renderItem={({ item }) => <ProductCard product={item} />}
      estimatedItemSize={80}
    />
  );
}
```

### useCallback

`useCallback` memorise une reference de fonction. Indispensable quand on passe des callbacks a des composants memo :

```tsx
function ProductList() {
  const [cart, setCart] = useState<Product[]>([]);

  // SANS useCallback : nouvelle fonction a chaque render
  // -> les ProductCard memo re-rendent quand meme !
  // const handleAddToCart = (product: Product) => {
  //   setCart(prev => [...prev, product]);
  // };

  // AVEC useCallback : meme reference tant que les deps ne changent pas
  const handleAddToCart = useCallback((product: Product) => {
    setCart((prev) => [...prev, product]);
  }, []); // [] car setCart est stable (setter de useState)

  return (
    <FlashList
      data={products}
      renderItem={({ item }) => (
        <ProductCard product={item} onAddToCart={handleAddToCart} />
      )}
      estimatedItemSize={80}
    />
  );
}
```

### Quand NE PAS utiliser ces hooks

L'optimisation prematuree est l'ennemi de la lisibilite. Ne memorisez pas tout :

```tsx
// INUTILE : calcul trivial, pas besoin de useMemo
const fullName = useMemo(
  () => `${user.firstName} ${user.lastName}`,
  [user.firstName, user.lastName]
);
// Ecrivez simplement :
const fullName = `${user.firstName} ${user.lastName}`;

// INUTILE : composant sans enfants memo
const handlePress = useCallback(() => {
  navigation.navigate('Details');
}, [navigation]);
// Si aucun enfant ne recoit handlePress en prop,
// useCallback ne sert a rien

// INUTILE : React.memo sur un composant qui change a chaque render
const Timer = React.memo(function Timer({ time }: { time: number }) {
  return <Text>{time}s</Text>; // time change chaque seconde, memo inutile
});
```

**Regle d'or** : profilez d'abord, optimisez ensuite. Utilisez React DevTools Profiler pour identifier les composants qui re-rendent trop souvent.

---

## Hermes Engine

### Qu'est-ce que Hermes ?

Hermes est le moteur JavaScript cree par Meta pour React Native. Depuis React Native 0.70, il est active par defaut. Depuis 0.76+, il est le seul moteur officiellement supporte.

### Precompilation en bytecode

La difference fondamentale avec V8 ou JavaScriptCore : Hermes compile le JavaScript en bytecode **au moment du build**, pas au runtime.

```
Code source (.js/.ts)
        |
        v
  [Metro bundler]
        |
        v
  Bundle (.js)
        |
        v
  [Hermes compiler] <-- Compile AVANT le deploy
        |
        v
  Bytecode (.hbc)   <-- Charge directement sur le device
```

**Avantages** :
- **Temps de demarrage reduit** : pas de parsing/compilation au lancement
- **Memoire reduite** : le bytecode est plus compact que le code source + AST
- **TTI (Time to Interactive) reduit** : l'app est interactive plus rapidement

### Verifier que Hermes est actif

```tsx
// Dans un composant ou au demarrage
const isHermes = () => !!(global as any).HermesInternal;

console.log(`Hermes actif : ${isHermes()}`);

// Pour voir la version
if (isHermes()) {
  console.log(
    'Version:',
    (global as any).HermesInternal?.getRuntimeProperties?.()
  );
}
```

### Configuration dans Expo

```json
// app.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

Avec Expo SDK 52+, Hermes est le moteur par defaut. Vous n'avez rien a configurer.

### Limitations de Hermes

Hermes ne supporte pas certaines API ES :
- `Proxy` (supporte depuis Hermes 0.12, mais avec des limitations)
- `Reflect.construct` (partiel)
- `eval()` (desactive pour la securite)
- Certaines fonctionnalites de regex (lookbehind, named groups — ajoutes progressivement)

```tsx
// Verifier le support au runtime
if (typeof Proxy !== 'undefined') {
  // Proxy disponible
}
```

### Profiling Hermes

Hermes fournit un profiler de sampling integre :

```tsx
import { HermesProfiling } from 'react-native';

// Demarrer le profiling
await HermesProfiling.start();

// ... executer le code a profiler ...

// Arreter et recuperer le profil
const profile = await HermesProfiling.stop();
// profile contient un fichier .cpuprofile
// ouvrable dans Chrome DevTools > Performance
```

---

## FlashList vs FlatList

### Le probleme de FlatList

`FlatList` est le composant de liste par defaut de React Native. Il virtualise les elements (ne rend que ceux visibles + un buffer), mais il a des problemes :

- **Blank frames** : des espaces blancs apparaissent pendant le scroll rapide
- **Re-renders excessifs** : `renderItem` est appele plus souvent que necessaire
- **Pas de recycling** : les cellules sont demontees puis remontees

### FlashList de Shopify

FlashList ([@shopify/flash-list](https://shopify.github.io/flash-list/)) utilise le **recycling** : au lieu de demonter une cellule qui sort de l'ecran, elle est reutilisee pour afficher un nouvel element.

```bash
npx expo install @shopify/flash-list
```

### Migration FlatList -> FlashList

```tsx
// AVANT : FlatList
import { FlatList } from 'react-native';

<FlatList
  data={products}
  renderItem={({ item }) => <ProductCard product={item} />}
  keyExtractor={(item) => item.id}
/>

// APRES : FlashList
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={products}
  renderItem={({ item }) => <ProductCard product={item} />}
  keyExtractor={(item) => item.id}
  estimatedItemSize={80} // OBLIGATOIRE : hauteur estimee en px
/>
```

### estimatedItemSize

C'est la prop la plus importante. FlashList l'utilise pour precalculer combien d'elements rendre :

```tsx
// Methode pour trouver la bonne valeur :
// 1. Mettez une valeur approximative (ex: 100)
// 2. Regardez le warning en console :
//    "estimatedItemSize was 100 but the average is 72"
// 3. Ajustez a la valeur suggeree

<FlashList
  data={products}
  renderItem={({ item }) => <ProductCard product={item} />}
  estimatedItemSize={72} // Ajuste apres le premier run
/>
```

### overrideItemLayout

Pour des listes avec des tailles variables :

```tsx
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={80}
  overrideItemLayout={(layout, item) => {
    // Ajuster la taille selon le type d'item
    if (item.type === 'header') {
      layout.size = 120;
    } else if (item.type === 'ad') {
      layout.size = 250;
    } else {
      layout.size = 80;
    }
  }}
/>
```

### getItemType

Optimise le recycling en groupant les elements par type :

```tsx
<FlashList
  data={mixedItems}
  renderItem={({ item }) => {
    switch (item.type) {
      case 'product':
        return <ProductCard product={item} />;
      case 'header':
        return <SectionHeader title={item.title} />;
      case 'ad':
        return <AdBanner ad={item} />;
      default:
        return null;
    }
  }}
  getItemType={(item) => item.type} // FlashList recycle par type
  estimatedItemSize={80}
/>
```

### Benchmarks typiques

| Metrique | FlatList | FlashList |
|----------|----------|-----------|
| Blank frames (scroll rapide) | 20-50% | < 1% |
| Memoire (1000 items) | ~180 MB | ~90 MB |
| Temps de mount (500 items) | ~800ms | ~200ms |
| UI thread (60fps) | Drops frequents | Stable |

---

## Optimisation des images

### expo-image

`expo-image` est le remplacement recommande de `<Image>` de React Native. Il est base sur les meilleures librairies natives (SDWebImage sur iOS, Glide sur Android).

```bash
npx expo install expo-image
```

```tsx
import { Image } from 'expo-image';

// Utilisation de base
<Image
  source={{ uri: 'https://example.com/photo.jpg' }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
/>
```

### Blurhash : placeholder pendant le chargement

```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: product.imageUrl }}
  placeholder={{ blurhash: product.blurhash }}
  // Le blurhash est un hash compact (ex: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj')
  // genere cote serveur, ~30 octets pour un placeholder flou
  transition={300} // Animation fondu 300ms
  style={{ width: '100%', aspectRatio: 4 / 3 }}
  contentFit="cover"
/>
```

### Priorite de chargement

```tsx
// Image critique (hero, above the fold)
<Image
  source={{ uri: heroUrl }}
  priority="high"
  style={styles.hero}
/>

// Image secondaire (dans la liste, below the fold)
<Image
  source={{ uri: thumbnailUrl }}
  priority="low"
  style={styles.thumbnail}
/>
```

### Strategie de cache

```tsx
import { Image } from 'expo-image';

// Politique de cache
<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk" // Defaut : cache memoire + disque
  // Autres options :
  // 'memory' — uniquement en memoire (purgee au background)
  // 'disk' — uniquement sur disque
  // 'none' — pas de cache
  style={styles.image}
/>

// Prefetch d'images (ex: au hover sur une liste)
await Image.prefetch('https://example.com/next-image.jpg');

// Vider le cache
await Image.clearDiskCache();
await Image.clearMemoryCache();
```

### SVG vs PNG : quand utiliser quoi

| Critere | SVG | PNG/WebP |
|---------|-----|----------|
| Icones monochromes | Oui | Non |
| Illustrations complexes | Depend | Oui |
| Photos | Non | Oui (WebP) |
| Taille a l'ecran variable | SVG (vectoriel) | PNG (pixelise) |
| Performance rendu | Plus lent (parsing XML) | Plus rapide |
| Taille fichier (icone simple) | ~500 octets | ~2-5 KB |

```tsx
// Pour les icones : utiliser une police d'icones ou SVG
import { SvgXml } from 'react-native-svg';

const iconSvg = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
</svg>`;

<SvgXml xml={iconSvg} width={24} height={24} color="#333" />

// Pour les photos : toujours WebP avec expo-image
<Image
  source={{ uri: 'https://example.com/photo.webp' }}
  style={styles.photo}
  contentFit="cover"
/>
```

---

## Bundle size

### Analyser la taille du bundle

```bash
# Generer les stats du bundle Metro
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output /tmp/bundle.js \
  --sourcemap-output /tmp/bundle.map

# Visualiser avec source-map-explorer
npx source-map-explorer /tmp/bundle.js /tmp/bundle.map
```

### Tree-shaking avec Metro

Metro (le bundler de React Native) supporte le tree-shaking depuis React Native 0.74+ :

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Activer le tree-shaking experimental (stable depuis 0.76)
config.transformer.unstable_allowRequireContext = true;

module.exports = config;
```

```tsx
// BIEN : import nomme -> tree-shakeable
import { format } from 'date-fns';
format(new Date(), 'yyyy-MM-dd');
// Seule la fonction format est incluse dans le bundle

// MAL : import de tout le module
import _ from 'lodash';
_.map([1, 2, 3], (n) => n * 2);
// TOUT lodash est inclus (~70KB gzippe)

// MIEUX : import specifique de lodash
import map from 'lodash/map';
map([1, 2, 3], (n) => n * 2);
// Seul lodash/map est inclus (~2KB)
```

### Lazy imports et dynamic import()

```tsx
// Import statique : charge au demarrage
import { HeavyChart } from './components/HeavyChart';

// Dynamic import : charge a la demande
const HeavyChartScreen = React.lazy(() => import('./components/HeavyChart'));

function AnalyticsScreen() {
  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <HeavyChartScreen />
    </Suspense>
  );
}
```

### Strategies pour reduire le bundle

```tsx
// 1. Utiliser des alternatives legeres
// lodash (70KB) -> lodash-es (tree-shakeable)
// moment (67KB) -> date-fns (tree-shakeable) ou dayjs (2KB)
// uuid (12KB) -> nanoid (1KB) ou expo-crypto

// 2. Eviter les polyfills inutiles (Hermes supporte ES2020+)
// Pas besoin de core-js, regenerator-runtime, etc.

// 3. Conditionner les imports par plateforme
// components/Camera.ios.tsx  -> fonctionnalites iOS specifiques
// components/Camera.android.tsx -> fonctionnalites Android specifiques
// Metro resout automatiquement l'extension .ios.tsx / .android.tsx

// 4. Require conditionnel (eviter en prod si possible)
if (__DEV__) {
  require('./devtools/ReactotronConfig');
}
```

---

## Gestion de la memoire

### Sources courantes de fuites memoire

```tsx
// 1. Subscriptions non nettoyees
function BadComponent() {
  useEffect(() => {
    const subscription = EventEmitter.addListener('event', handler);
    // OUBLI du cleanup -> fuite memoire !
  }, []);
  // ...
}

// CORRECT :
function GoodComponent() {
  useEffect(() => {
    const subscription = EventEmitter.addListener('event', handler);
    return () => subscription.remove(); // Cleanup !
  }, []);
  // ...
}

// 2. Timers non nettoyes
function BadTimer() {
  useEffect(() => {
    setInterval(() => {
      fetchData(); // Continue meme apres unmount !
    }, 5000);
  }, []);
}

// CORRECT :
function GoodTimer() {
  useEffect(() => {
    const id = setInterval(() => fetchData(), 5000);
    return () => clearInterval(id); // Cleanup !
  }, []);
}

// 3. Closures qui capturent des references volumineuses
function LargeDataProcessor({ data }: { data: BigData[] }) {
  const processedRef = useRef<BigData[]>([]);

  const processItem = useCallback((item: BigData) => {
    // Cette closure capture `data` (potentiellement enorme)
    // meme si on n'utilise qu'un seul item
    processedRef.current.push(item);
  }, [data]); // data dans les deps = nouvelle closure a chaque changement

  // MIEUX : ne pas capturer data
  const processItem2 = useCallback((item: BigData) => {
    processedRef.current.push(item);
  }, []); // Pas de deps sur data
}
```

### WeakRef et FinalizationRegistry

```tsx
// WeakRef : reference qui n'empeche pas le garbage collection
class ImageCache {
  private cache = new Map<string, WeakRef<ImageData>>();

  set(key: string, image: ImageData) {
    this.cache.set(key, new WeakRef(image));
  }

  get(key: string): ImageData | undefined {
    const ref = this.cache.get(key);
    if (!ref) return undefined;
    const image = ref.deref(); // undefined si GC a libere l'objet
    if (!image) {
      this.cache.delete(key); // Nettoyer l'entree morte
    }
    return image;
  }
}

// FinalizationRegistry : callback quand un objet est GC
const registry = new FinalizationRegistry((key: string) => {
  console.log(`Image ${key} a ete garbage collectee`);
});

function cacheImage(key: string, image: ImageData) {
  registry.register(image, key);
  imageCache.set(key, image);
}
```

### Patterns de cleanup

```tsx
// Pattern : AbortController pour annuler les requetes
function useApiData(url: string) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });

    return () => controller.abort(); // Annule la requete au unmount
  }, [url]);

  return data;
}

// Pattern : flag isMounted (pour les cas ou AbortController
// n'est pas disponible)
function useAsyncEffect(url: string) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    loadData(url).then((result) => {
      if (isMounted) {
        setData(result); // Ne met a jour que si encore monte
      }
    });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return data;
}
```

---

## Performances du JS Thread

### Le probleme

Le JS thread est unique. Tout calcul lourd bloque :
- Les interactions utilisateur
- Les animations (si pas sur UI thread)
- Les mises a jour de state

```tsx
// MAUVAIS : calcul lourd sur le JS thread
function SearchScreen() {
  const [query, setQuery] = useState('');
  const allProducts = useProducts(); // 10 000 items

  // Ce filtre bloque le JS thread a chaque frappe
  const results = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View>
      <TextInput value={query} onChangeText={setQuery} />
      <FlashList data={results} ... />
    </View>
  );
}
```

### Solution 1 : debounce

```tsx
import { useDeferredValue } from 'react';

function SearchScreen() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const allProducts = useProducts();

  // Le filtre utilise deferredQuery (mis a jour apres le render)
  const results = useMemo(
    () =>
      allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(deferredQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(deferredQuery.toLowerCase())
      ),
    [allProducts, deferredQuery]
  );

  return (
    <View>
      <TextInput value={query} onChangeText={setQuery} />
      <FlashList data={results} renderItem={renderItem} estimatedItemSize={80} />
    </View>
  );
}
```

### Solution 2 : offloading avec Reanimated worklets

Les worklets s'executent sur le **UI thread**, pas sur le JS thread :

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnUI,
} from 'react-native-reanimated';

function DragCard() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Ce calcul s'execute sur le UI thread (60fps garanti)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      // S'execute sur le UI thread via JSI
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text>Drag me</Text>
      </Animated.View>
    </GestureDetector>
  );
}
```

### Solution 3 : InteractionManager

```tsx
import { InteractionManager } from 'react-native';

function DetailScreen() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Attendre que l'animation de transition soit terminee
    // avant de lancer un calcul lourd
    const task = InteractionManager.runAfterInteractions(() => {
      const result = heavyComputation();
      setData(result);
    });

    return () => task.cancel();
  }, []);

  if (!data) return <LoadingSkeleton />;
  return <DetailView data={data} />;
}
```

---

## Profiling avec React DevTools et Flipper

### React DevTools Profiler

```bash
# Lancer React DevTools en standalone
npx react-devtools
```

Les etapes de profiling :
1. Ouvrir React DevTools > onglet **Profiler**
2. Cliquer **Record** (bouton rond bleu)
3. Interagir avec l'app (scroller, taper, naviguer)
4. Cliquer **Stop**
5. Analyser le **flame chart**

### Lire un flame chart

```
Commit #1 (12ms)
├── App (2ms)
│   ├── Navigator (1ms)
│   │   ├── ProductList (8ms)     <- 🔴 trop long !
│   │   │   ├── ProductCard (0.5ms) x 20
│   │   │   └── ProductCard (0.5ms) x 20
│   │   └── SearchBar (0.2ms)
│   └── TabBar (0.5ms)
```

Couleurs dans le Profiler :
- **Gris** : n'a pas re-render
- **Bleu/vert** : a re-render rapidement
- **Jaune/orange** : a re-render lentement
- **Rouge** : re-render tres lent (goulot)

### Highlight des re-renders

```tsx
// Dans React DevTools > Settings > Profiler
// Cocher "Highlight updates when components render"
// Les composants qui re-rendent s'entourent d'un flash colore
```

### Flipper (Meta)

Flipper est l'outil de debugging officiel de Meta pour React Native :

```bash
# Installation (macOS)
brew install flipper

# Ou telecharger depuis https://fbflipper.com/
```

Plugins utiles :
- **React DevTools** : integre dans Flipper
- **Network** : inspecter les requetes HTTP
- **Databases** : voir SQLite / AsyncStorage
- **Layout** : inspecter l'arbre des vues natives
- **Hermes Debugger** : deboguer le code JS avec breakpoints

### Performance Monitor natif

```tsx
// Afficher le moniteur de performances integre
import { DevSettings } from 'react-native';

if (__DEV__) {
  // Secouer le device ou Cmd+D dans le simulateur
  // -> "Show Perf Monitor"
  // Affiche : JS FPS | UI FPS | RAM | Views
}
```

### Mesurer avec console.time

```tsx
// Mesure simple
console.time('filterProducts');
const filtered = products.filter(/* ... */);
console.timeEnd('filterProducts');
// filterProducts: 45.123ms

// Mesure avec l'API Performance
const start = performance.now();
const result = heavyComputation();
const duration = performance.now() - start;
console.log(`Computation: ${duration.toFixed(2)}ms`);
```

---

## Pratique : optimiser une app lente

### Scenario : app de e-commerce avec des problemes de performance

Voici une app avec plusieurs problemes. Identifions-les et corrigeons-les :

```tsx
// AVANT : app lente avec tous les anti-patterns
// ================================================

// 1. Pas de memo sur les composants de liste
function ProductCard({ product, onPress, onAddToCart }) {
  // Re-render a chaque changement du parent
  return (
    <TouchableOpacity onPress={() => onPress(product.id)}>
      <Image
        source={{ uri: product.image }}
        style={{ width: 100, height: 100 }}
      />
      <Text>{product.name}</Text>
      <Text>{product.price} EUR</Text>
      <Button title="Ajouter" onPress={() => onAddToCart(product)} />
    </TouchableOpacity>
  );
}

// 2. FlatList sans optimisations
function ProductListScreen() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // 3. Fetch sans cleanup
    fetch('https://api.example.com/products')
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  // 4. Filtre recalcule a chaque render
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // 5. Nouvelle fonction a chaque render
  const handlePress = (id) => navigation.navigate('Details', { id });
  const handleAddToCart = (product) => setCart([...cart, product]);

  return (
    <View style={{ flex: 1 }}>
      <TextInput value={search} onChangeText={setSearch} />
      <FlatList
        data={filtered}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={handlePress}
            onAddToCart={handleAddToCart}
          />
        )}
        keyExtractor={(item) => item.id}
      />
      <Text>Panier: {cart.length} articles</Text>
    </View>
  );
}
```

```tsx
// APRES : app optimisee
// ================================================

import React, { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { View, TextInput, Text, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';

// 1. React.memo avec expo-image et blurhash
const ProductCard = React.memo(function ProductCard({
  product,
  onPress,
  onAddToCart,
}: ProductCardProps) {
  return (
    <Pressable onPress={() => onPress(product.id)}>
      <Image
        source={{ uri: product.image }}
        placeholder={{ blurhash: product.blurhash }}
        style={{ width: 100, height: 100 }}
        contentFit="cover"
        transition={200}
        priority="low"
      />
      <Text>{product.name}</Text>
      <Text>{product.price} EUR</Text>
      <Pressable onPress={() => onAddToCart(product)}>
        <Text>Ajouter</Text>
      </Pressable>
    </Pressable>
  );
});

function ProductListScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Product[]>([]);

  // 3. Fetch avec AbortController
  useEffect(() => {
    const controller = new AbortController();
    fetch('https://api.example.com/products', {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then(setProducts)
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      });
    return () => controller.abort();
  }, []);

  // 4. Filtre memorise
  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  // 5. Callbacks memorises
  const handlePress = useCallback(
    (id: string) => navigation.navigate('Details', { id }),
    [navigation]
  );
  const handleAddToCart = useCallback(
    (product: Product) => setCart((prev) => [...prev, product]),
    []
  );

  // 6. renderItem memorise
  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        onPress={handlePress}
        onAddToCart={handleAddToCart}
      />
    ),
    [handlePress, handleAddToCart]
  );

  return (
    <View style={{ flex: 1 }}>
      <TextInput value={search} onChangeText={setSearch} />
      {/* 2. FlashList a la place de FlatList */}
      <FlashList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
      />
      <Text>Panier: {cart.length} articles</Text>
    </View>
  );
}
```

### Checklist d'optimisation

| Etape | Action | Impact |
|-------|--------|--------|
| 1 | Profiler avec React DevTools | Identifier les goulots |
| 2 | `React.memo` sur les items de liste | Eviter les re-renders |
| 3 | `useCallback` pour les handlers passes en props | Stabiliser les references |
| 4 | `useMemo` pour les calculs couteux | Eviter les recalculs |
| 5 | FlashList au lieu de FlatList | Recycling + perf |
| 6 | expo-image au lieu de Image | Cache + blurhash |
| 7 | Cleanup dans les useEffect | Eviter les fuites memoire |
| 8 | Lazy import des ecrans lourds | Reduire le TTI |
| 9 | Verifier Hermes actif | Bytecode precompile |
| 10 | Analyser le bundle | Trouver les deps lourdes |

---

## Resume

| Concept | A retenir |
|---------|-----------|
| React.memo | Wrap les composants de liste, PAS tout |
| useMemo | Pour les calculs couteux, PAS les operations triviales |
| useCallback | Quand le callback est passe a un composant memo |
| Hermes | Actif par defaut, bytecode precompile, verifie avec HermesInternal |
| FlashList | Remplace FlatList, estimatedItemSize obligatoire, recycling |
| expo-image | Blurhash, cache, priorite, remplace Image |
| Bundle | Tree-shaking, imports nommes, lazy import, alternatives legeres |
| Memoire | Cleanup dans useEffect, AbortController, WeakRef |
| JS Thread | useDeferredValue, worklets Reanimated, InteractionManager |
| Profiling | React DevTools Profiler, Flipper, console.time |

---

## Ressources

- [FlashList](https://shopify.github.io/flash-list/) — Documentation officielle
- [expo-image](https://docs.expo.dev/versions/latest/sdk/image/) — API reference
- [Hermes](https://hermesengine.dev/) — Moteur JavaScript optimise pour mobile
- [React Profiler](https://react.dev/reference/react/Profiler) — Documentation officielle
- [Reanimated Worklets](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/worklets/) — Offloading sur UI thread
