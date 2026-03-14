# 12 — Networking et API

| Difficulte | Duree estimee | Lab | Quiz |
|:----------:|:-------------:|:---:|:----:|
| 3/5        | 75 min        | [Lab 12](../labs/lab-12-networking-api/) | [Quiz 12](../quizzes/quiz-12-networking.html) |

## Objectifs pedagogiques

A la fin de ce module, vous serez capable de :

- Utiliser l'API `fetch` native pour effectuer des requetes GET, POST, PUT et DELETE
- Typer les requetes et reponses avec TypeScript
- Annuler des requetes avec `AbortController`
- Implementer un pattern d'authentification Bearer token avec refresh automatique
- Construire un client API reutilisable avec intercepteurs et retry
- Configurer les URLs selon l'environnement (dev, staging, prod)
- Gerer les erreurs reseau, HTTP et timeout de maniere structuree

---

<details>
<summary>Rappel du module precedent</summary>

- **State management** : Zustand, Context, Redux Toolkit
- **Persistence** : MMKV, AsyncStorage
- **Flux de donnees** : actions, reducers, selectors
- **Middleware** : logging, persistence

</details>

---

## fetch : l'API native de React Native

React Native embarque l'API `fetch` du standard Web. Pas besoin d'installer Axios ou une autre librairie HTTP — `fetch` est disponible globalement, performant et parfaitement integre a la New Architecture via JSI.

### GET : recuperer des donnees

```tsx
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

async function getUser(id: number): Promise<User> {
  const response = await fetch(`https://api.example.com/users/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
```

:::warning Attention : fetch ne rejette pas sur les erreurs HTTP
Contrairement a Axios, `fetch` ne leve **pas** d'exception pour les codes 4xx ou 5xx. Seule une erreur **reseau** (pas de connexion, DNS introuvable) provoque un rejet de la Promise. Vous devez toujours verifier `response.ok` ou `response.status`.
:::

### POST : creer une ressource

```tsx
interface CreateUserPayload {
  name: string;
  email: string;
}

interface CreateUserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

async function createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.message ?? `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}
```

### PUT : mettre a jour une ressource

```tsx
interface UpdateUserPayload {
  name?: string;
  email?: string;
  avatar?: string;
}

async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  const response = await fetch(`https://api.example.com/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
```

### DELETE : supprimer une ressource

```tsx
async function deleteUser(id: number): Promise<void> {
  const response = await fetch(`https://api.example.com/users/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  // DELETE retourne souvent 204 No Content — pas de body a parser
}
```

---

## Typage complet des requetes et reponses

Un bon typage TypeScript elimine toute une categorie de bugs. Voici un pattern pour typer systematiquement vos appels API :

```tsx
// ─── Types de base ───────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestConfig<TBody = unknown> {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: TBody;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Types metier ────────────────────────────────────────────────────────────

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: number;
  postId: number;
  userId: number;
  body: string;
  createdAt: string;
}

interface CreatePostPayload {
  title: string;
  body: string;
}

interface UpdatePostPayload {
  title?: string;
  body?: string;
}

// ─── Endpoints types ────────────────────────────────────────────────────────

interface ApiEndpoints {
  'GET /posts': {
    params: { page?: number; pageSize?: number };
    response: PaginatedResponse<Post>;
  };
  'GET /posts/:id': {
    params: { id: number };
    response: Post;
  };
  'POST /posts': {
    body: CreatePostPayload;
    response: Post;
  };
  'PUT /posts/:id': {
    params: { id: number };
    body: UpdatePostPayload;
    response: Post;
  };
  'DELETE /posts/:id': {
    params: { id: number };
    response: void;
  };
  'GET /posts/:id/comments': {
    params: { id: number; page?: number };
    response: PaginatedResponse<Comment>;
  };
}
```

Ce pattern de type-map permet d'avoir un typage end-to-end entre la definition de l'endpoint et son utilisation.

---

## AbortController : annuler des requetes

`AbortController` est essentiel en React Native. Quand l'utilisateur quitte un ecran ou relance une recherche, les requetes en cours doivent etre annulees pour eviter les fuites memoire et les mises a jour de state sur des composants demontes.

### Usage basique

```tsx
const controller = new AbortController();

fetch('https://api.example.com/posts', {
  signal: controller.signal,
}).then(response => {
  // traitement
}).catch(error => {
  if (error.name === 'AbortError') {
    console.log('Requete annulee');
  } else {
    throw error;
  }
});

// Annuler la requete
controller.abort();
```

### Pattern useEffect avec cleanup

```tsx
import { useState, useEffect } from 'react';

function useUser(userId: number) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchUser() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://api.example.com/users/${userId}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: User = await response.json();
        setUser(data);
      } catch (err) {
        // Ne pas mettre a jour le state si la requete a ete annulee
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    // Cleanup : annule la requete si userId change ou si le composant est demonte
    return () => controller.abort();
  }, [userId]);

  return { user, loading, error };
}
```

:::tip Pourquoi verifier controller.signal.aborted dans finally ?
Quand la requete est annulee, le `catch` s'execute avec une `AbortError`. Sans verification, `setLoading(false)` s'executerait sur un composant potentiellement demonte, provoquant un warning React.
:::

### Timeout avec AbortController

```tsx
function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();

  // AbortSignal.timeout() est disponible en RN 0.73+
  // Sinon, utiliser setTimeout comme fallback
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}
```

### Annuler sur recherche debounced

```tsx
import { useState, useEffect, useRef } from 'react';

function useSearch<T>(searchFn: (query: string, signal: AbortSignal) => Promise<T[]>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Annuler la requete precedente
    controllerRef.current?.abort();

    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchFn(query, controller.signal);
        if (!controller.signal.aborted) {
          setResults(data);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, searchFn]);

  return { query, setQuery, results, loading };
}
```

---

## Authentification : Bearer token et refresh

La plupart des APIs REST utilisent des JWT (JSON Web Tokens). Le pattern standard :

1. L'utilisateur se connecte → l'API retourne un `accessToken` (courte duree) et un `refreshToken` (longue duree)
2. Chaque requete envoie l'`accessToken` dans le header `Authorization`
3. Quand l'`accessToken` expire (HTTP 401), on utilise le `refreshToken` pour en obtenir un nouveau
4. Si le `refreshToken` est aussi expire, on deconnecte l'utilisateur

### Token Manager

```tsx
import * as SecureStore from 'expo-secure-store';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp en ms
}

class TokenManager {
  private tokenPair: TokenPair | null = null;
  private refreshPromise: Promise<TokenPair> | null = null;

  async getTokenPair(): Promise<TokenPair | null> {
    if (!this.tokenPair) {
      const stored = await SecureStore.getItemAsync('auth_tokens');
      this.tokenPair = stored ? JSON.parse(stored) : null;
    }
    return this.tokenPair;
  }

  async setTokenPair(pair: TokenPair): Promise<void> {
    this.tokenPair = pair;
    await SecureStore.setItemAsync('auth_tokens', JSON.stringify(pair));
  }

  async clearTokens(): Promise<void> {
    this.tokenPair = null;
    await SecureStore.deleteItemAsync('auth_tokens');
  }

  isExpired(): boolean {
    if (!this.tokenPair) return true;
    // Marge de 30 secondes pour eviter les race conditions
    return Date.now() >= this.tokenPair.expiresAt - 30_000;
  }

  /**
   * Rafraichit le token. Deduplication : si un refresh est deja en cours,
   * on reutilise la meme Promise pour eviter les appels multiples.
   */
  async refresh(refreshFn: () => Promise<TokenPair>): Promise<TokenPair> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = refreshFn()
      .then(async (pair) => {
        await this.setTokenPair(pair);
        return pair;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }
}

const tokenManager = new TokenManager();
```

:::tip Pourquoi dedupliquer le refresh ?
Si 3 requetes echouent en 401 simultanement, les 3 vont tenter un refresh. Sans deduplication, le premier refresh reussit, mais le 2e et 3e utilisent un refreshToken deja consomme (one-time use) et echouent. Avec la deduplication, les 3 partagent la meme Promise.
:::

### Stockage securise des tokens

```tsx
// ❌ NE JAMAIS stocker les tokens dans AsyncStorage (non chiffre)
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('token', accessToken); // DANGER !

// ✅ Utiliser expo-secure-store (iOS Keychain / Android Keystore)
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('auth_tokens', JSON.stringify(tokenPair));

// ✅ Ou react-native-keychain
import * as Keychain from 'react-native-keychain';
await Keychain.setGenericPassword('auth', JSON.stringify(tokenPair));
```

---

## Client API reutilisable

Un client API centralise toutes les preoccupations transversales : base URL, headers communs, authentification, retry, logging.

### Architecture

```tsx
type Interceptor = (config: RequestInit & { url: string }) => RequestInit & { url: string };
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: Interceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // retirer le slash final
    this.timeout = config.timeout ?? 15000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.defaultHeaders,
    };
  }

  addRequestInterceptor(interceptor: Interceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = `${this.baseUrl}${path}`;
    if (!params) return url;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, String(value));
    }
    return `${url}?${searchParams.toString()}`;
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    }
  ): Promise<ApiResponse<T>> {
    let config: RequestInit & { url: string } = {
      url: this.buildUrl(path, options?.params),
      method,
      headers: {
        ...this.defaultHeaders,
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    };

    // Appliquer les intercepteurs de requete
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config);
    }

    // Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    if (config.signal) {
      // Combiner le signal externe avec le timeout
      config.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const { url, ...fetchOptions } = config;
      let response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      // Appliquer les intercepteurs de reponse
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new ApiError(response.status, response.statusText, errorBody);
      }

      // 204 No Content
      if (response.status === 204) {
        return {
          data: undefined as T,
          status: response.status,
          headers: response.headers,
        };
      }

      const data: T = await response.json();
      return { data, status: response.status, headers: response.headers };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(path: string, options?: {
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  }): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, body?: unknown, options?: {
    headers?: Record<string, string>;
    signal?: AbortSignal;
  }): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, { body, ...options });
  }

  async put<T>(path: string, body?: unknown, options?: {
    headers?: Record<string, string>;
    signal?: AbortSignal;
  }): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, { body, ...options });
  }

  async delete<T = void>(path: string, options?: {
    headers?: Record<string, string>;
    signal?: AbortSignal;
  }): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, options);
  }
}
```

### Classe d'erreur API

```tsx
class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}
```

### Intercepteurs

```tsx
// ─── Intercepteur d'authentification ────────────────────────────────────────

function createAuthInterceptor(tokenManager: TokenManager): Interceptor {
  return (config) => {
    const pair = tokenManager.tokenPair;
    if (pair?.accessToken) {
      config.headers = {
        ...config.headers as Record<string, string>,
        'Authorization': `Bearer ${pair.accessToken}`,
      };
    }
    return config;
  };
}

// ─── Intercepteur de logging ────────────────────────────────────────────────

function createLoggingInterceptor(): Interceptor {
  return (config) => {
    if (__DEV__) {
      console.log(`[API] ${config.method} ${config.url}`);
    }
    return config;
  };
}

// ─── Intercepteur de reponse : refresh token ────────────────────────────────

function createRefreshInterceptor(
  tokenManager: TokenManager,
  refreshEndpoint: string
): ResponseInterceptor {
  return async (response) => {
    if (response.status !== 401) return response;

    try {
      const newTokens = await tokenManager.refresh(async () => {
        const pair = await tokenManager.getTokenPair();
        if (!pair) throw new Error('No refresh token');

        const res = await fetch(refreshEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: pair.refreshToken }),
        });

        if (!res.ok) throw new Error('Refresh failed');
        return res.json();
      });

      // Relancer la requete originale avec le nouveau token
      const retryResponse = await fetch(response.url, {
        method: (response as any)._method,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Authorization': `Bearer ${newTokens.accessToken}`,
        },
      });

      return retryResponse;
    } catch {
      // Refresh echoue → deconnecter l'utilisateur
      await tokenManager.clearTokens();
      throw new ApiError(401, 'Session expired', null);
    }
  };
}
```

---

## Retry avec backoff exponentiel

Certaines erreurs sont transitoires (timeout, 503, probleme reseau). Un retry intelligent rend l'application resiliente.

```tsx
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;       // en ms
  maxDelay: number;        // en ms
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, retryableStatuses } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Verifier si l'erreur est retryable
      if (error instanceof ApiError && !retryableStatuses.includes(error.status)) {
        throw error; // Pas retryable (ex: 404, 422)
      }

      if (attempt === maxRetries) {
        throw lastError; // Plus de tentatives
      }

      // Backoff exponentiel avec jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );

      if (__DEV__) {
        console.log(
          `[Retry] Attempt ${attempt + 1}/${maxRetries}, retrying in ${Math.round(delay)}ms`
        );
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

### Integrer le retry dans le client

```tsx
// Wrapper pour le client API
async function fetchWithRetry<T>(
  client: ApiClient,
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  options?: any,
  retryConfig?: Partial<RetryConfig>
): Promise<ApiResponse<T>> {
  return retryWithBackoff(
    () => client[method]<T>(path, options),
    retryConfig
  );
}
```

:::tip Jitter : pourquoi ajouter du bruit aleatoire ?
Sans jitter, si 100 clients echouent au meme instant, ils retentent tous exactement en meme temps (effet "thundering herd"). Le jitter disperse les retries dans le temps, evitant de surcharger le serveur.
:::

---

## Configuration d'environnement

En React Native, la configuration d'environnement se gere differemment du web. Pas de `process.env` cote client — on utilise `react-native-config` ou les variables Expo.

### Avec Expo

```tsx
// app.config.ts
export default {
  expo: {
    extra: {
      apiUrl: process.env.API_URL ?? 'http://localhost:3000',
      environment: process.env.APP_ENV ?? 'development',
    },
  },
};

// utils/config.ts
import Constants from 'expo-constants';

interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
}

export const config: AppConfig = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000',
  environment: Constants.expoConfig?.extra?.environment ?? 'development',
};
```

### Avec react-native-config (bare workflow)

```tsx
// .env.development
API_URL=http://localhost:3000
APP_ENV=development

// .env.staging
API_URL=https://staging-api.example.com
APP_ENV=staging

// .env.production
API_URL=https://api.example.com
APP_ENV=production

// utils/config.ts
import Config from 'react-native-config';

interface AppConfig {
  apiUrl: string;
  environment: string;
}

export const config: AppConfig = {
  apiUrl: Config.API_URL ?? 'http://localhost:3000',
  environment: Config.APP_ENV ?? 'development',
};
```

### Pattern multi-environnement complet

```tsx
// config/environments.ts

interface EnvironmentConfig {
  apiUrl: string;
  wsUrl: string;
  cdnUrl: string;
  sentryDsn: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMocking: boolean;
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    apiUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000',
    cdnUrl: 'http://localhost:3001',
    sentryDsn: '',
    logLevel: 'debug',
    enableMocking: true,
  },
  staging: {
    apiUrl: 'https://staging-api.example.com',
    wsUrl: 'wss://staging-api.example.com',
    cdnUrl: 'https://staging-cdn.example.com',
    sentryDsn: 'https://xxx@sentry.io/staging',
    logLevel: 'info',
    enableMocking: false,
  },
  production: {
    apiUrl: 'https://api.example.com',
    wsUrl: 'wss://api.example.com',
    cdnUrl: 'https://cdn.example.com',
    sentryDsn: 'https://xxx@sentry.io/prod',
    logLevel: 'error',
    enableMocking: false,
  },
};

const currentEnv = Config.APP_ENV ?? 'development';
export const env = environments[currentEnv];
```

---

## Strategie de gestion d'erreurs

Les erreurs en networking se repartissent en 3 categories qu'il faut traiter differemment :

### 1. Erreurs reseau (pas de connexion)

```tsx
async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, await response.json().catch(() => null));
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new NetworkError('Pas de connexion internet. Verifiez votre reseau.');
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError('La requete a expire. Reessayez.');
    }

    throw error;
  }
}

class NetworkError extends Error {
  readonly name = 'NetworkError';
  constructor(message: string) {
    super(message);
  }
}

class TimeoutError extends Error {
  readonly name = 'TimeoutError';
  constructor(message: string) {
    super(message);
  }
}
```

### 2. Erreurs HTTP (4xx, 5xx)

```tsx
function categorizeHttpError(status: number): string {
  const categories: Record<number, string> = {
    400: 'Requete invalide. Verifiez les donnees envoyees.',
    401: 'Session expiree. Veuillez vous reconnecter.',
    403: 'Acces refuse. Vous n\'avez pas les droits necessaires.',
    404: 'Ressource introuvable.',
    409: 'Conflit. La ressource a ete modifiee par un autre utilisateur.',
    422: 'Donnees invalides. Verifiez le formulaire.',
    429: 'Trop de requetes. Attendez un moment.',
    500: 'Erreur serveur. Reessayez plus tard.',
    502: 'Serveur temporairement indisponible.',
    503: 'Service en maintenance. Reessayez dans quelques minutes.',
  };

  return categories[status] ?? `Erreur inattendue (${status}).`;
}
```

### 3. Erreurs de validation (formulaire)

```tsx
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ApiValidationResponse {
  message: string;
  errors: ValidationError[];
}

function parseValidationErrors(error: ApiError): Map<string, string> {
  const fieldErrors = new Map<string, string>();

  if (error.status === 422 && error.body) {
    const body = error.body as ApiValidationResponse;
    for (const err of body.errors) {
      fieldErrors.set(err.field, err.message);
    }
  }

  return fieldErrors;
}

// Utilisation dans un formulaire
async function handleSubmit(data: CreatePostPayload) {
  try {
    await apiClient.post('/posts', data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) {
      const fieldErrors = parseValidationErrors(error);
      // Afficher les erreurs sous chaque champ
      setErrors(fieldErrors);
    } else {
      // Erreur generique
      showToast('Une erreur est survenue');
    }
  }
}
```

### Hook d'erreur centralise

```tsx
import { useCallback } from 'react';
import { Alert } from 'react-native';

function useApiErrorHandler() {
  return useCallback((error: unknown) => {
    if (error instanceof NetworkError) {
      Alert.alert(
        'Pas de connexion',
        error.message,
        [{ text: 'OK' }]
      );
      return;
    }

    if (error instanceof TimeoutError) {
      Alert.alert(
        'Delai depasse',
        error.message,
        [{ text: 'Reessayer' }]
      );
      return;
    }

    if (error instanceof ApiError) {
      if (error.isUnauthorized) {
        // Navigation vers login
        return;
      }

      Alert.alert(
        'Erreur',
        categorizeHttpError(error.status),
        [{ text: 'OK' }]
      );
      return;
    }

    // Erreur inconnue
    Alert.alert('Erreur', 'Une erreur inattendue est survenue.');
  }, []);
}
```

---

## Exemple complet : client API pour une application sociale

Assemblons tous les concepts dans un client API complet :

```tsx
// api/client.ts

import { config } from '../config';

const apiClient = new ApiClient({
  baseUrl: config.apiUrl,
  timeout: 15000,
  defaultHeaders: {
    'X-App-Version': '1.0.0',
    'X-Platform': Platform.OS,
  },
});

// Intercepteurs
apiClient.addRequestInterceptor(createLoggingInterceptor());
apiClient.addRequestInterceptor(createAuthInterceptor(tokenManager));

// api/users.ts
export const usersApi = {
  getProfile: (userId: number, signal?: AbortSignal) =>
    apiClient.get<User>(`/users/${userId}`, { signal }),

  updateProfile: (userId: number, data: UpdateUserPayload) =>
    apiClient.put<User>(`/users/${userId}`, data),

  uploadAvatar: async (userId: number, imageUri: string) => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    return apiClient.post<{ avatarUrl: string }>(`/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// api/posts.ts
export const postsApi = {
  list: (page: number = 1, pageSize: number = 20, signal?: AbortSignal) =>
    apiClient.get<PaginatedResponse<Post>>('/posts', {
      params: { page, pageSize },
      signal,
    }),

  getById: (id: number, signal?: AbortSignal) =>
    apiClient.get<Post>(`/posts/${id}`, { signal }),

  create: (data: CreatePostPayload) =>
    apiClient.post<Post>('/posts', data),

  update: (id: number, data: UpdatePostPayload) =>
    apiClient.put<Post>(`/posts/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/posts/${id}`),

  getComments: (postId: number, page: number = 1, signal?: AbortSignal) =>
    apiClient.get<PaginatedResponse<Comment>>(`/posts/${postId}/comments`, {
      params: { page },
      signal,
    }),
};
```

### Utilisation dans un composant

```tsx
import { useState, useEffect } from 'react';
import { FlatList, View, Text, ActivityIndicator } from 'react-native';
import { postsApi } from '../api/posts';

function PostsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const handleError = useApiErrorHandler();

  useEffect(() => {
    const controller = new AbortController();

    async function loadPosts() {
      try {
        setLoading(true);
        const response = await postsApi.list(page, 20, controller.signal);
        setPosts(prev => page === 1
          ? response.data.data
          : [...prev, ...response.data.data]
        );
        setHasMore(response.data.page < response.data.totalPages);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          handleError(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPosts();
    return () => controller.abort();
  }, [page]);

  return (
    <FlatList
      data={posts}
      keyExtractor={item => String(item.id)}
      renderItem={({ item }) => (
        <View style={{ padding: 16 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
          <Text>{item.body}</Text>
        </View>
      )}
      onEndReached={() => {
        if (hasMore && !loading) {
          setPage(p => p + 1);
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <ActivityIndicator /> : null}
    />
  );
}
```

---

## Bonnes pratiques

### Checklist networking React Native

| Pratique | Description |
|----------|-------------|
| Toujours verifier `response.ok` | `fetch` ne rejette pas sur 4xx/5xx |
| AbortController dans useEffect | Eviter les mises a jour sur composant demonte |
| Timeout explicite | Ne jamais laisser une requete pending indefiniment |
| Retry avec backoff | Pour les erreurs transitoires uniquement |
| Tokens dans SecureStore | Jamais dans AsyncStorage |
| Refresh token deduplication | Eviter les appels multiples en parallele |
| Typage strict des payloads | Erreurs detectees a la compilation |
| Configuration par environnement | Pas de URLs en dur dans le code |

### Erreurs courantes

```tsx
// ❌ Pas de gestion d'erreur
const data = await fetch(url).then(r => r.json());

// ✅ Gestion complete
const response = await fetch(url);
if (!response.ok) {
  throw new ApiError(response.status, response.statusText, null);
}
const data = await response.json();
```

```tsx
// ❌ Pas d'annulation — fuite memoire si l'ecran est quitte
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData);
}, []);

// ✅ Annulation propre
useEffect(() => {
  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal })
    .then(r => r.json())
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });
  return () => controller.abort();
}, []);
```

```tsx
// ❌ Token en clair dans AsyncStorage
await AsyncStorage.setItem('jwt', token);

// ✅ Token chiffre dans SecureStore
await SecureStore.setItemAsync('jwt', token);
```

---

## Recapitulatif

| Concept | Outil / Pattern | Points cles |
|---------|-----------------|-------------|
| Requetes HTTP | `fetch` natif | Verifier `response.ok`, toujours typer |
| Annulation | `AbortController` | Cleanup dans `useEffect`, timeout |
| Authentification | Bearer + refresh | Deduplication, stockage securise |
| Client API | Classe avec intercepteurs | Base URL, headers, auth, logging |
| Retry | Backoff exponentiel + jitter | Seulement sur erreurs transitoires |
| Configuration | `react-native-config` / Expo | Une config par environnement |
| Erreurs | Classes specialisees | Network / HTTP / Validation / Timeout |

---

## Exercice pratique

Rendez-vous au [Lab 12](../labs/lab-12-networking-api/) pour implementer un client API type complet avec gestion de tokens, retry et annulation.

---

<details>
<summary>Pour aller plus loin</summary>

- [Fetch API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [AbortController — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [React Native Networking](https://reactnative.dev/docs/network)
- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [react-native-config](https://github.com/lukewalczak/react-native-config)

</details>
