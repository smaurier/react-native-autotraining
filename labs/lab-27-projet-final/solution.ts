import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertGreaterThan,
  assertLessThan,
  assertLength,
  assertNotNull,
  assertContains,
  assertArrayContains,
} from '../test-utils.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeoLocation {
  latitude: number;
  longitude: number;
  label?: string;
}

interface Attachment {
  id: string;
  type: 'image' | 'file';
  uri: string;
  size: number;
  createdAt: number;
}

interface Collaborator {
  userId: string;
  email: string;
  permission: 'read' | 'write' | 'admin';
  addedAt: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  authorId: string;
  collaborators: Collaborator[];
  location?: GeoLocation;
  attachments: Attachment[];
  isEncrypted: boolean;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  syncVersion: number;
  deletedAt?: number;
}

interface DateRange {
  start: number;
  end: number;
}

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityId: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  errors: string[];
}

interface SyncEngine {
  enqueue: (op: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>) => void;
  push: () => Promise<SyncOperation[]>;
  pull: (remoteNotes: Note[]) => Note[];
  resolveConflicts: (local: Note, remote: Note) => Note;
  getStatus: () => SyncStatus;
  setOnline: (online: boolean) => void;
}

interface Permission {
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
  canDelete: boolean;
}

interface CollaborationManager {
  invite: (noteId: string, email: string, permission: 'read' | 'write' | 'admin') => void;
  accept: (noteId: string, userId: string, email: string) => void;
  revoke: (noteId: string, userId: string) => void;
  getPermissions: (noteId: string, userId: string) => Permission;
  getCollaborators: (noteId: string) => Collaborator[];
}

interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface NoteQueue {
  enqueue: (noteId: string, action: string, payload: unknown) => string;
  process: (processor: (item: QueueItem) => Promise<boolean>) => Promise<number>;
  retry: (itemId: string) => boolean;
  getStats: () => QueueStats;
  clear: () => void;
}

interface QueueItem {
  id: string;
  noteId: string;
  action: string;
  payload: unknown;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  createdAt: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
}

interface NoteCache {
  get: (id: string) => Note | undefined;
  set: (id: string, note: Note) => void;
  preload: (notes: Note[]) => void;
  evict: (id: string) => boolean;
  getHitRate: () => number;
  getStats: () => CacheStats;
  clear: () => void;
}

interface AppNotification {
  id: string;
  type: 'note_shared' | 'note_updated' | 'note_comment' | 'reminder';
  title: string;
  body: string;
  noteId?: string;
  isRead: boolean;
  scheduledAt?: number;
  receivedAt: number;
}

interface NotificationDispatcher {
  schedule: (type: AppNotification['type'], title: string, body: string, noteId?: string, delay?: number) => string;
  handleReceived: (id: string) => AppNotification | undefined;
  getUnread: () => AppNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  getAll: () => AppNotification[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _idCounter = 0;
function generateId(): string {
  return `id-${++_idCounter}-${Date.now()}`;
}

function createTestNote(overrides: Partial<Note> = {}): Note {
  return {
    id: generateId(),
    title: 'Note de test',
    content: 'Contenu de test',
    tags: [],
    authorId: 'author-1',
    collaborators: [],
    attachments: [],
    isEncrypted: false,
    isArchived: false,
    isPinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    syncVersion: 0,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 1 : Modele de note — CRUD operations
// ═══════════════════════════════════════════════════════════════════════════════

function createNote(input: {
  title: string;
  content: string;
  tags?: string[];
  authorId: string;
  location?: GeoLocation;
}): Note {
  const now = Date.now();
  return {
    id: generateId(),
    title: input.title,
    content: input.content,
    tags: input.tags ?? [],
    authorId: input.authorId,
    collaborators: [],
    location: input.location,
    attachments: [],
    isEncrypted: false,
    isArchived: false,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
    syncVersion: 0,
  };
}

function updateNote(
  notes: Note[],
  noteId: string,
  updates: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'isPinned' | 'location'>>
): Note | null {
  const note = notes.find(n => n.id === noteId);
  if (!note) return null;

  if (updates.title !== undefined) note.title = updates.title;
  if (updates.content !== undefined) note.content = updates.content;
  if (updates.tags !== undefined) note.tags = updates.tags;
  if (updates.isPinned !== undefined) note.isPinned = updates.isPinned;
  if (updates.location !== undefined) note.location = updates.location;
  note.updatedAt = Date.now();
  note.syncVersion += 1;

  return note;
}

function deleteNote(notes: Note[], noteId: string): Note | null {
  const note = notes.find(n => n.id === noteId);
  if (!note) return null;

  note.deletedAt = Date.now();
  note.updatedAt = Date.now();
  note.syncVersion += 1;

  return note;
}

function archiveNote(notes: Note[], noteId: string): Note | null {
  const note = notes.find(n => n.id === noteId);
  if (!note) return null;

  note.isArchived = !note.isArchived;
  note.updatedAt = Date.now();
  note.syncVersion += 1;

  return note;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 2 : Systeme de tags
// ═══════════════════════════════════════════════════════════════════════════════

function addTag(notes: Note[], noteId: string, tag: string): Note | null {
  const note = notes.find(n => n.id === noteId);
  if (!note) return null;

  const tagLower = tag.toLowerCase();
  const exists = note.tags.some(t => t.toLowerCase() === tagLower);
  if (!exists) {
    note.tags.push(tag);
    note.updatedAt = Date.now();
  }

  return note;
}

function removeTag(notes: Note[], noteId: string, tag: string): Note | null {
  const note = notes.find(n => n.id === noteId);
  if (!note) return null;

  const tagLower = tag.toLowerCase();
  note.tags = note.tags.filter(t => t.toLowerCase() !== tagLower);
  note.updatedAt = Date.now();

  return note;
}

function filterByTags(notes: Note[], tags: string[]): Note[] {
  const tagsLower = tags.map(t => t.toLowerCase());
  return notes.filter(note => {
    if (note.deletedAt) return false;
    const noteTags = note.tags.map(t => t.toLowerCase());
    return tagsLower.every(tag => noteTags.includes(tag));
  });
}

function getPopularTags(notes: Note[], limit: number): { tag: string; count: number }[] {
  const tagCounts = new Map<string, number>();

  for (const note of notes) {
    if (note.deletedAt) continue;
    for (const tag of note.tags) {
      const lower = tag.toLowerCase();
      tagCounts.set(lower, (tagCounts.get(lower) ?? 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 3 : Recherche
// ═══════════════════════════════════════════════════════════════════════════════

function fullTextSearch(notes: Note[], query: string): Note[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return notes
    .filter(n => !n.deletedAt)
    .map(note => {
      const titleLower = note.title.toLowerCase();
      const contentLower = note.content.toLowerCase();
      const tagsLower = note.tags.map(t => t.toLowerCase());
      const locationLabel = (note.location?.label ?? '').toLowerCase();

      let score = 0;
      let allMatch = true;

      for (const term of terms) {
        const matchTitle = titleLower.includes(term);
        const matchTags = tagsLower.some(t => t.includes(term));
        const matchContent = contentLower.includes(term) || locationLabel.includes(term);

        if (!matchTitle && !matchTags && !matchContent) {
          allMatch = false;
          break;
        }

        if (matchTitle) score += 3;
        if (matchTags) score += 2;
        if (matchContent) score += 1;
      }

      return { note, score, allMatch };
    })
    .filter(({ allMatch }) => allMatch)
    .sort((a, b) => b.score - a.score)
    .map(({ note }) => note);
}

function searchByDate(notes: Note[], range: DateRange): Note[] {
  return notes.filter(note => {
    if (note.deletedAt) return false;
    return note.createdAt >= range.start && note.createdAt <= range.end;
  });
}

function searchByLocation(
  notes: Note[],
  center: { latitude: number; longitude: number },
  radiusKm: number
): Note[] {
  function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return notes.filter(note => {
    if (note.deletedAt) return false;
    if (!note.location) return false;
    const dist = haversineDistance(
      center.latitude, center.longitude,
      note.location.latitude, note.location.longitude
    );
    return dist <= radiusKm;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 4 : Sync engine
// ═══════════════════════════════════════════════════════════════════════════════

function createSyncEngine(localNotes: Note[]): SyncEngine {
  const queue: SyncOperation[] = [];
  let notes = [...localNotes];
  let isOnline = true;

  function resolveConflicts(local: Note, remote: Note): Note {
    if (remote.syncVersion > local.syncVersion) return remote;
    if (local.syncVersion > remote.syncVersion) return local;
    // Meme syncVersion → LWW (remote gagne en cas d'egalite)
    return remote.updatedAt >= local.updatedAt ? remote : local;
  }

  return {
    enqueue(op) {
      queue.push({
        ...op,
        id: generateId(),
        timestamp: Date.now(),
        retryCount: 0,
      });
    },

    async push() {
      if (!isOnline) return [];
      const ops = queue.splice(0, queue.length);
      return ops;
    },

    pull(remoteNotes: Note[]) {
      const noteMap = new Map<string, Note>();

      // D'abord les notes locales
      for (const note of notes) {
        noteMap.set(note.id, note);
      }

      // Fusionner avec les notes distantes
      for (const remote of remoteNotes) {
        const local = noteMap.get(remote.id);
        if (!local) {
          noteMap.set(remote.id, remote);
        } else {
          noteMap.set(remote.id, resolveConflicts(local, remote));
        }
      }

      notes = Array.from(noteMap.values());
      return notes;
    },

    resolveConflicts,

    getStatus() {
      return {
        isOnline,
        isSyncing: false,
        pendingCount: queue.length,
        lastSyncAt: null,
        errors: [],
      };
    },

    setOnline(online: boolean) {
      isOnline = online;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 5 : Chiffrement (implementation simplifiee)
// ═══════════════════════════════════════════════════════════════════════════════

function encrypt(plaintext: string, key: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < plaintext.length; i++) {
    const charCode = plaintext.charCodeAt(i);
    const keyCode = key.charCodeAt(i % key.length);
    bytes.push(charCode ^ keyCode);
  }
  // Encode as base64 using Buffer (available in Node/tsx)
  const buffer = Buffer.from(bytes);
  return buffer.toString('base64');
}

function decrypt(ciphertext: string, key: string): string {
  const buffer = Buffer.from(ciphertext, 'base64');
  const chars: string[] = [];
  for (let i = 0; i < buffer.length; i++) {
    const keyCode = key.charCodeAt(i % key.length);
    chars.push(String.fromCharCode(buffer[i] ^ keyCode));
  }
  return chars.join('');
}

function generateKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function hashPassword(password: string, salt: string): string {
  const input = password + salt;
  // Simple hash: multiple passes of char code accumulation
  let h1 = 0x811c9dc5; // FNV offset basis
  let h2 = 0x01000193; // FNV prime

  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = h1 ^ c;
    h1 = (h1 * 0x01000193) & 0xffffffff;
    h2 = h2 ^ c;
    h2 = (h2 * 0x811c9dc5) & 0xffffffff;
  }

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return hex1 + hex2;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 6 : Collaboration manager
// ═══════════════════════════════════════════════════════════════════════════════

function createCollaborationManager(notes: Note[]): CollaborationManager {
  // Work on the notes array directly (mutable reference)
  const noteMap = new Map<string, Note>();
  for (const note of notes) {
    noteMap.set(note.id, note);
  }

  return {
    invite(noteId: string, email: string, permission: 'read' | 'write' | 'admin') {
      const note = noteMap.get(noteId);
      if (!note) throw new Error('Note introuvable');

      const emailLower = email.toLowerCase();
      const exists = note.collaborators.some(
        c => c.email.toLowerCase() === emailLower
      );
      if (exists) throw new Error('Collaborateur deja present');

      note.collaborators.push({
        userId: '',
        email,
        permission,
        addedAt: Date.now(),
      });
    },

    accept(noteId: string, userId: string, email: string) {
      const note = noteMap.get(noteId);
      if (!note) throw new Error('Note introuvable');

      const emailLower = email.toLowerCase();
      const collab = note.collaborators.find(
        c => c.email.toLowerCase() === emailLower
      );
      if (!collab) throw new Error('Collaborateur introuvable');

      collab.userId = userId;
    },

    revoke(noteId: string, userId: string) {
      const note = noteMap.get(noteId);
      if (!note) throw new Error('Note introuvable');

      note.collaborators = note.collaborators.filter(
        c => c.userId !== userId
      );
    },

    getPermissions(noteId: string, userId: string): Permission {
      const note = noteMap.get(noteId);
      if (!note) return { canRead: false, canWrite: false, canAdmin: false, canDelete: false };

      // L'auteur a toutes les permissions
      if (note.authorId === userId) {
        return { canRead: true, canWrite: true, canAdmin: true, canDelete: true };
      }

      const collab = note.collaborators.find(c => c.userId === userId);
      if (!collab) {
        return { canRead: false, canWrite: false, canAdmin: false, canDelete: false };
      }

      switch (collab.permission) {
        case 'admin':
          return { canRead: true, canWrite: true, canAdmin: true, canDelete: true };
        case 'write':
          return { canRead: true, canWrite: true, canAdmin: false, canDelete: false };
        case 'read':
          return { canRead: true, canWrite: false, canAdmin: false, canDelete: false };
        default:
          return { canRead: false, canWrite: false, canAdmin: false, canDelete: false };
      }
    },

    getCollaborators(noteId: string): Collaborator[] {
      const note = noteMap.get(noteId);
      if (!note) return [];
      return note.collaborators;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 7 : Offline queue
// ═══════════════════════════════════════════════════════════════════════════════

function createNoteQueue(): NoteQueue {
  const items: QueueItem[] = [];

  return {
    enqueue(noteId: string, action: string, payload: unknown): string {
      const id = generateId();
      items.push({
        id,
        noteId,
        action,
        payload,
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
      });
      return id;
    },

    async process(processor: (item: QueueItem) => Promise<boolean>): Promise<number> {
      let successCount = 0;

      for (const item of items) {
        if (item.status !== 'pending') continue;

        item.status = 'processing';
        try {
          const success = await processor(item);
          if (success) {
            item.status = 'completed';
            successCount++;
          } else {
            item.status = 'failed';
            item.retryCount++;
          }
        } catch {
          item.status = 'failed';
          item.retryCount++;
        }
      }

      return successCount;
    },

    retry(itemId: string): boolean {
      const item = items.find(i => i.id === itemId);
      if (!item || item.status !== 'failed') return false;
      item.status = 'pending';
      return true;
    },

    getStats(): QueueStats {
      const stats: QueueStats = {
        total: items.length,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };

      for (const item of items) {
        switch (item.status) {
          case 'pending': stats.pending++; break;
          case 'processing': stats.processing++; break;
          case 'completed': stats.completed++; break;
          case 'failed': stats.failed++; break;
        }
      }

      return stats;
    },

    clear() {
      items.length = 0;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 8 : Cache de notes (LRU)
// ═══════════════════════════════════════════════════════════════════════════════

function createNoteCache(maxSize: number): NoteCache {
  const cache = new Map<string, Note>();
  let hits = 0;
  let misses = 0;

  return {
    get(id: string): Note | undefined {
      const note = cache.get(id);
      if (note !== undefined) {
        hits++;
        // Move to end (most recent)
        cache.delete(id);
        cache.set(id, note);
        return note;
      }
      misses++;
      return undefined;
    },

    set(id: string, note: Note) {
      if (cache.has(id)) {
        cache.delete(id);
      } else if (cache.size >= maxSize) {
        // Evict least recently used (first key)
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }
      cache.set(id, note);
    },

    preload(notes: Note[]) {
      for (const note of notes) {
        this.set(note.id, note);
      }
    },

    evict(id: string): boolean {
      return cache.delete(id);
    },

    getHitRate(): number {
      const total = hits + misses;
      return total === 0 ? 0 : hits / total;
    },

    getStats(): CacheStats {
      return {
        size: cache.size,
        maxSize,
        hitRate: this.getHitRate(),
      };
    },

    clear() {
      cache.clear();
      hits = 0;
      misses = 0;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 9 : Notification dispatcher
// ═══════════════════════════════════════════════════════════════════════════════

function createNotificationDispatcher(): NotificationDispatcher {
  const notifications: AppNotification[] = [];

  return {
    schedule(
      type: AppNotification['type'],
      title: string,
      body: string,
      noteId?: string,
      delay?: number
    ): string {
      const id = generateId();
      const now = Date.now();

      const notification: AppNotification = {
        id,
        type,
        title,
        body,
        noteId,
        isRead: false,
        receivedAt: delay ? 0 : now,
        scheduledAt: delay ? now + delay : undefined,
      };

      notifications.push(notification);
      return id;
    },

    handleReceived(id: string): AppNotification | undefined {
      const notification = notifications.find(n => n.id === id);
      if (!notification) return undefined;
      notification.receivedAt = Date.now();
      return notification;
    },

    getUnread(): AppNotification[] {
      return notifications.filter(n => !n.isRead && n.receivedAt > 0);
    },

    markRead(id: string) {
      const notification = notifications.find(n => n.id === id);
      if (notification) {
        notification.isRead = true;
      }
    },

    markAllRead() {
      for (const notification of notifications) {
        notification.isRead = true;
      }
    },

    getAll(): AppNotification[] {
      return [...notifications];
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

const runner = createTestRunner('Lab 27 — Projet final NomadNote');

// ─── Tests Exercice 1 : CRUD ─────────────────────────────────────────────────

runner.test('createNote genere un id et les timestamps', () => {
  const before = Date.now();
  const note = createNote({
    title: 'Ma premiere note',
    content: 'Contenu initial',
    authorId: 'user-1',
  });
  const after = Date.now();

  assertTrue(note.id.length > 0, 'id ne doit pas etre vide');
  assertEqual(note.title, 'Ma premiere note');
  assertEqual(note.content, 'Contenu initial');
  assertEqual(note.authorId, 'user-1');
  assertDeepEqual(note.tags, []);
  assertDeepEqual(note.collaborators, []);
  assertDeepEqual(note.attachments, []);
  assertFalse(note.isEncrypted);
  assertFalse(note.isArchived);
  assertFalse(note.isPinned);
  assertEqual(note.syncVersion, 0);
  assertTrue(note.createdAt >= before && note.createdAt <= after);
  assertTrue(note.updatedAt >= before && note.updatedAt <= after);
});

runner.test('createNote avec tags et location', () => {
  const note = createNote({
    title: 'Note geolocalisee',
    content: 'Au cafe',
    authorId: 'user-1',
    tags: ['voyage', 'cafe'],
    location: { latitude: 48.8566, longitude: 2.3522, label: 'Paris' },
  });
  assertDeepEqual(note.tags, ['voyage', 'cafe']);
  assertNotNull(note.location);
  assertEqual(note.location!.label, 'Paris');
});

runner.test('updateNote met a jour les champs et incremente syncVersion', () => {
  const notes = [createTestNote({ id: 'n1', title: 'Ancien titre', syncVersion: 2 })];
  const updated = updateNote(notes, 'n1', { title: 'Nouveau titre', isPinned: true });

  assertNotNull(updated);
  assertEqual(updated!.title, 'Nouveau titre');
  assertTrue(updated!.isPinned);
  assertEqual(updated!.syncVersion, 3);
  assertTrue(updated!.updatedAt >= notes[0].createdAt);
});

runner.test('updateNote retourne null pour un id inexistant', () => {
  const notes = [createTestNote({ id: 'n1' })];
  const result = updateNote(notes, 'inexistant', { title: 'Test' });
  assertEqual(result, null);
});

runner.test('deleteNote effectue un soft delete', () => {
  const notes = [createTestNote({ id: 'n1', syncVersion: 0 })];
  const deleted = deleteNote(notes, 'n1');

  assertNotNull(deleted);
  assertNotNull(deleted!.deletedAt);
  assertTrue(deleted!.deletedAt! > 0);
  assertEqual(deleted!.syncVersion, 1);
});

runner.test('archiveNote toggle le statut archive', () => {
  const notes = [createTestNote({ id: 'n1', isArchived: false })];
  const archived = archiveNote(notes, 'n1');
  assertNotNull(archived);
  assertTrue(archived!.isArchived);

  const unarchived = archiveNote(notes, 'n1');
  assertNotNull(unarchived);
  assertFalse(unarchived!.isArchived);
});

// ─── Tests Exercice 2 : Tags ─────────────────────────────────────────────────

runner.test('addTag ajoute un tag sans doublons', () => {
  const notes = [createTestNote({ id: 'n1', tags: ['existant'] })];
  const result = addTag(notes, 'n1', 'nouveau');
  assertNotNull(result);
  assertLength(result!.tags, 2);
  assertArrayContains(result!.tags, 'nouveau');

  // Doublon insensible a la casse
  const result2 = addTag(notes, 'n1', 'EXISTANT');
  assertNotNull(result2);
  assertLength(result2!.tags, 2); // pas de doublon
});

runner.test('removeTag supprime un tag (insensible a la casse)', () => {
  const notes = [createTestNote({ id: 'n1', tags: ['React', 'Native', 'Mobile'] })];
  const result = removeTag(notes, 'n1', 'native');
  assertNotNull(result);
  assertLength(result!.tags, 2);
  assertFalse(result!.tags.some(t => t.toLowerCase() === 'native'));
});

runner.test('filterByTags filtre avec logique AND', () => {
  const notes = [
    createTestNote({ id: 'n1', tags: ['react', 'native', 'mobile'] }),
    createTestNote({ id: 'n2', tags: ['react', 'web'] }),
    createTestNote({ id: 'n3', tags: ['react', 'native'], deletedAt: Date.now() }),
  ];
  const result = filterByTags(notes, ['react', 'native']);
  assertLength(result, 1);
  assertEqual(result[0].id, 'n1');
});

runner.test('getPopularTags retourne les tags les plus frequents', () => {
  const notes = [
    createTestNote({ tags: ['react', 'native'] }),
    createTestNote({ tags: ['react', 'web'] }),
    createTestNote({ tags: ['react', 'mobile', 'native'] }),
    createTestNote({ tags: ['vue'], deletedAt: Date.now() }), // exclue
  ];
  const popular = getPopularTags(notes, 2);
  assertLength(popular, 2);
  assertEqual(popular[0].tag, 'react');
  assertEqual(popular[0].count, 3);
  assertEqual(popular[1].tag, 'native');
  assertEqual(popular[1].count, 2);
});

// ─── Tests Exercice 3 : Recherche ───────────────────────────────────────────

runner.test('fullTextSearch recherche dans titre, contenu et tags', () => {
  const notes = [
    createTestNote({ id: 'n1', title: 'React Native Guide', content: 'Introduction', tags: ['dev'] }),
    createTestNote({ id: 'n2', title: 'Recettes', content: 'Poulet roti', tags: ['cuisine'] }),
    createTestNote({ id: 'n3', title: 'Meeting', content: 'React team sync', tags: ['work'] }),
    createTestNote({ id: 'n4', title: 'Supprimee', content: 'React test', deletedAt: Date.now() }),
  ];
  const results = fullTextSearch(notes, 'react');
  assertLength(results, 2);
  // n1 devrait etre premier (match titre = score 3 vs score 1 pour n3)
  assertEqual(results[0].id, 'n1');
});

runner.test('fullTextSearch multi-termes (AND logic)', () => {
  const notes = [
    createTestNote({ id: 'n1', title: 'React Native', content: 'Guide complet mobile' }),
    createTestNote({ id: 'n2', title: 'React Web', content: 'Guide web' }),
  ];
  const results = fullTextSearch(notes, 'react mobile');
  assertLength(results, 1);
  assertEqual(results[0].id, 'n1');
});

runner.test('searchByDate filtre par plage de dates', () => {
  const now = Date.now();
  const notes = [
    createTestNote({ id: 'n1', createdAt: now - 86400000 }), // hier
    createTestNote({ id: 'n2', createdAt: now }),              // maintenant
    createTestNote({ id: 'n3', createdAt: now - 172800000 }), // avant-hier
    createTestNote({ id: 'n4', createdAt: now, deletedAt: now }), // supprimee
  ];
  const results = searchByDate(notes, { start: now - 90000000, end: now });
  assertLength(results, 2);
});

runner.test('searchByLocation filtre par proximite', () => {
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  const notes = [
    createTestNote({ id: 'n1', location: { latitude: 48.8606, longitude: 2.3376, label: 'Louvre' } }), // ~1km
    createTestNote({ id: 'n2', location: { latitude: 48.8584, longitude: 2.2945, label: 'Tour Eiffel' } }), // ~4km
    createTestNote({ id: 'n3', location: { latitude: 43.2965, longitude: 5.3698, label: 'Marseille' } }), // ~660km
    createTestNote({ id: 'n4' }), // pas de location
  ];
  const nearby = searchByLocation(notes, paris, 5);
  assertLength(nearby, 2); // Louvre et Tour Eiffel
});

// ─── Tests Exercice 4 : Sync engine ─────────────────────────────────────────

runner.test('createSyncEngine enqueue et push des operations', async () => {
  const engine = createSyncEngine([]);
  engine.setOnline(true);

  engine.enqueue({ type: 'create', entityId: 'n1', payload: { title: 'Test' } });
  engine.enqueue({ type: 'update', entityId: 'n2', payload: { title: 'Modif' } });

  let status = engine.getStatus();
  assertEqual(status.pendingCount, 2);

  const pushed = await engine.push();
  assertLength(pushed, 2);

  status = engine.getStatus();
  assertEqual(status.pendingCount, 0);
});

runner.test('push retourne vide si offline', async () => {
  const engine = createSyncEngine([]);
  engine.setOnline(false);

  engine.enqueue({ type: 'create', entityId: 'n1', payload: {} });
  const pushed = await engine.push();
  assertLength(pushed, 0);

  const status = engine.getStatus();
  assertEqual(status.pendingCount, 1);
});

runner.test('pull fusionne les notes distantes', () => {
  const local = [
    createTestNote({ id: 'n1', title: 'Local', syncVersion: 1 }),
  ];
  const engine = createSyncEngine(local);

  const remote = [
    createTestNote({ id: 'n1', title: 'Remote', syncVersion: 2 }),
    createTestNote({ id: 'n2', title: 'Nouvelle', syncVersion: 1 }),
  ];
  const merged = engine.pull(remote);

  assertLength(merged, 2);
  const n1 = merged.find(n => n.id === 'n1');
  assertNotNull(n1);
  assertEqual(n1!.title, 'Remote'); // remote gagne (syncVersion plus elevee)
  const n2 = merged.find(n => n.id === 'n2');
  assertNotNull(n2);
  assertEqual(n2!.title, 'Nouvelle');
});

runner.test('resolveConflicts utilise syncVersion puis LWW', () => {
  const engine = createSyncEngine([]);

  // Remote syncVersion superieure → remote gagne
  const local1 = createTestNote({ id: 'c1', title: 'Local', syncVersion: 1 });
  const remote1 = createTestNote({ id: 'c1', title: 'Remote', syncVersion: 2 });
  assertEqual(engine.resolveConflicts(local1, remote1).title, 'Remote');

  // Local syncVersion superieure → local gagne
  const local2 = createTestNote({ id: 'c2', title: 'Local', syncVersion: 3 });
  const remote2 = createTestNote({ id: 'c2', title: 'Remote', syncVersion: 1 });
  assertEqual(engine.resolveConflicts(local2, remote2).title, 'Local');

  // Meme syncVersion → LWW (updatedAt plus recent gagne, remote en cas d'egalite)
  const now = Date.now();
  const local3 = createTestNote({ id: 'c3', title: 'Local', syncVersion: 1, updatedAt: now - 1000 });
  const remote3 = createTestNote({ id: 'c3', title: 'Remote', syncVersion: 1, updatedAt: now });
  assertEqual(engine.resolveConflicts(local3, remote3).title, 'Remote');
});

// ─── Tests Exercice 5 : Chiffrement ─────────────────────────────────────────

runner.test('encrypt puis decrypt retourne le texte original', () => {
  const key = 'maCleSuperSecrete123';
  const plaintext = 'Hello NomadNote!';
  const encrypted = encrypt(plaintext, key);

  assertTrue(encrypted !== plaintext, 'Le texte chiffre ne doit pas etre identique');
  assertTrue(encrypted.length > 0, 'Le texte chiffre ne doit pas etre vide');

  const decrypted = decrypt(encrypted, key);
  assertEqual(decrypted, plaintext);
});

runner.test('encrypt avec caracteres speciaux et unicode', () => {
  const key = 'cle-speciale';
  const plaintext = 'Notes avec accents: ecrire, etre, meme et des emojis!';
  const encrypted = encrypt(plaintext, key);
  const decrypted = decrypt(encrypted, key);
  assertEqual(decrypted, plaintext);
});

runner.test('generateKey genere une cle de la bonne longueur', () => {
  const key16 = generateKey(16);
  assertEqual(key16.length, 16);

  const key32 = generateKey(32);
  assertEqual(key32.length, 32);

  // Les cles doivent etre differentes
  const key1 = generateKey(32);
  const key2 = generateKey(32);
  assertTrue(key1 !== key2, 'Deux cles generees doivent etre differentes');
});

runner.test('hashPassword produit un hash hexadecimal deterministe', () => {
  const hash1 = hashPassword('monMotDePasse', 'sel123');
  const hash2 = hashPassword('monMotDePasse', 'sel123');
  assertEqual(hash1, hash2); // deterministe

  const hash3 = hashPassword('monMotDePasse', 'selDifferent');
  assertTrue(hash1 !== hash3, 'Des sels differents doivent produire des hashs differents');

  assertEqual(hash1.length, 16);
  assertTrue(/^[0-9a-f]+$/.test(hash1), 'Le hash doit etre en hexadecimal');
});

// ─── Tests Exercice 6 : Collaboration ───────────────────────────────────────

runner.test('invite ajoute un collaborateur', () => {
  const notes = [createTestNote({ id: 'n1', authorId: 'author-1' })];
  const manager = createCollaborationManager(notes);

  manager.invite('n1', 'alice@example.com', 'write');
  const collabs = manager.getCollaborators('n1');
  assertLength(collabs, 1);
  assertEqual(collabs[0].email, 'alice@example.com');
  assertEqual(collabs[0].permission, 'write');
});

runner.test('invite refuse les doublons (email insensible a la casse)', () => {
  const notes = [createTestNote({ id: 'n1', authorId: 'author-1' })];
  const manager = createCollaborationManager(notes);

  manager.invite('n1', 'alice@example.com', 'write');
  let threw = false;
  try {
    manager.invite('n1', 'ALICE@example.com', 'read');
  } catch {
    threw = true;
  }
  assertTrue(threw, 'Devrait lancer une erreur pour un email en doublon');
  assertLength(manager.getCollaborators('n1'), 1);
});

runner.test('accept met a jour le userId', () => {
  const notes = [createTestNote({ id: 'n1', authorId: 'author-1' })];
  const manager = createCollaborationManager(notes);

  manager.invite('n1', 'bob@example.com', 'read');
  manager.accept('n1', 'user-bob', 'bob@example.com');

  const collabs = manager.getCollaborators('n1');
  assertEqual(collabs[0].userId, 'user-bob');
});

runner.test('revoke supprime un collaborateur', () => {
  const notes = [createTestNote({ id: 'n1', authorId: 'author-1' })];
  const manager = createCollaborationManager(notes);

  manager.invite('n1', 'alice@example.com', 'write');
  manager.accept('n1', 'user-alice', 'alice@example.com');
  manager.revoke('n1', 'user-alice');

  assertLength(manager.getCollaborators('n1'), 0);
});

runner.test('getPermissions retourne les bonnes permissions', () => {
  const notes = [createTestNote({ id: 'n1', authorId: 'author-1' })];
  const manager = createCollaborationManager(notes);

  // Auteur a toutes les permissions
  const authorPerms = manager.getPermissions('n1', 'author-1');
  assertTrue(authorPerms.canRead);
  assertTrue(authorPerms.canWrite);
  assertTrue(authorPerms.canAdmin);
  assertTrue(authorPerms.canDelete);

  // Collaborateur read
  manager.invite('n1', 'reader@test.com', 'read');
  manager.accept('n1', 'user-reader', 'reader@test.com');
  const readerPerms = manager.getPermissions('n1', 'user-reader');
  assertTrue(readerPerms.canRead);
  assertFalse(readerPerms.canWrite);
  assertFalse(readerPerms.canAdmin);
  assertFalse(readerPerms.canDelete);

  // Collaborateur write
  manager.invite('n1', 'writer@test.com', 'write');
  manager.accept('n1', 'user-writer', 'writer@test.com');
  const writerPerms = manager.getPermissions('n1', 'user-writer');
  assertTrue(writerPerms.canRead);
  assertTrue(writerPerms.canWrite);
  assertFalse(writerPerms.canAdmin);
  assertFalse(writerPerms.canDelete);

  // Utilisateur inconnu
  const unknownPerms = manager.getPermissions('n1', 'inconnu');
  assertFalse(unknownPerms.canRead);
  assertFalse(unknownPerms.canWrite);
  assertFalse(unknownPerms.canAdmin);
  assertFalse(unknownPerms.canDelete);
});

// ─── Tests Exercice 7 : Offline queue ───────────────────────────────────────

runner.test('enqueue ajoute des elements a la file', () => {
  const queue = createNoteQueue();
  const id1 = queue.enqueue('n1', 'create', { title: 'Note 1' });
  const id2 = queue.enqueue('n2', 'update', { title: 'Modif' });

  assertTrue(id1.length > 0);
  assertTrue(id2.length > 0);
  assertTrue(id1 !== id2);

  const stats = queue.getStats();
  assertEqual(stats.total, 2);
  assertEqual(stats.pending, 2);
});

runner.test('process traite les elements pending', async () => {
  const queue = createNoteQueue();
  queue.enqueue('n1', 'create', {});
  queue.enqueue('n2', 'update', {});
  queue.enqueue('n3', 'delete', {});

  // Premier et troisieme reussissent, deuxieme echoue
  let callIndex = 0;
  const processed = await queue.process(async () => {
    callIndex++;
    return callIndex !== 2;
  });

  assertEqual(processed, 2);
  const stats = queue.getStats();
  assertEqual(stats.completed, 2);
  assertEqual(stats.failed, 1);
  assertEqual(stats.pending, 0);
});

runner.test('retry remet un element failed en pending', async () => {
  const queue = createNoteQueue();
  const id = queue.enqueue('n1', 'create', {});

  // Faire echouer
  await queue.process(async () => false);
  let stats = queue.getStats();
  assertEqual(stats.failed, 1);

  // Retry
  const retried = queue.retry(id);
  assertTrue(retried);
  stats = queue.getStats();
  assertEqual(stats.pending, 1);
  assertEqual(stats.failed, 0);
});

runner.test('clear vide la file', () => {
  const queue = createNoteQueue();
  queue.enqueue('n1', 'create', {});
  queue.enqueue('n2', 'update', {});
  queue.clear();

  const stats = queue.getStats();
  assertEqual(stats.total, 0);
  assertEqual(stats.pending, 0);
});

// ─── Tests Exercice 8 : Cache LRU ──────────────────────────────────────────

runner.test('cache set et get fonctionnent', () => {
  const cache = createNoteCache(3);
  const note = createTestNote({ id: 'n1', title: 'Cachee' });
  cache.set('n1', note);

  const retrieved = cache.get('n1');
  assertNotNull(retrieved);
  assertEqual(retrieved!.title, 'Cachee');
});

runner.test('cache evince le plus ancien element', () => {
  const cache = createNoteCache(2);
  cache.set('n1', createTestNote({ id: 'n1' }));
  cache.set('n2', createTestNote({ id: 'n2' }));
  cache.set('n3', createTestNote({ id: 'n3' })); // devrait evincer n1

  assertEqual(cache.get('n1'), undefined);
  assertNotNull(cache.get('n2'));
  assertNotNull(cache.get('n3'));
});

runner.test('cache LRU: l\'acces met a jour l\'ordre', () => {
  const cache = createNoteCache(2);
  cache.set('n1', createTestNote({ id: 'n1' }));
  cache.set('n2', createTestNote({ id: 'n2' }));

  // Acceder a n1 le rend "recent"
  cache.get('n1');

  // Ajouter n3 devrait evincer n2 (le plus ancien non accede)
  cache.set('n3', createTestNote({ id: 'n3' }));

  assertNotNull(cache.get('n1'));
  assertEqual(cache.get('n2'), undefined);
  assertNotNull(cache.get('n3'));
});

runner.test('cache preload charge plusieurs notes', () => {
  const cache = createNoteCache(5);
  const notes = [
    createTestNote({ id: 'n1' }),
    createTestNote({ id: 'n2' }),
    createTestNote({ id: 'n3' }),
  ];
  cache.preload(notes);

  assertNotNull(cache.get('n1'));
  assertNotNull(cache.get('n2'));
  assertNotNull(cache.get('n3'));
});

runner.test('cache evict supprime un element', () => {
  const cache = createNoteCache(5);
  cache.set('n1', createTestNote({ id: 'n1' }));
  assertTrue(cache.evict('n1'));
  assertEqual(cache.get('n1'), undefined);
  assertFalse(cache.evict('inexistant'));
});

runner.test('cache hitRate se calcule correctement', () => {
  const cache = createNoteCache(5);
  cache.set('n1', createTestNote({ id: 'n1' }));

  cache.get('n1');  // hit
  cache.get('n1');  // hit
  cache.get('n2');  // miss

  const hitRate = cache.getHitRate();
  // 2 hits / 3 total = 0.6666...
  assertTrue(Math.abs(hitRate - 2 / 3) < 0.01);
});

runner.test('cache getStats retourne les bonnes valeurs', () => {
  const cache = createNoteCache(10);
  cache.set('n1', createTestNote({ id: 'n1' }));
  cache.set('n2', createTestNote({ id: 'n2' }));

  const stats = cache.getStats();
  assertEqual(stats.size, 2);
  assertEqual(stats.maxSize, 10);
});

// ─── Tests Exercice 9 : Notifications ───────────────────────────────────────

runner.test('schedule cree une notification immediate', () => {
  const dispatcher = createNotificationDispatcher();
  const id = dispatcher.schedule('note_shared', 'Note partagee', 'Alice a partage une note', 'n1');

  assertTrue(id.length > 0);
  const all = dispatcher.getAll();
  assertLength(all, 1);
  assertEqual(all[0].type, 'note_shared');
  assertEqual(all[0].title, 'Note partagee');
  assertFalse(all[0].isRead);
  assertTrue(all[0].receivedAt > 0);
});

runner.test('schedule avec delay cree une notification planifiee', () => {
  const dispatcher = createNotificationDispatcher();
  const id = dispatcher.schedule('reminder', 'Rappel', 'Revoir la note', 'n1', 60000);

  const all = dispatcher.getAll();
  assertLength(all, 1);
  assertNotNull(all[0].scheduledAt);
  // Pas encore recue
  assertEqual(all[0].receivedAt, 0);

  // Les non recues ne sont pas dans getUnread
  assertLength(dispatcher.getUnread(), 0);

  // handleReceived la marque comme recue
  const received = dispatcher.handleReceived(id);
  assertNotNull(received);
  assertTrue(received!.receivedAt > 0);

  // Maintenant visible dans getUnread
  assertLength(dispatcher.getUnread(), 1);
});

runner.test('markRead et markAllRead fonctionnent', () => {
  const dispatcher = createNotificationDispatcher();
  dispatcher.schedule('note_updated', 'Mise a jour', 'Body 1', 'n1');
  dispatcher.schedule('note_comment', 'Commentaire', 'Body 2', 'n2');

  assertLength(dispatcher.getUnread(), 2);

  const all = dispatcher.getAll();
  dispatcher.markRead(all[0].id);
  assertLength(dispatcher.getUnread(), 1);

  dispatcher.markAllRead();
  assertLength(dispatcher.getUnread(), 0);
});

runner.test('handleReceived retourne undefined pour un id inexistant', () => {
  const dispatcher = createNotificationDispatcher();
  const result = dispatcher.handleReceived('fake-id');
  assertEqual(result, undefined);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Lancement
// ═══════════════════════════════════════════════════════════════════════════════

runner.run();
