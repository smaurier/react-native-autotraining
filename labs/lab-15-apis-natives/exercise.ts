// =============================================================================
// Lab 15 — APIs natives essentielles (Exercice)
// =============================================================================
// Execution : npx tsx labs/lab-15-apis-natives/exercise.ts
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

const { test, run } = createTestRunner('Lab 15 — APIs natives essentielles');

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
// Simule la gestion des permissions a la maniere d'Expo.
//
// createPermissionManager(permissions: string[]) -> PermissionManager
//
// - Toutes les permissions commencent a 'undetermined', canAskAgain: true
// - request(name) :
//   - Si 'undetermined' : passe a 'granted', canAskAgain: true
//   - Si 'granted' : ne change rien
//   - Si 'denied' et canAskAgain : passe a 'granted', canAskAgain: true
//   - Si 'denied' et !canAskAgain : ne change rien
//   - Si la permission n'existe pas, leve une erreur
//   - Retourne le nouvel etat
// - check(name) : retourne l'etat actuel (erreur si inexistante)
// - isGranted(name) : retourne true si status === 'granted'
// - getAll() : retourne un objet { permName: PermissionState, ... }
//
// Pour simuler un refus, on va tester en modifiant l'etat directement
// via le mecanisme suivant : si request est appele 2 fois de suite
// sur une permission 'undetermined', la 1ere appelle passe a 'granted'.
// (Pas de refus dans cette simulation simple.)
// =============================================================================

// TODO: Implementez createPermissionManager

// =============================================================================
// Exercice 2 : createFileManager
// Simule un systeme de fichiers en memoire.
//
// createFileManager() -> FileManager
//
// - write(path, content) : cree ou ecrase le fichier.
//   Le path utilise '/' comme separateur. Ex: 'documents/notes.txt'
// - read(path) : retourne le contenu. Leve une erreur si inexistant.
// - delete(path) : supprime le fichier. Retourne true si existait, false sinon.
// - exists(path) : retourne true si le fichier existe.
// - listDir(dirPath) : retourne les noms de fichiers dont le path commence
//   par dirPath + '/'. Ne retourne que le nom du fichier (pas le path complet).
//   Ex: listDir('documents') pour 'documents/a.txt' retourne ['a.txt'].
//   Ne retourne que les fichiers directement dans le repertoire (pas les sous-rep).
// =============================================================================

// TODO: Implementez createFileManager

// =============================================================================
// Exercice 3 : compressImageMetadata
// Simule la compression d'une image en recalculant ses metadonnees.
//
// compressImageMetadata(metadata, quality) -> CompressedMetadata
//
// - quality : nombre entre 0 et 1 (ex: 0.7 = 70%)
// - Nouvelles dimensions : width * quality, height * quality (arrondis au floor)
// - Nouveau sizeKB : sizeKB * quality * quality (taille proportionnelle a l'aire)
//   Arrondi a 2 decimales.
// - compressionRatio : originalSizeKB / nouveau sizeKB, arrondi a 2 decimales
// - originalWidth, originalHeight, originalSizeKB : les valeurs d'origine
// - Le format et l'uri restent identiques
// =============================================================================

// TODO: Implementez compressImageMetadata

// =============================================================================
// Exercice 4 : createLocationTracker
// Suit des points GPS et calcule distance, duree et vitesse.
//
// createLocationTracker() -> LocationTracker
//
// - addPoint(lat, lng) : ajoute un point avec timestamp = Date.now()
// - getPoints() : retourne tous les points
// - getDistance() : distance totale en metres (formule de Haversine entre chaque
//   paire de points consecutifs). Retourne 0 si < 2 points.
// - getDuration() : duree en millisecondes entre premier et dernier point.
//   Retourne 0 si < 2 points.
// - getAverageSpeed() : vitesse moyenne en m/s (distance / duree en secondes).
//   Retourne 0 si duree === 0.
//
// Formule de Haversine (distance entre 2 points GPS en metres) :
//   R = 6371e3
//   dLat = (lat2 - lat1) * PI / 180
//   dLon = (lon2 - lon1) * PI / 180
//   a = sin(dLat/2)^2 + cos(lat1*PI/180) * cos(lat2*PI/180) * sin(dLon/2)^2
//   c = 2 * atan2(sqrt(a), sqrt(1-a))
//   distance = R * c
// =============================================================================

// TODO: Implementez createLocationTracker

// =============================================================================
// Exercice 5 : createShareIntent
// Construit un payload de partage adapte aux deux plateformes.
//
// createShareIntent(content: {
//   type: ShareContentType,
//   title: string,
//   message?: string,
//   url?: string,
//   mimeType?: string,
// }) -> ShareIntent
//
// Le ShareIntent contient :
// - Les memes champs que l'input (type, title, message, url, mimeType)
// - platforms.ios : { title, message, url } (si url absent, omis)
// - platforms.android :
//   - Si type === 'url' : { title, message: (message ? message + '\n' + url : url) }
//     (Android combine message et url dans le champ message)
//   - Si type === 'text' : { title, message }
//   - Si type === 'image' ou 'file' : { title, message, mimeType }
//     (mimeType par defaut 'application/octet-stream' si absent)
// =============================================================================

// TODO: Implementez createShareIntent

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
  assertFalse(fm.delete('temp.txt')); // Deja supprime
});

test('Ex2: listDir retourne les fichiers du repertoire', () => {
  const fm = createFileManager();
  fm.write('docs/a.txt', 'A');
  fm.write('docs/b.txt', 'B');
  fm.write('docs/sub/c.txt', 'C'); // Sous-repertoire, ne doit pas apparaitre
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
  assertEqual(result.width, 500);     // 1000 * 0.5
  assertEqual(result.height, 400);    // 800 * 0.5
  assertEqual(result.sizeKB, 125);    // 500 * 0.5 * 0.5
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
  // sizeKB = 1200 * 0.7 * 0.7 = 588
  assertEqual(result.sizeKB, 588);
  // compressionRatio = 1200 / 588 = 2.040816... -> 2.04
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
  tracker.addPoint(48.8566, 2.3522);  // Paris
  tracker.addPoint(48.8584, 2.2945);  // Tour Eiffel

  const points = tracker.getPoints();
  assertLength(points, 2);
  assertApprox(points[0].latitude, 48.8566, 0.001);
});

test('Ex4: getDistance calcule la distance Haversine', () => {
  const tracker = createLocationTracker();
  // Paris centre -> Tour Eiffel ~ 4.1 km
  tracker.addPoint(48.8566, 2.3522);
  tracker.addPoint(48.8584, 2.2945);

  const distance = tracker.getDistance();
  // La distance devrait etre ~4100 metres (environ)
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

  // Simuler un delai en utilisant des timestamps differents
  const points = tracker.getPoints();
  // La duree sera tres faible (quasi 0) car les points sont ajoutes quasi instantanement
  // Mais on verifie que ca retourne 0 avec < 2 points
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
