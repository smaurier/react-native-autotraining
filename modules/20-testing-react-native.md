# Module 20 — Testing React Native

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 4/5        | 90 min        | [Lab 20](../labs/lab-20-testing/) | [Quiz 20](../quizzes/quiz-20-testing.html) |

## Objectifs

- Configurer Jest avec React Native et Hermes
- Maitriser React Native Testing Library (RNTL) : render, screen, queries, events
- Tester des composants avec getByText, getByRole, getByTestId
- Tester des hooks personnalises avec renderHook et act
- Tester la navigation avec un NavigationContainer mocke
- Gerer l'asynchrone avec waitFor et findBy
- Mocker les modules natifs avec jest.mock
- Comprendre quand les snapshots sont utiles (et quand ils nuisent)
- Tester un store Zustand
- Tester des hooks React Query
- Configurer la couverture de code avec des seuils pertinents
- Ecrire une suite de tests complete pour un flux de login

---

## Configuration de Jest avec React Native

### Setup de base avec Expo

Expo SDK 52+ inclut Jest preconfigure :

```bash
npx expo install jest-expo jest @types/jest
```

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@shopify/flash-list)"
    ]
  }
}
```

### Configuration TypeScript

```ts
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  setupFilesAfterSetup: ['./jest.setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo|@expo|react-navigation|@react-navigation|@shopify/flash-list)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};

export default config;
```

### Fichier de setup

```ts
// jest.setup.ts
import '@testing-library/react-native/extend-expect';

// Mock des modules natifs courants
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'ExpoImage',
}));

// Mock de AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Silence les warnings en test
jest.spyOn(console, 'warn').mockImplementation(() => {});
```

### Hermes et Jest

Hermes est le moteur JS par defaut. Jest utilise le moteur de Node.js, pas Hermes. Pour tester du code qui depend de fonctionnalites specifiques a Hermes :

```ts
// jest.setup.ts — simuler l'environnement Hermes si necessaire
(global as any).HermesInternal = {
  getRuntimeProperties: () => ({
    'OSS Release Version': '0.12.0',
  }),
};
```

---

## React Native Testing Library (RNTL)

### Installation

```bash
npm install --save-dev @testing-library/react-native
```

### Philosophie

RNTL suit la philosophie de Testing Library : **tester comme l'utilisateur interagit**, pas les details d'implementation.

```tsx
// MAUVAIS : tester les details d'implementation
expect(component.state.isLoading).toBe(false);
expect(component.instance().handlePress).toBeDefined();

// BON : tester ce que l'utilisateur voit et fait
expect(screen.getByText('Bienvenue')).toBeTruthy();
fireEvent.press(screen.getByRole('button', { name: 'Connexion' }));
expect(screen.getByText('Vous etes connecte')).toBeTruthy();
```

### render et screen

```tsx
import { render, screen } from '@testing-library/react-native';
import { WelcomeScreen } from '../WelcomeScreen';

describe('WelcomeScreen', () => {
  it('affiche le titre de bienvenue', () => {
    render(<WelcomeScreen userName="Alice" />);

    // screen donne acces a toutes les queries
    expect(screen.getByText('Bonjour, Alice !')).toBeTruthy();
  });
});
```

---

## Queries : trouver les elements

### Hierarchie des queries (par ordre de preference)

| Priorite | Query | Usage |
|----------|-------|-------|
| 1 | `getByRole` | Accessibilite (bouton, heading, text input) |
| 2 | `getByText` | Texte visible a l'ecran |
| 3 | `getByPlaceholderText` | Champ de saisie |
| 4 | `getByDisplayValue` | Valeur actuelle d'un input |
| 5 | `getByLabelText` | Label d'accessibilite |
| 6 | `getByTestId` | Dernier recours (testID prop) |

### getByRole

```tsx
// Composant
function LoginForm() {
  return (
    <View>
      <Text accessibilityRole="header">Connexion</Text>
      <TextInput
        accessibilityLabel="Email"
        placeholder="votre@email.com"
        accessibilityRole="none"
      />
      <TextInput
        accessibilityLabel="Mot de passe"
        secureTextEntry
        placeholder="********"
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Se connecter">
        <Text>Se connecter</Text>
      </Pressable>
    </View>
  );
}

// Test
it('affiche le formulaire de login', () => {
  render(<LoginForm />);

  expect(screen.getByRole('header')).toHaveTextContent('Connexion');
  expect(screen.getByLabelText('Email')).toBeTruthy();
  expect(screen.getByLabelText('Mot de passe')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Se connecter' })).toBeTruthy();
});
```

### getByText

```tsx
it('affiche le prix du produit', () => {
  render(<ProductCard product={mockProduct} />);

  expect(screen.getByText('29.99 EUR')).toBeTruthy();
  expect(screen.getByText('En stock')).toBeTruthy();
});

// Avec regex pour un match partiel
expect(screen.getByText(/29\.99/)).toBeTruthy();
```

### getByTestId (dernier recours)

```tsx
// Composant — testID uniquement quand les autres queries sont impossibles
<View testID="product-card-42">
  <Image source={{ uri: product.image }} testID="product-image" />
  <View testID="rating-stars">
    {/* SVG stars complexes */}
  </View>
</View>

// Test
expect(screen.getByTestId('product-card-42')).toBeTruthy();
```

### Variantes : getBy, queryBy, findBy, getAllBy

```tsx
// getBy : leve une erreur si pas trouve (ou plus d'un)
screen.getByText('Connexion'); // throw si absent

// queryBy : retourne null si pas trouve (pour tester l'ABSENCE)
expect(screen.queryByText('Erreur')).toBeNull();

// findBy : async, attend que l'element apparaisse (utilise waitFor)
const welcomeText = await screen.findByText('Bienvenue');

// getAllBy : retourne un tableau (au moins 1)
const items = screen.getAllByRole('button');
expect(items).toHaveLength(3);

// queryAllBy : retourne un tableau vide si rien trouve
const errors = screen.queryAllByText(/erreur/i);
expect(errors).toHaveLength(0);
```

---

## Events : fireEvent et userEvent

### fireEvent

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

it('met a jour le compteur au clic', () => {
  render(<Counter />);

  const button = screen.getByRole('button', { name: 'Incrementer' });
  expect(screen.getByText('Compteur: 0')).toBeTruthy();

  fireEvent.press(button);
  expect(screen.getByText('Compteur: 1')).toBeTruthy();

  fireEvent.press(button);
  fireEvent.press(button);
  expect(screen.getByText('Compteur: 3')).toBeTruthy();
});
```

### Events de saisie

```tsx
it('filtre les produits par recherche', () => {
  render(<ProductSearch products={mockProducts} />);

  const searchInput = screen.getByPlaceholderText('Rechercher...');
  fireEvent.changeText(searchInput, 'iPhone');

  expect(screen.getByText('iPhone 15')).toBeTruthy();
  expect(screen.queryByText('Samsung Galaxy')).toBeNull();
});
```

### Events de scroll

```tsx
it('charge plus d\'items au scroll', () => {
  render(<InfiniteList />);

  const list = screen.getByTestId('product-list');

  // Simuler un scroll vers le bas
  fireEvent.scroll(list, {
    nativeEvent: {
      contentOffset: { y: 1000 },
      contentSize: { height: 2000, width: 375 },
      layoutMeasurement: { height: 800, width: 375 },
    },
  });

  // Verifier que plus d'items sont charges
  expect(screen.getAllByTestId(/product-item/)).toHaveLength(20);
});
```

---

## Tester des hooks : renderHook et act

### renderHook

```tsx
import { renderHook, act } from '@testing-library/react-native';

// Hook a tester
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => c - 1);
  const reset = () => setCount(initial);
  return { count, increment, decrement, reset };
}

// Test
describe('useCounter', () => {
  it('initialise avec la valeur par defaut', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('incremente le compteur', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(11);
  });

  it('reset au compteur initial', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.count).toBe(7);

    act(() => {
      result.current.reset();
    });
    expect(result.current.count).toBe(5);
  });
});
```

### Tester un hook avec un wrapper (providers)

```tsx
// Hook qui depend d'un contexte
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be within ThemeProvider');
  return context;
}

// Test avec wrapper
it('retourne le theme du provider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme="dark">{children}</ThemeProvider>
  );

  const { result } = renderHook(() => useTheme(), { wrapper });
  expect(result.current.theme).toBe('dark');
});
```

---

## Tester la navigation

### Mock du NavigationContainer

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { render, screen, fireEvent } from '@testing-library/react-native';

const Stack = createNativeStackNavigator();

function renderWithNavigation(component: React.ReactElement) {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Test" component={() => component} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Ou pour tester la navigation entre ecrans :
function renderNavigator() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Tester la navigation

```tsx
it('navigue vers Details au clic sur un produit', async () => {
  renderNavigator();

  // On est sur Home
  expect(screen.getByText('Liste des produits')).toBeTruthy();

  // Cliquer sur un produit
  fireEvent.press(screen.getByText('iPhone 15'));

  // Verifier qu'on est sur Details
  expect(await screen.findByText('Details du produit')).toBeTruthy();
  expect(screen.getByText('iPhone 15')).toBeTruthy();
});

it('revient en arriere avec le bouton retour', async () => {
  renderNavigator();

  fireEvent.press(screen.getByText('iPhone 15'));
  await screen.findByText('Details du produit');

  // Simuler le retour
  fireEvent.press(screen.getByLabelText('Retour'));

  expect(await screen.findByText('Liste des produits')).toBeTruthy();
});
```

### Mocker useNavigation

Pour des tests unitaires de composants sans monter tout le navigator :

```tsx
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: { id: '42' },
  }),
}));

it('appelle navigate avec les bons params', () => {
  render(<ProductCard product={mockProduct} />);

  fireEvent.press(screen.getByText('Voir les details'));

  expect(mockNavigate).toHaveBeenCalledWith('Details', { id: '42' });
});
```

---

## Tests asynchrones : waitFor et findBy

### waitFor

```tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

it('affiche les donnees apres le chargement', async () => {
  // Mock du fetch
  jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => ({ products: [{ id: '1', name: 'iPhone 15' }] }),
  } as Response);

  render(<ProductListScreen />);

  // D'abord on voit le loader
  expect(screen.getByTestId('loading-spinner')).toBeTruthy();

  // Puis les donnees apparaissent
  await waitFor(() => {
    expect(screen.getByText('iPhone 15')).toBeTruthy();
  });

  // Le loader a disparu
  expect(screen.queryByTestId('loading-spinner')).toBeNull();
});
```

### findBy (raccourci pour waitFor + getBy)

```tsx
it('affiche un message d erreur en cas d echec', async () => {
  jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network'));

  render(<ProductListScreen />);

  // findByText attend automatiquement (timeout par defaut : 1000ms)
  const errorMessage = await screen.findByText('Erreur de chargement');
  expect(errorMessage).toBeTruthy();
});

// Avec timeout personnalise
const slowElement = await screen.findByText('Donnees chargees', {}, {
  timeout: 5000,
});
```

### Tester des formulaires async

```tsx
it('soumet le formulaire et affiche le succes', async () => {
  const mockSubmit = jest.fn().mockResolvedValueOnce({ success: true });

  render(<LoginForm onSubmit={mockSubmit} />);

  fireEvent.changeText(screen.getByLabelText('Email'), 'alice@test.com');
  fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'secret123');
  fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));

  // Attendre le resultat async
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'alice@test.com',
      password: 'secret123',
    });
  });

  expect(await screen.findByText('Connexion reussie')).toBeTruthy();
});
```

---

## Mocking des modules natifs

### jest.mock pour les modules natifs

```tsx
// __mocks__/react-native-camera.ts
export const RNCamera = {
  Constants: {
    FlashMode: { on: 'on', off: 'off', auto: 'auto' },
    Type: { back: 'back', front: 'front' },
  },
};

export default {
  takePictureAsync: jest.fn().mockResolvedValue({ uri: 'mock://photo.jpg' }),
};
```

```tsx
// Dans le test
jest.mock('react-native-camera');

it('prend une photo et l affiche', async () => {
  render(<CameraScreen />);

  fireEvent.press(screen.getByRole('button', { name: 'Prendre une photo' }));

  const photo = await screen.findByTestId('preview-image');
  expect(photo.props.source).toEqual({ uri: 'mock://photo.jpg' });
});
```

### Mock de expo modules

```tsx
// Mock de expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
  }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 48.8566, longitude: 2.3522 },
  }),
  Accuracy: { High: 6 },
}));

it('affiche la position de l utilisateur', async () => {
  render(<LocationScreen />);

  fireEvent.press(screen.getByText('Obtenir ma position'));

  expect(await screen.findByText(/48\.8566/)).toBeTruthy();
});
```

### Dossier __mocks__

```
src/
  __mocks__/
    expo-image.ts
    @react-native-async-storage/
      async-storage.ts
    react-native-reanimated.ts
  components/
  screens/
```

```ts
// __mocks__/react-native-reanimated.ts
// Mock complet pour les tests
const Reanimated = {
  useSharedValue: jest.fn((init) => ({ value: init })),
  useAnimatedStyle: jest.fn((fn) => fn()),
  withSpring: jest.fn((v) => v),
  withTiming: jest.fn((v) => v),
  withDelay: jest.fn((_d, v) => v),
  runOnUI: jest.fn((fn) => fn),
  runOnJS: jest.fn((fn) => fn),
};

module.exports = {
  ...Reanimated,
  default: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image',
    ScrollView: 'Animated.ScrollView',
    createAnimatedComponent: jest.fn((comp) => comp),
  },
};
```

---

## Snapshot testing

### Quand les snapshots sont utiles

```tsx
// BON : snapshot pour un composant presentationnel stable
it('match le snapshot du header', () => {
  const tree = render(
    <AppHeader title="Accueil" showBack={false} />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});
```

Les snapshots sont utiles pour :
- Detecter des changements visuels accidentels
- Composants presentationnels stables (Header, Footer, Badge)
- Design system : composants de base (Button, Card, Input)

### Quand les snapshots NUISENT

```tsx
// MAUVAIS : snapshot d'un composant avec des donnees dynamiques
it('match le snapshot de la page produit', () => {
  // Ce snapshot sera ENORME et changera constamment
  const tree = render(
    <ProductPage product={fullProduct} reviews={reviews} relatedProducts={related} />
  ).toJSON();
  expect(tree).toMatchSnapshot();
  // -> fichier .snap de 500+ lignes
  // -> mis a jour avec `jest -u` sans verifier le contenu
  // -> faux sentiment de securite
});
```

Les snapshots sont nuisibles quand :
- Le composant contient des donnees dynamiques (dates, IDs)
- Le snapshot est trop gros (>50 lignes)
- On fait `jest -u` sans regarder les diffs
- Le test ne verifie rien de specifique

### Inline snapshots (alternative)

```tsx
// Snapshots inline : plus petits, revues dans les code reviews
it('rend le badge avec le bon style', () => {
  const { toJSON } = render(<Badge count={5} color="red" />);

  expect(toJSON()).toMatchInlineSnapshot(`
    <View style={{ backgroundColor: 'red', borderRadius: 10, padding: 4 }}>
      <Text style={{ color: 'white', fontSize: 12 }}>5</Text>
    </View>
  `);
});
```

---

## Tester un store Zustand

### Setup

```tsx
// store/useCartStore.ts
import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
```

### Tests du store

```tsx
// __tests__/useCartStore.test.ts
import { useCartStore } from '../store/useCartStore';
import { act } from '@testing-library/react-native';

// IMPORTANT : reset le store entre chaque test
beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe('useCartStore', () => {
  it('ajoute un item au panier', () => {
    const { addItem } = useCartStore.getState();

    act(() => {
      addItem({ id: '1', name: 'iPhone', price: 999 });
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: '1',
      name: 'iPhone',
      price: 999,
      quantity: 1,
    });
  });

  it('incremente la quantite si l item existe deja', () => {
    const { addItem } = useCartStore.getState();

    act(() => {
      addItem({ id: '1', name: 'iPhone', price: 999 });
      addItem({ id: '1', name: 'iPhone', price: 999 });
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('supprime un item du panier', () => {
    useCartStore.setState({
      items: [{ id: '1', name: 'iPhone', price: 999, quantity: 1 }],
    });

    act(() => {
      useCartStore.getState().removeItem('1');
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('calcule le total correctement', () => {
    useCartStore.setState({
      items: [
        { id: '1', name: 'iPhone', price: 999, quantity: 2 },
        { id: '2', name: 'Case', price: 29, quantity: 1 },
      ],
    });

    expect(useCartStore.getState().total()).toBe(2027);
  });

  it('vide le panier', () => {
    useCartStore.setState({
      items: [
        { id: '1', name: 'iPhone', price: 999, quantity: 1 },
        { id: '2', name: 'Case', price: 29, quantity: 3 },
      ],
    });

    act(() => {
      useCartStore.getState().clearCart();
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
```

### Tester un composant qui utilise le store

```tsx
it('affiche les items du panier', () => {
  // Pre-remplir le store
  useCartStore.setState({
    items: [
      { id: '1', name: 'iPhone 15', price: 999, quantity: 1 },
      { id: '2', name: 'AirPods', price: 199, quantity: 2 },
    ],
  });

  render(<CartScreen />);

  expect(screen.getByText('iPhone 15')).toBeTruthy();
  expect(screen.getByText('AirPods')).toBeTruthy();
  expect(screen.getByText('1 397 EUR')).toBeTruthy(); // total
});
```

---

## Tester React Query

### Setup du QueryClient pour les tests

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Pas de retry en test
        gcTime: 0, // Pas de cache entre les tests
      },
    },
  });
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}
```

### Tester un hook useQuery

```tsx
// Hook
function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then((r) => r.json()),
  });
}

// Test
it('charge et affiche les produits', async () => {
  // Mock du fetch
  jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { id: '1', name: 'iPhone 15', price: 999 },
      { id: '2', name: 'Galaxy S24', price: 899 },
    ],
  } as Response);

  renderWithQuery(<ProductListScreen />);

  // Etat de chargement
  expect(screen.getByTestId('loading')).toBeTruthy();

  // Donnees chargees
  expect(await screen.findByText('iPhone 15')).toBeTruthy();
  expect(screen.getByText('Galaxy S24')).toBeTruthy();
  expect(screen.queryByTestId('loading')).toBeNull();
});
```

### Tester un hook useMutation

```tsx
it('ajoute un produit au panier via mutation', async () => {
  const mockPost = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true }),
  } as Response);

  renderWithQuery(<AddToCartButton productId="42" />);

  fireEvent.press(screen.getByRole('button', { name: 'Ajouter au panier' }));

  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledWith('/api/cart', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ productId: '42' }),
    }));
  });

  expect(await screen.findByText('Ajoute !')).toBeTruthy();
});
```

### Tester les erreurs

```tsx
it('affiche une erreur quand le fetch echoue', async () => {
  jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network Error'));

  renderWithQuery(<ProductListScreen />);

  expect(await screen.findByText(/erreur/i)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Reessayer' })).toBeTruthy();
});

it('retente le chargement au clic sur Reessayer', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch')
    .mockRejectedValueOnce(new Error('Network'))
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: '1', name: 'iPhone 15' }],
    } as Response);

  renderWithQuery(<ProductListScreen />);

  // Premiere tentative echoue
  await screen.findByText(/erreur/i);

  // Reessayer
  fireEvent.press(screen.getByRole('button', { name: 'Reessayer' }));

  // Deuxieme tentative reussit
  expect(await screen.findByText('iPhone 15')).toBeTruthy();
  expect(fetchSpy).toHaveBeenCalledTimes(2);
});
```

---

## Couverture de code

### Configuration

```json
// jest.config.ts (extrait)
{
  "collectCoverage": true,
  "coverageDirectory": "coverage",
  "coverageReporters": ["text", "lcov", "json-summary"],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "src/store/**/*.ts": {
      "branches": 90,
      "functions": 95,
      "lines": 95,
      "statements": 95
    },
    "src/utils/**/*.ts": {
      "branches": 90,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  }
}
```

### Seuils pertinents

| Type de code | Couverture recommandee | Justification |
|-------------|----------------------|---------------|
| Utils / helpers purs | 95%+ | Fonctions pures, faciles a tester |
| Stores (Zustand) | 90%+ | Logique metier critique |
| Hooks personnalises | 85%+ | Logique reutilisable |
| Composants ecrans | 70%+ | Beaucoup de UI, tester les interactions |
| Composants UI de base | 60%+ | Surtout visuels, snapshots suffisent |
| Navigation config | 50%+ | Configuration plus que logique |

### Commandes utiles

```bash
# Couverture globale
npx jest --coverage

# Couverture d'un fichier specifique
npx jest --coverage --collectCoverageFrom='src/store/useCartStore.ts'

# Rapport HTML (ouvrir coverage/lcov-report/index.html)
npx jest --coverage --coverageReporters=html

# Verifier les seuils en CI
npx jest --coverage --coverageThreshold='{"global":{"lines":80}}'
```

---

## Pratique : suite de tests pour un flux de login

### Le composant a tester

```tsx
// screens/LoginScreen.tsx
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!email || !password) return;
    const success = await login(email, password);
    if (success) {
      navigation.navigate('Home' as never);
    }
  };

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Connexion
      </Text>

      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}

      <TextInput
        accessibilityLabel="Email"
        placeholder="votre@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        accessibilityLabel="Mot de passe"
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Se connecter"
        onPress={handleSubmit}
        disabled={isLoading}
        style={[styles.button, isLoading && styles.disabled]}
      >
        <Text>{isLoading ? 'Connexion...' : 'Se connecter'}</Text>
      </Pressable>
    </View>
  );
}
```

### Le hook useAuth

```tsx
// hooks/useAuth.ts
function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Erreur de connexion');
        return false;
      }
      const user = await response.json();
      setUser(user);
      return true;
    } catch {
      setError('Erreur reseau');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
```

### La suite de tests complete

```tsx
// __tests__/LoginScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuthStore } from '../store/useAuthStore';

// Mocks
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// Reset entre les tests
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null });
});

describe('LoginScreen', () => {
  // --- Tests de rendu ---

  it('affiche le formulaire de connexion', () => {
    render(<LoginScreen />);

    expect(screen.getByRole('header')).toHaveTextContent('Connexion');
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Mot de passe')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeTruthy();
  });

  it('n affiche pas de message d erreur initialement', () => {
    render(<LoginScreen />);

    expect(screen.queryByRole('alert')).toBeNull();
  });

  // --- Tests d'interaction ---

  it('permet de saisir email et mot de passe', () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'alice@test.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'secret123');

    expect(screen.getByLabelText('Email')).toHaveProp('value', 'alice@test.com');
    expect(screen.getByLabelText('Mot de passe')).toHaveProp('value', 'secret123');
  });

  it('ne soumet pas si les champs sont vides', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    render(<LoginScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // --- Tests async (succes) ---

  it('connexion reussie : navigue vers Home', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Alice', email: 'alice@test.com' }),
    } as Response);

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'alice@test.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'secret123');
    fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });

  it('affiche un etat de chargement pendant la connexion', async () => {
    // Fetch qui ne resolve pas tout de suite
    let resolveLogin: (value: any) => void;
    jest.spyOn(global, 'fetch').mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'alice@test.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'secret123');
    fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));

    // Pendant le chargement
    expect(screen.getByText('Connexion...')).toBeTruthy();

    // Resoudre le fetch
    resolveLogin!({
      ok: true,
      json: async () => ({ id: '1', name: 'Alice' }),
    });

    await waitFor(() => {
      expect(screen.getByText('Se connecter')).toBeTruthy();
    });
  });

  it('met a jour le store apres connexion reussie', async () => {
    const mockUser = { id: '1', name: 'Alice', email: 'alice@test.com' };
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    } as Response);

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'alice@test.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'secret123');
    fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  // --- Tests async (erreurs) ---

  it('affiche une erreur serveur', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Email ou mot de passe incorrect' }),
    } as Response);

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'alice@test.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'wrong');
    fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));

    expect(
      await screen.findByText('Email ou mot de passe incorrect')
    ).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('affiche une erreur reseau', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network'));

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'alice@test.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'secret123');
    fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Erreur reseau')).toBeTruthy();
  });

  it('ne navigue pas en cas d erreur', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network'));

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'alice@test.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'secret123');
    fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));

    await screen.findByText('Erreur reseau');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
```

---

## Resume

| Concept | A retenir |
|---------|-----------|
| Jest + Expo | `jest-expo` preset, `transformIgnorePatterns` pour les modules |
| RNTL | Tester comme l'utilisateur, pas les details d'implementation |
| Queries | Preferer getByRole > getByText > getByTestId |
| fireEvent | `press`, `changeText`, `scroll` — simuler les interactions |
| renderHook | Tester les hooks isoles avec `act` pour les mises a jour |
| Navigation | Mock `useNavigation` ou render le NavigationContainer complet |
| waitFor / findBy | Pour les resultats asynchrones |
| jest.mock | Mocker les modules natifs (camera, location, storage) |
| Snapshots | Utile pour les composants stables, nuisible pour les dynamiques |
| Zustand | `useStore.setState()` pour precharger, reset en `beforeEach` |
| React Query | `QueryClient` avec `retry: false`, `gcTime: 0` en test |
| Couverture | 80% global, 95% pour utils/stores, seuils par dossier |

---

## Ressources

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) — Documentation officielle
- [Testing Library Queries](https://testing-library.com/docs/queries/about) — Guide des queries
- [Jest](https://jestjs.io/) — Framework de test
- [Expo Testing](https://docs.expo.dev/develop/unit-testing/) — Guide Expo officiel
- [Zustand Testing](https://docs.pmnd.rs/zustand/guides/testing) — Guide de test Zustand
