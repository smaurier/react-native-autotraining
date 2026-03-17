# Module 03 — State et cycle de vie

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 2/5        | 75 min        | [Lab 03](../labs/lab-03-state-cycle-de-vie/) | [Quiz 03](../quizzes/quiz-03-state.html) |

## Objectifs

- Maîtriser `useState` avec des primitives, objets et tableaux
- Comprendre l'immutabilite et appliquer les patterns de mise a jour
- Utiliser `useEffect` pour les effets de bord, le cleanup et le dependency array
- Manipuler `useRef` pour les refs DOM et les valeurs mutables
- Créer des hooks personnalises réutilisables
- Decouvrir `useReducer` pour la logique d'état complexe
- Éviter les erreurs classiques : stale closures, boucles infinies, deps manquantes

---

## useState : l'état local

### Primitives

Le hook `useState` retourne un couple `[valeur, setter]`. Le setter declenche un re-render :

```tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.count}>{count}</Text>
      <TouchableOpacity onPress={() => setCount(count + 1)}>
        <Text>+1</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCount(count - 1)}>
        <Text>-1</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCount(0)}>
        <Text>Reset</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Setter fonctionnel vs direct

Quand le nouvel état depend de l'état précédent, **toujours utiliser la forme fonctionnelle** :

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  // MAUVAIS : utilise la valeur capturee au moment du render
  const incrementBad = () => {
    setCount(count + 1);
    setCount(count + 1); // Toujours count + 1, pas count + 2 !
  };

  // BON : utilise la valeur la plus recente
  const incrementGood = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1); // prev est a jour => count + 2
  };

  // BON : increment multiple
  const incrementBy = (n: number) => {
    setCount(prev => prev + n);
  };

  return (
    <View>
      <Text>{count}</Text>
      <TouchableOpacity onPress={incrementGood}>
        <Text>+2</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Initialisation paresseuse (lazy initial state)

Si l'état initial nécessité un calcul couteux, passer une **fonction** :

```tsx
// MAUVAIS : computeExpensiveValue() est appele a chaque render
const [data, setData] = useState(computeExpensiveValue());

// BON : computeExpensiveValue() n'est appele qu'au premier render
const [data, setData] = useState(() => computeExpensiveValue());

// Exemple concret : lire du stockage
const [settings, setSettings] = useState(() => {
  const saved = localStorage.getItem('settings');
  return saved ? JSON.parse(saved) : defaultSettings;
});
```

### Typage explicite avec useState

```tsx
// Type infere automatiquement : string
const [name, setName] = useState('');

// Type infere : number
const [count, setCount] = useState(0);

// Type explicite necessaire pour les unions et les null
const [user, setUser] = useState<User | null>(null);

// Type explicite pour les tableaux vides
const [items, setItems] = useState<string[]>([]);
const [tasks, setTasks] = useState<Task[]>([]);

// Type explicite pour les enums
type Status = 'idle' | 'loading' | 'success' | 'error';
const [status, setStatus] = useState<Status>('idle');
```

---

## Immutabilite : pourquoi et comment

### Pourquoi React exige l'immutabilite

React compare les références pour détecter les changements. Muter un objet **ne change pas sa référence**, donc React ne re-rend pas :

```tsx
// MAUVAIS : mutation directe — React ne detecte pas le changement
const [user, setUser] = useState({ name: 'Alice', age: 30 });
const handleBirthday = () => {
  user.age += 1;       // Mutation de l'objet existant
  setUser(user);       // Meme reference ! React ignore
};

// BON : nouvel objet avec spread
const handleBirthday = () => {
  setUser(prev => ({ ...prev, age: prev.age + 1 }));  // Nouvelle reference
};
```

### Mise a jour d'objets

```tsx
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  address: {
    street: string;
    city: string;
    zip: string;
  };
}

const [form, setForm] = useState<FormData>({
  firstName: '',
  lastName: '',
  email: '',
  address: { street: '', city: '', zip: '' },
});

// Mise a jour d'une propriete simple
const updateFirstName = (value: string) => {
  setForm(prev => ({ ...prev, firstName: value }));
};

// Mise a jour d'une propriete imbriquee
const updateCity = (value: string) => {
  setForm(prev => ({
    ...prev,
    address: { ...prev.address, city: value },
  }));
};

// Handler generique pour les champs de premier niveau
const handleChange = (field: keyof Omit<FormData, 'address'>, value: string) => {
  setForm(prev => ({ ...prev, [field]: value }));
};
```

### Mise a jour de tableaux

```tsx
interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const [todos, setTodos] = useState<Todo[]>([]);

// Ajouter un element
const addTodo = (text: string) => {
  const newTodo: Todo = { id: crypto.randomUUID(), text, done: false };
  setTodos(prev => [...prev, newTodo]);
};

// Ajouter au debut
const prependTodo = (text: string) => {
  const newTodo: Todo = { id: crypto.randomUUID(), text, done: false };
  setTodos(prev => [newTodo, ...prev]);
};

// Supprimer par id
const removeTodo = (id: string) => {
  setTodos(prev => prev.filter(t => t.id !== id));
};

// Mettre a jour un element specifique
const toggleTodo = (id: string) => {
  setTodos(prev =>
    prev.map(t => t.id === id ? { ...t, done: !t.done } : t)
  );
};

// Remplacer un element
const updateTodoText = (id: string, newText: string) => {
  setTodos(prev =>
    prev.map(t => t.id === id ? { ...t, text: newText } : t)
  );
};

// Reordonner (deplacer un element)
const moveTodo = (fromIndex: number, toIndex: number) => {
  setTodos(prev => {
    const result = [...prev];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  });
};

// Trier
const sortByDone = () => {
  setTodos(prev => [...prev].sort((a, b) => Number(a.done) - Number(b.done)));
};
```

### Tableau de référence : operations immutables

| Operation | Mutable (interdit) | Immutable (correct) |
|-----------|-------------------|-------------------|
| Ajouter | `arr.push(item)` | `[...arr, item]` |
| Supprimer | `arr.splice(i, 1)` | `arr.filter(x => x.id !== id)` |
| Modifier | `arr[i].done = true` | `arr.map(x => x.id === id ? {...x, done: true} : x)` |
| Trier | `arr.sort()` | `[...arr].sort()` |
| Inverser | `arr.reverse()` | `[...arr].reverse()` |
| Objet: modifier | `obj.name = 'Bob'` | `{...obj, name: 'Bob'}` |
| Objet imbrique | `obj.addr.city = 'Paris'` | `{...obj, addr: {...obj.addr, city: 'Paris'}}` |

---

## useEffect : effets de bord

### Syntaxe et exécution

`useEffect` exécuté du code **après** le render. C'est le hook pour les effets de bord : appels API, timers, subscriptions, manipulation DOM.

```tsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cet effet s'execute apres chaque render ou userId change
    setLoading(true);

    fetch(`https://api.example.com/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);  // Dependency array : re-execute quand userId change

  if (loading) return <ActivityIndicator />;
  if (!user) return <Text>Utilisateur introuvable</Text>;

  return (
    <View>
      <Text>{user.name}</Text>
      <Text>{user.email}</Text>
    </View>
  );
}
```

### Les trois modes du dependency array

```tsx
// 1. Sans dependency array : execute apres CHAQUE render
useEffect(() => {
  console.log('Execute apres chaque render');
});

// 2. Tableau vide : execute UNE SEULE FOIS au montage
useEffect(() => {
  console.log('Execute au montage uniquement');
}, []);

// 3. Avec dependances : execute quand une dep change
useEffect(() => {
  console.log(`userId a change : ${userId}`);
  fetchUser(userId);
}, [userId]);

// Plusieurs dependances
useEffect(() => {
  console.log('query ou page a change');
  search(query, page);
}, [query, page]);
```

### Cleanup : nettoyer les effets

La fonction retournee par `useEffect` est le **cleanup**. Elle s'exécuté :
- Avant la re-exécution de l'effet (quand les deps changent)
- Au demontage du composant

```tsx
// Timer avec cleanup
function CountdownTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup : nettoyer le timer au demontage ou changement de seconds
    return () => clearInterval(intervalId);
  }, [seconds]);

  return <Text>{remaining}s</Text>;
}
```

```tsx
// Subscription avec cleanup
function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Equivalent RN : NetInfo.addEventListener
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <Text>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>;
}
```

```tsx
// AbortController pour annuler les fetches
function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/search?q=${query}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => setResults(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });

    // Cleanup : annuler la requete precedente
    return () => controller.abort();
  }, [query]);

  return (
    <FlatList
      data={results}
      renderItem={({ item }) => <Text>{item.title}</Text>}
    />
  );
}
```

### Pattern : éviter les race conditions

```tsx
function UserData({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;  // Flag local

    async function fetchUser() {
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();

      if (!cancelled) {   // Ne met a jour que si pas cancelled
        setUser(data);
      }
    }

    fetchUser();

    return () => {
      cancelled = true;    // Annule si userId change avant la reponse
    };
  }, [userId]);

  return user ? <Text>{user.name}</Text> : <ActivityIndicator />;
}
```

---

## useRef : références et valeurs mutables

### Deux usages distincts

`useRef` créé une référence mutable qui persiste entre les renders **sans causer de re-render** quand elle change.

#### 1. Référence vers un élément natif

```tsx
import { useRef } from 'react';
import { TextInput, TouchableOpacity, Text, View } from 'react-native';

function LoginForm() {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const focusPassword = () => {
    passwordRef.current?.focus();
  };

  const focusEmail = () => {
    emailRef.current?.focus();
  };

  return (
    <View>
      <TextInput
        ref={emailRef}
        placeholder="Email"
        returnKeyType="next"
        onSubmitEditing={focusPassword}  // Tab vers le champ suivant
      />
      <TextInput
        ref={passwordRef}
        placeholder="Mot de passe"
        secureTextEntry
        returnKeyType="done"
      />
      <TouchableOpacity onPress={focusEmail}>
        <Text>Focus email</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### 2. Valeur mutable persistante

```tsx
function StopWatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const start = () => {
    if (running) return;
    setRunning(true);
    startTimeRef.current = Date.now() - elapsed;
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 10);
  };

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = () => {
    stop();
    setElapsed(0);
  };

  // Cleanup au demontage
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  return (
    <View style={styles.stopwatch}>
      <Text style={styles.time}>{formatTime(elapsed)}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity onPress={running ? stop : start}>
          <Text>{running ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={reset}>
          <Text>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

### Pattern : valeur précédente

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;  // Retourne la valeur du render precedent
}

// Utilisation
function PriceDisplay({ price }: { price: number }) {
  const previousPrice = usePrevious(price);

  const direction = previousPrice !== undefined
    ? price > previousPrice ? 'up' : price < previousPrice ? 'down' : 'same'
    : 'same';

  return (
    <View style={styles.price}>
      <Text style={styles[direction]}>
        {direction === 'up' ? '\u25B2' : direction === 'down' ? '\u25BC' : ''}
        {price.toFixed(2)} EUR
      </Text>
    </View>
  );
}
```

### useRef vs useState : quand utiliser quoi

| Critere | useState | useRef |
|---------|----------|--------|
| Cause un re-render | Oui | Non |
| Persiste entre renders | Oui | Oui |
| Visible dans le JSX | Oui | Non (sauf via .current lu dans le render) |
| Usage typique | Donnees affichees | Timers, refs DOM, compteurs internes |

---

## Hooks personnalises (custom hooks)

Un custom hook est une **fonction** qui commence par `use` et qui utilise d'autres hooks. C'est le mécanisme principal de reutilisation de logique.

### useToggle

```tsx
function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = () => setValue(prev => !prev);
  const setTrue = () => setValue(true);
  const setFalse = () => setValue(false);

  return { value, toggle, setTrue, setFalse } as const;
}

// Utilisation
function SettingsScreen() {
  const darkMode = useToggle(false);
  const notifications = useToggle(true);

  return (
    <View>
      <TouchableOpacity onPress={darkMode.toggle}>
        <Text>Mode sombre : {darkMode.value ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={notifications.toggle}>
        <Text>Notifications : {notifications.value ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### useCounter

```tsx
function useCounter(initialValue: number = 0, { min, max, step = 1 }: {
  min?: number;
  max?: number;
  step?: number;
} = {}) {
  const [count, setCount] = useState(initialValue);

  const increment = () => {
    setCount(prev => {
      const next = prev + step;
      return max !== undefined ? Math.min(next, max) : next;
    });
  };

  const decrement = () => {
    setCount(prev => {
      const next = prev - step;
      return min !== undefined ? Math.max(next, min) : next;
    });
  };

  const reset = () => setCount(initialValue);
  const set = (value: number) => setCount(value);

  return { count, increment, decrement, reset, set } as const;
}

// Utilisation
function QuantitySelector() {
  const quantity = useCounter(1, { min: 1, max: 99 });

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={quantity.decrement}><Text>-</Text></TouchableOpacity>
      <Text>{quantity.count}</Text>
      <TouchableOpacity onPress={quantity.increment}><Text>+</Text></TouchableOpacity>
    </View>
  );
}
```

### useDebounce

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Utilisation : recherche avec debounce
function SearchScreen() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => res.json())
      .then(setResults);
  }, [debouncedQuery]);  // Cherche seulement quand la valeur debounced change

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher..."
      />
      <Text>{results.length} resultats</Text>
      <FlatList
        data={results}
        renderItem={({ item }) => <Text>{item.title}</Text>}
      />
    </View>
  );
}
```

### useLocalStorage (pattern adapte a React Native)

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

function useAsyncStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  // Charger la valeur au montage
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then(item => {
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      })
      .finally(() => setLoading(false));
  }, [key]);

  // Setter qui persiste dans AsyncStorage
  const setValue = (value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      AsyncStorage.setItem(key, JSON.stringify(newValue));
      return newValue;
    });
  };

  return [storedValue, setValue, loading] as const;
}

// Utilisation
function ThemeScreen() {
  const [theme, setTheme, loading] = useAsyncStorage<'light' | 'dark'>('theme', 'light');

  if (loading) return <ActivityIndicator />;

  return (
    <TouchableOpacity onPress={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}>
      <Text>Theme actuel : {theme}</Text>
    </TouchableOpacity>
  );
}
```

### useFetch : hook générique pour les requêtes

```tsx
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url, fetchCount]);

  const refetch = () => setFetchCount(c => c + 1);

  return { data, loading, error, refetch };
}

// Utilisation
function UserList() {
  const { data: users, loading, error, refetch } = useFetch<User[]>('/api/users');

  if (loading) return <ActivityIndicator />;
  if (error) return (
    <View>
      <Text>Erreur : {error.message}</Text>
      <TouchableOpacity onPress={refetch}><Text>Reessayer</Text></TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={users}
      renderItem={({ item }) => <Text>{item.name}</Text>}
      refreshing={loading}
      onRefresh={refetch}
    />
  );
}
```

---

## useReducer : logique d'état complexe

Quand l'état a plusieurs sous-valeurs interdependantes ou que la logique de mise a jour est complexe, `useReducer` est preferable a `useState` :

```tsx
import { useReducer } from 'react';

// 1. Definir le type de l'etat
interface FormState {
  values: { email: string; password: string; confirmPassword: string };
  errors: { email?: string; password?: string; confirmPassword?: string };
  isSubmitting: boolean;
  isValid: boolean;
}

// 2. Definir les actions (discriminated union)
type FormAction =
  | { type: 'SET_FIELD'; field: string; value: string }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_FAILURE'; errors: Record<string, string> }
  | { type: 'RESET' };

// 3. Le reducer : fonction pure (state, action) => newState
const initialState: FormState = {
  values: { email: '', password: '', confirmPassword: '' },
  errors: {},
  isSubmitting: false,
  isValid: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
        isValid: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: undefined },
      };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_SUCCESS':
      return { ...initialState };
    case 'SUBMIT_FAILURE':
      return { ...state, isSubmitting: false, errors: action.errors };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

// 4. Utilisation dans le composant
function RegistrationForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const handleChange = (field: string, value: string) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const handleSubmit = async () => {
    // Validation
    const errors: Record<string, string> = {};
    if (!state.values.email.includes('@')) {
      errors.email = 'Email invalide';
    }
    if (state.values.password.length < 8) {
      errors.password = 'Minimum 8 caracteres';
    }
    if (state.values.password !== state.values.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SUBMIT_FAILURE', errors });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });
    try {
      await api.register(state.values);
      dispatch({ type: 'SUBMIT_SUCCESS' });
    } catch {
      dispatch({ type: 'SUBMIT_FAILURE', errors: { email: 'Erreur serveur' } });
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        value={state.values.email}
        onChangeText={(v) => handleChange('email', v)}
        placeholder="Email"
      />
      {state.errors.email && <Text style={styles.error}>{state.errors.email}</Text>}

      <TextInput
        value={state.values.password}
        onChangeText={(v) => handleChange('password', v)}
        placeholder="Mot de passe"
        secureTextEntry
      />
      {state.errors.password && <Text style={styles.error}>{state.errors.password}</Text>}

      <TextInput
        value={state.values.confirmPassword}
        onChangeText={(v) => handleChange('confirmPassword', v)}
        placeholder="Confirmer"
        secureTextEntry
      />
      {state.errors.confirmPassword && (
        <Text style={styles.error}>{state.errors.confirmPassword}</Text>
      )}

      <TouchableOpacity onPress={handleSubmit} disabled={state.isSubmitting}>
        <Text>{state.isSubmitting ? 'Envoi...' : "S'inscrire"}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Quand utiliser useReducer vs useState

| Critere | useState | useReducer |
|---------|----------|------------|
| État simple (1-2 valeurs) | Oui | Non |
| Sous-valeurs interdependantes | Difficile | Oui |
| Logique de transition complexe | Non | Oui |
| Testabilite du reducer | Non applicable | Facile (fonction pure) |
| Partage de logique | Moins naturel | Dispatch + actions |

---

## Cycle de vie des composants

### Mapping classes -> hooks

| Phase classe | Hook équivalent | Quand |
|--------------|-----------------|-------|
| `constructor` | `useState(initialValue)` | Initialisation |
| `componentDidMount` | `useEffect(() => { ... }, [])` | Après le premier render |
| `componentDidUpdate` | `useEffect(() => { ... }, [deps])` | Après chaque render ou deps changent |
| `componentWillUnmount` | `useEffect(() => { return () => { ... } }, [])` | Avant demontage |
| `shouldComponentUpdate` | `React.memo()` | Optimisation re-render |

### Sequence complete

```tsx
function LifecycleDemo({ userId }: { userId: string }) {
  // 1. INITIALISATION (equivalent constructor)
  const [user, setUser] = useState<User | null>(null);
  console.log('Render'); // Execute a chaque render

  // 2. MONTAGE (equivalent componentDidMount)
  useEffect(() => {
    console.log('Monte !');
    const subscription = eventBus.subscribe('user-update', handleUpdate);

    // 4. DEMONTAGE (equivalent componentWillUnmount)
    return () => {
      console.log('Demonte !');
      subscription.unsubscribe();
    };
  }, []);

  // 3. MISE A JOUR (equivalent componentDidUpdate pour userId)
  useEffect(() => {
    console.log(`userId change : ${userId}`);
    fetchUser(userId).then(setUser);

    return () => {
      console.log(`Cleanup pour ancien userId`);
    };
  }, [userId]);

  return <Text>{user?.name ?? 'Chargement...'}</Text>;
}
```

### Ordre d'exécution détaillé

```
Premier render :
  1. Fonction du composant execute (useState initialisations)
  2. JSX retourne
  3. React met a jour le DOM
  4. useEffect(() => { ... }, []) execute (montage)
  5. useEffect(() => { ... }, [userId]) execute

Quand userId change :
  1. Cleanup du useEffect([userId]) precedent
  2. Fonction du composant re-execute
  3. JSX retourne
  4. React met a jour le DOM
  5. useEffect(() => { ... }, [userId]) re-execute

Demontage :
  1. Cleanup de tous les useEffect
```

---

## Erreurs classiques et comment les éviter

### 1. Stale closure (fermeture perimee)

```tsx
// MAUVAIS : count est capture au moment de la creation du handler
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count);  // Toujours 0 ! Stale closure.
      setCount(count + 1); // Toujours 0 + 1 = 1
    }, 1000);
    return () => clearInterval(id);
  }, []);  // [] = effet monte une seule fois, count capture a 0

  return <Text>{count}</Text>;
}

// BON : setter fonctionnel
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(prev => prev + 1);  // prev est toujours a jour
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <Text>{count}</Text>;
}
```

### 2. Boucle infinie avec useEffect

```tsx
// MAUVAIS : l'objet est recree a chaque render -> dep change -> re-render -> ...
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const filters = { role: 'admin' };  // Nouvel objet a chaque render !

  useEffect(() => {
    fetchUsers(filters).then(setUsers);
  }, [filters]);  // filters change a chaque render !

  return <FlatList data={users} renderItem={...} />;
}

// BON : memo ou extraction de la dep
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const role = 'admin';

  useEffect(() => {
    fetchUsers({ role }).then(setUsers);
  }, [role]);  // role est un string, comparaison par valeur

  return <FlatList data={users} renderItem={...} />;
}

// BON alternative : useMemo pour l'objet
function UserList({ role }: { role: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const filters = useMemo(() => ({ role }), [role]);

  useEffect(() => {
    fetchUsers(filters).then(setUsers);
  }, [filters]);

  return <FlatList data={users} renderItem={...} />;
}
```

### 3. Deps manquantes

```tsx
// MAUVAIS : ESLint avertit que userId manque dans les deps
function Profile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []);  // Bug : ne re-fetche pas quand userId change

  return <Text>{user?.name}</Text>;
}

// BON
useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]);  // Re-fetche quand userId change
```

### 4. SetState dans le render (sans condition)

```tsx
// MAUVAIS : boucle infinie
function Bad({ data }: { data: number[] }) {
  const [sorted, setSorted] = useState<number[]>([]);
  setSorted([...data].sort());  // SetState dans le corps = boucle !

  return <Text>{sorted.join(', ')}</Text>;
}

// BON : useMemo pour les calculs derives
function Good({ data }: { data: number[] }) {
  const sorted = useMemo(() => [...data].sort(), [data]);
  return <Text>{sorted.join(', ')}</Text>;
}
```

---

## TextInput : composant controle

Le pattern **controlled component** est fondamental en React : le composant React est la source de verite pour la valeur du champ.

```tsx
function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (field: keyof typeof form) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Soumission :', form);
    // Validation, appel API, etc.
  };

  return (
    <View style={styles.form}>
      <TextInput
        value={form.name}
        onChangeText={handleChange('name')}
        placeholder="Nom"
        style={styles.input}
      />
      <TextInput
        value={form.email}
        onChangeText={handleChange('email')}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={form.message}
        onChangeText={handleChange('message')}
        placeholder="Message"
        multiline
        numberOfLines={4}
        style={[styles.input, styles.textarea]}
      />
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!form.name || !form.email || !form.message}
      >
        <Text>Envoyer</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Validation en temps réel

```tsx
function EmailInput() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validate = (value: string) => {
    if (!value) return 'Email requis';
    if (!value.includes('@')) return 'Email invalide';
    if (!value.includes('.')) return 'Email invalide';
    return null;
  };

  const handleChange = (value: string) => {
    setEmail(value);
    if (touched) {
      setError(validate(value));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validate(email));
  };

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder="email@example.com"
        style={[styles.input, error && touched && styles.inputError]}
      />
      {error && touched && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
```

---

## Exemple complet : SearchWithDebounce

```tsx
interface SearchResult {
  id: string;
  title: string;
  description: string;
}

function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error('Erreur de recherche');
        return res.json();
      })
      .then((data: SearchResult[]) => {
        setResults(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <View style={styles.screen}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher (min. 2 caracteres)..."
        style={styles.searchInput}
      />

      {loading && <ActivityIndicator style={styles.loader} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultDesc}>{item.description}</Text>
          </View>
        )}
        ListEmptyComponent={
          debouncedQuery.length >= 2 && !loading ? (
            <Text style={styles.empty}>Aucun resultat</Text>
          ) : null
        }
      />
    </View>
  );
}
```

---

## Exemple complet : FormWithValidation

```tsx
interface FormField {
  value: string;
  error: string | null;
  touched: boolean;
}

interface FormFields {
  username: FormField;
  email: FormField;
  password: FormField;
}

type FieldName = keyof FormFields;

const validators: Record<FieldName, (value: string) => string | null> = {
  username: (v) => {
    if (v.length < 3) return 'Minimum 3 caracteres';
    if (v.length > 20) return 'Maximum 20 caracteres';
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Caracteres alphanumeriques et _ uniquement';
    return null;
  },
  email: (v) => {
    if (!v) return 'Email requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email invalide';
    return null;
  },
  password: (v) => {
    if (v.length < 8) return 'Minimum 8 caracteres';
    if (!/[A-Z]/.test(v)) return 'Au moins une majuscule';
    if (!/[0-9]/.test(v)) return 'Au moins un chiffre';
    return null;
  },
};

const createField = (value = ''): FormField => ({ value, error: null, touched: false });

function RegistrationForm() {
  const [fields, setFields] = useState<FormFields>({
    username: createField(),
    email: createField(),
    password: createField(),
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (name: FieldName) => (value: string) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        error: prev[name].touched ? validators[name](value) : null,
      },
    }));
  };

  const handleBlur = (name: FieldName) => () => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched: true,
        error: validators[name](prev[name].value),
      },
    }));
  };

  const isValid = Object.entries(fields).every(
    ([name, field]) => validators[name as FieldName](field.value) === null
  );

  const handleSubmit = () => {
    // Marquer tous les champs comme touched et valider
    const updatedFields = { ...fields };
    for (const name of Object.keys(fields) as FieldName[]) {
      updatedFields[name] = {
        ...updatedFields[name],
        touched: true,
        error: validators[name](updatedFields[name].value),
      };
    }
    setFields(updatedFields);

    if (isValid) {
      setSubmitted(true);
      console.log('Formulaire valide :', {
        username: fields.username.value,
        email: fields.email.value,
        password: fields.password.value,
      });
    }
  };

  if (submitted) {
    return (
      <View style={styles.success}>
        <Text style={styles.successText}>Inscription reussie !</Text>
        <TouchableOpacity onPress={() => {
          setFields({
            username: createField(),
            email: createField(),
            password: createField(),
          });
          setSubmitted(false);
        }}>
          <Text>Recommencer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      {(Object.keys(fields) as FieldName[]).map((name) => (
        <View key={name} style={styles.fieldGroup}>
          <Text style={styles.label}>{name}</Text>
          <TextInput
            value={fields[name].value}
            onChangeText={handleChange(name)}
            onBlur={handleBlur(name)}
            secureTextEntry={name === 'password'}
            autoCapitalize="none"
            style={[
              styles.input,
              fields[name].error && fields[name].touched && styles.inputError,
            ]}
          />
          {fields[name].error && fields[name].touched && (
            <Text style={styles.errorText}>{fields[name].error}</Text>
          )}
        </View>
      ))}

      <TouchableOpacity
        onPress={handleSubmit}
        style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
      >
        <Text style={styles.submitText}>S'inscrire</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Résumé des hooks

| Hook | Usage | Re-render ? |
|------|-------|-------------|
| `useState` | État local | Oui |
| `useEffect` | Effets de bord (API, timers, subscriptions) | Non (après render) |
| `useRef` | Refs DOM + valeurs mutables persistantes | Non |
| `useReducer` | État complexe avec logique de transition | Oui |
| `useMemo` | Calcul dérivé memorise | Non (optimisation) |
| `useCallback` | Fonction memorisee | Non (optimisation) |

---

## Points clés à retenir

1. **Setter fonctionnel** quand le nouvel état depend de l'ancien : `setX(prev => ...)`
2. **Immutabilite** : toujours créer de nouveaux objets/tableaux, jamais muter
3. **Dependency array** : lister tout ce que l'effet utilise depuis le scope du composant
4. **Cleanup** : toujours nettoyer les timers, subscriptions, abort controllers
5. **useRef** pour les valeurs qui ne doivent pas causer de re-render
6. **Custom hooks** : extraire la logique réutilisable dans des fonctions `use*`
7. **useReducer** quand l'état a plus de 2-3 sous-valeurs interdependantes
8. **Stale closures** : le piege #1 — utiliser les setters fonctionnels dans les callbacks

> **Prochain module** : Listes et donnees — FlatList, SectionList, pagination, et manipulation de donnees.

---

## Navigation

| Précédent | Suivant |
|:---------:|:-------:|
| [Module 02 — Props et communication](./02-props-et-communication.md) | [Module 04 — Listes et donnees](./04-listes-et-donnees.md) |

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 03 state](../screencasts/screencast-03-state.md)
2. **Lab** : [lab-03-state-cycle-de-vie](../labs/lab-03-state-cycle-de-vie/README)
3. **Quiz** : [quiz 03 state](../quizzes/quiz-03-state.html)
:::
