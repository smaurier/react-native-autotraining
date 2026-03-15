# Module 10 — Gestion de l'état : Context et Zustand

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 3/5        | 90 min        | [Lab 10](../labs/lab-10-gestion-detat/) | [Quiz 10](../quizzes/quiz-10-etat.html) |

## Objectifs

- Comprendre quand React Context + useReducer suffit pour l'état global
- Identifier les pieges de Context : re-renders inutiles, provider hell
- Créer des stores Zustand avec selectors, middleware et persistence
- Appliquer le slice pattern pour structurer un store complexe
- Comparer Context, Zustand, Redux et Jotai pour choisir l'outil adapte
- Implementer un auth store, un cart store et un preferences store

---

## React Context + useReducer : quand ça suffit

### Le cas d'usage

Context est intégré a React. Pour un état global simple (theme, locale, utilisateur connecte) partage entre quelques composants, il fait le travail sans dépendance externe.

```tsx
import { createContext, useContext, useReducer, type ReactNode } from 'react';

// --- Types ---
interface AuthState {
  user: { id: string; name: string; email: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { id: string; name: string; email: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' };

// --- Reducer ---
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return { user: action.payload, isAuthenticated: true, isLoading: false };
    case 'LOGIN_FAILURE':
      return { user: null, isAuthenticated: false, isLoading: false };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false };
  }
}

// --- Context ---
const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
} | null>(null);

// --- Provider ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook personnalise ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Utilisation dans un composant

```tsx
function ProfileScreen() {
  const { state, dispatch } = useAuth();

  if (state.isLoading) {
    return <ActivityIndicator size="large" />;
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <View style={styles.container}>
        <Text>Veuillez vous connecter</Text>
        <Pressable
          onPress={() => {
            dispatch({ type: 'LOGIN_START' });
            // Simuler un appel API
            setTimeout(() => {
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { id: '1', name: 'Alice', email: 'alice@example.com' },
              });
            }, 1000);
          }}
        >
          <Text>Se connecter</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>Bonjour, {state.user.name}</Text>
      <Pressable onPress={() => dispatch({ type: 'LOGOUT' })}>
        <Text>Deconnexion</Text>
      </Pressable>
    </View>
  );
}
```

### Separer state et dispatch

Un pattern ameliore : deux contextes distincts. Les composants qui ne font que lire l'état ne se re-rendent pas quand seul `dispatch` change.

```tsx
const AuthStateContext = createContext<AuthState | null>(null);
const AuthDispatchContext = createContext<React.Dispatch<AuthAction> | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthDispatchContext.Provider value={dispatch}>
      <AuthStateContext.Provider value={state}>
        {children}
      </AuthStateContext.Provider>
    </AuthDispatchContext.Provider>
  );
}

export function useAuthState() {
  const state = useContext(AuthStateContext);
  if (!state) throw new Error('useAuthState must be used within AuthProvider');
  return state;
}

export function useAuthDispatch() {
  const dispatch = useContext(AuthDispatchContext);
  if (!dispatch) throw new Error('useAuthDispatch must be used within AuthProvider');
  return dispatch;
}
```

---

## Les pieges de Context

### Piege 1 : re-renders en cascade

Quand la valeur du Context change, **tous** les composants qui appellent `useContext` se re-rendent, même s'ils n'utilisent qu'une partie de la valeur.

```tsx
// PROBLEME : chaque mise a jour de n'importe quelle propriete
// re-rend TOUS les consommateurs
const AppContext = createContext<{
  theme: 'light' | 'dark';
  locale: string;
  user: User | null;
  notifications: Notification[];
  cartCount: number;
} | null>(null);

// Le composant Header se re-rend quand cartCount change
// alors qu'il n'utilise que theme et user
function Header() {
  const ctx = useContext(AppContext)!;
  return (
    <View style={{ backgroundColor: ctx.theme === 'dark' ? '#000' : '#fff' }}>
      <Text>Bonjour {ctx.user?.name}</Text>
    </View>
  );
}
```

**Solution partielle** : splitter en plusieurs contextes.

```tsx
// Un contexte par domaine
const ThemeContext = createContext<'light' | 'dark'>('light');
const UserContext = createContext<User | null>(null);
const CartContext = createContext<{ count: number }>({ count: 0 });
const NotifContext = createContext<Notification[]>([]);
```

Mais cela mene au piege suivant.

### Piege 2 : Provider Hell

```tsx
// Quand ca degere...
function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <AnalyticsProvider>
                <FeatureFlagProvider>
                  <RootNavigator />
                </FeatureFlagProvider>
              </AnalyticsProvider>
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
```

On peut composer les providers, mais le problème fondamental reste : Context n'a pas de selecteurs natifs.

```tsx
// Helper pour reduire l'imbrication
function ComposeProviders({
  providers,
  children,
}: {
  providers: React.FC<{ children: ReactNode }>[];
  children: ReactNode;
}) {
  return providers.reduceRight(
    (child, Provider) => <Provider>{child}</Provider>,
    children,
  );
}

// Usage
function App() {
  return (
    <ComposeProviders
      providers={[
        ThemeProvider,
        LocaleProvider,
        AuthProvider,
        CartProvider,
      ]}
    >
      <RootNavigator />
    </ComposeProviders>
  );
}
```

### Piege 3 : pas de selecteurs

Avec Context, on ne peut pas s'abonner à un sous-ensemble de l'état. Chaque consommateur recoit l'objet complet et se re-rend à chaque changement.

```tsx
// Impossible de faire ca nativement avec Context :
const cartCount = useSelector(state => state.cart.items.length);

// On doit wrapper dans un memo... qui ne resout pas tout
const MemoizedCartIcon = React.memo(function CartIcon() {
  const { cartCount } = useContext(CartContext)!;
  return <Badge count={cartCount} />;
});
// Se re-rend quand quand la REFERENCE de la valeur du context change,
// meme si cartCount est identique
```

### Quand Context suffit

| Critere | Context OK | Besoin d'un store |
|---------|-----------|-------------------|
| Nombre de domaines d'état | 1-3 | > 3 |
| Frequence de mise a jour | Rare (theme, locale) | Frequent (cart, notifs) |
| Nombre de consommateurs | < 10 composants | Beaucoup |
| Besoin de selecteurs fins | Non | Oui |
| Persistence / middleware | Non | Oui |
| État hors composants | Non | Oui |

---

## Zustand : le store minimaliste

### Pourquoi Zustand

Zustand est une solution de gestion d'état legere (< 2 kB) qui resout les problèmes de Context :

- **Selecteurs natifs** : les composants ne se re-rendent que si la valeur selectionnee change
- **Pas de Provider** : le store vit hors de l'arbre React
- **API simple** : `create()` retourne un hook
- **Middleware** : persist, devtools, immer, combine
- **Compatible React Native** : fonctionne avec MMKV, AsyncStorage

### Installation

```bash
npx expo install zustand
```

### Créer un store basique

```tsx
import { create } from 'zustand';

// --- Types ---
interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

// --- Store ---
const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// --- Composant ---
function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);

  return (
    <Pressable onPress={increment}>
      <Text>Compteur : {count}</Text>
    </Pressable>
  );
}
```

### L'importance des selecteurs

```tsx
// MAUVAIS : le composant se re-rend a chaque changement du store
function BadComponent() {
  const store = useCounterStore();
  return <Text>{store.count}</Text>;
}

// BON : ne se re-rend que quand count change
function GoodComponent() {
  const count = useCounterStore((state) => state.count);
  return <Text>{count}</Text>;
}

// BON : selecteur pour une valeur derivee
function CartTotal() {
  const total = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.price * item.qty, 0)
  );
  return <Text>Total : {total.toFixed(2)} EUR</Text>;
}
```

### Selecteurs stables avec `useShallow`

Quand on selectionne un objet ou un tableau, il faut éviter de créer une nouvelle référence à chaque render.

```tsx
import { useShallow } from 'zustand/react/shallow';

// PROBLEME : cree un nouvel objet a chaque render -> re-render infini
function Profile() {
  const { name, email } = useUserStore((state) => ({
    name: state.name,
    email: state.email,
  }));
  // ...
}

// SOLUTION : useShallow compare les proprietes individuellement
function Profile() {
  const { name, email } = useUserStore(
    useShallow((state) => ({ name: state.name, email: state.email }))
  );
  // Ne se re-rend que si name OU email change
}
```

---

## Auth store complet avec Zustand

```tsx
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthStore {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  clearError: () => void;
}

const useAuthStore = create<AuthStore>((set, get) => ({
  // --- State initial ---
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // --- Actions ---
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('https://api.example.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Identifiants invalides');
      }

      const data = await response.json();
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        isLoading: false,
      });
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  refreshToken: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch('https://api.example.com/auth/refresh', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      set({ token: data.token });
    } catch {
      // Token invalide, deconnecter
      get().logout();
    }
  },

  updateProfile: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
```

### Utilisation dans l'app

```tsx
// Dans un ecran de login
function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable onPress={() => login(email, password)} disabled={isLoading}>
        <Text>{isLoading ? 'Connexion...' : 'Se connecter'}</Text>
      </Pressable>
    </View>
  );
}

// Dans le navigateur racine : conditionnel auth
function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

// Acceder au store hors React (dans un intercepteur API par exemple)
const token = useAuthStore.getState().token;
```

---

## Cart store avec valeurs calculees

```tsx
import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  // Valeurs calculees (via getters)
  getTotal: () => number;
  getItemCount: () => number;
  getItemById: (id: string) => CartItem | undefined;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { items: [...state.items, { ...product, quantity: 1 }] };
    });
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  // Pas stockees dans l'etat, calculees a la demande
  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getItemById: (id) => {
    return get().items.find((item) => item.id === id);
  },
}));
```

### Selecteurs dérivés pour le cart

```tsx
// Badge sur l'icone du panier - ne se re-rend que quand le nombre change
function CartBadge() {
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  if (itemCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{itemCount}</Text>
    </View>
  );
}

// Liste des items du panier
function CartItemList() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CartItemRow
          item={item}
          onQuantityChange={(qty) => updateQuantity(item.id, qty)}
          onRemove={() => removeItem(item.id)}
        />
      )}
    />
  );
}

// Total : selecteur calcule inline
function CartFooter() {
  const total = useCartStore((state) =>
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  return (
    <View style={styles.footer}>
      <Text style={styles.totalText}>Total : {total.toFixed(2)} EUR</Text>
      <Pressable style={styles.checkoutButton}>
        <Text style={styles.checkoutText}>Commander</Text>
      </Pressable>
    </View>
  );
}
```

---

## Zustand persist middleware

### Avec AsyncStorage

```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferencesStore {
  theme: 'light' | 'dark' | 'system';
  locale: 'fr' | 'en' | 'nl';
  notificationsEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
  setTheme: (theme: PreferencesStore['theme']) => void;
  setLocale: (locale: PreferencesStore['locale']) => void;
  toggleNotifications: () => void;
  setFontSize: (size: PreferencesStore['fontSize']) => void;
  reset: () => void;
}

const defaultPreferences = {
  theme: 'system' as const,
  locale: 'fr' as const,
  notificationsEnabled: true,
  fontSize: 'medium' as const,
};

const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...defaultPreferences,

      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      toggleNotifications: () =>
        set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
      setFontSize: (fontSize) => set({ fontSize }),
      reset: () => set(defaultPreferences),
    }),
    {
      name: 'user-preferences', // cle dans le storage
      storage: createJSONStorage(() => AsyncStorage),
      // Optionnel : ne persister qu'une partie du state
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        notificationsEnabled: state.notificationsEnabled,
        fontSize: state.fontSize,
      }),
    },
  ),
);
```

### Avec MMKV (plus performant)

MMKV est une solution de stockage synchrone de Meta, beaucoup plus rapide qu'AsyncStorage (10x-100x). En 2027, c'est le choix par defaut pour React Native.

```bash
npx expo install react-native-mmkv
```

```tsx
import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

// Creer une instance MMKV
const storage = new MMKV();

// Adapter MMKV au format attendu par Zustand
const mmkvStorage: StateStorage = {
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name, value) => {
    storage.set(name, value);
  },
  removeItem: (name) => {
    storage.delete(name);
  },
};

// Utiliser MMKV comme storage
const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ... actions
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
      // Migration de version
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration depuis la v0
          return { ...(persistedState as AuthStore), isLoading: false };
        }
        return persistedState as AuthStore;
      },
    },
  ),
);
```

### Hydration et ecran de chargement

Quand le store est persiste, il faut attendre la rehydratation avant d'afficher l'app.

```tsx
function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Zustand persist expose un listener de rehydratation
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsReady(true);
    });

    // Si deja hydrate (MMKV est synchrone)
    if (useAuthStore.persist.hasHydrated()) {
      setIsReady(true);
    }

    return unsub;
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return <RootNavigator />;
}

// Alternative : hook dedie
function useHydration() {
  const [hydrated, setHydrated] = useState(
    useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

  return hydrated;
}
```

---

## Zustand devtools et immer middleware

### Devtools

En développement, le middleware devtools permet d'inspecter le store dans React DevTools ou Flipper.

```tsx
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useCartStore = create<CartStore>()(
  devtools(
    (set) => ({
      items: [],
      addItem: (product) =>
        set(
          (state) => ({
            items: [...state.items, { ...product, quantity: 1 }],
          }),
          false,
          'cart/addItem' // nom de l'action dans les devtools
        ),
      clearCart: () =>
        set({ items: [] }, false, 'cart/clearCart'),
    }),
    { name: 'CartStore' }, // nom du store
  ),
);
```

### Immer middleware

Immer permet d'écrire des mutations "immutables" avec une syntaxe mutable. Particulierement utile pour les états imbriques.

```bash
npx expo install immer
```

```tsx
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface TodoStore {
  lists: {
    id: string;
    name: string;
    todos: {
      id: string;
      text: string;
      done: boolean;
      subtasks: { id: string; text: string; done: boolean }[];
    }[];
  }[];
  addTodo: (listId: string, text: string) => void;
  toggleTodo: (listId: string, todoId: string) => void;
  toggleSubtask: (listId: string, todoId: string, subtaskId: string) => void;
}

const useTodoStore = create<TodoStore>()(
  immer((set) => ({
    lists: [],

    addTodo: (listId, text) =>
      set((state) => {
        // Syntaxe mutable ! Immer gere l'immutabilite
        const list = state.lists.find((l) => l.id === listId);
        if (list) {
          list.todos.push({
            id: Date.now().toString(),
            text,
            done: false,
            subtasks: [],
          });
        }
      }),

    toggleTodo: (listId, todoId) =>
      set((state) => {
        const list = state.lists.find((l) => l.id === listId);
        const todo = list?.todos.find((t) => t.id === todoId);
        if (todo) {
          todo.done = !todo.done;
        }
      }),

    toggleSubtask: (listId, todoId, subtaskId) =>
      set((state) => {
        const list = state.lists.find((l) => l.id === listId);
        const todo = list?.todos.find((t) => t.id === todoId);
        const subtask = todo?.subtasks.find((s) => s.id === subtaskId);
        if (subtask) {
          subtask.done = !subtask.done;
        }
      }),
  })),
);
```

### Combiner les middlewares

L'ordre d'imbrication compte : le middleware le plus externe s'exécuté en premier.

```tsx
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useCartStore = create<CartStore>()(
  devtools(
    persist(
      immer((set) => ({
        items: [],
        addItem: (product) =>
          set((state) => {
            const existing = state.items.find((i) => i.id === product.id);
            if (existing) {
              existing.quantity += 1;
            } else {
              state.items.push({ ...product, quantity: 1 });
            }
          }),
        removeItem: (id) =>
          set((state) => {
            state.items = state.items.filter((i) => i.id !== id);
          }),
        clearCart: () =>
          set((state) => {
            state.items = [];
          }),
      })),
      {
        name: 'cart-storage',
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
    { name: 'CartStore' },
  ),
);
```

---

## Le slice pattern

Pour les stores complexes, le slice pattern permet de découper le store en modules independants.

### Définir les slices

```tsx
import { type StateCreator } from 'zustand';

// --- Auth Slice ---
interface AuthSlice {
  user: { id: string; name: string } | null;
  token: string | null;
  login: (user: AuthSlice['user'], token: string) => void;
  logout: () => void;
}

const createAuthSlice: StateCreator<
  AppStore,
  [],
  [],
  AuthSlice
> = (set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
});

// --- Cart Slice ---
interface CartSlice {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const createCartSlice: StateCreator<
  AppStore,
  [],
  [],
  CartSlice
> = (set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clearCart: () => set({ items: [] }),
});

// --- Preferences Slice ---
interface PreferencesSlice {
  theme: 'light' | 'dark';
  locale: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setLocale: (locale: string) => void;
}

const createPreferencesSlice: StateCreator<
  AppStore,
  [],
  [],
  PreferencesSlice
> = (set) => ({
  theme: 'light',
  locale: 'fr',
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
});
```

### Combiner les slices

```tsx
// Type global = union des slices
type AppStore = AuthSlice & CartSlice & PreferencesSlice;

const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (...args) => ({
        ...createAuthSlice(...args),
        ...createCartSlice(...args),
        ...createPreferencesSlice(...args),
      }),
      {
        name: 'app-store',
        storage: createJSONStorage(() => mmkvStorage),
        partialize: (state) => ({
          // Ne pas persister le token (securite)
          user: state.user,
          theme: state.theme,
          locale: state.locale,
          // Ne pas persister le cart (il vient du serveur)
        }),
      },
    ),
    { name: 'AppStore' },
  ),
);
```

### Communication inter-slices

Un slice peut acceder a l'état d'un autre slice via `get()`.

```tsx
const createCartSlice: StateCreator<
  AppStore,
  [],
  [],
  CartSlice
> = (set, get) => ({
  items: [],
  addItem: (item) => {
    // Verifier que l'utilisateur est connecte (via auth slice)
    const { user } = get();
    if (!user) {
      console.warn('Utilisateur non connecte');
      return;
    }
    set((state) => ({ items: [...state.items, item] }));
  },
  // ...
});
```

---

## Actions asynchrones

Zustand géré naturellement les actions async dans le store.

```tsx
interface ProductStore {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: string) => Promise<Product | null>;
}

const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('https://api.example.com/products');
      const products = await response.json();
      set({ products, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur',
        isLoading: false,
      });
    }
  },

  fetchProductById: async (id) => {
    // Verifier d'abord le cache local
    const cached = get().products.find((p) => p.id === id);
    if (cached) return cached;

    try {
      const response = await fetch(`https://api.example.com/products/${id}`);
      const product = await response.json();
      // Ajouter au cache
      set((state) => ({
        products: [...state.products, product],
      }));
      return product;
    } catch {
      return null;
    }
  },
}));
```

---

## Acceder au store hors de React

Un avantage majeur de Zustand : le store est accessible n'importe ou, pas seulement dans des composants.

```tsx
// Dans un intercepteur API (Axios / fetch wrapper)
function createApiClient() {
  return {
    async get(url: string) {
      const token = useAuthStore.getState().token;
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.status === 401) {
        // Token expire, deconnecter
        useAuthStore.getState().logout();
      }

      return response.json();
    },
  };
}

// Dans un service de notifications
function handlePushNotification(notification: PushNotification) {
  const { type, payload } = notification.data;

  if (type === 'new_message') {
    useNotifStore.getState().addNotification(payload);
  }

  if (type === 'order_update') {
    useCartStore.getState().updateOrderStatus(payload.orderId, payload.status);
  }
}

// Souscrire aux changements hors React
const unsubscribe = useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuth) => {
    if (!isAuth) {
      // Nettoyer les caches quand l'utilisateur se deconnecte
      useCartStore.getState().clearCart();
      useNotifStore.getState().clearAll();
    }
  },
);
```

---

## Matrice de comparaison

| Critere | Context + useReducer | Zustand | Redux Toolkit | Jotai |
|---------|---------------------|---------|---------------|-------|
| **Taille du bundle** | 0 kB (intégré) | ~1.5 kB | ~12 kB | ~3.5 kB |
| **Boilerplate** | Moyen | Minimal | Moyen (ameliore vs Redux) | Minimal |
| **Selecteurs** | Non natif | Oui (`useShallow`) | Oui (`useSelector`) | Oui (atoms dérivés) |
| **Re-renders** | Tous les consommateurs | Selectif | Selectif | Selectif |
| **Provider requis** | Oui | Non | Oui | Oui |
| **Middleware** | Non | Oui (persist, devtools, immer) | Oui (RTK middleware) | Via extensions |
| **Acces hors React** | Non | `getState()` | `store.getState()` | Non |
| **DevTools** | React DevTools | Middleware optionnel | Redux DevTools | Jotai DevTools |
| **Courbe d'apprentissage** | Faible | Faible | Moyenne | Faible |
| **TypeScript** | Manuel | Excellent | Bon | Excellent |
| **Async** | Dispatch + thunk | Natif dans les actions | Thunks / RTK Query | Via atoms async |
| **Ideal pour** | Theme, locale | General, store moyen-gros | Très gros projets, équipe | UI atomique, composants |

### Quand utiliser quoi

```
Etat local d'un composant      -> useState / useReducer
Etat partage entre 2-3 composants -> Props, Context
Etat global simple, MAJ rares  -> Context + useReducer
Etat global, MAJ frequentes    -> Zustand
App tres complexe, grosse equipe -> Redux Toolkit
Etat granulaire, bottom-up     -> Jotai
```

### Recommandation pour React Native en 2027

**Zustand est le choix par defaut.** Il combine simplicite, performance et flexibilite. Context reste pertinent pour l'état rare (theme, locale). Redux Toolkit est justifie uniquement pour les très grosses équipes qui ont besoin d'un cadre strict. Jotai est excellent pour les UIs très réactives avec beaucoup de petits états independants.

---

## Preferences store complet

Un cas d'usage frequent en mobile : persister les preferences utilisateur.

```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Preferences {
  // Apparence
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: number;

  // Comportement
  hapticFeedback: boolean;
  autoPlay: boolean;
  notificationsEnabled: boolean;
  notificationCategories: {
    marketing: boolean;
    updates: boolean;
    social: boolean;
  };

  // Donnees
  locale: string;
  currency: string;
  lastSync: number | null;
}

interface PreferencesStore extends Preferences {
  setTheme: (theme: Preferences['theme']) => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: number) => void;
  toggleHaptic: () => void;
  toggleAutoPlay: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationCategory: (
    category: keyof Preferences['notificationCategories'],
    enabled: boolean,
  ) => void;
  setLocale: (locale: string) => void;
  setCurrency: (currency: string) => void;
  markSynced: () => void;
  resetToDefaults: () => void;
}

const defaults: Preferences = {
  theme: 'system',
  accentColor: '#0d6efd',
  fontSize: 16,
  hapticFeedback: true,
  autoPlay: true,
  notificationsEnabled: true,
  notificationCategories: {
    marketing: false,
    updates: true,
    social: true,
  },
  locale: 'fr',
  currency: 'EUR',
  lastSync: null,
};

const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...defaults,

      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setFontSize: (fontSize) => set({ fontSize: Math.max(12, Math.min(24, fontSize)) }),
      toggleHaptic: () => set((s) => ({ hapticFeedback: !s.hapticFeedback })),
      toggleAutoPlay: () => set((s) => ({ autoPlay: !s.autoPlay })),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setNotificationCategory: (category, enabled) =>
        set((s) => ({
          notificationCategories: {
            ...s.notificationCategories,
            [category]: enabled,
          },
        })),
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      markSynced: () => set({ lastSync: Date.now() }),
      resetToDefaults: () => set(defaults),
    }),
    {
      name: 'preferences',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (state, version) => {
        const s = state as Preferences;
        if (version < 1) {
          return { ...s, notificationCategories: defaults.notificationCategories };
        }
        if (version < 2) {
          return { ...s, currency: 'EUR' };
        }
        return s as PreferencesStore;
      },
    },
  ),
);
```

### Ecran de reglages avec le preferences store

```tsx
function SettingsScreen() {
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const haptic = usePreferencesStore((s) => s.hapticFeedback);
  const toggleHaptic = usePreferencesStore((s) => s.toggleHaptic);
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const setFontSize = usePreferencesStore((s) => s.setFontSize);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.section}>Apparence</Text>

      {/* Selecteur de theme */}
      <View style={styles.row}>
        <Text>Theme</Text>
        <SegmentedControl
          values={['Clair', 'Sombre', 'Systeme']}
          selectedIndex={['light', 'dark', 'system'].indexOf(theme)}
          onChange={(index) =>
            setTheme((['light', 'dark', 'system'] as const)[index])
          }
        />
      </View>

      {/* Slider taille de police */}
      <View style={styles.row}>
        <Text>Taille du texte : {fontSize}px</Text>
        <Slider
          minimumValue={12}
          maximumValue={24}
          step={1}
          value={fontSize}
          onValueChange={setFontSize}
        />
      </View>

      {/* Toggle retour haptique */}
      <View style={styles.row}>
        <Text>Retour haptique</Text>
        <Switch value={haptic} onValueChange={toggleHaptic} />
      </View>
    </ScrollView>
  );
}
```

---

## Patterns avances

### Reset de tous les stores à la deconnexion

```tsx
// Centraliser le reset
function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const clearCart = useCartStore((s) => s.clearCart);
  const resetPrefs = usePreferencesStore((s) => s.resetToDefaults);

  return useCallback(() => {
    logout();
    clearCart();
    resetPrefs();
  }, [logout, clearCart, resetPrefs]);
}

// Alternative : ecouter les changements du auth store
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated, wasAuthenticated) => {
    if (wasAuthenticated && !isAuthenticated) {
      useCartStore.getState().clearCart();
    }
  },
);
```

### Store temporaire (non persiste)

Pour un flux en cours (wizard, formulaire multi-étapes) :

```tsx
const useCheckoutStore = create<CheckoutStore>((set) => ({
  step: 0,
  address: null,
  paymentMethod: null,
  setStep: (step) => set({ step }),
  setAddress: (address) => set({ address }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  reset: () => set({ step: 0, address: null, paymentMethod: null }),
}));

// Reset automatique quand on quitte le flux
function CheckoutScreen() {
  const reset = useCheckoutStore((s) => s.reset);

  useEffect(() => {
    return () => reset(); // cleanup au demontage
  }, [reset]);

  // ...
}
```

### Subscribe avec selecteur (Zustand v5)

```tsx
// S'abonner a un sous-ensemble de l'etat
const unsubscribe = useCartStore.subscribe(
  (state) => state.items.length,
  (newLength, prevLength) => {
    if (newLength > prevLength) {
      // Declencher un retour haptique quand un item est ajoute
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  { fireImmediately: false },
);
```

---

## Bonnes pratiques

### 1. Un store par domaine

```
stores/
  useAuthStore.ts
  useCartStore.ts
  usePreferencesStore.ts
  useNotificationStore.ts
```

### 2. Toujours utiliser des selecteurs

```tsx
// Toujours
const count = useCartStore((s) => s.items.length);

// Jamais
const { items } = useCartStore();
```

### 3. Actions dans le store, pas dans les composants

```tsx
// BON : la logique est dans le store
const addToCart = useCartStore((s) => s.addItem);
addToCart(product);

// MAUVAIS : la logique est dans le composant
const items = useCartStore((s) => s.items);
useCartStore.setState({ items: [...items, product] });
```

### 4. Typer le store complètement

```tsx
// Toujours definir l'interface avant le create
interface MyStore {
  data: string[];
  isLoading: boolean;
  fetch: () => Promise<void>;
}

const useMyStore = create<MyStore>()(...);
```

### 5. Tester les stores

```tsx
import { act } from '@testing-library/react-native';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset le store avant chaque test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('should login successfully', async () => {
    await act(async () => {
      await useAuthStore.getState().login('test@test.com', 'password');
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
```

---

## Résumé

| Concept | A retenir |
|---------|-----------|
| Context | Suffisant pour theme, locale, 1-3 domaines d'état rares |
| Selecteurs | Cle de la performance : ne re-rend que ce qui change |
| Zustand | Store minimal, pas de Provider, selecteurs natifs |
| Persist | MMKV (synchrone, rapide) > AsyncStorage (async) |
| Immer | Syntaxe mutable pour les états profondement imbriques |
| Slice pattern | Decouper un gros store en modules independants |
| Hors React | `getState()` pour les intercepteurs API, services, etc. |

---

## Ressources

- Zustand : https://zustand-demo.pmnd.rs/
- Zustand GitHub : https://github.com/pmndrs/zustand
- MMKV : https://github.com/mrousavy/react-native-mmkv
- Jotai : https://jotai.org/
- Redux Toolkit : https://redux-toolkit.js.org/

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 10 état](../screencasts/screencast-10-etat.md)
2. **Lab** : [lab-10-gestion-detat](../labs/lab-10-gestion-detat/README)
3. **Visualisation** : [State Management](../visualizations/state-management-comparison.html)
4. **Quiz** : [quiz 10 état](../quizzes/quiz-10-etat.html)
:::
