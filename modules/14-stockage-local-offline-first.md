# Module 14 — Stockage local et architecture offline-first

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 4/5        | 75 min        | [Lab 14](../labs/lab-14-stockage-offline/) | [Quiz 14](../quizzes/quiz-14-offline.html) |

## Objectifs

- Comprendre les solutions de stockage local disponibles dans l'ecosysteme React Native
- Utiliser AsyncStorage pour des donnees simples et connaitre ses limites
- Adopter MMKV pour un stockage cle-valeur haute performance avec chiffrement
- Integrer expo-sqlite pour les donnees relationnelles avec migrations
- Concevoir une architecture offline-first avec queue de synchronisation
- Implementer des strategies de resolution de conflits
- Detecter l'etat reseau et synchroniser en arriere-plan

---

## Panorama du stockage local

### Pourquoi stocker localement ?

Une application mobile performante doit fonctionner meme sans connexion. Le stockage local permet :

1. **Performance** : les donnees locales s'affichent instantanement, pas de latence reseau
2. **Fiabilite** : l'application reste fonctionnelle en mode avion, dans un tunnel, en zone blanche
3. **UX fluide** : l'utilisateur ne voit jamais de spinner de chargement pour les donnees deja consultees
4. **Economie de bande passante** : on ne retelecharge pas les donnees deja presentes

### Les solutions principales

| Solution | Type | Performance | Capacite | Chiffrement | Cas d'usage |
|----------|------|-------------|----------|-------------|-------------|
| AsyncStorage | Cle-valeur async | Lente | ~6 MB (Android) | Non | Preferences simples |
| MMKV | Cle-valeur sync | Tres rapide | Illimitee | Oui | Tokens, settings, cache |
| expo-sqlite | Relationnel | Rapide | Illimitee | Via extension | Donnees structurees |
| expo-file-system | Fichiers | Variable | Illimitee | Non | Images, documents |

---

## AsyncStorage : les bases

### Qu'est-ce que AsyncStorage ?

AsyncStorage est le stockage cle-valeur le plus simple de l'ecosysteme React Native. C'est l'equivalent de `localStorage` dans un navigateur, mais **asynchrone**.

> **Note historique** : AsyncStorage etait inclus dans React Native core jusqu'en 2019. Il a ete extrait dans `@react-native-async-storage/async-storage` et est desormais un package communautaire.

### Installation

```bash
npx expo install @react-native-async-storage/async-storage
```

### API de base

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// Stocker une valeur (toujours une string)
await AsyncStorage.setItem('username', 'marie');

// Lire une valeur
const username = await AsyncStorage.getItem('username');
// username: 'marie' | null

// Supprimer une valeur
await AsyncStorage.removeItem('username');

// Stocker un objet (serialisation manuelle)
const user = { id: 1, name: 'Marie', role: 'admin' };
await AsyncStorage.setItem('user', JSON.stringify(user));

// Relire un objet
const raw = await AsyncStorage.getItem('user');
const parsed = raw ? JSON.parse(raw) : null;
```

### Operations par lot

```tsx
// Ecrire plusieurs cles en une seule operation
await AsyncStorage.multiSet([
  ['theme', 'dark'],
  ['language', 'fr'],
  ['onboarded', 'true'],
]);

// Lire plusieurs cles
const values = await AsyncStorage.multiGet(['theme', 'language', 'onboarded']);
// values: [['theme', 'dark'], ['language', 'fr'], ['onboarded', 'true']]

// Supprimer plusieurs cles
await AsyncStorage.multiRemove(['theme', 'language']);

// Lister toutes les cles
const allKeys = await AsyncStorage.getAllKeys();

// Tout supprimer (attention !)
await AsyncStorage.clear();
```

### Hook personnalise pour AsyncStorage

```tsx
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function useAsyncStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(key).then((raw) => {
      if (raw !== null) {
        setValue(JSON.parse(raw));
      }
      setLoading(false);
    });
  }, [key]);

  const update = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      const resolved =
        typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(value)
          : newValue;
      setValue(resolved);
      await AsyncStorage.setItem(key, JSON.stringify(resolved));
    },
    [key, value],
  );

  const remove = useCallback(async () => {
    setValue(initialValue);
    await AsyncStorage.removeItem(key);
  }, [key, initialValue]);

  return { value, update, remove, loading } as const;
}
```

### Limites critiques d'AsyncStorage

| Limite | Detail |
|--------|--------|
| **6 MB sur Android** | La base SQLite sous-jacente est limitee par defaut a 6 MB |
| **Pas de chiffrement** | Les donnees sont stockees en clair sur le disque |
| **Tout est string** | Serialisation/deserialisation manuelle obligatoire |
| **Asynchrone uniquement** | Chaque lecture passe par le bridge (latence) |
| **Pas de requetes** | Impossible de filtrer, trier ou paginer |
| **Pas de schema** | Aucune validation de structure |

> **Verdict** : AsyncStorage convient pour des preferences simples (theme, langue, onboarding flag). Pour tout le reste, preferez MMKV ou SQLite.

---

## MMKV : stockage haute performance

### Pourquoi MMKV ?

MMKV (Memory-Mapped Key-Value) est une bibliotheque de stockage cle-valeur developpee par WeChat (Tencent). Elle est **10 a 30 fois plus rapide** qu'AsyncStorage grace au memory-mapping.

| Caracteristique | AsyncStorage | MMKV |
|----------------|--------------|------|
| Lecture 1000 items | ~600 ms | ~20 ms |
| Ecriture 1000 items | ~800 ms | ~15 ms |
| API | Asynchrone | **Synchrone** |
| Chiffrement | Non | **AES-256** |
| Multi-process | Non | **Oui** |
| Taille max | ~6 MB | **Illimitee** |

### Installation

```bash
npx expo install react-native-mmkv
```

> **New Architecture** : `react-native-mmkv` v3+ utilise JSI (JavaScript Interface) pour communiquer directement avec le code natif, sans passer par le bridge. C'est ce qui explique ses performances exceptionnelles et son API synchrone.

### Utilisation de base

```tsx
import { MMKV } from 'react-native-mmkv';

// Creer une instance (par defaut : non chiffree)
const storage = new MMKV();

// Stocker des valeurs (synchrone !)
storage.set('username', 'marie');
storage.set('age', 28);
storage.set('premium', true);
storage.set('preferences', JSON.stringify({ theme: 'dark', lang: 'fr' }));

// Lire des valeurs (synchrone !)
const username = storage.getString('username'); // 'marie'
const age = storage.getNumber('age');           // 28
const premium = storage.getBoolean('premium');  // true
const prefs = JSON.parse(storage.getString('preferences') ?? '{}');

// Verifier l'existence
if (storage.contains('username')) {
  console.log('Utilisateur connecte');
}

// Supprimer
storage.delete('username');

// Tout lister
const allKeys = storage.getAllKeys(); // ['age', 'premium', 'preferences']

// Tout supprimer
storage.clearAll();
```

### Instances chiffrees

```tsx
// Instance chiffree avec une cle AES-256
const secureStorage = new MMKV({
  id: 'secure-storage',
  encryptionKey: 'my-secret-encryption-key-32chars!',
});

secureStorage.set('authToken', 'eyJhbGciOiJIUzI1NiIsInR...');
secureStorage.set('refreshToken', 'dGhpcyBpcyBhIHJlZnJlc2...');

// Les donnees sont chiffrees sur le disque
const token = secureStorage.getString('authToken');
```

### Instances multiples (multi-tenant)

```tsx
// Chaque instance a son propre fichier de stockage
const userStorage = new MMKV({ id: 'user-data' });
const cacheStorage = new MMKV({ id: 'cache' });
const analyticsStorage = new MMKV({ id: 'analytics' });

// Utile pour separer les donnees par concern
userStorage.set('profile', JSON.stringify(profile));
cacheStorage.set('api-response-/users', JSON.stringify(response));
```

### Integration avec Zustand

L'un des avantages majeurs de MMKV est son integration native avec Zustand pour la persistance d'etat :

```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV({ id: 'app-store' });

// Adaptateur MMKV pour Zustand
const mmkvStorage = {
  getItem: (name: string) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkv.set(name, value);
  },
  removeItem: (name: string) => {
    mmkv.delete(name);
  },
};

// Store Zustand persiste avec MMKV
interface SettingsState {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: string) => void;
  toggleNotifications: () => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'fr',
      notifications: true,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleNotifications: () =>
        set((state) => ({ notifications: !state.notifications })),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
```

### Hook useMMKVStorage

```tsx
import { useMMKVString, useMMKVNumber, useMMKVBoolean } from 'react-native-mmkv';

function SettingsScreen() {
  // Hooks reactifs : le composant re-render quand la valeur change
  const [theme, setTheme] = useMMKVString('theme');
  const [fontSize, setFontSize] = useMMKVNumber('fontSize');
  const [darkMode, setDarkMode] = useMMKVBoolean('darkMode');

  return (
    <View>
      <Switch
        value={darkMode}
        onValueChange={setDarkMode}
      />
      <Slider
        value={fontSize ?? 16}
        onValueChange={setFontSize}
        minimumValue={12}
        maximumValue={24}
      />
    </View>
  );
}
```

---

## expo-sqlite : donnees relationnelles

### Quand utiliser SQLite ?

SQLite convient quand les donnees sont **structurees** et necessitent des **requetes complexes** :

- Listes d'articles avec filtrage, tri et pagination
- Historique de transactions
- Donnees relationnelles (utilisateurs, commandes, produits)
- Cache de reponses API avec expiration
- File d'attente d'operations offline

### Installation

```bash
npx expo install expo-sqlite
```

### Utilisation de base

```tsx
import * as SQLite from 'expo-sqlite';

// Ouvrir (ou creer) une base de donnees
const db = await SQLite.openDatabaseAsync('myapp.db');

// Creer une table
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Inserer une ligne
await db.runAsync(
  'INSERT INTO todos (title) VALUES (?)',
  'Acheter du pain',
);

// Inserer avec parametres nommes
await db.runAsync(
  'INSERT INTO todos (title, completed) VALUES ($title, $completed)',
  { $title: 'Faire les courses', $completed: 0 },
);

// Lire toutes les lignes
const todos = await db.getAllAsync<{
  id: number;
  title: string;
  completed: number;
  created_at: string;
}>('SELECT * FROM todos ORDER BY created_at DESC');

// Lire une seule ligne
const todo = await db.getFirstAsync<{
  id: number;
  title: string;
  completed: number;
}>('SELECT * FROM todos WHERE id = ?', 42);

// Mettre a jour
await db.runAsync(
  'UPDATE todos SET completed = 1, updated_at = datetime(\'now\') WHERE id = ?',
  42,
);

// Supprimer
await db.runAsync('DELETE FROM todos WHERE id = ?', 42);
```

### Transactions

```tsx
// Les transactions garantissent l'atomicite
await db.withTransactionAsync(async () => {
  await db.runAsync(
    'INSERT INTO orders (user_id, total) VALUES (?, ?)',
    userId, total,
  );

  for (const item of cartItems) {
    await db.runAsync(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      orderId, item.productId, item.quantity, item.price,
    );
  }

  await db.runAsync(
    'UPDATE products SET stock = stock - ? WHERE id = ?',
    item.quantity, item.productId,
  );
});
// Si une erreur survient, tout est annule (rollback)
```

### Systeme de migrations

Les migrations permettent de faire evoluer le schema de la base sans perdre de donnees :

```tsx
interface Migration {
  version: number;
  up: string;   // SQL pour appliquer la migration
  down: string;  // SQL pour annuler la migration
}

const migrations: Migration[] = [
  {
    version: 1,
    up: `
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `,
    down: 'DROP TABLE IF EXISTS todos;',
  },
  {
    version: 2,
    up: `
      ALTER TABLE todos ADD COLUMN priority INTEGER DEFAULT 0;
      ALTER TABLE todos ADD COLUMN due_date TEXT;
    `,
    down: `
      -- SQLite ne supporte pas DROP COLUMN avant 3.35.0
      -- On recree la table sans les colonnes
      CREATE TABLE todos_backup AS SELECT id, title, completed, created_at FROM todos;
      DROP TABLE todos;
      ALTER TABLE todos_backup RENAME TO todos;
    `,
  },
  {
    version: 3,
    up: `
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );
      ALTER TABLE todos ADD COLUMN category_id INTEGER REFERENCES categories(id);
      CREATE INDEX idx_todos_category ON todos(category_id);
    `,
    down: `
      DROP INDEX IF EXISTS idx_todos_category;
      CREATE TABLE todos_backup AS
        SELECT id, title, completed, created_at, priority, due_date FROM todos;
      DROP TABLE todos;
      ALTER TABLE todos_backup RENAME TO todos;
      DROP TABLE IF EXISTS categories;
    `,
  },
];

async function runMigrations(db: SQLite.SQLiteDatabase) {
  // Table de suivi des migrations
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_version',
  );
  const currentVersion = row?.version ?? 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(migration.up);
        await db.runAsync(
          'INSERT INTO schema_version (version) VALUES (?)',
          migration.version,
        );
      });
      console.log(`Migration v${migration.version} appliquee`);
    }
  }
}
```

### Repository pattern avec SQLite

```tsx
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: number;
  createdAt: string;
}

class TodoRepository {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getAll(filter?: { completed?: boolean; priority?: number }): Promise<Todo[]> {
    let query = 'SELECT * FROM todos WHERE 1=1';
    const params: unknown[] = [];

    if (filter?.completed !== undefined) {
      query += ' AND completed = ?';
      params.push(filter.completed ? 1 : 0);
    }
    if (filter?.priority !== undefined) {
      query += ' AND priority = ?';
      params.push(filter.priority);
    }

    query += ' ORDER BY created_at DESC';

    const rows = await this.db.getAllAsync<{
      id: number;
      title: string;
      completed: number;
      priority: number;
      created_at: string;
    }>(query, ...params);

    return rows.map(this.mapRow);
  }

  async getById(id: number): Promise<Todo | null> {
    const row = await this.db.getFirstAsync<{
      id: number;
      title: string;
      completed: number;
      priority: number;
      created_at: string;
    }>('SELECT * FROM todos WHERE id = ?', id);

    return row ? this.mapRow(row) : null;
  }

  async create(title: string, priority = 0): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO todos (title, priority) VALUES (?, ?)',
      title, priority,
    );
    return result.lastInsertRowId;
  }

  async update(id: number, changes: Partial<Pick<Todo, 'title' | 'completed' | 'priority'>>) {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (changes.title !== undefined) {
      sets.push('title = ?');
      params.push(changes.title);
    }
    if (changes.completed !== undefined) {
      sets.push('completed = ?');
      params.push(changes.completed ? 1 : 0);
    }
    if (changes.priority !== undefined) {
      sets.push('priority = ?');
      params.push(changes.priority);
    }

    if (sets.length === 0) return;

    sets.push("updated_at = datetime('now')");
    params.push(id);

    await this.db.runAsync(
      `UPDATE todos SET ${sets.join(', ')} WHERE id = ?`,
      ...params,
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM todos WHERE id = ?', id);
  }

  private mapRow(row: {
    id: number;
    title: string;
    completed: number;
    priority: number;
    created_at: string;
  }): Todo {
    return {
      id: row.id,
      title: row.title,
      completed: row.completed === 1,
      priority: row.priority,
      createdAt: row.created_at,
    };
  }
}
```

---

## Architecture offline-first

### Le principe

Dans une architecture offline-first, l'application fonctionne **d'abord localement** et synchronise avec le serveur quand la connexion est disponible :

```
Utilisateur -> Ecriture locale -> Affichage immediat
                    |
                    v
              Queue de sync
                    |
            (quand en ligne)
                    v
              Envoi au serveur
                    |
                    v
          Confirmation / Conflit
```

### Queue de synchronisation

Le coeur de l'architecture offline-first est la **queue de synchronisation** : une file d'attente qui stocke les operations effectuees hors ligne pour les rejouer quand la connexion revient.

```tsx
interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

class SyncQueue {
  private queue: SyncOperation[] = [];
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  async init() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        entity TEXT NOT NULL,
        payload TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        status TEXT DEFAULT 'pending'
      );
    `);
    await this.loadFromDB();
  }

  async enqueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) {
    const op: SyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(op);
    await this.db.runAsync(
      `INSERT INTO sync_queue (id, type, entity, payload, timestamp, max_retries)
       VALUES (?, ?, ?, ?, ?, ?)`,
      op.id, op.type, op.entity, JSON.stringify(op.payload), op.timestamp, op.maxRetries,
    );

    return op.id;
  }

  async dequeue(): Promise<SyncOperation | null> {
    const op = this.queue.find((o) => o.status === 'pending');
    if (!op) return null;

    op.status = 'syncing';
    await this.db.runAsync(
      'UPDATE sync_queue SET status = ? WHERE id = ?',
      'syncing', op.id,
    );

    return op;
  }

  async markSynced(id: string) {
    this.queue = this.queue.filter((o) => o.id !== id);
    await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
  }

  async markFailed(id: string) {
    const op = this.queue.find((o) => o.id === id);
    if (!op) return;

    op.retryCount++;
    if (op.retryCount >= op.maxRetries) {
      op.status = 'failed';
    } else {
      op.status = 'pending';
    }

    await this.db.runAsync(
      'UPDATE sync_queue SET status = ?, retry_count = ? WHERE id = ?',
      op.status, op.retryCount, op.id,
    );
  }

  getPendingCount(): number {
    return this.queue.filter((o) => o.status === 'pending').length;
  }

  getFailedOperations(): SyncOperation[] {
    return this.queue.filter((o) => o.status === 'failed');
  }

  private async loadFromDB() {
    const rows = await this.db.getAllAsync<{
      id: string;
      type: string;
      entity: string;
      payload: string;
      timestamp: number;
      retry_count: number;
      max_retries: number;
      status: string;
    }>('SELECT * FROM sync_queue ORDER BY timestamp ASC');

    this.queue = rows.map((row) => ({
      id: row.id,
      type: row.type as SyncOperation['type'],
      entity: row.entity,
      payload: JSON.parse(row.payload),
      timestamp: row.timestamp,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      status: row.status as SyncOperation['status'],
    }));
  }
}
```

### Sync Manager complet

```tsx
import NetInfo from '@react-native-community/netinfo';

class SyncManager {
  private syncQueue: SyncQueue;
  private isSyncing = false;
  private unsubscribeNetInfo: (() => void) | null = null;

  constructor(
    private db: SQLite.SQLiteDatabase,
    private apiClient: ApiClient,
  ) {
    this.syncQueue = new SyncQueue(db);
  }

  async init() {
    await this.syncQueue.init();

    // Ecouter les changements de connectivite
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isSyncing) {
        this.syncAll();
      }
    });
  }

  async addOperation(
    type: SyncOperation['type'],
    entity: string,
    payload: Record<string, unknown>,
  ) {
    await this.syncQueue.enqueue({ type, entity, payload, maxRetries: 3 });

    // Tenter la sync immediatement
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      this.syncAll();
    }
  }

  async syncAll() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      let operation = await this.syncQueue.dequeue();

      while (operation) {
        try {
          await this.executeOperation(operation);
          await this.syncQueue.markSynced(operation.id);
        } catch (error) {
          await this.syncQueue.markFailed(operation.id);
        }

        operation = await this.syncQueue.dequeue();
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async executeOperation(op: SyncOperation) {
    switch (op.type) {
      case 'CREATE':
        await this.apiClient.post(`/${op.entity}`, op.payload);
        break;
      case 'UPDATE':
        await this.apiClient.put(`/${op.entity}/${op.payload.id}`, op.payload);
        break;
      case 'DELETE':
        await this.apiClient.delete(`/${op.entity}/${op.payload.id}`);
        break;
    }
  }

  getStatus() {
    return {
      pendingCount: this.syncQueue.getPendingCount(),
      failedOperations: this.syncQueue.getFailedOperations(),
      isSyncing: this.isSyncing,
    };
  }

  destroy() {
    this.unsubscribeNetInfo?.();
  }
}
```

### Utilisation dans un composant

```tsx
function TodoScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const syncManager = useSyncManager();

  const addTodo = async (title: string) => {
    // 1. Ecrire localement (affichage immediat)
    const tempId = crypto.randomUUID();
    const newTodo: Todo = {
      id: tempId,
      title,
      completed: false,
      priority: 0,
      createdAt: new Date().toISOString(),
      _syncStatus: 'pending', // Indicateur visuel
    };

    setTodos((prev) => [newTodo, ...prev]);
    await todoRepo.createLocal(newTodo);

    // 2. Ajouter a la queue de sync
    await syncManager.addOperation('CREATE', 'todos', {
      tempId,
      title,
      completed: false,
    });
  };

  const toggleTodo = async (id: string) => {
    // 1. Modifier localement
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, _syncStatus: 'pending' } : t,
      ),
    );

    const todo = todos.find((t) => t.id === id);
    if (todo) {
      await todoRepo.updateLocal(id, { completed: !todo.completed });
      await syncManager.addOperation('UPDATE', 'todos', {
        id,
        completed: !todo.completed,
      });
    }
  };

  return (
    <FlatList
      data={todos}
      renderItem={({ item }) => (
        <TodoItem
          todo={item}
          onToggle={() => toggleTodo(item.id)}
          syncStatus={item._syncStatus}
        />
      )}
    />
  );
}
```

---

## Resolution de conflits

### Le probleme

Quand deux appareils (ou un appareil et le serveur) modifient la meme donnee en meme temps, il y a un **conflit**. Trois strategies principales existent :

### 1. Last-Write-Wins (LWW)

La strategie la plus simple : le dernier a ecrire ecrase les autres.

```tsx
interface VersionedRecord {
  id: string;
  data: Record<string, unknown>;
  updatedAt: number; // timestamp
  version: number;   // compteur de version
}

function resolveLastWriteWins(
  local: VersionedRecord,
  remote: VersionedRecord,
): VersionedRecord {
  // Le plus recent gagne
  if (local.updatedAt > remote.updatedAt) {
    return { ...local, version: Math.max(local.version, remote.version) + 1 };
  }
  return { ...remote, version: Math.max(local.version, remote.version) + 1 };
}
```

**Avantage** : Simple, deterministe, pas d'intervention utilisateur.
**Inconvenient** : Perte de donnees possible (les modifications du perdant sont ecrasees).

### 2. Merge automatique (champ par champ)

On fusionne les modifications champ par champ en gardant la version la plus recente de chaque champ.

```tsx
interface FieldTimestamp {
  [field: string]: number; // timestamp de derniere modification par champ
}

interface MergeableRecord {
  id: string;
  data: Record<string, unknown>;
  fieldTimestamps: FieldTimestamp;
  version: number;
}

function resolveFieldMerge(
  local: MergeableRecord,
  remote: MergeableRecord,
): MergeableRecord {
  const merged: Record<string, unknown> = {};
  const mergedTimestamps: FieldTimestamp = {};

  // Union de tous les champs
  const allFields = new Set([
    ...Object.keys(local.data),
    ...Object.keys(remote.data),
  ]);

  for (const field of allFields) {
    const localTs = local.fieldTimestamps[field] ?? 0;
    const remoteTs = remote.fieldTimestamps[field] ?? 0;

    if (localTs >= remoteTs) {
      merged[field] = local.data[field];
      mergedTimestamps[field] = localTs;
    } else {
      merged[field] = remote.data[field];
      mergedTimestamps[field] = remoteTs;
    }
  }

  return {
    id: local.id,
    data: merged,
    fieldTimestamps: mergedTimestamps,
    version: Math.max(local.version, remote.version) + 1,
  };
}
```

**Avantage** : Preserve le maximum de modifications des deux cotes.
**Inconvenient** : Peut creer des etats incoherents si les champs sont interdependants.

### 3. Resolution manuelle

On presente les deux versions a l'utilisateur qui choisit.

```tsx
interface ConflictResolution<T> {
  localVersion: T;
  remoteVersion: T;
  status: 'pending' | 'resolved';
  chosenVersion?: 'local' | 'remote' | 'merged';
  mergedResult?: T;
}

function ConflictModal<T extends Record<string, unknown>>({
  conflict,
  onResolve,
}: {
  conflict: ConflictResolution<T>;
  onResolve: (resolution: ConflictResolution<T>) => void;
}) {
  return (
    <Modal visible transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Conflit detecte</Text>
          <Text style={styles.subtitle}>
            Cet element a ete modifie ailleurs. Quelle version garder ?
          </Text>

          <View style={styles.comparison}>
            <View style={styles.version}>
              <Text style={styles.versionLabel}>Votre version</Text>
              {Object.entries(conflict.localVersion).map(([key, value]) => (
                <Text key={key}>{key}: {String(value)}</Text>
              ))}
            </View>

            <View style={styles.version}>
              <Text style={styles.versionLabel}>Version serveur</Text>
              {Object.entries(conflict.remoteVersion).map(([key, value]) => (
                <Text key={key}>{key}: {String(value)}</Text>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() =>
                onResolve({ ...conflict, status: 'resolved', chosenVersion: 'local' })
              }
            >
              <Text>Garder la mienne</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                onResolve({ ...conflict, status: 'resolved', chosenVersion: 'remote' })
              }
            >
              <Text>Garder le serveur</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

### Quand utiliser quelle strategie ?

| Strategie | Cas d'usage |
|-----------|------------|
| Last-Write-Wins | Preferences, settings, donnees non critiques |
| Merge champ par champ | Formulaires complexes, profils utilisateur |
| Resolution manuelle | Donnees critiques (documents, transactions) |

---

## Detection reseau : NetInfo

### Installation

```bash
npx expo install @react-native-community/netinfo
```

### Utilisation de base

```tsx
import NetInfo from '@react-native-community/netinfo';

// Etat actuel du reseau
const state = await NetInfo.fetch();
console.log('Connecte ?', state.isConnected);
console.log('Type :', state.type); // 'wifi' | 'cellular' | 'none' | ...
console.log('Details :', state.details);

// Ecouter les changements
const unsubscribe = NetInfo.addEventListener((state) => {
  console.log('Connexion changee :', state.isConnected, state.type);

  if (state.isConnected) {
    // Lancer la synchronisation
    syncManager.syncAll();
  }
});

// Se desabonner
unsubscribe();
```

### Hook useNetworkStatus

```tsx
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
}

function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      });
    });

    return unsubscribe;
  }, []);

  return status;
}
```

### Banniere de connexion

```tsx
function OfflineBanner() {
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>
        Mode hors ligne — Les modifications seront synchronisees a la reconnexion
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ff9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
```

---

## Synchronisation en arriere-plan

### expo-background-fetch

`expo-background-fetch` permet d'executer du code periodiquement en arriere-plan, meme quand l'application est fermee.

```bash
npx expo install expo-background-fetch expo-task-manager
```

### Configuration

```tsx
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_SYNC_TASK = 'background-sync-task';

// 1. Definir la tache (doit etre au top level, hors composant)
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Executer la synchronisation
    const syncQueue = new SyncQueue(db);
    await syncQueue.init();

    const pendingCount = syncQueue.getPendingCount();
    if (pendingCount === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const syncManager = new SyncManager(db, apiClient);
    await syncManager.syncAll();

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 2. Enregistrer la tache au demarrage de l'app
async function registerBackgroundSync() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);

  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes minimum
      stopOnTerminate: false,   // Continuer apres fermeture (Android)
      startOnBoot: true,        // Demarrer au boot (Android)
    });
  }
}
```

### Limites de la sync en arriere-plan

| Plateforme | Limite |
|------------|--------|
| iOS | L'OS decide quand executer la tache (apprentissage des habitudes utilisateur). Minimum ~15 min. |
| Android | Egalement soumis aux optimisations batterie. Peut etre restreint par les modes economie d'energie. |
| Les deux | Pas de garantie d'execution exacte. La tache peut etre retardee ou annulee. |

> **Important** : La synchronisation en arriere-plan est un complement, pas une garantie. La sync au premier plan (quand l'app est ouverte et en ligne) reste la strategie principale.

---

## Cache LRU pour les donnees API

### Principe du cache LRU

Un cache **LRU (Least Recently Used)** garde les N elements les plus recemment utilises. Quand le cache est plein, l'element le moins recemment utilise est evince.

```tsx
class LRUCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Verifier l'expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Remettre en tete (Map preserve l'ordre d'insertion)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    // Supprimer si deja present (pour le remettre en tete)
    this.cache.delete(key);

    // Evincer le plus ancien si necessaire
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? this.defaultTTL),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
```

### Utilisation avec une couche API

```tsx
const apiCache = new LRUCache<unknown>(200, 10 * 60 * 1000); // 200 entries, 10 min TTL

async function cachedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const cacheKey = `${options?.method ?? 'GET'}:${url}`;

  // 1. Verifier le cache
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return cached as T;
  }

  // 2. Requete reseau
  const response = await fetch(url, options);
  const data = await response.json();

  // 3. Mettre en cache (seulement les GET)
  if (!options?.method || options.method === 'GET') {
    apiCache.set(cacheKey, data);
  }

  return data as T;
}
```

---

## Exemple complet : application Todo offline-first

### Architecture

```
App
 |-- TodoScreen (liste + ajout)
 |-- SyncStatusBar (indicateur visuel)
 |-- OfflineBanner (banniere hors ligne)
 |
 |-- TodoRepository (SQLite local)
 |-- SyncQueue (queue d'operations)
 |-- SyncManager (orchestrateur)
 |-- useNetworkStatus (hook)
```

### Le store Zustand offline-aware

```tsx
import { create } from 'zustand';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  syncStatus: 'synced' | 'pending' | 'failed';
  updatedAt: number;
}

interface TodoStore {
  todos: Todo[];
  pendingSyncCount: number;
  isOnline: boolean;

  addTodo: (title: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  setOnline: (online: boolean) => void;
  markSynced: (id: string) => void;
  loadFromDB: () => Promise<void>;
}

const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  pendingSyncCount: 0,
  isOnline: true,

  addTodo: (title) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      syncStatus: 'pending',
      updatedAt: Date.now(),
    };

    set((state) => ({
      todos: [newTodo, ...state.todos],
      pendingSyncCount: state.pendingSyncCount + 1,
    }));

    // Sauvegarder en local + ajouter a la queue
    todoRepo.createLocal(newTodo);
    syncManager.addOperation('CREATE', 'todos', newTodo);
  },

  toggleTodo: (id) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, syncStatus: 'pending', updatedAt: Date.now() }
          : t,
      ),
      pendingSyncCount: state.pendingSyncCount + 1,
    }));

    const todo = get().todos.find((t) => t.id === id);
    if (todo) {
      todoRepo.updateLocal(id, { completed: todo.completed });
      syncManager.addOperation('UPDATE', 'todos', { id, completed: todo.completed });
    }
  },

  deleteTodo: (id) => {
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
      pendingSyncCount: state.pendingSyncCount + 1,
    }));

    todoRepo.deleteLocal(id);
    syncManager.addOperation('DELETE', 'todos', { id });
  },

  setOnline: (online) => set({ isOnline: online }),

  markSynced: (id) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, syncStatus: 'synced' } : t,
      ),
      pendingSyncCount: Math.max(0, state.pendingSyncCount - 1),
    }));
  },

  loadFromDB: async () => {
    const todos = await todoRepo.getAll();
    set({ todos });
  },
}));
```

### Indicateur de statut de synchronisation

```tsx
function SyncStatusIndicator() {
  const pendingCount = useTodoStore((s) => s.pendingSyncCount);
  const isOnline = useTodoStore((s) => s.isOnline);

  if (pendingCount === 0 && isOnline) {
    return (
      <View style={[styles.indicator, styles.synced]}>
        <Text style={styles.text}>Synchronise</Text>
      </View>
    );
  }

  if (!isOnline) {
    return (
      <View style={[styles.indicator, styles.offline]}>
        <Text style={styles.text}>Hors ligne ({pendingCount} en attente)</Text>
      </View>
    );
  }

  return (
    <View style={[styles.indicator, styles.syncing]}>
      <ActivityIndicator size="small" color="#fff" />
      <Text style={styles.text}>Synchronisation... ({pendingCount})</Text>
    </View>
  );
}
```

---

## Bonnes pratiques

### Performance

1. **MMKV pour les donnees simples** : tokens, preferences, flags — acces synchrone sans latence
2. **SQLite pour les donnees structurees** : utilisez des index sur les colonnes de filtre/tri
3. **Cache LRU en memoire** : evitez les lectures SQLite repetees pour les memes donnees
4. **Batch les operations** : groupez les ecritures dans des transactions SQLite

### Securite

1. **Chiffrez les donnees sensibles** : tokens, infos personnelles via MMKV chiffre
2. **Ne stockez jamais de mots de passe** en clair — utilisez `expo-secure-store` pour les credentials
3. **Nettoyez au logout** : supprimez toutes les donnees locales quand l'utilisateur se deconnecte

### Offline-first

1. **Ecrivez localement d'abord** : l'affichage est immediat, la sync est secondaire
2. **Gerez les conflits explicitement** : ne les ignorez pas, choisissez une strategie
3. **Montrez l'etat de sync** : l'utilisateur doit savoir ce qui est synchronise ou non
4. **Limitez la taille de la queue** : purgez les operations trop anciennes
5. **Testez en mode avion** : c'est le seul moyen de valider le comportement offline

---

## Recapitulatif

| Concept | Outil | Quand l'utiliser |
|---------|-------|-----------------|
| Cle-valeur simple | AsyncStorage | Prototypage, preferences basiques |
| Cle-valeur performant | MMKV | Tokens, settings, cache rapide |
| Donnees relationnelles | expo-sqlite | Listes, historiques, requetes complexes |
| Persistance Zustand | MMKV + persist middleware | Etat applicatif persiste |
| Queue de sync | SQLite + SyncQueue | Operations offline |
| Detection reseau | NetInfo | Adapter le comportement en/hors ligne |
| Sync arriere-plan | expo-background-fetch | Sync periodique meme app fermee |
| Resolution conflits | LWW / Merge / Manuel | Selon la criticite des donnees |

---

## Exercice pratique

Rendez-vous au [Lab 14](../labs/lab-14-stockage-offline/) pour implementer une queue offline, un sync manager, un resolveur de conflits, un systeme de migrations et un cache LRU en pur TypeScript.
