# Module 00 : Prérequis et introduction a React Native

<!-- nav-cours-précédent -->
> **Cours précédent** : [Observabilité & SRE](../../12-observability-sre/modules/19-projet-final.md). Si tu arrives ici sans avoir fait les cours précédents, consulte le [guide de démarrage](../../GUIDE-DEMARRAGE.md).


| Metadata | Valeur |
|----------|--------|
| **Difficulte** | 1/5 |
| **Duree** | 45 min |
| **Prérequis** | Cours 08-React valide (hooks, state, routing), TypeScript (01-TypeScript modules 00-09 minimum) |
| **Lab** | [Lab 00 — Prérequis Setup](/labs/lab-00-prerequis-setup/) |
| **Quiz** | [Quiz 00 — Prérequis](/quizzes/quiz-00-prerequis.html) |

---

## Objectifs du module

- Réviser les fondamentaux TypeScript indispensables pour React Native
- Comprendre ce qu'est React Native et son positionnement
- Maîtriser l'architecture interne (threads, bridge, new architecture)
- Installer l'environnement de développement complet
- Créer et lancer un premier projet Expo

---

> **Ce cours nécessité le cours 08-React comme prérequis.** Tu dois maîtriser les hooks (useState, useEffect), le state management, et idealement avoir fait le module Next.js. Le rafraichissement TypeScript ci-dessous est un rappel, pas une introduction.

## 1. Rafraichissement JavaScript/TypeScript

Avant de plonger dans React Native, assurons-nous que les bases TypeScript sont solides. React Native utilise TypeScript comme langage principal dans les projets modernes.

### 1.1 Types de base

```typescript
// Types primitifs
const name: string = 'Alice';
const age: number = 30;
const isActive: boolean = true;
const data: null = null;
const value: undefined = undefined;

// Tableaux
const scores: number[] = [10, 20, 30];
const names: Array<string> = ['Alice', 'Bob'];

// Tuple
const pair: [string, number] = ['age', 30];

// Union
const id: string | number = 'abc-123';

// Literal types
type Direction = 'up' | 'down' | 'left' | 'right';
const move: Direction = 'up';
```

### 1.2 Interfaces et types

```typescript
// Interface — description de la forme d'un objet
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string; // optionnel
  readonly createdAt: Date; // immutable
}

// Extension d'interface
interface AdminUser extends User {
  role: 'admin' | 'superadmin';
  permissions: string[];
}

// Type alias — plus flexible
type UserId = string | number;

type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};

// Intersection
type UserWithPosts = User & {
  posts: Post[];
};

// Record — objet avec cles typees
type UserMap = Record<string, User>;
const users: UserMap = {
  'abc': { id: 1, name: 'Alice', email: 'a@a.com', createdAt: new Date() },
};
```

### 1.3 Generics

Les generics sont omnipresents dans React Native (composants, hooks, navigation).

```typescript
// Fonction generique
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const firstNumber = first([1, 2, 3]); // type: number | undefined
const firstString = first(['a', 'b']); // type: string | undefined

// Generics avec contrainte
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Alice', age: 30 };
const userName = getProperty(user, 'name'); // type: string
// getProperty(user, 'invalid'); // Erreur TS !

// Interface generique
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(item: T): Promise<T>;
  delete(id: string): Promise<void>;
}

// Implementation
class UserRepository implements Repository<User> {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id.toString() === id) ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async save(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id.toString() !== id);
  }
}
```

### 1.4 Destructuring et spread

```typescript
// Destructuring d'objet
const user = { name: 'Alice', age: 30, email: 'a@a.com' };
const { name, ...rest } = user;
// name = 'Alice', rest = { age: 30, email: 'a@a.com' }

// Destructuring avec renommage
const { name: userName, age: userAge } = user;

// Destructuring de tableau
const [first, second, ...others] = [1, 2, 3, 4, 5];
// first = 1, second = 2, others = [3, 4, 5]

// Spread d'objet — immutabilite (tres utilise dans React)
const updatedUser = { ...user, age: 31 };
// Cree un nouvel objet, user n'est pas modifie

// Spread de tableau
const allScores = [...scores, 40, 50];

// Fusion d'objets
const defaults = { theme: 'light', lang: 'fr', fontSize: 14 };
const userPrefs = { theme: 'dark' };
const config = { ...defaults, ...userPrefs };
// { theme: 'dark', lang: 'fr', fontSize: 14 }

// Destructuring dans les parametres de fonction (pattern React)
interface ButtonProps {
  title: string;
  color?: string;
  onPress: () => void;
}

function Button({ title, color = 'blue', onPress }: ButtonProps) {
  // title, color et onPress sont directement accessibles
  console.log(`Button: ${title} (${color})`);
}
```

### 1.5 Async/Await

```typescript
// Fonction asynchrone basique
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`https://api.example.com/users/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Gestion d'erreurs
async function loadUserSafe(id: number): Promise<User | null> {
  try {
    const user = await fetchUser(id);
    return user;
  } catch (error) {
    console.error('Failed to load user:', error);
    return null;
  }
}

// Execution parallele
async function loadDashboard(userId: number) {
  // Mauvais — sequentiel (lent)
  const user = await fetchUser(userId);
  const posts = await fetchPosts(userId);
  const notifications = await fetchNotifications(userId);

  // Bon — parallele (rapide)
  const [userP, postsP, notificationsP] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchNotifications(userId),
  ]);

  return { user: userP, posts: postsP, notifications: notificationsP };
}

// Promise.allSettled — ne fail pas si une requete echoue
async function loadDashboardSafe(userId: number) {
  const results = await Promise.allSettled([
    fetchUser(userId),
    fetchPosts(userId),
    fetchNotifications(userId),
  ]);

  return results.map(r =>
    r.status === 'fulfilled' ? r.value : null
  );
}
```

### 1.6 Fonctions utilitaires TypeScript

```typescript
// Partial — rend toutes les props optionnelles
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; ... }

// Required — rend toutes les props obligatoires
type RequiredUser = Required<User>;

// Pick — selectionne certaines props
type UserPreview = Pick<User, 'id' | 'name' | 'avatar'>;

// Omit — exclut certaines props
type UserWithoutEmail = Omit<User, 'email'>;

// Mapped types
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Conditional types
type IsString<T> = T extends string ? true : false;
type Result = IsString<'hello'>; // true
type Result2 = IsString<42>;     // false
```

---

## 2. Qu'est-ce que React Native ?

### 2.1 Definition

React Native est un framework open-source créé par Meta (Facebook) pour construire des applications mobiles natives en utilisant JavaScript et React. Le mot clé est **native** : les composants sont de vrais composants natifs iOS et Android, pas une WebView.

```
React Native = React (logique UI) + Native (rendu plateforme)
```

### 2.2 React Native vs les alternatives

| Critere | React Native | Flutter | Natif (Swift/Kotlin) | Ionic/Capacitor |
|---------|-------------|---------|---------------------|-----------------|
| **Langage** | TypeScript/JS | Dart | Swift / Kotlin | TypeScript/JS |
| **Rendu** | Composants natifs | Canvas (Skia) | Natif pur | WebView |
| **Performance** | Proche du natif | Excellente | Maximale | Limitee |
| **Hot Reload** | Oui (Fast Refresh) | Oui | Limité | Oui |
| **Ecosysteme** | npm (enorme) | pub.dev (croissant) | Mature | npm |
| **Équipe requise** | 1 équipe JS | 1 équipe Dart | 2 équipes | 1 équipe JS |
| **Partage de code web** | Possible (RN Web) | Possible (Flutter Web) | Non | Natif web |
| **Taille app** | ~15-25 MB | ~15-25 MB | ~5-15 MB | ~10-20 MB |
| **Adoption** | Meta, Microsoft, Shopify | Google, BMW, Alibaba | Tous | Enterprise |

### 2.3 Quand choisir React Native ?

**Bons cas d'usage :**
- Équipe avec experience React/JavaScript
- Application cross-platform (iOS + Android)
- Prototypage rapide
- Application avec beaucoup de logique metier (partageable)
- Intégration avec un ecosysteme web React existant

**Cas où considerer d'autres options :**
- Jeux 3D ou animations très complexes → Unity, natif
- Application ultra-specialisee (camera AR avancee) → natif
- Équipe Dart existante → Flutter
- Application web uniquement → React + PWA

---

## 3. Architecture de React Native

### 3.1 L'architecture classique (Bridge)

React Native fonctionne avec deux threads principaux qui communiquent via un "bridge" :

```
┌──────────────────────────────────────────────────────┐
│                    Application RN                     │
│                                                       │
│  ┌──────────────┐   Bridge (JSON)   ┌──────────────┐ │
│  │   JS Thread   │ ◄──────────────► │ Native Thread │ │
│  │              │                   │               │ │
│  │ • Logique    │                   │ • Rendu UI    │ │
│  │ • State      │                   │ • Animations  │ │
│  │ • Events     │                   │ • Gestures    │ │
│  │ • React      │                   │ • APIs OS     │ │
│  └──────────────┘                   └──────────────┘ │
│                                                       │
│  ┌──────────────┐                                     │
│  │ Shadow Thread │ (Yoga layout engine)               │
│  │ • Calcul      │                                    │
│  │   Flexbox     │                                    │
│  └──────────────┘                                     │
└──────────────────────────────────────────────────────┘
```

**JS Thread** : exécuté votre code JavaScript/TypeScript, la logique React, le state management, les appels réseau.

**Native Thread (Main/UI Thread)** : responsable du rendu des composants natifs a l'ecran, des animations natives, de la gestion des gestes.

**Shadow Thread** : calcule les layouts Flexbox via Yoga (moteur de layout de Meta).

**Bridge** : serialise les messages en JSON entre JS et Native. C'est le goulot d'etranglement potentiel.

### 3.2 La nouvelle architecture (Fabric + JSI)

Depuis React Native 0.72+, la nouvelle architecture remplace le bridge :

```
┌──────────────────────────────────────────────────────┐
│              Nouvelle Architecture RN                  │
│                                                       │
│  ┌──────────────┐      JSI         ┌──────────────┐ │
│  │   JS Thread   │ ◄─────────────► │ Native Thread │ │
│  │  (Hermes)    │   (direct C++)   │               │ │
│  │              │                   │               │ │
│  │ Turbo        │                   │ Fabric        │ │
│  │ Modules      │                   │ Renderer      │ │
│  └──────────────┘                   └──────────────┘ │
│                                                       │
│  Avantages :                                          │
│  • Pas de serialisation JSON                          │
│  • Appels synchrones possibles                        │
│  • Chargement lazy des modules natifs                 │
│  • Rendu concurrent (React 18)                        │
└──────────────────────────────────────────────────────┘
```

**JSI (JavaScript Interface)** : permet au JS d'appeler directement du C++ sans serialisation. Elimine le goulot d'etranglement du bridge.

**Hermes** : moteur JavaScript optimise pour mobile (bytecode precompile, faible consommation mémoire).

**Fabric** : nouveau système de rendu qui supporte le rendu concurrent de React 18.

**Turbo Modules** : remplacement des Native Modules avec chargement lazy et typage fort.

### 3.3 Comment le rendu fonctionne

```typescript
// Vous ecrivez du JSX
<View style={{ padding: 16 }}>
  <Text style={{ fontSize: 18 }}>Bonjour</Text>
</View>

// React cree un arbre virtuel (Virtual DOM)
{
  type: 'View',
  props: { style: { padding: 16 } },
  children: [
    {
      type: 'Text',
      props: { style: { fontSize: 18 } },
      children: ['Bonjour']
    }
  ]
}

// Yoga calcule le layout Flexbox
// Le renderer natif cree les composants correspondants :
// iOS  → UIView + UILabel
// Android → android.view.View + TextView
```

---

## 4. Installation de l'environnement

### 4.1 Prerequisites système

```bash
# Verifier Node.js (>= 18 requis)
node --version
# v20.11.0

# Verifier npm
npm --version
# 10.2.4

# Installer Watchman (macOS — recommande pour la perf)
brew install watchman
watchman --version
```

### 4.2 Installer Expo CLI

Expo est la manière recommandee de démarrer avec React Native. C'est un ensemble d'outils qui simplifie enormement le développement.

```bash
# Expo CLI est utilise via npx (pas d'installation globale)
npx expo --version
# 0.18.x

# Installer l'application Expo Go sur votre telephone
# iOS  → App Store : "Expo Go"
# Android → Play Store : "Expo Go"
```

### 4.3 Android Studio (pour emulateur Android)

1. Telecharger Android Studio depuis [developer.android.com](https://developer.android.com/studio)
2. Installer le SDK Android (API 34+)
3. Configurer les variables d'environnement :

```bash
# ~/.bashrc ou ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk           # Linux
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

4. Créer un emulateur (AVD Manager → Create Virtual Device → Pixel 7 → API 34)

### 4.4 Xcode (macOS uniquement, pour iOS)

1. Installer Xcode depuis le Mac App Store
2. Installer les Command Line Tools :

```bash
xcode-select --install
```

3. Accepter la licence :

```bash
sudo xcodebuild -license accept
```

4. Installer CocoaPods :

```bash
sudo gem install cocoapods
# ou
brew install cocoapods
```

### 4.5 Vérifier l'installation

```bash
# Expo doctor verifie tout
npx expo-doctor@latest

# React Native doctor (pour bare workflow)
npx react-native doctor
```

---

## 5. Expo vs Bare Workflow

### 5.1 Expo (Managed Workflow)

Expo encapsule React Native dans un environnement pre-configure. Vous n'avez **pas besoin** d'Android Studio ou Xcode pour commencer.

```
Expo = React Native + outils + services + configuration automatique
```

**Avantages :**
- Démarrage en 2 minutes
- Pas de configuration native
- OTA updates (EAS Update)
- Build dans le cloud (EAS Build)
- Expo Go pour tester sur device sans build
- SDK riche (Camera, Location, Notifications, etc.)

**Inconvenients :**
- Taille de l'app legerement plus grande
- Certains modules natifs custom necessitent un "dev client"

### 5.2 Bare Workflow (React Native CLI)

Acces direct aux dossiers `ios/` et `android/`. Configuration manuelle complete.

```bash
# Creation d'un projet bare
npx react-native init MonApp
```

**Avantages :**
- Controle total sur le code natif
- Intégration de n'importe quelle librairie native
- Optimisation fine de la taille

**Inconvenients :**
- Configuration complexe
- Maintenance des dépendances natives
- Pas d'OTA updates sans configuration manuelle

### 5.3 Le meilleur des deux mondes : Expo + Dev Client

Depuis Expo SDK 49+, vous pouvez utiliser Expo avec des modules natifs custom :

```bash
# Creer un projet Expo
npx create-expo-app MonApp

# Ajouter un module natif (ex: react-native-vision-camera)
npx expo install react-native-vision-camera

# Creer un dev client (build custom d'Expo Go)
npx expo prebuild
npx expo run:ios
npx expo run:android
```

### 5.4 Arbre de decision

```
Ai-je besoin de modules natifs custom ?
├── Non → Expo Managed ✅
└── Oui
    ├── Le module est dans l'ecosysteme Expo ? → Expo + Dev Client ✅
    └── Module tres specifique / legacy → Bare Workflow
```

::: tip Recommandation
Pour ce cours, nous utilisons **Expo** sauf mention contraire. C'est le choix recommande par l'équipe React Native officielle depuis 2024.
:::

---

## 6. Premier projet : Hello React Native

### 6.1 Création du projet

```bash
# Creer un nouveau projet avec le template TypeScript
npx create-expo-app@latest MonApp --template blank-typescript

# Structure creee :
MonApp/
├── App.tsx           # Point d'entree
├── app.json          # Configuration Expo
├── babel.config.js   # Configuration Babel
├── tsconfig.json     # Configuration TypeScript
├── package.json
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash-icon.png
└── node_modules/
```

### 6.2 Anatomie d'App.tsx

```typescript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Bonjour React Native !</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

**Decomposition :**
- `View` = équivalent de `<div>` en web → conteneur générique
- `Text` = obligatoire pour afficher du texte (pas de texte nu !)
- `StyleSheet.create` = créé un objet de styles optimise
- `StatusBar` = barre de statut du telephone (heure, batterie)

### 6.3 Configuration app.json

```json
{
  "expo": {
    "name": "MonApp",
    "slug": "mon-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.example.monapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.example.monapp"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### 6.4 Lancer l'application

```bash
# Entrer dans le dossier
cd MonApp

# Demarrer le serveur de developpement
npx expo start

# Options :
# i → Ouvrir sur simulateur iOS
# a → Ouvrir sur emulateur Android
# w → Ouvrir dans le navigateur
# Scan QR → Ouvrir sur Expo Go (telephone physique)
```

### 6.5 Fast Refresh

React Native dispose du **Fast Refresh** : quand vous modifiez un fichier, les changements apparaissent instantanement sans perdre l'état de l'application.

```typescript
// Modifiez le texte et sauvegardez :
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Bonjour le monde ! 🌍
      </Text>
      <Text style={{ marginTop: 8, color: '#666' }}>
        Mon premier composant React Native
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
```

Le changement apparait en ~200ms sans recharger l'app.

---

## 7. Exploration du projet

### 7.1 Fichiers importants

```
MonApp/
├── App.tsx              ← Composant racine
├── app.json             ← Config Expo (nom, icones, permissions)
├── babel.config.js      ← Transpilation JS
├── tsconfig.json        ← Configuration TypeScript
├── package.json         ← Dependances
├── .gitignore           ← Fichiers a ignorer par git
└── assets/              ← Images, fonts, etc.
```

### 7.2 Dependances clés

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.3.0",
    "typescript": "^5.3.0"
  }
}
```

### 7.3 Premier exercice guide : modifier App.tsx

Remplacez le contenu de `App.tsx` pour créer une carte de présentation :

```typescript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=68' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Alice Martin</Text>
        <Text style={styles.role}>Developpeuse Mobile</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>42</Text>
            <Text style={styles.statLabel}>Projets</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>1.2k</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>89</Text>
            <Text style={styles.statLabel}>Stars</Text>
          </View>
        </View>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // ombre Android
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  role: {
    fontSize: 14,
    color: '#8892b0',
    marginTop: 4,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4dabf7',
  },
  statLabel: {
    fontSize: 12,
    color: '#8892b0',
    marginTop: 2,
  },
});
```

---

## 8. Debug et outils

### 8.1 Console.log

Le moyen le plus simple de debugger :

```typescript
console.log('User data:', user);
console.warn('Deprecated API call');
console.error('Network error:', error);
```

Les logs apparaissent dans le terminal ou s'exécuté `npx expo start`.

### 8.2 React DevTools

```bash
# Installer React DevTools
npm install -g react-devtools

# Lancer (dans un terminal separe)
react-devtools
```

Permet d'inspecter l'arbre de composants, les props, le state, le contexte.

### 8.3 Expo DevTools

Quand `npx expo start` est lance, appuyez sur `m` pour ouvrir le menu développeur dans l'app :
- **Reload** : recharge complete
- **Toggle Inspector** : inspecteur d'éléments (comme les DevTools du navigateur)
- **Performance Monitor** : FPS, RAM, threads

### 8.4 Erreurs courantes du débutant

```typescript
// ❌ Erreur : texte en dehors de <Text>
<View>
  Bonjour    {/* CRASH : Text strings must be rendered within a <Text> */}
</View>

// ✅ Correct
<View>
  <Text>Bonjour</Text>
</View>

// ❌ Erreur : utiliser des balises HTML
<div style="color: red">
  <p>Hello</p>
</div>

// ✅ Correct : composants React Native
<View>
  <Text style={{ color: 'red' }}>Hello</Text>
</View>

// ❌ Erreur : CSS en string
<View style="background-color: blue">

// ✅ Correct : objet JavaScript
<View style={{ backgroundColor: 'blue' }}>

// ❌ Erreur : proprietes CSS web
<View style={{ display: 'grid', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>

// ✅ Correct : proprietes React Native
<View style={{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 4,
}}>
```

---

## 9. Concepts clés à retenir

### 9.1 Tout est composant

En React Native, chaque élément de l'interface est un composant :

```typescript
// Composants de base fournis par React Native
import {
  View,          // Conteneur (comme <div>)
  Text,          // Texte (obligatoire pour tout texte)
  Image,         // Images
  ScrollView,    // Zone scrollable
  TextInput,     // Champ de saisie
  TouchableOpacity, // Zone tactile avec feedback
  FlatList,      // Liste performante
  SafeAreaView,  // Zone safe (notch, barre de navigation)
} from 'react-native';
```

### 9.2 Pas de DOM, pas de CSS

React Native n'utilise pas le DOM ni le CSS. A la place :
- **Yoga** pour le layout (Flexbox, mais `flexDirection: 'column'` par defaut)
- **StyleSheet.create** pour les styles (syntaxe camelCase)
- **Composants natifs** au lieu de balises HTML

### 9.3 Flexbox par defaut

En React Native, Flexbox est le seul système de layout. Mais attention, les valeurs par defaut différent du web :

```typescript
// Web : flexDirection par defaut = 'row'
// React Native : flexDirection par defaut = 'column'

<View>
  <Text>Premier</Text>   {/* En haut */}
  <Text>Deuxieme</Text>  {/* En dessous */}
  <Text>Troisieme</Text> {/* Encore en dessous */}
</View>

// Pour mettre en ligne :
<View style={{ flexDirection: 'row' }}>
  <Text>Gauche</Text>
  <Text>Centre</Text>
  <Text>Droite</Text>
</View>
```

---

## 10. Récapitulatif

| Concept | Detail |
|---------|--------|
| React Native | Framework mobile cross-platform (composants natifs) |
| Expo | Outil recommande pour démarrer et développer |
| Architecture | JS Thread + Native Thread + Bridge (où JSI) |
| Hermes | Moteur JS optimise mobile |
| Fast Refresh | Rechargement instantane du code |
| Yoga | Moteur de layout Flexbox |
| View | Conteneur de base (remplace `<div>`) |
| Text | Obligatoire pour tout texte |
| StyleSheet | Système de styles (camelCase, pas de CSS) |

---

## Exercice pratique

Completez le [Lab 00](/labs/lab-00-prerequis-setup/) pour valider vos connaissances TypeScript.

Puis testez vos connaissances avec le [Quiz 00](/quizzes/quiz-00-prerequis.html).

---

## Ressources

- [Documentation React Native](https://reactnative.dev/)
- [Documentation Expo](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [React Native New Architecture](https://reactnative.dev/docs/new-architecture-intro)
- [Hermes Engine](https://hermesengine.dev/)

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 00 prérequis](../screencasts/screencast-00-prerequis.md)
2. **Lab** : [lab-00-prérequis-setup](../labs/lab-00-prerequis-setup/README)
3. **Visualisation** : [Architecture React Native](../visualizations/react-native-architecture.html)
4. **Quiz** : [quiz 00 prérequis](../quizzes/quiz-00-prerequis.html)
:::
