# Module 22 — Déploiement et CI/CD

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 4/5        | 90 min        | [Lab 22](../labs/lab-22-deploiement-ci-cd/) | [Quiz 22](../quizzes/quiz-22-deploiement.html) |

## Objectifs

- Comprendre la signature d'application iOS (certificats, provisioning profiles) et Android (keystore)
- Configurer EAS Build avec des profils de build (development, preview, production)
- Automatiser la soumission aux stores avec EAS Submit
- Déployer des mises a jour OTA avec EAS Update
- Connaître les regles de l'App Store et du Play Store
- Mettre en place un pipeline CI/CD avec GitHub Actions
- Gérer le versioning (semver, build numbers, runtime version)
- Gérer les environnements (dev, staging, production)

---

## Signature d'application

Avant de publier sur les stores, l'application doit etre **signee cryptographiquement**. Cela garantit l'identite du développeur et l'integrite du binaire.

### iOS : certificats et provisioning profiles

```
Architecture de signature iOS :

  Apple Developer Account
        │
        ├── Distribution Certificate (.p12)
        │     → Identifie le developpeur/l'entreprise
        │     → Valide 1 an (a renouveler)
        │     → Max 3 certificats de distribution
        │
        ├── Provisioning Profile (.mobileprovision)
        │     → Lie : App ID + Certificate + Devices (dev) ou Store
        │     → Types :
        │       • Development : test sur devices physiques
        │       • Ad Hoc : distribution limitee (100 devices max)
        │       • App Store : soumission App Store Connect
        │       • Enterprise : distribution interne (compte entreprise)
        │
        └── App ID (Bundle Identifier)
              → ex: com.mycompany.myapp
              → Configure dans Apple Developer Portal
              → Inclut les capabilities (push, sign-in, etc.)
```

#### Processus manuel (à connaître)

```bash
# 1. Creer un Certificate Signing Request (CSR) via Keychain Access
# 2. Uploader sur developer.apple.com → Certificates
# 3. Telecharger le .cer et l'installer dans le Keychain
# 4. Creer l'App ID sur developer.apple.com → Identifiers
# 5. Creer le Provisioning Profile → Profiles
# 6. Configurer Xcode : Signing & Capabilities
```

> **Bonne nouvelle** : EAS Build géré tout cela automatiquement ! Mais comprendre le processus aide au debugging.

### Android : keystore

```
Architecture de signature Android :

  Keystore (.jks ou .keystore)
        │
        ├── Upload Key (votre cle locale)
        │     → Signe l'AAB avant upload sur Play Store
        │     → Generee par vous, a conserver precieusement
        │     → Si perdue : demander un reset a Google (long)
        │
        └── App Signing Key (cle Google)
              → Google la genere et la garde
              → Signe le binaire final distribue aux utilisateurs
              → Google Play App Signing (active par defaut)
```

#### Générer un keystore

```bash
# Generer un keystore pour la production
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore myapp-upload.keystore \
  -alias myapp-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Verifier le contenu
keytool -list -v -keystore myapp-upload.keystore
```

> **IMPORTANT** : ne jamais committer le keystore dans Git ! Ajouter `*.keystore` et `*.jks` au `.gitignore`.

#### Configuration dans Gradle

```groovy
// android/app/build.gradle
android {
    signingConfigs {
        release {
            storeFile file(System.getenv('KEYSTORE_PATH') ?: 'upload.keystore')
            storePassword System.getenv('KEYSTORE_PASSWORD') ?: ''
            keyAlias System.getenv('KEY_ALIAS') ?: ''
            keyPassword System.getenv('KEY_PASSWORD') ?: ''
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## EAS Build

[EAS Build](https://docs.expo.dev/build/introduction/) est le service cloud d'Expo pour builder les applications iOS et Android. C'est **le standard pour les projets Expo** (SDK 52+).

### Installation et login

```bash
# Installer EAS CLI globalement
npm install -g eas-cli

# Se connecter a son compte Expo
eas login

# Verifier le compte
eas whoami
```

### Configuration : eas.json

```json
{
  "$schema": "https://raw.githubusercontent.com/expo/eas-cli/main/packages/eas-json/schema/eas.json",
  "cli": {
    "version": ">= 13.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "APP_ENV": "development",
        "API_URL": "https://dev-api.myapp.com"
      },
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "staging",
        "API_URL": "https://staging-api.myapp.com"
      },
      "channel": "preview",
      "autoIncrement": true
    },
    "production": {
      "env": {
        "APP_ENV": "production",
        "API_URL": "https://api.myapp.com"
      },
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "dev@mycompany.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDEF1234"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### Les trois profils de build

```
development :
  → Build de developpement avec Expo Dev Client
  → Distribution interne (testeurs)
  → Simulateur iOS active
  → Variables d'environnement de dev
  → Canal de mise a jour : "development"

preview :
  → Build de pre-production
  → Distribution interne (QA, beta testers)
  → Auto-increment du build number
  → Variables de staging
  → Canal : "preview"

production :
  → Build de production pour les stores
  → Optimisations activees (minification, tree-shaking)
  → Auto-increment du build number
  → Variables de production
  → Canal : "production"
```

### Lancer un build

```bash
# Build de developpement (les deux plateformes)
eas build --profile development --platform all

# Build iOS seulement
eas build --profile production --platform ios

# Build Android seulement
eas build --profile production --platform android

# Build local (sans le cloud EAS)
eas build --profile development --platform ios --local

# Build preview pour les testeurs internes
eas build --profile preview --platform all
```

### Credentials management

```bash
# EAS gere les credentials automatiquement
# Lors du premier build iOS, il va :
# 1. Creer le Distribution Certificate
# 2. Creer le Provisioning Profile
# 3. Les stocker dans le cloud EAS

# Lister les credentials
eas credentials

# Pour Android, EAS genere le keystore automatiquement
# Mais on peut aussi fournir le sien :
eas credentials --platform android
```

### Options avancees

```json
{
  "build": {
    "production": {
      "ios": {
        "image": "macos-ventura-14.2-xcode-15.1",
        "resourceClass": "m-medium",
        "buildConfiguration": "Release"
      },
      "android": {
        "image": "ubuntu-22.04-jdk-17-ndk-25",
        "resourceClass": "medium",
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "cache": {
        "key": "v1-production",
        "paths": [
          "node_modules",
          "ios/Pods"
        ]
      }
    }
  }
}
```

---

## EAS Submit

EAS Submit automatise la soumission aux stores directement depuis le build EAS.

### Soumission a l'App Store

```bash
# Soumettre le dernier build iOS de production
eas submit --platform ios --latest

# Soumettre un build specifique
eas submit --platform ios --id <build-id>

# Soumettre un IPA local
eas submit --platform ios --path ./myapp.ipa
```

#### Configuration App Store Connect

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "dev@mycompany.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDEF1234",
        "appName": "Mon App",
        "language": "fr-FR",
        "sku": "com.mycompany.myapp"
      }
    }
  }
}
```

### Soumission au Play Store

```bash
# Soumettre le dernier build Android de production
eas submit --platform android --latest

# Tracks disponibles :
#   internal  → Test interne (jusqu'a 100 testeurs)
#   alpha     → Test ferme
#   beta      → Test ouvert
#   production → Publication
```

#### Configuration Play Store

```bash
# 1. Creer un compte de service Google Cloud
# 2. Activer l'API Google Play Developer
# 3. Ajouter le compte de service dans la Google Play Console
# 4. Telecharger la cle JSON

# Configurer dans eas.json :
```

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal",
        "releaseStatus": "draft",
        "changesNotSentForReview": true
      }
    }
  }
}
```

### Build + Submit en une commande

```bash
# Builder ET soumettre automatiquement
eas build --profile production --platform all --auto-submit
```

---

## EAS Update (OTA)

EAS Update permet de déployer des mises a jour **over-the-air** (OTA) sans passer par les stores. Ideal pour les corrections de bugs et les petites ameliorations.

### Comment ça marche

```
Build natif (binaire) :
  → Contient le code natif (Swift/Kotlin, modules natifs)
  → Necessite un passage par les stores
  → Identifie par un "runtime version"

Update OTA (bundle JS) :
  → Contient le code JavaScript/TypeScript et les assets
  → Deploye instantanement via EAS Update
  → Compatible avec un runtime version specifique
  → Les utilisateurs recoivent la mise a jour au prochain lancement
```

### Configuration

```json
// app.json / app.config.ts
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/<project-id>",
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 5000
    }
  }
}
```

### Runtime version policies

```
"appVersion" :
  → runtimeVersion = version de l'app (ex: "1.2.0")
  → Un update n'est recu que par les builds avec la meme version
  → Simple et predictible

"nativeVersion" :
  → runtimeVersion = ios.buildNumber + android.versionCode
  → Plus granulaire

"fingerprint" :
  → runtimeVersion = hash du code natif
  → Deteccion automatique des changements natifs
  → Recommande pour Expo SDK 52+

Personnalise :
  → runtimeVersion = valeur fixee manuellement
  → Controle total
```

### Publier un update

```bash
# Publier sur le canal de production
eas update --channel production --message "Fix: correction du bug de login"

# Publier sur le canal preview
eas update --channel preview --message "Feature: nouveau design de la home"

# Publier une branche specifique
eas update --branch main --message "v1.2.1 hotfix"

# Publier avec un runtime version specifique
eas update --channel production --runtime-version 1.2.0
```

### Canaux et branches

```
Canal (channel) :
  → Pointe vers une branche
  → Les builds d'un canal recoivent les updates de la branche associee
  → Ex: canal "production" → branche "main"

Branche (branch) :
  → Contient les updates publies
  → Peut etre associee a un ou plusieurs canaux
  → Ex: branche "main", branche "staging"

Mapping :
  Canal "production" → Branche "main"
  Canal "preview"    → Branche "staging"
  Canal "development"→ Branche "develop"
```

```bash
# Voir les canaux
eas channel:list

# Creer un canal
eas channel:create staging

# Pointer un canal vers une branche
eas channel:edit production --branch main

# Voir les updates d'une branche
eas update:list --branch main
```

### Rollback

```bash
# Lister les updates sur un canal
eas update:list --channel production

# Rollback : repointer vers un update precedent
eas update:rollback --channel production

# Ou republier une version anterieure
git checkout v1.2.0
eas update --channel production --message "Rollback to v1.2.0"
```

### Vérification programmatique

```typescript
// Dans l'application, verifier les updates manuellement
import * as Updates from 'expo-updates';

async function checkForUpdate() {
  if (__DEV__) return; // Pas d'OTA en dev

  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();

      // Redemarrer l'app avec le nouvel update
      await Updates.reloadAsync();
    }
  } catch (error) {
    console.error('Erreur lors de la verification des updates:', error);
  }
}

// Appeler au lancement ou a un moment strategique
// Ex: au retour de l'arriere-plan
```

### Limites des OTA updates

```
CE QU'ON PEUT METTRE A JOUR PAR OTA :
  ✓ Code JavaScript/TypeScript
  ✓ Assets statiques (images, fonts)
  ✓ Styles et layouts
  ✓ Configuration non-native

CE QUI NECESSITE UN NOUVEAU BUILD NATIF :
  ✗ Ajout/suppression de modules natifs
  ✗ Changement de permissions (camera, location...)
  ✗ Modification du app.json/app.config.ts (certaines proprietes)
  ✗ Mise a jour du SDK Expo
  ✗ Changement de l'icone ou du splash screen
```

---

## App Store Guidelines

### Raisons courantes de rejet

```
1. Performances
   → Crash au lancement (testez sur de vrais appareils !)
   → Ecrans vides / contenu placeholder
   → Liens casses

2. Design
   → UI non conforme aux Human Interface Guidelines
   → Utilisation d'icones systeme de maniere non standard
   → Pas de support iPad si l'app est universelle

3. Contenu
   → Pas de politique de confidentialite
   → Contenu genere par l'utilisateur sans moderation
   → Liens vers des systemes de paiement externes

4. Metadonnees
   → Screenshots ne correspondant pas a l'app
   → Description trompeuse
   → Categorie incorrecte

5. Fonctionnel
   → Login obligatoire sans compte de demo
   → App trop simple (aurait pu etre un site web)
   → Fonctionnalite incomplete ou en beta
```

### Checklist App Store

```
Avant soumission :
  □ Politique de confidentialite (URL valide)
  □ App Privacy Details remplis dans App Store Connect
  □ Compte de demo fourni si login obligatoire
  □ Screenshots pour chaque taille d'ecran requise
  □ Description en francais et anglais
  □ Icone 1024x1024 sans transparence
  □ Pas de mention "beta" ou "test"
  □ Tester sur un vrai appareil (pas juste simulateur)
  □ Verifier le comportement sans connexion internet
  □ Support de Dynamic Type et VoiceOver
```

### App Privacy Details

```
Depuis iOS 14.5, Apple exige de declarer :
  - Types de donnees collectees
  - Utilisation de chaque type (analytics, personalisation, etc.)
  - Si les donnees sont liees a l'identite de l'utilisateur
  - Si les donnees sont utilisees pour le tracking

Configurer dans App Store Connect → App Privacy
```

---

## Play Store Guidelines

### Exigences techniques

```
2025 - Exigences actuelles :
  - Target SDK : API 35 (Android 15) minimum
  - Format : AAB (Android App Bundle), pas APK
  - 64-bit : obligatoire
  - Deferred components : recommande pour les grosses apps
```

### Content rating

```bash
# Le questionnaire IARC est obligatoire
# Google Play Console → Content rating
# Repondre honnetement aux questions sur :
#   - Violence
#   - Contenu sexuel
#   - Langage
#   - Substances
#   - Jeux d'argent
#   - Contenu genere par les utilisateurs

# Le rating est attribue automatiquement (PEGI, ESRB, etc.)
```

### Data safety

```
Depuis 2022, Google exige un formulaire "Data safety" :
  - Quelles donnees sont collectees
  - Comment elles sont utilisees
  - Si elles sont partagees avec des tiers
  - Pratiques de securite (chiffrement, suppression)

Google Play Console → App content → Data safety
```

### Checklist Play Store

```
Avant soumission :
  □ Target API level >= 35
  □ Format AAB (pas APK)
  □ Content rating rempli
  □ Data safety rempli
  □ Politique de confidentialite (URL)
  □ Au moins 4 screenshots par type d'ecran
  □ Feature graphic 1024x500
  □ Description courte (80 chars) + longue (4000 chars)
  □ Categorie et tags
  □ Coordonnees du developpeur
  □ Tester sur plusieurs tailles d'ecran
  □ Verifier les permissions declarees dans le manifest
  □ ProGuard / R8 active pour la minification
```

---

## CI/CD avec GitHub Actions

### Pipeline complet

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

jobs:
  # ─── Lint & Tests ──────────────────────────────
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # ─── EAS Build (preview) sur PR ────────────────
  build-preview:
    needs: quality
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build preview
        run: eas build --profile preview --platform all --non-interactive

      - name: Comment PR with build links
        uses: actions/github-script@v7
        with:
          script: |
            const { data: builds } = await github.rest.actions
              .listJobsForWorkflowRun({
                owner: context.repo.owner,
                repo: context.repo.repo,
                run_id: context.runId,
              });
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '📱 Preview build started! Check [EAS Dashboard](https://expo.dev) for build status.',
            });

  # ─── EAS Update sur push develop ──────────────
  update-staging:
    needs: quality
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Publish OTA update to preview channel
        run: |
          eas update --channel preview \
            --message "$(git log -1 --pretty=%s)" \
            --non-interactive

  # ─── EAS Build + Submit sur push main ──────────
  release-production:
    needs: quality
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build and submit to stores
        run: |
          eas build --profile production \
            --platform all \
            --auto-submit \
            --non-interactive
```

### Secrets a configurer

```
Dans GitHub → Settings → Secrets and variables → Actions :

  EXPO_TOKEN          → Token EAS (eas login --token)
  CODECOV_TOKEN       → Token Codecov (optionnel)

Les credentials iOS/Android sont gerees par EAS,
pas besoin de les stocker dans GitHub Secrets.
```

### Workflow pour les tags de version

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Build production
        run: |
          eas build --profile production \
            --platform all \
            --auto-submit \
            --non-interactive \
            --message "Release v${{ steps.version.outputs.VERSION }}"

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

---

## Fastlane comme alternative

[Fastlane](https://fastlane.tools/) est un outil open source pour automatiser le build et le déploiement. C'est l'alternative a EAS pour les projets **ejected** ou non-Expo.

### Comparaison EAS vs Fastlane

| Critere | EAS | Fastlane |
|---------|-----|----------|
| Setup | Simple (SaaS) | Complexe (local) |
| Build | Cloud | Local ou CI |
| Cout | Gratuit (limite) / payant | Gratuit (open source) |
| Credentials | Gestion automatique | match / cert |
| Expo | Natif | Compatible mais non officiel |
| Personnalisation | Limite | Totale |
| Screenshots auto | Non | Oui (snapshot) |

### Exemple Fastfile

```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Build and submit to TestFlight"
  lane :beta do
    increment_build_number
    build_app(
      workspace: "ios/MyApp.xcworkspace",
      scheme: "MyApp",
      export_method: "app-store"
    )
    upload_to_testflight(skip_waiting_for_build_processing: true)
  end

  desc "Submit to App Store"
  lane :release do
    build_app(
      workspace: "ios/MyApp.xcworkspace",
      scheme: "MyApp",
      export_method: "app-store"
    )
    upload_to_app_store(
      force: true,
      submit_for_review: true,
      automatic_release: true
    )
  end
end

platform :android do
  desc "Build and submit to Play Store internal track"
  lane :beta do
    gradle(
      project_dir: "android",
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: "internal",
      aab: "android/app/build/outputs/bundle/release/app-release.aab"
    )
  end
end
```

> Pour un projet **Expo SDK 52+**, EAS est recommande. Fastlane est utile pour les projets **bare React Native** ou les besoins très spécifiques (screenshots automatiques, metadata management).

---

## Versioning

### Stratégie Semver

```
MAJOR.MINOR.PATCH
  1.2.3

MAJOR : changement incompatible (redesign, migration de donnees)
MINOR : nouvelle fonctionnalite retrocompatible
PATCH : correction de bug

Exemples :
  1.0.0 → Lancement initial
  1.1.0 → Nouvelle fonctionnalite de recherche
  1.1.1 → Fix du crash sur Android 14
  2.0.0 → Redesign complet de l'app
```

### Build numbers

```
iOS : CFBundleVersion (ex: 42)
  → Entier incremental
  → Doit augmenter a chaque soumission
  → Pas visible par les utilisateurs

Android : versionCode (ex: 42)
  → Entier incremental
  → Doit augmenter a chaque soumission
  → Pas visible par les utilisateurs

version visible : CFBundleShortVersionString / versionName
  → Ex: "1.2.3"
  → Visible dans le store
```

### Gestion dans app.config.ts

```typescript
// app.config.ts
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Mon App',
  slug: 'mon-app',
  version: '1.2.3',           // Version visible (semver)
  ios: {
    buildNumber: '42',         // Build number iOS
    bundleIdentifier: 'com.mycompany.myapp',
  },
  android: {
    versionCode: 42,           // Build number Android
    package: 'com.mycompany.myapp',
  },
  runtimeVersion: {
    policy: 'appVersion',      // Pour EAS Update
  },
};

export default config;
```

### Auto-increment avec EAS

```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  },
  "cli": {
    "appVersionSource": "remote"
  }
}
```

Avec `appVersionSource: "remote"`, EAS géré le build number automatiquement. Plus besoin de le committer dans le code !

### Runtime version pour EAS Update

```
La runtime version determine la compatibilite entre un
build natif et un update OTA.

Strategie recommandee (Expo SDK 52+) :
  "fingerprint" → hash automatique du code natif
  → Si le code natif change, la runtime version change
  → Les updates ne sont envoyes qu'aux builds compatibles

Alternative simple :
  "appVersion" → runtime version = version de l'app
  → Quand on bumpe la version, il faut un nouveau build
  → Les updates vont aux builds avec la meme version
```

---

## Gestion des environnements

### Variables d'environnement dans eas.json

```json
{
  "build": {
    "development": {
      "env": {
        "APP_ENV": "development",
        "API_URL": "http://localhost:3000",
        "SENTRY_DSN": "",
        "ENABLE_ANALYTICS": "false"
      }
    },
    "preview": {
      "env": {
        "APP_ENV": "staging",
        "API_URL": "https://staging-api.myapp.com",
        "SENTRY_DSN": "https://xxx@sentry.io/123",
        "ENABLE_ANALYTICS": "true"
      }
    },
    "production": {
      "env": {
        "APP_ENV": "production",
        "API_URL": "https://api.myapp.com",
        "SENTRY_DSN": "https://yyy@sentry.io/456",
        "ENABLE_ANALYTICS": "true"
      }
    }
  }
}
```

### Configuration dynamique dans app.config.ts

```typescript
// app.config.ts
import { ExpoConfig } from 'expo/config';

const APP_ENV = process.env.APP_ENV || 'development';

const envConfig = {
  development: {
    name: 'Mon App (Dev)',
    bundleId: 'com.mycompany.myapp.dev',
    icon: './assets/icon-dev.png',
  },
  staging: {
    name: 'Mon App (Staging)',
    bundleId: 'com.mycompany.myapp.staging',
    icon: './assets/icon-staging.png',
  },
  production: {
    name: 'Mon App',
    bundleId: 'com.mycompany.myapp',
    icon: './assets/icon.png',
  },
} as const;

const env = envConfig[APP_ENV as keyof typeof envConfig];

const config: ExpoConfig = {
  name: env.name,
  slug: 'mon-app',
  version: '1.2.3',
  icon: env.icon,
  ios: {
    bundleIdentifier: env.bundleId,
  },
  android: {
    package: env.bundleId,
  },
  extra: {
    apiUrl: process.env.API_URL,
    appEnv: APP_ENV,
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  },
};

export default config;
```

### Acceder aux variables dans l'app

```typescript
// config/env.ts
import Constants from 'expo-constants';

interface AppConfig {
  apiUrl: string;
  appEnv: 'development' | 'staging' | 'production';
  enableAnalytics: boolean;
}

export const appConfig: AppConfig = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000',
  appEnv: Constants.expoConfig?.extra?.appEnv ?? 'development',
  enableAnalytics: Constants.expoConfig?.extra?.enableAnalytics ?? false,
};

// Utilisation dans l'app :
// import { appConfig } from './config/env';
// fetch(`${appConfig.apiUrl}/tasks`);
```

### Secrets EAS

```bash
# Stocker des secrets qui ne doivent PAS etre dans le code
eas secret:create --name SENTRY_AUTH_TOKEN --value "sntrys_xxx" --scope project

# Lister les secrets
eas secret:list

# Les secrets sont disponibles comme variables d'environnement
# pendant le build EAS
```

---

## Workflow complet : du PR au store

```
1. Developpeur cree une branche feature
   git checkout -b feature/new-search

2. Push et ouvre un PR
   → CI : lint, typecheck, tests unitaires
   → CI : eas build --profile preview (optionnel)

3. Code review + merge dans develop
   → CI : eas update --channel preview
   → Les testeurs avec un build "preview" recoivent l'update OTA

4. QA valide sur staging
   → Merge develop dans main

5. Push sur main
   → CI : eas build --profile production --auto-submit
   → Soumission automatique aux stores

6. Hotfix urgent ?
   → git checkout -b hotfix/login-crash
   → Fix + merge dans main
   → eas update --channel production
   → Les utilisateurs recoivent le fix OTA instantanement
   → Pas besoin de review store !
```

---

## Debugging des builds EAS

### Erreurs courantes

```
"Build failed: CocoaPods install failed"
  → Verifier les versions dans Podfile
  → Ajouter "cocoapods" dans eas.json cache.paths
  → Essayer : npx expo prebuild --clean

"Build failed: Gradle build failed"
  → Verifier le targetSdkVersion
  → Verifier les dependances Java/Kotlin
  → Nettoyer : cd android && ./gradlew clean

"Code signing error"
  → eas credentials → regenerer les credentials
  → Verifier l'Apple Developer Program (expiration ?)

"EAS Update: runtime version mismatch"
  → L'update n'est pas compatible avec le build
  → Verifier la runtime version policy
  → Faire un nouveau build si le code natif a change
```

### Logs de build

```bash
# Voir les builds recents
eas build:list

# Voir les logs d'un build specifique
eas build:view <build-id>

# Telecharger les logs complets
# Disponible dans le dashboard Expo : expo.dev
```

---

## Récapitulatif

| Concept | Description |
|---------|-------------|
| Signing iOS | Certificat + Provisioning Profile |
| Signing Android | Keystore + Upload Key |
| EAS Build | Build cloud pour iOS et Android |
| eas.json | Configuration des profils de build |
| EAS Submit | Soumission automatisee aux stores |
| EAS Update | Mises a jour OTA sans passer par les stores |
| Runtime version | Compatibilite build natif / update OTA |
| Channel | Canal de distribution des updates |
| Semver | MAJOR.MINOR.PATCH |
| autoIncrement | Build number géré par EAS |
| GitHub Actions | CI/CD : lint, test, build, submit |
| Fastlane | Alternative open source a EAS |
| app.config.ts | Configuration dynamique par environnement |

---

## Exercice pratique

Rendez-vous dans le [Lab 22](../labs/lab-22-deploiement-ci-cd/) pour implementer un simulateur de pipeline CI/CD en pur TypeScript : versioning, build config, release checklist, update channels et pipeline d'intégration.

---

## Navigation

| Précédent | Suivant |
|:---------:|:-------:|
| [Module 21 — Tests E2E avec Detox](./21-tests-e2e-detox.md) | [Module 23 — Modules natifs et Turbo Modules](./23-modules-natifs-turbo-modules.md) |

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 22 déploiement](../screencasts/screencast-22-deploiement.md)
2. **Lab** : [lab-22-déploiement-ci-cd](../labs/lab-22-deploiement-ci-cd/README)
3. **Visualisation** : [Bundle Analyzer](../visualizations/bundle-analyzer.html)
4. **Quiz** : [quiz 22 déploiement](../quizzes/quiz-22-deploiement.html)
:::
