// =============================================================================
// Lab 15 — APIs natives essentielles (Solution)
// =============================================================================
// Execution : npx tsx labs/lab-15-apis-natives/solution.ts
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
  assertLength,
  assertGreaterThan,
  assertApprox,
  assertContains,
} from '../test-utils.ts';

const { test, run } = createTestRunner('Lab 15 — APIs natives essentielles (Solution)');

// =============================================================================
// Types
// =============================================================================

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface PermissionState {
  status: PermissionStatus;
  canAskAgain: boolean;
}

interface PermissionManager {
  request: (name: string) => PermissionState;
  check: (name: string) => PermissionState;
  isGranted: (name: string) => boolean;
  getAll: () => Record<string, PermissionState>;
}

interface FileEntry {
  name: string;
  content: string;
  size: number;
  createdAt: number;
}

interface FileManager {
  write: (path: string, content: string) => void;
  read: (path: string) => string;
  delete: (path: string) => boolean;
  exists: (path: string) => boolean;
  listDir: (dirPath: string) => string[];
}

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  sizeKB: number;
  uri: string;
}

interface CompressedMetadata extends ImageMetadata {
  originalWidth: number;
  originalHeight: number;
  originalSizeKB: number;
  compressionRatio: number;
}

interface GeoPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface LocationTracker {
  addPoint: (lat: number, lng: number) => void;
  getPoints: () => GeoPoint[];
  getDistance: () => number;
  getDuration: () => number;
  getAverageSpeed: () => number;
}

type ShareContentType = 'text' | 'url' | 'image' | 'file';

interface SharePayload {
  type: ShareContentType;
  title: string;
  message?: string;
  url?: string;
  mimeType?: string;
}

interface ShareIntent {
  type: ShareContentType;
  title: string;
  message?: string;
  url?: string;
  mimeType?: string;
  platforms: {
    ios: Record<string, unknown>;
    android: Record<string, unknown>;
  };
}

// =============================================================================
// Exercice 1 : createPermissionManager
// =============================================================================

function createPermissionManager(permissions: string[]): PermissionManager {
  const states = new Map<string, PermissionState>();

  for (const p of permissions) {
    states.set(p, { status: 'undetermined', canAskAgain: true });
  }

  function ensureExists(name: string): PermissionState {
    const state = states.get(name);
    if (!state) throw new Error(`Unknown permission: ${name}`);
    return state;
  }

  return {
    request(name: string): PermissionState {
      const state = ensureExists(name);

      if (state.status === 'undetermined') {
        state.status = 'granted';
      } else if (state.status === 'denied' && state.canAskAgain) {
        state.status = 'granted';
      }
      // 'granted' ou 'denied' sans canAskAgain : pas de changement

      return { ...state };
    },

    check(name: string): PermissionState {
      const state = ensureExists(name);
      return { ...state };
    },

    isGranted(name: string): boolean {
      const state = states.get(name);
      return state?.status === 'granted';
    },

    getAll(): Record<string, PermissionState> {
      const result: Record<string, PermissionState> = {};
      for (const [key, value] of states) {
        result[key] = { ...value };
      }
      return result;
    },
  };
}

// =============================================================================
// Exercice 2 : createFileManager
// =============================================================================

function createFileManager(): FileManager {
  const files = new Map<string, string>();

  return {
    write(path: string, content: string): void {
      files.set(path, content);
    },

    read(path: string): string {
      const content = files.get(path);
      if (content === undefined) {
        throw new Error(`File not found: ${path}`);
      }
      return content;
    },

    delete(path: string): boolean {
      return files.delete(path);
    },

    exists(path: string): boolean {
      return files.has(path);
    },

    listDir(dirPath: string): string[] {
      const prefix = dirPath + '/';
      const result: string[] = [];

      for (const path of files.keys()) {
        if (path.startsWith(prefix)) {
          const rest = path.slice(prefix.length);
          // Seulement les fichiers directs (pas de '/' dans le reste)
          if (!rest.includes('/')) {
            result.push(rest);
          }
        }
      }

      return result;
    },
  };
}

// =============================================================================
// Exercice 3 : compressImageMetadata
// =============================================================================

function compressImageMetadata(
  metadata: ImageMetadata,
  quality: number,
): CompressedMetadata {
  const newWidth = Math.floor(metadata.width * quality);
  const newHeight = Math.floor(metadata.height * quality);
  const newSizeKB = Math.round(metadata.sizeKB * quality * quality * 100) / 100;
  const compressionRatio = Math.round((metadata.sizeKB / newSizeKB) * 100) / 100;

  return {
    width: newWidth,
    height: newHeight,
    format: metadata.format,
    sizeKB: newSizeKB,
    uri: metadata.uri,
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    originalSizeKB: metadata.sizeKB,
    compressionRatio,
  };
}

// =============================================================================
// Exercice 4 : createLocationTracker
// =============================================================================

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createLocationTracker(): LocationTracker {
  const points: GeoPoint[] = [];

  return {
    addPoint(lat: number, lng: number): void {
      points.push({ latitude: lat, longitude: lng, timestamp: Date.now() });
    },

    getPoints(): GeoPoint[] {
      return [...points];
    },

    getDistance(): number {
      if (points.length < 2) return 0;

      let total = 0;
      for (let i = 1; i < points.length; i++) {
        total += haversineDistance(
          points[i - 1].latitude,
          points[i - 1].longitude,
          points[i].latitude,
          points[i].longitude,
        );
      }
      return total;
    },

    getDuration(): number {
      if (points.length < 2) return 0;
      return points[points.length - 1].timestamp - points[0].timestamp;
    },

    getAverageSpeed(): number {
      if (points.length < 2) return 0;
      const duration = points[points.length - 1].timestamp - points[0].timestamp;
      if (duration === 0) return 0;
      const distance = this.getDistance();
      return distance / (duration / 1000); // m/s
    },
  };
}

// =============================================================================
// Exercice 5 : createShareIntent
// =============================================================================

function createShareIntent(content: {
  type: ShareContentType;
  title: string;
  message?: string;
  url?: string;
  mimeType?: string;
}): ShareIntent {
  // iOS payload
  const ios: Record<string, unknown> = {
    title: content.title,
  };
  if (content.message !== undefined) {
    ios.message = content.message;
  }
  if (content.url !== undefined) {
    ios.url = content.url;
  }

  // Android payload
  const android: Record<string, unknown> = {
    title: content.title,
  };

  switch (content.type) {
    case 'url': {
      const msg = content.message
        ? `${content.message}\n${content.url}`
        : content.url;
      android.message = msg;
      break;
    }
    case 'text': {
      if (content.message !== undefined) {
        android.message = content.message;
      }
      break;
    }
    case 'image':
    case 'file': {
      if (content.message !== undefined) {
        android.message = content.message;
      }
      android.mimeType = content.mimeType ?? 'application/octet-stream';
      break;
    }
  }

  return {
    type: content.type,
    title: content.title,
    message: content.message,
    url: content.url,
    mimeType: content.mimeType,
    platforms: { ios, android },
  };
}

// =============================================================================
// Tests
// =============================================================================

// --- Exercice 1 : createPermissionManager ---

test('Ex1: permissions commencent a undetermined', () => {
  const pm = createPermissionManager(['camera', 'location', 'photos']);
  const state = pm.check('camera');
  assertEqual(state.status, 'undetermined');
  assertTrue(state.canAskAgain);
});

test('Ex1: request passe de undetermined a granted', () => {
  const pm = createPermissionManager(['camera']);
  const state = pm.request('camera');
  assertEqual(state.status, 'granted');
  assertTrue(pm.isGranted('camera'));
});

test('Ex1: request sur permission inexistante leve une erreur', () => {
  const pm = createPermissionManager(['camera']);
  assertThrows(() => pm.request('bluetooth'));
});

test('Ex1: check sur permission inexistante leve une erreur', () => {
  const pm = createPermissionManager(['camera']);
  assertThrows(() => pm.check('bluetooth'));
});

test('Ex1: getAll retourne toutes les permissions', () => {
  const pm = createPermissionManager(['camera', 'location']);
  pm.request('camera');
  const all = pm.getAll();
  assertEqual(all['camera'].status, 'granted');
  assertEqual(all['location'].status, 'undetermined');
});

// --- Exercice 2 : createFileManager ---

test('Ex2: write et read fonctionnent', () => {
  const fm = createFileManager();
  fm.write('documents/notes.txt', 'Hello World');
  assertEqual(fm.read('documents/notes.txt'), 'Hello World');
});

test('Ex2: read leve une erreur si fichier inexistant', () => {
  const fm = createFileManager();
  assertThrows(() => fm.read('nonexistent.txt'));
});

test('Ex2: exists retourne true/false correctement', () => {
  const fm = createFileManager();
  assertFalse(fm.exists('test.txt'));
  fm.write('test.txt', 'data');
  assertTrue(fm.exists('test.txt'));
});

test('Ex2: delete supprime un fichier', () => {
  const fm = createFileManager();
  fm.write('temp.txt', 'temporary');
  assertTrue(fm.delete('temp.txt'));
  assertFalse(fm.exists('temp.txt'));
  assertFalse(fm.delete('temp.txt'));
});

test('Ex2: listDir retourne les fichiers du repertoire', () => {
  const fm = createFileManager();
  fm.write('docs/a.txt', 'A');
  fm.write('docs/b.txt', 'B');
  fm.write('docs/sub/c.txt', 'C');
  fm.write('other/d.txt', 'D');

  const files = fm.listDir('docs');
  assertLength(files, 2);
  assertTrue(files.includes('a.txt'));
  assertTrue(files.includes('b.txt'));
});

// --- Exercice 3 : compressImageMetadata ---

test('Ex3: compression a quality 0.5', () => {
  const meta: ImageMetadata = {
    width: 1000, height: 800, format: 'jpeg', sizeKB: 500, uri: 'photo.jpg',
  };
  const result = compressImageMetadata(meta, 0.5);
  assertEqual(result.width, 500);
  assertEqual(result.height, 400);
  assertEqual(result.sizeKB, 125);
  assertEqual(result.originalWidth, 1000);
  assertEqual(result.originalHeight, 800);
  assertEqual(result.originalSizeKB, 500);
  assertEqual(result.format, 'jpeg');
  assertEqual(result.uri, 'photo.jpg');
});

test('Ex3: compression ratio est correct', () => {
  const meta: ImageMetadata = {
    width: 2000, height: 1500, format: 'png', sizeKB: 1200, uri: 'image.png',
  };
  const result = compressImageMetadata(meta, 0.7);
  assertEqual(result.sizeKB, 588);
  assertApprox(result.compressionRatio, 2.04, 0.01);
});

test('Ex3: quality 1.0 ne change pas les dimensions', () => {
  const meta: ImageMetadata = {
    width: 800, height: 600, format: 'jpeg', sizeKB: 300, uri: 'pic.jpg',
  };
  const result = compressImageMetadata(meta, 1.0);
  assertEqual(result.width, 800);
  assertEqual(result.height, 600);
  assertEqual(result.sizeKB, 300);
  assertApprox(result.compressionRatio, 1.0, 0.01);
});

// --- Exercice 4 : createLocationTracker ---

test('Ex4: addPoint et getPoints', () => {
  const tracker = createLocationTracker();
  tracker.addPoint(48.8566, 2.3522);
  tracker.addPoint(48.8584, 2.2945);

  const points = tracker.getPoints();
  assertLength(points, 2);
  assertApprox(points[0].latitude, 48.8566, 0.001);
});

test('Ex4: getDistance calcule la distance Haversine', () => {
  const tracker = createLocationTracker();
  tracker.addPoint(48.8566, 2.3522);
  tracker.addPoint(48.8584, 2.2945);

  const distance = tracker.getDistance();
  assertGreaterThan(distance, 3500);
  assertTrue(distance < 5000);
});

test('Ex4: getDistance retourne 0 avec un seul point', () => {
  const tracker = createLocationTracker();
  tracker.addPoint(48.8566, 2.3522);
  assertEqual(tracker.getDistance(), 0);
});

test('Ex4: getDuration retourne la duree entre premier et dernier point', () => {
  const tracker = createLocationTracker();
  tracker.addPoint(48.8566, 2.3522);

  const tracker2 = createLocationTracker();
  assertEqual(tracker2.getDuration(), 0);
});

test('Ex4: getAverageSpeed retourne 0 si pas assez de points', () => {
  const tracker = createLocationTracker();
  assertEqual(tracker.getAverageSpeed(), 0);
  tracker.addPoint(48.8566, 2.3522);
  assertEqual(tracker.getAverageSpeed(), 0);
});

// --- Exercice 5 : createShareIntent ---

test('Ex5: share text basique', () => {
  const intent = createShareIntent({
    type: 'text',
    title: 'Partager',
    message: 'Bonjour le monde',
  });
  assertEqual(intent.type, 'text');
  assertEqual(intent.title, 'Partager');
  assertEqual(intent.platforms.ios.title, 'Partager');
  assertEqual(intent.platforms.ios.message, 'Bonjour le monde');
  assertEqual(intent.platforms.android.title, 'Partager');
  assertEqual(intent.platforms.android.message, 'Bonjour le monde');
});

test('Ex5: share url combine message et url sur Android', () => {
  const intent = createShareIntent({
    type: 'url',
    title: 'Lien',
    message: 'Regardez ca',
    url: 'https://example.com',
  });
  assertEqual(intent.platforms.ios.url, 'https://example.com');
  assertEqual(intent.platforms.android.message, 'Regardez ca\nhttps://example.com');
});

test('Ex5: share url sans message sur Android', () => {
  const intent = createShareIntent({
    type: 'url',
    title: 'Lien',
    url: 'https://example.com',
  });
  assertEqual(intent.platforms.android.message, 'https://example.com');
});

test('Ex5: share image inclut mimeType sur Android', () => {
  const intent = createShareIntent({
    type: 'image',
    title: 'Photo',
    message: 'Ma photo',
    mimeType: 'image/jpeg',
  });
  assertEqual(intent.platforms.android.mimeType, 'image/jpeg');
});

test('Ex5: share file sans mimeType utilise le defaut', () => {
  const intent = createShareIntent({
    type: 'file',
    title: 'Document',
    message: 'Fichier important',
  });
  assertEqual(intent.platforms.android.mimeType, 'application/octet-stream');
});

// =============================================================================
// Lancement
// =============================================================================

run();
