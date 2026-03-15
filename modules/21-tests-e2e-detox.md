# Module 21 — Tests E2E avec Detox

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 4/5        | 75 min        | [Lab 21](../labs/lab-21-detox-e2e/) | [Quiz 21](../quizzes/quiz-21-detox.html) |

## Objectifs

- Configurer Detox dans un projet Expo/React Native (New Architecture)
- Écrire des matchers pour localiser les éléments : by.id, by.text, by.label, by.type
- Effectuer des actions utilisateur : tap, longPress, typeText, scroll, swipe
- Écrire des assertions : toBeVisible, toExist, toHaveText, toHaveToggleValue
- Gérer le cycle de vie des tests : beforeAll, beforeEach, device.reloadReactNative
- Tester des flux complets : login, navigation, formulaire, pull-to-refresh
- Gérer l'asynchronicite avec waitFor().toBeVisible().withTimeout()
- Intégrer Detox dans un pipeline CI (GitHub Actions)
- Decouvrir Maestro comme alternative

---

## Pourquoi des tests E2E ?

Les tests unitaires et d'intégration verifient des morceaux isoles de logique. Les tests **end-to-end** (E2E) valident l'application **du point de vue de l'utilisateur**, sur un vrai appareil ou simulateur.

```
Pyramide de tests :
                    /\
                   /  \     E2E (Detox, Maestro)
                  /    \    → Lent, couteux, haute confiance
                 /------\
                /        \   Integration (React Native Testing Library)
               /          \  → Composants + hooks ensemble
              /------------\
             /              \  Unitaire (Jest)
            /                \ → Rapide, isole, logique pure
           /------------------\
```

Les tests E2E sont les plus **lents** et **couteux** a maintenir, mais ils apportent la **plus grande confiance** que l'application fonctionne correctement pour l'utilisateur.

### Quand utiliser des tests E2E ?

- Flux critiques : inscription, paiement, onboarding
- Navigation complexe : deep links, tabs imbriques
- Interactions natives : permissions, camera, notifications
- Regression visuelle après un upgrade

### Detox : le standard React Native

[Detox](https://wix.github.io/Detox/) est développé par Wix. Ses avantages :

1. **Synchronisation automatique** : Detox attend que les animations, les requêtes réseau et les timers soient termines avant d'agir
2. **Tests grey-box** : acces au runtime natif tout en testant comme un utilisateur
3. **Fiable** : pas de `sleep()` arbitraires grâce à la synchronisation
4. **New Architecture** : compatible Fabric et TurboModules depuis Detox 20+

---

## Installation et configuration

### Prérequis

```bash
# macOS : Xcode + simulateur iOS
xcode-select --install
brew tap wix/brew
brew install applesimutils

# Android : Android Studio + emulateur
# Verifier que ANDROID_HOME est configure

# Node.js >= 18
node --version
```

### Installation dans le projet

```bash
# Depuis la racine du projet Expo
npm install --save-dev detox detox-cli jest @types/detox

# Initialiser Detox
npx detox init
```

Ceci créé deux fichiers :
- `.detoxrc.js` (configuration principale)
- `e2e/jest.config.js` (configuration Jest pour E2E)

### Configuration .detoxrc.js

```javascript
// .detoxrc.js
/** @type {Detox.DetoxConfig} */
module.exports = {
  logger: {
    level: process.env.CI ? 'debug' : 'info',
  },
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    // ─── iOS ────────────────────────────────────────
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/MyApp.app',
      build:
        'xcodebuild -workspace ios/MyApp.xcworkspace ' +
        '-scheme MyApp -configuration Debug ' +
        '-sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Release-iphonesimulator/MyApp.app',
      build:
        'xcodebuild -workspace ios/MyApp.xcworkspace ' +
        '-scheme MyApp -configuration Release ' +
        '-sdk iphonesimulator -derivedDataPath ios/build',
    },
    // ─── Android ────────────────────────────────────
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build:
        'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_35',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
```

### Configuration avec Expo (prebuild)

```bash
# Generer les projets natifs
npx expo prebuild

# Adapter les chemins dans .detoxrc.js
# binaryPath pointe vers le build Expo
```

Pour un projet **Expo managed** sans eject :

```javascript
// .detoxrc.js — variante Expo
module.exports = {
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/myapp.app',
      build: 'npx expo run:ios --configuration Debug',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath:
        'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'npx expo run:android --variant debug',
    },
  },
};
```

### Jest config pour E2E

```javascript
// e2e/jest.config.js
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1, // Tests E2E : un seul worker
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
```

---

## Élément Matchers

Les matchers permettent de **localiser** un élément dans l'arbre de rendu. Detox offre quatre stratégies principales.

### by.id — Le plus fiable

```tsx
// Dans le composant React Native :
<TextInput testID="email-input" placeholder="Email" />
<TouchableOpacity testID="login-btn">
  <Text>Se connecter</Text>
</TouchableOpacity>

// Dans le test Detox :
const emailInput = element(by.id('email-input'));
const loginBtn = element(by.id('login-btn'));
```

> **Bonne pratique** : toujours utiliser `testID` pour les éléments clés. C'est la méthode la plus stable car elle ne depend pas du texte affiche ni de la hiérarchie.

### by.text — Par contenu textuel

```typescript
// Match un element affichant exactement ce texte
const title = element(by.text('Bienvenue'));

// Attention : sensible a la casse et aux traductions !
// Ne PAS utiliser pour les boutons traduits
```

### by.label — Par accessibilityLabel

```tsx
// Dans le composant :
<TouchableOpacity
  accessibilityLabel="Ajouter au panier"
  accessibilityRole="button"
>
  <Icon name="cart-plus" />
</TouchableOpacity>

// Dans le test :
const addBtn = element(by.label('Ajouter au panier'));
```

Utile pour les éléments sans texte visible (icones, images).

### by.type — Par type natif (avance)

```typescript
// iOS : match par classe native
const scrollView = element(by.type('RCTScrollView'));

// Android : match par classe native
const editText = element(by.type('android.widget.EditText'));
```

> **Attention** : `by.type` est fragile car il depend de l'implementation native. A éviter sauf cas très spécifique.

### Combinaison de matchers

```typescript
// Element avec un id ET un texte
element(by.id('header-title').and(by.text('Accueil')));

// Element enfant d'un parent
element(by.id('item-title').withAncestor(by.id('item-row-3')));

// Element parent d'un enfant
element(by.id('item-row').withDescendant(by.text('React Native')));

// N-ieme element correspondant
element(by.text('Supprimer')).atIndex(2);
```

### Convention de nommage des testID

```
Pattern : <ecran>-<composant>-<action/role>

Exemples :
  login-email-input
  login-password-input
  login-submit-btn
  home-task-list
  home-task-item-3
  settings-theme-toggle
  profile-avatar-image
```

---

## Actions

Les actions simulent des **gestes utilisateur** sur les éléments localises.

### tap — Appui simple

```typescript
// Tap sur un bouton
await element(by.id('login-btn')).tap();

// Tap a une position specifique (x, y en points)
await element(by.id('map-view')).tap({ x: 100, y: 200 });
```

### longPress — Appui long

```typescript
// Appui long (duree par defaut)
await element(by.id('task-item-0')).longPress();

// Appui long avec duree personnalisee (ms)
await element(by.id('task-item-0')).longPress(1500);
```

### typeText — Saisie de texte

```typescript
// Taper du texte dans un champ
await element(by.id('email-input')).typeText('user@example.com');

// Remplacer le texte existant
await element(by.id('email-input')).replaceText('new@example.com');

// Effacer le texte
await element(by.id('email-input')).clearText();

// Taper du texte puis fermer le clavier
await element(by.id('email-input')).typeText('user@example.com\n');
// ou
await element(by.id('email-input')).tapReturnKey();
```

### scroll — Defilement

```typescript
// Scroller vers le bas de 300 points
await element(by.id('task-list')).scroll(300, 'down');

// Scroller vers le haut de 200 points
await element(by.id('task-list')).scroll(200, 'up');

// Scroller jusqu'a ce qu'un element soit visible
await waitFor(element(by.id('item-99')))
  .toBeVisible()
  .whileElement(by.id('task-list'))
  .scroll(100, 'down');
```

### swipe — Balayage

```typescript
// Swipe a gauche (supprimer)
await element(by.id('task-item-0')).swipe('left');

// Swipe a droite (marquer comme fait)
await element(by.id('task-item-0')).swipe('right');

// Swipe avec vitesse et pourcentage
await element(by.id('task-item-0')).swipe('left', 'fast', 0.75);
// speed: 'fast' | 'slow'
// normalizedOffset: 0..1 (pourcentage de la largeur)
```

### Autres actions

```typescript
// Multi-tap
await element(by.id('counter-btn')).multiTap(3);

// Pinch (zoom)
await element(by.id('photo-view')).pinch(1.5); // zoom in
await element(by.id('photo-view')).pinch(0.5); // zoom out

// Ajuster un slider
await element(by.id('volume-slider')).adjustSliderToPosition(0.75);

// Scroller un date picker
await element(by.id('date-picker')).setDatePickerDate(
  '2025-06-15',
  'yyyy-MM-dd'
);

// Toggle un switch
await element(by.id('notifications-toggle')).tap();
```

---

## Assertions

Les assertions **verifient l'état** des éléments après une action.

### toBeVisible / toNotBeVisible

```typescript
// L'element est visible a l'ecran
await expect(element(by.id('welcome-title'))).toBeVisible();

// L'element n'est PAS visible (hors ecran ou cache)
await expect(element(by.id('loading-spinner'))).not.toBeVisible();
```

> `toBeVisible` vérifié que l'élément est **physiquement visible** dans le viewport, pas juste qu'il existe dans l'arbre.

### toExist / toNotExist

```typescript
// L'element existe dans l'arbre (meme si pas visible)
await expect(element(by.id('hidden-config'))).toExist();

// L'element n'existe PAS du tout
await expect(element(by.id('admin-panel'))).not.toExist();
```

### toHaveText

```typescript
// Verifier le contenu textuel exact
await expect(element(by.id('task-count'))).toHaveText('3 taches');

// Verifier le placeholder
await expect(element(by.id('search-input'))).toHaveText('');
```

### toHaveToggleValue

```typescript
// Verifier l'etat d'un switch/toggle
await expect(element(by.id('dark-mode-toggle'))).toHaveToggleValue(true);
await expect(element(by.id('notifications-toggle'))).toHaveToggleValue(false);
```

### Autres assertions

```typescript
// L'element a le focus
await expect(element(by.id('email-input'))).toBeFocused();

// L'element a un certain label d'accessibilite
await expect(element(by.id('send-btn'))).toHaveLabel('Envoyer le message');

// L'element a une certaine valeur (slider, progress)
await expect(element(by.id('progress-bar'))).toHaveValue('75');

// L'element est a une position (pourcentage du viewport)
await expect(element(by.id('header'))).toBeVisible(75); // au moins 75% visible
```

---

## Cycle de vie des tests

### Structure d'un fichier de test

```typescript
// e2e/login.test.ts
import { device, element, by, expect, waitFor } from 'detox';

describe('Login Flow', () => {
  // ─── Avant tous les tests du fichier ──────────
  beforeAll(async () => {
    // Lance l'application
    await device.launchApp({
      newInstance: true,
      permissions: {
        notifications: 'YES',
        location: 'always',
      },
    });
  });

  // ─── Avant chaque test ────────────────────────
  beforeEach(async () => {
    // Recharge l'app (etat frais)
    await device.reloadReactNative();
  });

  // ─── Apres tous les tests ─────────────────────
  afterAll(async () => {
    // Nettoyage si necessaire
  });

  it('should display login screen on first launch', async () => {
    await expect(element(by.id('login-screen'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('login-btn'))).toBeVisible();
  });

  it('should show error on invalid credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@example.com');
    await element(by.id('password-input')).typeText('badpassword');
    await element(by.id('login-btn')).tap();

    await expect(element(by.id('error-message'))).toBeVisible();
    await expect(element(by.id('error-message'))).toHaveText(
      'Email ou mot de passe incorrect'
    );
  });
});
```

### device API

```typescript
// Lancer avec des options
await device.launchApp({
  newInstance: true,          // Nouvelle instance (pas de restauration)
  delete: true,               // Supprimer l'app et reinstaller
  permissions: {              // Permissions predefinies
    notifications: 'YES',
    camera: 'YES',
    location: 'always',
    photos: 'YES',
  },
  languageAndLocale: {        // Langue et locale
    language: 'fr',
    locale: 'fr-FR',
  },
  launchArgs: {               // Arguments de lancement
    mockServer: 'true',
    env: 'test',
  },
});

// Recharger React Native (sans relancer l'app native)
await device.reloadReactNative();

// Envoyer l'app en arriere-plan
await device.sendToHome();

// Ramener l'app au premier plan
await device.launchApp({ newInstance: false });

// Simuler un deep link
await device.openURL({
  url: 'myapp://task/42',
  sourceApp: 'com.apple.mobilesafari',
});

// Changer l'orientation
await device.setOrientation('landscape');
await device.setOrientation('portrait');

// Secouer l'appareil (ouvre le dev menu en debug)
await device.shake();

// Installer/desinstaller l'application
await device.installApp();
await device.uninstallApp();

// Prendre un screenshot
await device.takeScreenshot('login-success');
```

---

## Tester des flux complets

### Flux de login

```typescript
// e2e/flows/login.test.ts
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete login with valid credentials', async () => {
    // 1. Ecran de login visible
    await expect(element(by.id('login-screen'))).toBeVisible();

    // 2. Saisir les identifiants
    await element(by.id('email-input')).typeText('alice@example.com');
    await element(by.id('password-input')).typeText('password123');

    // 3. Soumettre
    await element(by.id('login-btn')).tap();

    // 4. Attendre la redirection vers l'accueil
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // 5. Verifier le message de bienvenue
    await expect(element(by.id('welcome-text'))).toHaveText(
      'Bonjour, Alice !'
    );
  });

  it('should logout and return to login screen', async () => {
    // Se connecter d'abord
    await element(by.id('email-input')).typeText('alice@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-btn')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Naviguer vers les parametres
    await element(by.id('tab-settings')).tap();

    // Se deconnecter
    await element(by.id('logout-btn')).tap();

    // Confirmer
    await element(by.text('Confirmer')).tap();

    // Retour au login
    await expect(element(by.id('login-screen'))).toBeVisible();
  });
});
```

### Flux de navigation

```typescript
// e2e/flows/navigation.test.ts
describe('Navigation Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should navigate through tab bar', async () => {
    // Tab Accueil (active par defaut)
    await expect(element(by.id('home-screen'))).toBeVisible();

    // Tab Recherche
    await element(by.id('tab-search')).tap();
    await expect(element(by.id('search-screen'))).toBeVisible();

    // Tab Favoris
    await element(by.id('tab-favorites')).tap();
    await expect(element(by.id('favorites-screen'))).toBeVisible();

    // Tab Profil
    await element(by.id('tab-profile')).tap();
    await expect(element(by.id('profile-screen'))).toBeVisible();
  });

  it('should push and pop screens in stack', async () => {
    await element(by.id('tab-home')).tap();

    // Tap sur un item pour naviguer vers les details
    await element(by.id('task-item-0')).tap();
    await expect(element(by.id('task-detail-screen'))).toBeVisible();
    await expect(element(by.id('task-detail-title'))).toHaveText(
      'Faire les courses'
    );

    // Retour arriere
    await element(by.id('back-btn')).tap();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should handle deep link navigation', async () => {
    await device.openURL({ url: 'myapp://task/42' });

    await waitFor(element(by.id('task-detail-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('task-detail-id'))).toHaveText('#42');
  });
});
```

### Flux de formulaire

```typescript
// e2e/flows/form.test.ts
describe('Form Submission', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    // Naviguer vers le formulaire
    await element(by.id('tab-home')).tap();
    await element(by.id('add-task-btn')).tap();
  });

  it('should create a new task', async () => {
    // Remplir le formulaire
    await element(by.id('task-title-input')).typeText('Acheter du pain');
    await element(by.id('task-description-input')).typeText(
      'A la boulangerie du coin'
    );

    // Selectionner une priorite
    await element(by.id('priority-selector')).tap();
    await element(by.text('Haute')).tap();

    // Activer le rappel
    await element(by.id('reminder-toggle')).tap();

    // Soumettre
    await element(by.id('submit-task-btn')).tap();

    // Verifier le retour a la liste avec la nouvelle tache
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.text('Acheter du pain'))).toBeVisible();
  });

  it('should show validation errors', async () => {
    // Soumettre sans remplir
    await element(by.id('submit-task-btn')).tap();

    // Erreur de validation
    await expect(element(by.id('title-error'))).toBeVisible();
    await expect(element(by.id('title-error'))).toHaveText(
      'Le titre est obligatoire'
    );
  });

  it('should dismiss keyboard on tap outside', async () => {
    await element(by.id('task-title-input')).typeText('Test');
    await expect(element(by.id('task-title-input'))).toBeFocused();

    // Tap en dehors du champ
    await element(by.id('form-container')).tap({ x: 10, y: 10 });

    // Le clavier doit etre ferme
    await expect(element(by.id('task-title-input'))).not.toBeFocused();
  });
});
```

### Pull-to-refresh

```typescript
// e2e/flows/pull-to-refresh.test.ts
describe('Pull to Refresh', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should refresh the task list', async () => {
    // Verifier le nombre initial
    await expect(element(by.id('task-count'))).toHaveText('5 taches');

    // Pull to refresh : swipe down sur la liste
    await element(by.id('task-list')).swipe('down', 'slow', 0.5);

    // Attendre que le rafraichissement soit termine
    await waitFor(element(by.id('refresh-indicator')))
      .not.toBeVisible()
      .withTimeout(5000);

    // Le compteur a peut-etre change
    await expect(element(by.id('task-list'))).toBeVisible();
  });
});
```

---

## Gestion de l'asynchronicite

La synchronisation automatique de Detox géré la plupart des cas. Mais parfois il faut attendre explicitement.

### waitFor — Attendre une condition

```typescript
// Attendre qu'un element soit visible (timeout 5s)
await waitFor(element(by.id('success-message')))
  .toBeVisible()
  .withTimeout(5000);

// Attendre qu'un element disparaisse
await waitFor(element(by.id('loading-spinner')))
  .not.toBeVisible()
  .withTimeout(10000);

// Attendre qu'un element existe
await waitFor(element(by.id('data-container')))
  .toExist()
  .withTimeout(8000);

// Attendre qu'un texte apparaisse
await waitFor(element(by.id('status-text')))
  .toHaveText('Termine')
  .withTimeout(5000);
```

### whileElement — Scroller en attendant

```typescript
// Scroller la liste jusqu'a trouver l'element
await waitFor(element(by.id('item-42')))
  .toBeVisible()
  .whileElement(by.id('task-list'))
  .scroll(100, 'down');
```

### Problemes de synchronisation courants

```typescript
// ── Probleme : animation infinie (lottie, skeleton) ──
// Detox attend indefiniment que l'animation se termine

// Solution 1 : desactiver les animations en mode test
// Dans le composant :
const isE2E = process.env.DETOX_MODE === 'true';
if (!isE2E) {
  // Lancer l'animation Lottie
}

// Solution 2 : desactiver la synchronisation temporairement
await device.disableSynchronization();
await element(by.id('action-btn')).tap();
await device.enableSynchronization();

// ── Probleme : setTimeout long dans le code ──
// Solution : mocker les timers en mode test

// ── Probleme : WebSocket / connexion permanente ──
// Solution : filtrer les URLs de la synchronisation
// dans .detoxrc.js :
// behavior: {
//   init: {
//     exposeGlobals: true
//   },
//   launchApp: 'auto'
// }
```

### Pattern : attendre le chargement complet

```typescript
async function waitForAppReady() {
  await waitFor(element(by.id('app-ready-indicator')))
    .toBeVisible()
    .withTimeout(15000);
}

// Utilisation dans les tests
beforeEach(async () => {
  await device.reloadReactNative();
  await waitForAppReady();
});
```

---

## Bonnes pratiques

### 1. Page Objects Pattern

Encapsuler les interactions dans des objets réutilisables :

```typescript
// e2e/pages/LoginPage.ts
class LoginPage {
  get emailInput() {
    return element(by.id('login-email-input'));
  }

  get passwordInput() {
    return element(by.id('login-password-input'));
  }

  get submitBtn() {
    return element(by.id('login-submit-btn'));
  }

  get errorMessage() {
    return element(by.id('login-error-message'));
  }

  async login(email: string, password: string) {
    await this.emailInput.typeText(email);
    await this.passwordInput.typeText(password);
    await this.submitBtn.tap();
  }

  async expectVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitBtn).toBeVisible();
  }
}

export const loginPage = new LoginPage();
```

```typescript
// e2e/pages/HomePage.ts
class HomePage {
  get screen() {
    return element(by.id('home-screen'));
  }

  get taskList() {
    return element(by.id('home-task-list'));
  }

  get addBtn() {
    return element(by.id('home-add-task-btn'));
  }

  taskItem(index: number) {
    return element(by.id(`home-task-item-${index}`));
  }

  async expectVisible() {
    await expect(this.screen).toBeVisible();
  }

  async tapTask(index: number) {
    await this.taskItem(index).tap();
  }
}

export const homePage = new HomePage();
```

```typescript
// e2e/login.test.ts — Utilisation
import { loginPage } from './pages/LoginPage';
import { homePage } from './pages/HomePage';

describe('Login', () => {
  it('should login successfully', async () => {
    await loginPage.expectVisible();
    await loginPage.login('alice@example.com', 'password123');
    await homePage.expectVisible();
  });
});
```

### 2. Helpers réutilisables

```typescript
// e2e/helpers/auth.ts
export async function loginAs(email: string, password: string) {
  await element(by.id('login-email-input')).typeText(email);
  await element(by.id('login-password-input')).typeText(password);
  await element(by.id('login-submit-btn')).tap();
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(5000);
}

export async function logout() {
  await element(by.id('tab-settings')).tap();
  await element(by.id('logout-btn')).tap();
  await element(by.text('Confirmer')).tap();
  await waitFor(element(by.id('login-screen')))
    .toBeVisible()
    .withTimeout(3000);
}
```

### 3. Test data / mock server

```typescript
// e2e/helpers/mockServer.ts
// Utiliser un serveur mock (ex: MSW ou json-server) pour les tests E2E

// Dans .detoxrc.js, passer l'URL du mock :
// launchArgs: { apiUrl: 'http://localhost:3001' }

// Dans l'app, lire le launch argument :
// const apiUrl = NativeModules.LaunchArguments?.apiUrl || PROD_URL;
```

---

## Lancer les tests

### Commandes Detox

```bash
# Build l'app pour les tests
npx detox build --configuration ios.sim.debug

# Lancer tous les tests
npx detox test --configuration ios.sim.debug

# Lancer un seul fichier de test
npx detox test --configuration ios.sim.debug e2e/login.test.ts

# Lancer avec des logs detailles
npx detox test --configuration ios.sim.debug --loglevel verbose

# Re-lancer sans rebuild
npx detox test --configuration ios.sim.debug --reuse

# Prendre des screenshots en cas d'echec
npx detox test --configuration ios.sim.debug --take-screenshots failing

# Enregistrer une video
npx detox test --configuration ios.sim.debug --record-videos failing

# Android
npx detox build --configuration android.emu.debug
npx detox test --configuration android.emu.debug
```

### Scripts package.json

```json
{
  "scripts": {
    "e2e:build:ios": "detox build --configuration ios.sim.debug",
    "e2e:test:ios": "detox test --configuration ios.sim.debug",
    "e2e:build:android": "detox build --configuration android.emu.debug",
    "e2e:test:android": "detox test --configuration android.emu.debug",
    "e2e:ci:ios": "detox build -c ios.sim.release && detox test -c ios.sim.release --headless",
    "e2e:ci:android": "detox build -c android.emu.release && detox test -c android.emu.release --headless"
  }
}
```

---

## Intégration CI : GitHub Actions

```yaml
# .github/workflows/e2e-ios.yml
name: E2E Tests (iOS)

on:
  pull_request:
    branches: [main]

jobs:
  e2e-ios:
    runs-on: macos-14  # Apple Silicon runner
    timeout-minutes: 45

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install applesimutils
        run: |
          brew tap wix/brew
          brew install applesimutils

      - name: Install CocoaPods
        run: cd ios && pod install

      - name: Build for Detox
        run: npx detox build --configuration ios.sim.release

      - name: Boot simulator
        run: |
          UDID=$(xcrun simctl list devices available | grep "iPhone 16" | head -1 | grep -oE '[0-9A-F-]{36}')
          xcrun simctl boot "$UDID" || true

      - name: Run Detox tests
        run: npx detox test --configuration ios.sim.release --headless --record-videos failing --take-screenshots failing

      - name: Upload artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: detox-artifacts-ios
          path: artifacts/
          retention-days: 7
```

```yaml
# .github/workflows/e2e-android.yml
name: E2E Tests (Android)

on:
  pull_request:
    branches: [main]

jobs:
  e2e-android:
    runs-on: ubuntu-latest
    timeout-minutes: 45

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Enable KVM
        run: |
          echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
          sudo udevadm control --reload-rules
          sudo udevadm trigger --name-match=kvm

      - name: AVD cache
        uses: actions/cache@v4
        with:
          path: |
            ~/.android/avd/*
            ~/.android/adb*
          key: avd-api-35

      - name: Create AVD and run tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 35
          target: google_apis
          arch: x86_64
          profile: pixel_7
          avd-name: Pixel_7_API_35
          emulator-options: -no-window -gpu swiftshader_indirect -noaudio -no-boot-anim
          disable-animations: true
          script: |
            npx detox build --configuration android.emu.release
            npx detox test --configuration android.emu.release --headless

      - name: Upload artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: detox-artifacts-android
          path: artifacts/
          retention-days: 7
```

---

## Maestro : alternative a Detox

[Maestro](https://maestro.mobile.dev/) est un framework E2E plus recent avec une approche **declarative** en YAML.

### Comparaison Detox vs Maestro

| Critere | Detox | Maestro |
|---------|-------|---------|
| Langage | JavaScript/TypeScript | YAML |
| Synchronisation | Automatique (grey-box) | Polling (black-box) |
| Setup | Complexe | Simple |
| iOS + Android | Oui | Oui |
| CI | Necessite simulateur | Maestro Cloud disponible |
| Communaute | Grande (Wix) | En croissance |
| Debugging | Logs + screenshots | Studio visuel |

### Exemple Maestro

```yaml
# .maestro/login-flow.yaml
appId: com.myapp
---
- launchApp
- tapOn:
    id: "email-input"
- inputText: "alice@example.com"
- tapOn:
    id: "password-input"
- inputText: "password123"
- tapOn:
    id: "login-btn"
- assertVisible:
    id: "home-screen"
- assertVisible:
    text: "Bonjour, Alice !"
```

```bash
# Installer Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Lancer un test
maestro test .maestro/login-flow.yaml

# Lancer tous les tests
maestro test .maestro/

# Mode studio (visuel)
maestro studio
```

### Quand choisir Maestro ?

- **Petite équipe** sans experience Detox
- **Prototypage rapide** de tests E2E
- Tests **cross-platform** simples
- Intégration avec **Maestro Cloud** pour CI

### Quand choisir Detox ?

- Besoin de **synchronisation fiable** (animations, requêtes)
- Tests **complexes** avec logique conditionnelle
- **Grande équipe** avec des testeurs experimentes
- Controle fin sur le **device** et les **permissions**

---

## Stratégies de test E2E

### Quels flux tester ?

```
Priorite haute :
  ✓ Inscription / Login / Logout
  ✓ Parcours principal (core user journey)
  ✓ Paiement / achat
  ✓ Deep links critiques

Priorite moyenne :
  ✓ Navigation entre ecrans
  ✓ Formulaires avec validation
  ✓ Pull-to-refresh / pagination
  ✓ Mode offline (si applicable)

Priorite basse (preferer tests unitaires/integration) :
  ✗ Calculs de logique metier
  ✗ Rendu conditionnel simple
  ✗ Formatage de dates/nombres
```

### Organisation des fichiers

```
e2e/
  jest.config.js
  helpers/
    auth.ts          # Login/logout helpers
    navigation.ts    # Navigation helpers
    waitFor.ts       # Custom wait conditions
  pages/
    LoginPage.ts     # Page Object
    HomePage.ts
    SettingsPage.ts
  flows/
    login.test.ts    # Flux de login
    onboarding.test.ts
    taskCrud.test.ts
    navigation.test.ts
  smoke/
    critical.test.ts # Tests smoke (les plus importants)
```

### Tagging des tests

```typescript
// Utiliser les tags Jest pour categoriser
describe('[smoke] Login', () => { /* ... */ });
describe('[regression] Task CRUD', () => { /* ... */ });

// Lancer uniquement les smoke tests
// npx detox test --configuration ios.sim.release --testNamePattern="\[smoke\]"
```

---

## Debugging des tests Detox

### Logs détaillés

```bash
# Logs Detox complets
npx detox test -c ios.sim.debug --loglevel trace

# Logs dans un fichier
npx detox test -c ios.sim.debug --loglevel trace 2>&1 | tee detox-log.txt
```

### Screenshots et videos

```bash
# Screenshot a chaque echec
npx detox test -c ios.sim.debug --take-screenshots failing

# Video des tests en echec
npx detox test -c ios.sim.debug --record-videos failing

# Les artefacts sont dans le dossier artifacts/
ls artifacts/
```

### Debug interactif

```typescript
// Ajouter un point d'arret dans le test
it('debug test', async () => {
  await element(by.id('login-btn')).tap();

  // Pause : le test attend que vous appuyiez sur Entree
  await new Promise((resolve) => {
    console.log('Test en pause. Inspectez le simulateur...');
    process.stdin.once('data', resolve);
  });

  await expect(element(by.id('home-screen'))).toBeVisible();
});
```

### Hiérarchie de l'arbre

```bash
# Afficher la hierarchie des vues (iOS)
xcrun simctl ui booted describe

# Android : utiliser Layout Inspector dans Android Studio
```

---

## Récapitulatif

| Concept | Description |
|---------|-------------|
| `element(by.id())` | Localiser par testID (le plus fiable) |
| `element(by.text())` | Localiser par texte affiche |
| `.tap()` | Simuler un tap utilisateur |
| `.typeText()` | Saisir du texte dans un champ |
| `.scroll()` | Defiler dans une liste |
| `expect().toBeVisible()` | Vérifier la visibilite |
| `waitFor().withTimeout()` | Attendre une condition async |
| `device.reloadReactNative()` | Recharger l'app entre les tests |
| `device.launchApp()` | Lancer avec des options spécifiques |
| Page Object Pattern | Encapsuler les interactions par ecran |
| GitHub Actions | CI avec simulateur macOS / emulateur Android |
| Maestro | Alternative declarative en YAML |

---

## Exercice pratique

Rendez-vous dans le [Lab 21](../labs/lab-21-detox-e2e/) pour implementer un simulateur de tests E2E en pur TypeScript : matchers, actions, assertions, flows et reporting.

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 21 detox](../screencasts/screencast-21-detox.md)
2. **Lab** : [lab-21-detox-e2e](../labs/lab-21-detox-e2e/README)
3. **Quiz** : [quiz 21 detox](../quizzes/quiz-21-detox.html)
:::
