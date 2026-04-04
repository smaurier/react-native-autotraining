import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertGreaterThan,
  assertLessThan,
  assertLength,
  assertContains,
} from "../test-utils.ts";

// ─── Types ───────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

interface ApiClient {
  get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>>;
  put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>>;
  delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  addRequestInterceptor(
    interceptor: (config: RequestConfig) => RequestConfig,
  ): void;
}

interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

interface TokenManager {
  getToken(): string;
  isExpired(): boolean;
  refresh(): Promise<string>;
}

interface ApiErrorInfo {
  type: "network" | "timeout" | "client" | "server" | "unknown";
  status: number | null;
  message: string;
  retryable: boolean;
}

// ─── Exercice 1 : createApiClient ───────────────────────────────────────────

// JS-REPETITION: url_search_params

/**
 * Cree un client API avec une baseUrl.
 *
 * Le client doit :
 * - Prefixer tous les paths avec la baseUrl
 * - Supporter les methodes get, post, put, delete
 * - Gerer les query params (options.params → ?key=value&...)
 * - Appliquer les headers par defaut (Content-Type: application/json, Accept: application/json)
 * - Fusionner les headers personnalises avec les headers par defaut
 * - Appliquer les intercepteurs de requete dans l'ordre d'ajout
 * - Serialiser le body en JSON pour post/put
 *
 * Note : comme on ne peut pas faire de vrais appels HTTP dans ce lab,
 * le client retourne un objet { data, status } ou `data` est le RequestConfig
 * qui AURAIT ete envoye. Cela permet de tester la construction de la requete.
 *
 * Pour get/delete: retourne { data: requestConfig, status: 200 }
 * Pour post/put:   retourne { data: requestConfig, status: 201 }
 */
function createApiClient(baseUrl: string): ApiClient {
  // TODO: implementer le client API
  return {
    get: async () => ({ data: {} as any, status: 0 }),
    post: async () => ({ data: {} as any, status: 0 }),
    put: async () => ({ data: {} as any, status: 0 }),
    delete: async () => ({ data: {} as any, status: 0 }),
    addRequestInterceptor: () => {},
  };
}

// ─── Exercice 1 bis : parseRateLimitHeader ──────────────────────────────────

// JS-REPETITION: match_all

/**
 * Parse un header texte de type:
 * "limit=100 remaining=42 reset=1700000000"
 *
 * Retourne un objet numerique:
 * { limit: 100, remaining: 42, reset: 1700000000 }
 *
 * Indice: utilisez String.matchAll avec une regex globale.
 */
function parseRateLimitHeader(header: string): Record<string, number> {
  // TODO: extraire toutes les paires cle=nombre avec matchAll
  return {};
}

// ─── Exercice 2 : retryWithBackoff ──────────────────────────────────────────

/**
 * Execute une fonction avec retry et backoff exponentiel.
 *
 * - Appelle `fn` jusqu'a ce qu'elle reussisse ou que maxRetries soit atteint
 * - Le delai entre les tentatives suit un backoff exponentiel : baseDelay * 2^attempt
 *   (attempt commence a 0 pour le premier retry)
 * - Retourne le resultat de fn si elle reussit
 * - Leve la derniere erreur si toutes les tentatives echouent
 * - maxRetries = nombre de RETRIES (en plus de l'appel initial)
 *   Donc maxRetries=3 → 1 appel initial + 3 retries = 4 appels max
 *
 * Pour le test, on ne fait pas de vrai setTimeout — on simule juste le
 * nombre d'appels et le resultat.
 */
function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  _baseDelay: number = 1000,
): Promise<T> {
  // TODO: implementer le retry avec backoff
  return fn();
}

// ─── Exercice 3 : createTokenManager ────────────────────────────────────────

/**
 * Cree un gestionnaire de tokens d'authentification.
 *
 * - getToken() : retourne le token courant
 * - isExpired() : retourne true si le token est expire
 *   (un token est expire si Date.now() >= expiresAt)
 * - refresh() : appelle refreshFn pour obtenir un nouveau token
 *   et met a jour le token courant et la date d'expiration
 *   refreshFn retourne { token: string, expiresAt: number }
 *
 * Deduplication : si refresh() est appele plusieurs fois en parallele,
 * une seule execution de refreshFn doit avoir lieu. Les appels concurrents
 * doivent recevoir le meme resultat.
 */
function createTokenManager(
  initialToken: string,
  initialExpiresAt: number,
  refreshFn: () => Promise<{ token: string; expiresAt: number }>,
): TokenManager {
  // TODO: implementer le gestionnaire de tokens
  return {
    getToken: () => "",
    isExpired: () => true,
    refresh: async () => "",
  };
}

// ─── Exercice 4 : createAbortableRequest ────────────────────────────────────

/**
 * Cree une requete annulable avec timeout.
 *
 * Retourne un objet avec :
 * - promise : une Promise qui :
 *   - Resolve avec le resultat de `fn` si elle termine avant le timeout
 *   - Reject avec une Error('Timeout') si le timeout expire
 *   - Reject avec une Error('Aborted') si abort() est appele
 * - abort() : annule la requete manuellement
 *
 * Note : `fn` recoit un AbortSignal. Si le signal est abort, fn doit
 * pouvoir detecter l'annulation (mais dans nos tests on simule).
 */
function createAbortableRequest<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): { promise: Promise<T>; abort: () => void } {
  // TODO: implementer la requete annulable avec timeout
  return {
    promise: fn(new AbortController().signal),
    abort: () => {},
  };
}

// ─── Exercice 5 : parseApiError ─────────────────────────────────────────────

/**
 * Analyse une erreur et retourne une description structuree.
 *
 * Regles :
 * - Si error.name === 'TypeError' et message contient 'network' (insensible a la casse) :
 *   → type: 'network', status: null, message: 'Pas de connexion internet', retryable: true
 *
 * - Si error.name === 'AbortError' :
 *   → type: 'timeout', status: null, message: 'Requete annulee ou timeout', retryable: true
 *
 * - Si error a une propriete `status` (nombre) :
 *   - status 400-499 → type: 'client', retryable: false
 *     SAUF status 408 (Request Timeout) et 429 (Too Many Requests) → retryable: true
 *   - status 500-599 → type: 'server', retryable: true
 *   - message: 'Erreur HTTP {status}'
 *
 * - Sinon : type: 'unknown', status: null, message: error.message ou 'Erreur inconnue', retryable: false
 */
function parseApiError(error: unknown): ApiErrorInfo {
  // TODO: categoriser l'erreur
  return {
    type: "unknown",
    status: null,
    message: "Erreur inconnue",
    retryable: false,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════════════

const runner = createTestRunner("Lab 12 — Networking et API");

// ─── Tests createApiClient ──────────────────────────────────────────────────

runner.test("createApiClient: GET construit l'URL correcte", async () => {
  const client = createApiClient("https://api.example.com");
  const result = await client.get<RequestConfig>("/users");
  assertEqual(result.data.url, "https://api.example.com/users");
  assertEqual(result.data.method, "GET");
  assertEqual(result.status, 200);
});

runner.test(
  "createApiClient: GET avec params ajoute les query strings",
  async () => {
    const client = createApiClient("https://api.example.com");
    const result = await client.get<RequestConfig>("/users", {
      params: { page: 1, limit: 20, active: true },
    });
    assertContains(result.data.url, "page=1");
    assertContains(result.data.url, "limit=20");
    assertContains(result.data.url, "active=true");
  },
);

runner.test("createApiClient: POST serialise le body en JSON", async () => {
  const client = createApiClient("https://api.example.com");
  const result = await client.post<RequestConfig>("/users", {
    name: "Alice",
    email: "a@b.com",
  });
  assertEqual(result.data.method, "POST");
  assertEqual(
    result.data.body,
    JSON.stringify({ name: "Alice", email: "a@b.com" }),
  );
  assertEqual(result.status, 201);
});

runner.test("createApiClient: PUT serialise le body en JSON", async () => {
  const client = createApiClient("https://api.example.com");
  const result = await client.put<RequestConfig>("/users/1", { name: "Bob" });
  assertEqual(result.data.method, "PUT");
  assertEqual(result.data.url, "https://api.example.com/users/1");
  assertEqual(result.data.body, JSON.stringify({ name: "Bob" }));
  assertEqual(result.status, 201);
});

runner.test("createApiClient: DELETE sans body", async () => {
  const client = createApiClient("https://api.example.com");
  const result = await client.delete<RequestConfig>("/users/1");
  assertEqual(result.data.method, "DELETE");
  assertEqual(result.data.url, "https://api.example.com/users/1");
  assertEqual(result.data.body, undefined);
  assertEqual(result.status, 200);
});

runner.test("createApiClient: headers par defaut", async () => {
  const client = createApiClient("https://api.example.com");
  const result = await client.get<RequestConfig>("/users");
  assertEqual(result.data.headers["Content-Type"], "application/json");
  assertEqual(result.data.headers["Accept"], "application/json");
});

runner.test("createApiClient: headers personnalises fusionnes", async () => {
  const client = createApiClient("https://api.example.com");
  const result = await client.get<RequestConfig>("/users", {
    headers: { "X-Custom": "value", Accept: "text/plain" },
  });
  assertEqual(result.data.headers["Content-Type"], "application/json");
  assertEqual(result.data.headers["X-Custom"], "value");
  assertEqual(result.data.headers["Accept"], "text/plain");
});

runner.test("createApiClient: intercepteur modifie la requete", async () => {
  const client = createApiClient("https://api.example.com");
  client.addRequestInterceptor((config) => ({
    ...config,
    headers: { ...config.headers, Authorization: "Bearer test-token" },
  }));
  const result = await client.get<RequestConfig>("/users");
  assertEqual(result.data.headers["Authorization"], "Bearer test-token");
});

runner.test(
  "createApiClient: intercepteurs appliques dans l'ordre",
  async () => {
    const client = createApiClient("https://api.example.com");
    client.addRequestInterceptor((config) => ({
      ...config,
      headers: { ...config.headers, "X-First": "1" },
    }));
    client.addRequestInterceptor((config) => ({
      ...config,
      headers: { ...config.headers, "X-Second": "2", "X-First": "overridden" },
    }));
    const result = await client.get<RequestConfig>("/users");
    assertEqual(result.data.headers["X-First"], "overridden");
    assertEqual(result.data.headers["X-Second"], "2");
  },
);

runner.test(
  "parseRateLimitHeader: extrait les paires numeriques avec matchAll",
  () => {
    const parsed = parseRateLimitHeader(
      "limit=100 remaining=42 reset=1700000000",
    );
    assertDeepEqual(parsed, {
      limit: 100,
      remaining: 42,
      reset: 1700000000,
    });
  },
);

// ─── Tests retryWithBackoff ─────────────────────────────────────────────────

runner.test("retryWithBackoff: reussit du premier coup", async () => {
  let calls = 0;
  const result = await retryWithBackoff(
    async () => {
      calls++;
      return "ok";
    },
    3,
    0,
  );
  assertEqual(result, "ok");
  assertEqual(calls, 1);
});

runner.test("retryWithBackoff: reussit apres 2 echecs", async () => {
  let calls = 0;
  const result = await retryWithBackoff(
    async () => {
      calls++;
      if (calls < 3) throw new Error("fail");
      return "ok";
    },
    3,
    0,
  );
  assertEqual(result, "ok");
  assertEqual(calls, 3);
});

runner.test("retryWithBackoff: echoue apres maxRetries", async () => {
  let calls = 0;
  try {
    await retryWithBackoff(
      async () => {
        calls++;
        throw new Error("always fails");
      },
      2,
      0,
    );
    assertTrue(false, "Devrait avoir leve une erreur");
  } catch (err) {
    assertEqual((err as Error).message, "always fails");
    assertEqual(calls, 3); // 1 initial + 2 retries
  }
});

// ─── Tests createTokenManager ───────────────────────────────────────────────

runner.test("createTokenManager: getToken retourne le token initial", () => {
  const tm = createTokenManager(
    "initial-token",
    Date.now() + 60000,
    async () => ({
      token: "new",
      expiresAt: Date.now() + 60000,
    }),
  );
  assertEqual(tm.getToken(), "initial-token");
});

runner.test(
  "createTokenManager: isExpired retourne false si non expire",
  () => {
    const tm = createTokenManager("token", Date.now() + 60000, async () => ({
      token: "new",
      expiresAt: Date.now() + 60000,
    }));
    assertFalse(tm.isExpired());
  },
);

runner.test("createTokenManager: isExpired retourne true si expire", () => {
  const tm = createTokenManager("token", Date.now() - 1000, async () => ({
    token: "new",
    expiresAt: Date.now() + 60000,
  }));
  assertTrue(tm.isExpired());
});

runner.test("createTokenManager: refresh met a jour le token", async () => {
  const tm = createTokenManager("old", Date.now() - 1000, async () => ({
    token: "refreshed",
    expiresAt: Date.now() + 60000,
  }));
  const newToken = await tm.refresh();
  assertEqual(newToken, "refreshed");
  assertEqual(tm.getToken(), "refreshed");
  assertFalse(tm.isExpired());
});

runner.test("createTokenManager: refresh deduplication", async () => {
  let callCount = 0;
  const tm = createTokenManager("old", Date.now() - 1000, async () => {
    callCount++;
    // Simuler une latence
    await new Promise((r) => setTimeout(r, 10));
    return { token: `refreshed-${callCount}`, expiresAt: Date.now() + 60000 };
  });

  // Appeler refresh 3 fois en parallele
  const [r1, r2, r3] = await Promise.all([
    tm.refresh(),
    tm.refresh(),
    tm.refresh(),
  ]);

  // Une seule execution de refreshFn
  assertEqual(callCount, 1);
  assertEqual(r1, r2);
  assertEqual(r2, r3);
});

// ─── Tests createAbortableRequest ───────────────────────────────────────────

runner.test("createAbortableRequest: resolve avant timeout", async () => {
  const { promise } = createAbortableRequest(async () => "done", 5000);
  const result = await promise;
  assertEqual(result, "done");
});

runner.test("createAbortableRequest: reject sur timeout", async () => {
  const { promise } = createAbortableRequest(async () => {
    await new Promise((r) => setTimeout(r, 200));
    return "too late";
  }, 50);
  try {
    await promise;
    assertTrue(false, "Devrait avoir timeout");
  } catch (err) {
    assertEqual((err as Error).message, "Timeout");
  }
});

runner.test("createAbortableRequest: reject sur abort manuel", async () => {
  const { promise, abort } = createAbortableRequest(async () => {
    await new Promise((r) => setTimeout(r, 5000));
    return "never";
  }, 10000);

  // Abort apres 10ms
  setTimeout(() => abort(), 10);

  try {
    await promise;
    assertTrue(false, "Devrait avoir ete abort");
  } catch (err) {
    assertEqual((err as Error).message, "Aborted");
  }
});

// ─── Tests parseApiError ────────────────────────────────────────────────────

runner.test("parseApiError: erreur reseau", () => {
  const error = new TypeError("Network request failed");
  const info = parseApiError(error);
  assertEqual(info.type, "network");
  assertEqual(info.status, null);
  assertTrue(info.retryable);
});

runner.test("parseApiError: abort/timeout", () => {
  const error = new DOMException("The operation was aborted", "AbortError");
  const info = parseApiError(error);
  assertEqual(info.type, "timeout");
  assertEqual(info.status, null);
  assertTrue(info.retryable);
});

runner.test("parseApiError: erreur client 404", () => {
  const error = Object.assign(new Error("Not found"), { status: 404 });
  const info = parseApiError(error);
  assertEqual(info.type, "client");
  assertEqual(info.status, 404);
  assertFalse(info.retryable);
  assertContains(info.message, "404");
});

runner.test("parseApiError: erreur client 429 retryable", () => {
  const error = Object.assign(new Error("Too many requests"), { status: 429 });
  const info = parseApiError(error);
  assertEqual(info.type, "client");
  assertEqual(info.status, 429);
  assertTrue(info.retryable);
});

runner.test("parseApiError: erreur client 408 retryable", () => {
  const error = Object.assign(new Error("Request Timeout"), { status: 408 });
  const info = parseApiError(error);
  assertEqual(info.type, "client");
  assertEqual(info.status, 408);
  assertTrue(info.retryable);
});

runner.test("parseApiError: erreur serveur 500", () => {
  const error = Object.assign(new Error("Internal Server Error"), {
    status: 500,
  });
  const info = parseApiError(error);
  assertEqual(info.type, "server");
  assertEqual(info.status, 500);
  assertTrue(info.retryable);
});

runner.test("parseApiError: erreur inconnue", () => {
  const info = parseApiError("some random error");
  assertEqual(info.type, "unknown");
  assertEqual(info.status, null);
  assertFalse(info.retryable);
});

runner.run();
