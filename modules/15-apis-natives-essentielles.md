# Module 15 — APIs natives essentielles

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 3/5        | 75 min        | [Lab 15](../labs/lab-15-apis-natives/) | [Quiz 15](../quizzes/quiz-15-apis-natives.html) |

## Objectifs

- Comprendre le modele de permissions d'Expo et les bonnes pratiques UX
- Capturer des photos et scanner des codes-barres avec expo-camera
- Selectionner et compresser des images avec expo-image-picker
- Obtenir la position GPS en foreground et background avec expo-location
- Gerer des fichiers (telechargement, upload, cache) avec expo-file-system
- Partager du contenu via les share sheets natives
- Interagir avec le presse-papier et les retours haptiques

---

## Le modele de permissions Expo

### Pourquoi les permissions ?

Sur mobile, l'acces aux capteurs et donnees personnelles (camera, localisation, photos) est protege par le systeme d'exploitation. L'application doit **demander l'autorisation** a l'utilisateur avant d'y acceder.

### Les deux etapes

1. **Declaration** : declarer les permissions dans `app.json` / `app.config.ts` (compile dans le manifeste natif)
2. **Demande a l'execution** : afficher le dialogue systeme quand l'utilisateur declenche l'action

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "L'application a besoin d'acceder a votre camera pour scanner les codes-barres."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "L'application utilise votre position pour afficher les points d'interet a proximite."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "L'application a besoin d'acceder a vos photos pour choisir une image de profil."
        }
      ]
    ]
  }
}
```

### Demander une permission a l'execution

```tsx
import * as Camera from 'expo-camera';

function ScannerScreen() {
  const [permission, requestPermission] = Camera.useCameraPermissions();

  // Etat initial : permission non encore demandee
  if (!permission) {
    return <View />;
  }

  // Permission refusee
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          L'acces a la camera est necessaire pour scanner les codes-barres.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Autoriser la camera</Text>
        </Pressable>
      </View>
    );
  }

  // Permission accordee
  return <CameraView style={styles.camera} />;
}
```

### Les etats de permission

```tsx
import { PermissionStatus } from 'expo-modules-core';

// Les etats possibles :
PermissionStatus.UNDETERMINED  // Pas encore demande
PermissionStatus.GRANTED       // Accorde
PermissionStatus.DENIED        // Refuse (peut etre redemande sur Android)

// Sur iOS, apres un refus :
// - L'utilisateur doit aller dans Reglages > App pour reactiver
// - On peut utiliser Linking.openSettings() pour l'y envoyer
```

### Pattern generique de gestion des permissions

```tsx
import { Alert, Linking, Platform } from 'react-native';

async function ensurePermission(
  checkFn: () => Promise<{ status: PermissionStatus; canAskAgain: boolean }>,
  requestFn: () => Promise<{ status: PermissionStatus }>,
  rationale: string,
): Promise<boolean> {
  const { status, canAskAgain } = await checkFn();

  if (status === PermissionStatus.GRANTED) {
    return true;
  }

  if (status === PermissionStatus.UNDETERMINED || canAskAgain) {
    const result = await requestFn();
    return result.status === PermissionStatus.GRANTED;
  }

  // Permission definitivement refusee -> envoyer aux reglages
  Alert.alert(
    'Permission requise',
    rationale,
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Ouvrir les reglages',
        onPress: () => Linking.openSettings(),
      },
    ],
  );

  return false;
}

// Utilisation :
const granted = await ensurePermission(
  () => Camera.getCameraPermissionsAsync(),
  () => Camera.requestCameraPermissionsAsync(),
  'L\'acces a la camera est necessaire pour scanner les codes-barres. Activez-le dans les reglages.',
);
```

### Bonnes pratiques UX pour les permissions

1. **Demandez au moment pertinent** : pas au lancement, mais quand l'utilisateur clique sur "Scanner"
2. **Expliquez pourquoi** : affichez un ecran explicatif avant le dialogue systeme
3. **Proposez une alternative** : si la camera est refusee, permettez la saisie manuelle du code
4. **Ne bloquez pas l'app** : une permission refusee ne doit pas rendre l'app inutilisable
5. **Pre-check avant la demande** : verifiez si la permission est deja accordee pour eviter des dialogues inutiles

---

## Camera : expo-camera

### Installation

```bash
npx expo install expo-camera
```

### Capture de photo

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';

function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>Permission camera requise</Text>
        <Pressable onPress={requestPermission}>
          <Text>Autoriser</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    const result = await cameraRef.current.takePictureAsync({
      quality: 0.8,       // 0-1, compression JPEG
      base64: false,       // true pour obtenir le base64
      exif: true,          // inclure les metadonnees EXIF
      skipProcessing: false, // true pour plus de vitesse (pas de rotation auto)
    });

    if (result) {
      setPhoto(result.uri);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.actions}>
          <Pressable onPress={() => setPhoto(null)}>
            <Text>Reprendre</Text>
          </Pressable>
          <Pressable onPress={() => savePhoto(photo)}>
            <Text>Enregistrer</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.controls}>
          <Pressable style={styles.flipButton} onPress={toggleFacing}>
            <Text style={styles.buttonText}>Retourner</Text>
          </Pressable>
          <Pressable style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInner} />
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}
```

### Scan de codes-barres

```tsx
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';

function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return; // Eviter les scans multiples
    setScanned(true);

    Alert.alert(
      'Code scanne',
      `Type: ${result.type}\nDonnee: ${result.data}`,
      [
        { text: 'Scanner a nouveau', onPress: () => setScanned(false) },
        { text: 'OK' },
      ],
    );
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>Permission camera requise pour le scanner</Text>
        <Pressable onPress={requestPermission}>
          <Text>Autoriser</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay de visee */}
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text style={styles.instructions}>
            Placez le code-barres dans le cadre
          </Text>
        </View>
      </CameraView>
    </View>
  );
}
```

---

## Image Picker : expo-image-picker

### Installation

```bash
npx expo install expo-image-picker
```

### Selectionner une image

```tsx
import * as ImagePicker from 'expo-image-picker';

async function pickImage(): Promise<string | null> {
  // Verifier la permission (galerie photos)
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission requise', 'Autorisez l\'acces a vos photos.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],           // 'images' | 'videos' | 'livePhotos'
    allowsEditing: true,              // Activer le recadrage
    aspect: [1, 1],                   // Ratio du recadrage (carre)
    quality: 0.8,                     // Compression (0-1)
    base64: false,                    // Inclure le base64
    exif: false,                      // Inclure les metadonnees EXIF
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0].uri;
}
```

### Prendre une photo avec la camera (via ImagePicker)

```tsx
async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission requise', 'Autorisez l\'acces a la camera.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0].uri;
}
```

### Composant Avatar avec choix image

```tsx
function AvatarPicker({ currentUri, onImageSelected }: {
  currentUri?: string;
  onImageSelected: (uri: string) => void;
}) {
  const showOptions = () => {
    Alert.alert('Photo de profil', 'Choisissez une source', [
      {
        text: 'Prendre une photo',
        onPress: async () => {
          const uri = await takePhoto();
          if (uri) onImageSelected(uri);
        },
      },
      {
        text: 'Choisir dans la galerie',
        onPress: async () => {
          const uri = await pickImage();
          if (uri) onImageSelected(uri);
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <Pressable onPress={showOptions}>
      <View style={styles.avatarContainer}>
        {currentUri ? (
          <Image source={{ uri: currentUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Text style={styles.placeholderText}>+</Text>
          </View>
        )}
        <View style={styles.editBadge}>
          <Text style={styles.editIcon}>Modifier</Text>
        </View>
      </View>
    </Pressable>
  );
}
```

### Compression et redimensionnement

```tsx
import * as ImageManipulator from 'expo-image-manipulator';

async function compressImage(uri: string, maxWidth = 800): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      { resize: { width: maxWidth } }, // Redimensionner (hauteur proportionnelle)
    ],
    {
      compress: 0.7,                   // Compression JPEG 70%
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return result.uri;
}

// Utilisation apres la selection
const rawUri = await pickImage();
if (rawUri) {
  const compressedUri = await compressImage(rawUri, 600);
  // compressedUri est pret pour l'upload
}
```

---

## Geolocalisation : expo-location

### Installation

```bash
npx expo install expo-location
```

### Position actuelle (foreground)

```tsx
import * as Location from 'expo-location';

async function getCurrentPosition(): Promise<Location.LocationObject | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission requise', 'Autorisez la localisation.');
    return null;
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return location;
  // location.coords.latitude
  // location.coords.longitude
  // location.coords.altitude
  // location.coords.speed
  // location.coords.heading
  // location.timestamp
}
```

### Suivi en temps reel (foreground)

```tsx
function LocationTracker() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [tracking, setTracking] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 10,   // Notification tous les 10 metres
        timeInterval: 5000,     // Ou toutes les 5 secondes
      },
      (newLocation) => {
        setLocation(newLocation);
      },
    );

    setTracking(true);
  };

  const stopTracking = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setTracking(false);
  };

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      {location && (
        <Text>
          Lat: {location.coords.latitude.toFixed(6)}{'\n'}
          Lng: {location.coords.longitude.toFixed(6)}{'\n'}
          Vitesse: {((location.coords.speed ?? 0) * 3.6).toFixed(1)} km/h
        </Text>
      )}
      <Pressable onPress={tracking ? stopTracking : startTracking}>
        <Text>{tracking ? 'Arreter' : 'Demarrer'} le suivi</Text>
      </Pressable>
    </View>
  );
}
```

### Suivi en arriere-plan (background)

```tsx
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Definir la tache (top level)
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    // Stocker les positions localement
    for (const location of locations) {
      await saveLocationToDatabase(location);
    }
  }
});

// Demarrer le suivi en arriere-plan
async function startBackgroundTracking() {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') {
    Alert.alert(
      'Permission requise',
      'Pour le suivi en arriere-plan, autorisez "Toujours" dans les reglages.',
    );
    return;
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 50,           // Tous les 50 metres
    deferredUpdatesInterval: 60000, // Regrouper les mises a jour (1 min)
    showsBackgroundLocationIndicator: true, // Indicateur iOS (barre bleue)
    foregroundService: {
      notificationTitle: 'Suivi GPS actif',
      notificationBody: 'L\'application enregistre votre parcours.',
      notificationColor: '#0d6efd',
    },
  });
}

// Arreter le suivi
async function stopBackgroundTracking() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
```

### Geocodage et geocodage inverse

```tsx
// Adresse -> Coordonnees
const coords = await Location.geocodeAsync('10 rue de Rivoli, Paris');
// [{ latitude: 48.8566, longitude: 2.3522, altitude: null }]

// Coordonnees -> Adresse
const addresses = await Location.reverseGeocodeAsync({
  latitude: 48.8566,
  longitude: 2.3522,
});
// [{ city: 'Paris', country: 'France', street: 'Rue de Rivoli', ... }]
```

### Calcul de distance entre deux points

```tsx
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371e3; // Rayon de la Terre en metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en metres
}
```

---

## Systeme de fichiers : expo-file-system

### Installation

```bash
npx expo install expo-file-system
```

### Repertoires disponibles

```tsx
import * as FileSystem from 'expo-file-system';

// Repertoire documents (persiste, sauvegarde iCloud/Google)
const docsDir = FileSystem.documentDirectory;
// iOS: /var/mobile/.../Documents/
// Android: /data/data/com.app/files/

// Repertoire cache (peut etre purge par l'OS)
const cacheDir = FileSystem.cacheDirectory;
```

### Operations de base

```tsx
// Ecrire un fichier texte
await FileSystem.writeAsStringAsync(
  FileSystem.documentDirectory + 'notes.txt',
  'Contenu de mes notes',
  { encoding: FileSystem.EncodingType.UTF8 },
);

// Lire un fichier texte
const content = await FileSystem.readAsStringAsync(
  FileSystem.documentDirectory + 'notes.txt',
);

// Verifier si un fichier existe
const info = await FileSystem.getInfoAsync(
  FileSystem.documentDirectory + 'notes.txt',
);
if (info.exists) {
  console.log('Taille:', info.size, 'octets');
  console.log('Modifie:', new Date(info.modificationTime * 1000));
}

// Supprimer un fichier
await FileSystem.deleteAsync(
  FileSystem.documentDirectory + 'notes.txt',
  { idempotent: true }, // Pas d'erreur si inexistant
);

// Creer un repertoire
await FileSystem.makeDirectoryAsync(
  FileSystem.documentDirectory + 'images/',
  { intermediates: true }, // Creer les parents si necessaire
);

// Lister le contenu d'un repertoire
const files = await FileSystem.readDirectoryAsync(
  FileSystem.documentDirectory + 'images/',
);
// ['photo1.jpg', 'photo2.jpg', ...]
```

### Telechargement de fichier

```tsx
// Telechargement simple
const downloadResult = await FileSystem.downloadAsync(
  'https://example.com/photo.jpg',
  FileSystem.cacheDirectory + 'photo.jpg',
);

console.log('Statut:', downloadResult.status);
console.log('URI locale:', downloadResult.uri);

// Telechargement avec progression
const downloadResumable = FileSystem.createDownloadResumable(
  'https://example.com/video.mp4',
  FileSystem.documentDirectory + 'video.mp4',
  {},
  (progress) => {
    const pct = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
    console.log(`Progression: ${(pct * 100).toFixed(1)}%`);
    setDownloadProgress(pct);
  },
);

const result = await downloadResumable.downloadAsync();

// Pause et reprise
await downloadResumable.pauseAsync();
// ... plus tard
await downloadResumable.resumeAsync();
```

### Upload de fichier

```tsx
const uploadResult = await FileSystem.uploadAsync(
  'https://api.example.com/upload',
  FileSystem.documentDirectory + 'photo.jpg',
  {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    headers: {
      Authorization: 'Bearer token123',
    },
    parameters: {
      description: 'Photo de profil',
      userId: '42',
    },
  },
);

console.log('Statut:', uploadResult.status);
console.log('Reponse:', uploadResult.body);
```

### Gestionnaire de cache d'images

```tsx
class ImageCacheManager {
  private cacheDir: string;

  constructor() {
    this.cacheDir = FileSystem.cacheDirectory + 'image-cache/';
  }

  async init() {
    const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
    }
  }

  private getCacheKey(url: string): string {
    // Hash simple de l'URL pour le nom de fichier
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const ext = url.split('.').pop()?.split('?')[0] ?? 'jpg';
    return `${Math.abs(hash).toString(36)}.${ext}`;
  }

  async getCachedUri(url: string): Promise<string> {
    const fileName = this.getCacheKey(url);
    const filePath = this.cacheDir + fileName;

    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists) {
      return filePath; // Deja en cache
    }

    // Telecharger et mettre en cache
    const result = await FileSystem.downloadAsync(url, filePath);
    return result.uri;
  }

  async clearCache(): Promise<void> {
    await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
    await this.init();
  }

  async getCacheSize(): Promise<number> {
    const files = await FileSystem.readDirectoryAsync(this.cacheDir);
    let totalSize = 0;

    for (const file of files) {
      const info = await FileSystem.getInfoAsync(this.cacheDir + file);
      if (info.exists && info.size) {
        totalSize += info.size;
      }
    }

    return totalSize;
  }
}
```

---

## Partage : expo-sharing

### Installation

```bash
npx expo install expo-sharing
```

### Partager un fichier

```tsx
import * as Sharing from 'expo-sharing';

async function shareFile(fileUri: string) {
  // Verifier que le partage est disponible
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    Alert.alert('Non disponible', 'Le partage n\'est pas disponible sur cet appareil.');
    return;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'image/jpeg',
    dialogTitle: 'Partager la photo',
    UTI: 'public.jpeg', // iOS seulement
  });
}
```

### Partager du texte ou un lien (Share API native)

```tsx
import { Share } from 'react-native';

async function shareContent() {
  try {
    const result = await Share.share({
      title: 'Decouvrez cette app',
      message: 'Je recommande cette application de gestion de taches !',
      url: 'https://myapp.com', // iOS seulement (combine avec message sur Android)
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        console.log('Partage via:', result.activityType); // iOS seulement
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Partage annule');
    }
  } catch (error) {
    Alert.alert('Erreur', 'Impossible de partager le contenu.');
  }
}
```

### Bouton de partage reutilisable

```tsx
function ShareButton({ title, message, url }: {
  title: string;
  message: string;
  url?: string;
}) {
  const handleShare = async () => {
    try {
      await Share.share(
        Platform.select({
          ios: { title, message, url },
          android: { title, message: url ? `${message}\n${url}` : message },
        })!,
      );
    } catch {
      // L'utilisateur a annule ou une erreur s'est produite
    }
  };

  return (
    <Pressable onPress={handleShare} style={styles.shareButton}>
      <Text style={styles.shareText}>Partager</Text>
    </Pressable>
  );
}
```

---

## Presse-papier : expo-clipboard

### Installation

```bash
npx expo install expo-clipboard
```

### Utilisation

```tsx
import * as Clipboard from 'expo-clipboard';

// Copier du texte
await Clipboard.setStringAsync('Texte a copier');

// Lire le presse-papier
const text = await Clipboard.getStringAsync();

// Verifier s'il y a du texte
const hasText = await Clipboard.hasStringAsync();

// Copier une image (iOS 14+, Android 10+)
await Clipboard.setImageAsync(base64ImageString);
```

### Hook useCopyToClipboard

```tsx
function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { copy, copied };
}

// Utilisation
function CopyableCode({ code }: { code: string }) {
  const { copy, copied } = useCopyToClipboard();

  return (
    <Pressable onPress={() => copy(code)} style={styles.codeBlock}>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.copyHint}>
        {copied ? 'Copie !' : 'Appuyez pour copier'}
      </Text>
    </Pressable>
  );
}
```

---

## Retours haptiques : expo-haptics

### Installation

```bash
npx expo install expo-haptics
```

### Types de retour haptique

```tsx
import * as Haptics from 'expo-haptics';

// Impact (retour physique, comme un "clic")
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Notification (succes, erreur, avertissement)
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Selection (leger, comme le scroll d'un picker)
await Haptics.selectionAsync();
```

### Quand utiliser les haptiques ?

| Action | Type de retour | Style |
|--------|---------------|-------|
| Appuyer un bouton | Impact | Light |
| Valider un formulaire | Notification | Success |
| Erreur de validation | Notification | Error |
| Supprimer un element (swipe) | Impact | Medium |
| Pull-to-refresh | Impact | Light |
| Toggle un switch | Selection | - |
| Scroll d'un picker | Selection | - |
| Action destructive confirmee | Impact | Heavy |

### Hook useHaptics

```tsx
function useHaptics() {
  const impact = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const notification = (type: Haptics.NotificationFeedbackType) => {
    Haptics.notificationAsync(type);
  };

  const selection = () => {
    Haptics.selectionAsync();
  };

  return { impact, notification, selection };
}

// Utilisation dans un composant
function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const { impact, notification } = useHaptics();

  const handleDelete = () => {
    impact(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert('Confirmer', 'Supprimer cet element ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          onDelete();
          notification(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  return (
    <Pressable onPress={handleDelete} style={styles.deleteButton}>
      <Text style={styles.deleteText}>Supprimer</Text>
    </Pressable>
  );
}
```

---

## Exemple complet : capture photo avec geolocalisation

### Le flow complet

```
1. Utilisateur appuie sur "Prendre une photo"
2. Verification permissions (camera + location)
3. Capture de la photo
4. Obtention de la position GPS
5. Compression de l'image
6. Sauvegarde locale (fichier + metadata)
7. Affichage avec la localisation en overlay
```

### Implementation

```tsx
import { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';

interface GeoPhoto {
  uri: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: number;
}

function GeoPhotoScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<GeoPhoto[]>([]);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const captureGeoPhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);

    try {
      // 1. Prendre la photo
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        exif: true,
      });
      if (!photo) return;

      // 2. Obtenir la position
      const { status } = await Location.requestForegroundPermissionsAsync();
      let latitude = 0, longitude = 0, address = 'Position inconnue';

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;

        const addresses = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (addresses.length > 0) {
          const a = addresses[0];
          address = [a.street, a.city, a.country].filter(Boolean).join(', ');
        }
      }

      // 3. Compresser l'image
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );

      // 4. Sauvegarder dans le repertoire documents
      const fileName = `photo_${Date.now()}.jpg`;
      const destUri = FileSystem.documentDirectory + 'photos/' + fileName;
      await FileSystem.makeDirectoryAsync(
        FileSystem.documentDirectory + 'photos/',
        { intermediates: true },
      );
      await FileSystem.moveAsync({ from: compressed.uri, to: destUri });

      // 5. Sauvegarder les metadonnees
      const geoPhoto: GeoPhoto = {
        uri: destUri,
        latitude,
        longitude,
        address,
        timestamp: Date.now(),
      };

      setPhotos((prev) => [geoPhoto, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 6. Sauvegarder les metadata en JSON
      const metaPath = FileSystem.documentDirectory + 'photos/metadata.json';
      const existingRaw = await FileSystem.readAsStringAsync(metaPath).catch(() => '[]');
      const existing = JSON.parse(existingRaw) as GeoPhoto[];
      existing.unshift(geoPhoto);
      await FileSystem.writeAsStringAsync(metaPath, JSON.stringify(existing));

    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible de capturer la photo.');
    } finally {
      setCapturing(false);
    }
  };

  // Ecran de permission
  if (!cameraPermission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          La camera est necessaire pour prendre des photos geolocalisees.
        </Text>
        <Pressable style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Autoriser la camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.captureBar}>
          <Pressable
            style={[styles.captureButton, capturing && styles.disabled]}
            onPress={captureGeoPhoto}
            disabled={capturing}
          >
            <View style={styles.captureInner} />
          </Pressable>
        </View>
      </CameraView>

      {/* Galerie */}
      <FlatList
        horizontal
        data={photos}
        keyExtractor={(item) => String(item.timestamp)}
        renderItem={({ item }) => (
          <View style={styles.thumbnail}>
            <Image source={{ uri: item.uri }} style={styles.thumbImage} />
            <Text style={styles.thumbAddress} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        )}
        style={styles.gallery}
      />
    </View>
  );
}
```

---

## Bonnes pratiques

### Permissions

1. **Jamais au lancement** : demandez les permissions quand l'utilisateur declenche l'action
2. **Expliquez avant** : un ecran d'explication avant le dialogue systeme ameliore le taux d'acceptation de 30-50%
3. **Gerez le refus gracieusement** : proposez une alternative ou un lien vers les reglages
4. **Verifiez toujours** : ne supposez jamais qu'une permission est encore accordee

### Camera et images

1. **Compressez systematiquement** : une photo brute fait 3-8 MB, compressez a 200-500 KB pour l'upload
2. **Utilisez le cache** : stockez les images telecharges dans `cacheDirectory`, pas `documentDirectory`
3. **Liberez la memoire** : les images haute resolution consomment beaucoup de RAM

### Geolocalisation

1. **Precision adaptee** : utilisez `Accuracy.Balanced` sauf besoin de navigation precise
2. **Background = battery drain** : le suivi GPS en arriere-plan consomme beaucoup de batterie
3. **Informez l'utilisateur** : affichez clairement quand le GPS est actif

### Fichiers

1. **documentDirectory** pour les donnees utilisateur (persistent, sauvegardees)
2. **cacheDirectory** pour les fichiers temporaires (peut etre purge par l'OS)
3. **Nettoyez le cache** regulierement : proposez un bouton "Vider le cache" dans les parametres

### Haptiques

1. **Subtilite** : n'abusez pas des retours haptiques, utilisez-les pour confirmer des actions
2. **Coherence** : meme type de retour pour des actions similaires dans toute l'app
3. **Light par defaut** : reservez Heavy pour les actions destructives ou importantes

---

## Recapitulatif

| API | Package | Cas d'usage principal |
|-----|---------|----------------------|
| Camera | expo-camera | Capture photo, scan codes-barres |
| Image Picker | expo-image-picker | Selection galerie, capture simplifiee |
| Location | expo-location | GPS foreground/background, geocodage |
| File System | expo-file-system | Fichiers, telechargement, upload |
| Sharing | expo-sharing | Partage de fichiers via share sheet |
| Clipboard | expo-clipboard | Copier/coller du texte |
| Haptics | expo-haptics | Retour tactile (vibration) |

---

## Exercice pratique

Rendez-vous au [Lab 15](../labs/lab-15-apis-natives/) pour implementer un gestionnaire de permissions, un gestionnaire de fichiers en memoire, un compresseur de metadonnees d'image, un tracker de position et un constructeur de share intent en pur TypeScript.
