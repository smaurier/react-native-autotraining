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

function createApiClient(baseUrl: string): ApiClient {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const interceptors: Array<(config: RequestConfig) => RequestConfig> = [];

  function buildUrl(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    let url = `${normalizedBase}${path}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        searchParams.set(key, String(value));
      }
      url += `?${searchParams.toString()}`;
    }
    return url;
  }

  function buildRequest(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): RequestConfig {
    const url = buildUrl(path, options?.params);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    };

    let config: RequestConfig = {
      method,
      url,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };

    for (const interceptor of interceptors) {
      config = interceptor(config);
    }

    return config;
  }

  return {
    async get<T>(
      path: string,
      options?: RequestOptions,
    ): Promise<ApiResponse<T>> {
      const config = buildRequest("GET", path, undefined, options);
      return { data: config as T, status: 200 };
    },

    async post<T>(
      path: string,
      body?: unknown,
      options?: RequestOptions,
    ): Promise<ApiResponse<T>> {
      const config = buildRequest("POST", path, body, options);
      return { data: config as T, status: 201 };
    },

    async put<T>(
      path: string,
      body?: unknown,
      options?: RequestOptions,
    ): Promise<ApiResponse<T>> {
      const config = buildRequest("PUT", path, body, options);
      return { data: config as T, status: 201 };
    },

    async delete<T>(
      path: string,
      options?: RequestOptions,
    ): Promise<ApiResponse<T>> {
      const config = buildRequest("DELETE", path, undefined, options);
      return { data: config as T, status: 200 };
    },

    addRequestInterceptor(
      interceptor: (config: RequestConfig) => RequestConfig,
    ): void {
      interceptors.push(interceptor);
    },
  };
}

// ─── Exercice 1 bis : parseRateLimitHeader ──────────────────────────────────

// JS-REPETITION: match_all

function parseRateLimitHeader(header: string): Record<string, number> {
  const result: Record<string, number> = {};
  const regex = /([a-zA-Z_][\w-]*)=(\d+)/g;

  for (const match of header.matchAll(regex)) {
    const [, key, value] = match;
    result[key] = Number(value);
  }

  return result;
}

// ─── Exercice 2 : retryWithBackoff ──────────────────────────────────────────

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  _baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Dans un vrai scenario : await new Promise(r => setTimeout(r, baseDelay * 2 ** attempt));
        // Pour les tests, on utilise baseDelay = 0
        if (_baseDelay > 0) {
          await new Promise((r) =>
            setTimeout(r, _baseDelay * Math.pow(2, attempt)),
          );
        }
      }
    }
  }

  throw lastError!;
}

// ─── Exercice 3 : createTokenManager ────────────────────────────────────────

function createTokenManager(
  initialToken: string,
  initialExpiresAt: number,
  refreshFn: () => Promise<{ token: string; expiresAt: number }>,
): TokenManager {
  let currentToken = initialToken;
  let expiresAt = initialExpiresAt;
  let refreshPromise: Promise<string> | null = null;

  return {
    getToken(): string {
      return currentToken;
    },

    isExpired(): boolean {
      return Date.now() >= expiresAt;
    },

    async refresh(): Promise<string> {
      if (refreshPromise) {
        return refreshPromise;
      }

      refreshPromise = refreshFn()
        .then((result) => {
          currentToken = result.token;
          expiresAt = result.expiresAt;
          return currentToken;
        })
        .finally(() => {
          refreshPromise = null;
        });

      return refreshPromise;
    },
  };
}

// ─── Exercice 4 : createAbortableRequest ────────────────────────────────────

function createAbortableRequest<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): { promise: Promise<T>; abort: () => void } {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout>;

  const promise = new Promise<T>((resolve, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("Timeout"));
    }, timeoutMs);

    controller.signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      // Le reject sera gere par le catch ci-dessous si c'est un abort manuel
    });

    fn(controller.signal)
      .then((result) => {
        clearTimeout(timeoutId);
        if (!controller.signal.aborted) {
          resolve(result);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (controller.signal.aborted) {
          // Deja rejete par timeout ou abort
        } else {
          reject(err);
        }
      });
  });

  // Wrap pour gerer l'abort manuel
  let manualAbort = false;
  const wrappedPromise = new Promise<T>((resolve, reject) => {
    const abortHandler = () => {
      if (!manualAbort) return;
      reject(new Error("Aborted"));
    };

    controller.signal.addEventListener("abort", abortHandler);

    promise.then(resolve).catch((err) => {
      if (manualAbort) {
        reject(new Error("Aborted"));
      } else {
        reject(err);
      }
    });
  });

  return {
    promise: wrappedPromise,
    abort: () => {
      manualAbort = true;
      controller.abort();
    },
  };
}

// ─── Exercice 5 : parseApiError ─────────────────────────────────────────────

function parseApiError(error: unknown): ApiErrorInfo {
  // Erreur reseau
  if (
    error instanceof TypeError &&
    error.message.toLowerCase().includes("network")
  ) {
    return {
      type: "network",
      status: null,
      message: "Pas de connexion internet",
      retryable: true,
    };
  }

  // AbortError
  if (error instanceof Error && error.name === "AbortError") {
    return {
      type: "timeout",
      status: null,
      message: "Requete annulee ou timeout",
      retryable: true,
    };
  }

  // Erreur HTTP (avec propriete status)
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as any).status as number;

    if (status >= 400 && status < 500) {
      const retryable = status === 408 || status === 429;
      return {
        type: "client",
        status,
        message: `Erreur HTTP ${status}`,
        retryable,
      };
    }

    if (status >= 500 && status < 600) {
      return {
        type: "server",
        status,
        message: `Erreur HTTP ${status}`,
        retryable: true,
      };
    }
  }

  // Erreur inconnue
  return {
    type: "unknown",
    status: null,
    message: error instanceof Error ? error.message : "Erreur inconnue",
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
    await new Promise((r) => setTimeout(r, 10));
    return { token: `refreshed-${callCount}`, expiresAt: Date.now() + 60000 };
  });

  const [r1, r2, r3] = await Promise.all([
    tm.refresh(),
    tm.refresh(),
    tm.refresh(),
  ]);

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
