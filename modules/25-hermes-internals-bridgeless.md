# Module 25 : Hermes Engine et mode Bridgeless

| Metadata | Valeur |
|----------|--------|
| **Difficulte** | 5/5 |
| **Duree** | 75 min |
| **Prerequis** | Modules 01-18, notions JS engine, base performance mobile |
| **Lab** | [Lab 25 — Hermes & Bridgeless](/labs/lab-25-hermes-bridgeless/) |
| **Quiz** | [Quiz 25 — Hermes](/quizzes/quiz-25-hermes.html) |

---

## Objectifs du module

- Comprendre l'architecture interne du moteur Hermes et ses optimisations
- Maitriser la compilation en bytecode (hbc) et son impact sur le startup time
- Comparer Hermes, V8 et JavaScriptCore sur des criteres concrets
- Analyser un bundle bytecode avec les outils CLI Hermes
- Comprendre le garbage collector GenGC et ses strategies de collecte
- Activer et exploiter le mode Bridgeless (New Architecture)
- Profiler une application avec le sampling profiler Hermes
- Detecter et resoudre les fuites memoire via heap snapshots
- Optimiser le temps de demarrage d'une application React Native

---

## 1. Introduction a Hermes

### 1.1 Qu'est-ce que Hermes ?

Hermes est un moteur JavaScript open-source developpe par Meta, optimise specifiquement pour React Native. Contrairement aux moteurs traditionnels (V8, JavaScriptCore), Hermes a ete concu des le depart pour les contraintes mobiles : demarrage rapide, faible consommation memoire, et taille binaire reduite.

> **Depuis React Native 0.70+**, Hermes est le moteur par defaut. Avec la New Architecture (0.74+), Hermes est indissociable du mode Bridgeless et de JSI (JavaScript Interface).

```
┌─────────────────────────────────────────────────────────────┐
│                    Pipeline Hermes                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Source JS/TS ──> Babel/Metro ──> JS Bundle                │
│                                          │                   │
│                                    Compilateur Hermes        │
│                                          │                   │
│                                    Bytecode (.hbc)           │
│                                          │                   │
│                                    VM Hermes (runtime)       │
│                                          │                   │
│                                    Execution native          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Pourquoi un moteur dedie ?

Les moteurs JavaScript classiques (V8, JSC) sont optimises pour les navigateurs web, ou le **throughput** (vitesse d'execution continue) est prioritaire. Sur mobile, les contraintes sont differentes :

| Critere | Web (V8/JSC) | Mobile (Hermes) |
|---------|-------------|-----------------|
| Priorite | Throughput maximal | Startup rapide |
| Compilation | JIT (Just-In-Time) | AOT (Ahead-Of-Time) → bytecode |
| Memoire | Abondante (Go) | Limitee (centaines de Mo) |
| CPU | Multi-core puissant | Efficience energetique |
| Cold start | Secondaire | Critique (premiere impression) |
| Taille binaire | Non critique | Chaque Mo compte |

### 1.3 Activation de Hermes

Depuis React Native 0.74+ et Expo SDK 51+, Hermes est active par defaut. Pour verifier :

```typescript
// Verifier a l'execution
const isHermes = () => !!(global as any).HermesInternal;

console.log(`Moteur: ${isHermes() ? 'Hermes' : 'Autre (V8/JSC)'}`);

// Acceder aux informations internes
if ((global as any).HermesInternal) {
  const runtime = (global as any).HermesInternal.getRuntimeProperties();
  console.log('Version Hermes:', runtime['OSS Release Version']);
  console.log('Bytecode version:', runtime['Bytecode Version']);
  console.log('Build mode:', runtime['Build']);
}
```

Configuration dans `app.json` (Expo) :

```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

Configuration bare React Native (`android/gradle.properties`) :

```properties
# Hermes est active par defaut depuis RN 0.70
hermesEnabled=true
```

---

## 2. Compilation en bytecode

### 2.1 Le principe de la compilation AOT

Contrairement a V8 qui compile le JavaScript en code machine au moment de l'execution (JIT), Hermes **precompile** le JavaScript en bytecode pendant le build. Ce bytecode est ensuite interprete directement par la VM Hermes au demarrage.

```
┌──────────────────────────────────────────────────────────────────┐
│                   V8 (JIT) vs Hermes (AOT)                        │
├────────────────────────────┬─────────────────────────────────────┤
│     V8 / JSC               │          Hermes                     │
│                            │                                     │
│  1. Telecharger JS         │  1. Build: compiler → .hbc          │
│  2. Parser le source       │  2. Distribuer .hbc dans l'app      │
│  3. Construire AST         │  3. Runtime: charger .hbc en memoire│
│  4. Compiler en bytecode   │  4. Interpreter directement         │
│  5. Optimiser (JIT tiers)  │                                     │
│  6. Executer               │  → Pas de parsing ni compilation    │
│                            │  → Demarrage quasi-instantane       │
│  Etapes 2-5 = STARTUP      │                                     │
│  (100-500ms sur mobile)    │  → ~50-150ms au total               │
└────────────────────────────┴─────────────────────────────────────┘
```

### 2.2 Format du bytecode Hermes (.hbc)

Le fichier `.hbc` (Hermes Bytecode) est un format binaire optimise :

```
┌──────────────────────────────────────────────┐
│              Structure du fichier .hbc         │
├──────────────────────────────────────────────┤
│  Magic Number (c61fbc03)                      │
│  Version du bytecode                          │
│  Source hash (SHA1)                            │
│  Global code index                             │
├──────────────────────────────────────────────┤
│  Function Table                                │
│  ├─ Function Header (nom, params, registres)  │
│  ├─ Bytecode instructions                     │
│  └─ Debug info (source maps optionnels)       │
├──────────────────────────────────────────────┤
│  String Table                                  │
│  ├─ String storage (dedupliquees)             │
│  └─ Identifiers                               │
├──────────────────────────────────────────────┤
│  Regexp Table                                  │
│  CJS Module Table                              │
│  Array Buffer                                  │
│  Object Key Buffer                             │
│  Object Value Buffer                           │
└──────────────────────────────────────────────┘
```

### 2.3 Compilateur Hermes en ligne de commande

Le compilateur `hermesc` permet d'inspecter et d'optimiser les bundles :

```bash
# Compiler un fichier JS en bytecode
npx react-native-community/cli hermesc -emit-binary -out bundle.hbc bundle.js

# Desassembler le bytecode pour inspection
npx hermesc -dump-bytecode bundle.hbc

# Afficher les statistiques du bytecode
npx hermesc -dump-bytecode bundle.hbc | head -50
```

Exemple de sortie du desassembleur :

```
Function<global>(1 params, 15 registers, 0 symbols):
    CreateEnvironment r0
    GetGlobalObject   r1
    TryGetById        r2, r1, 1, "require"
    LoadConstString   r3, "react-native"
    Call1             r2, r2, r3
    GetByIdShort      r4, r2, 2, "AppRegistry"
    ...
```

### 2.4 Impact sur la taille du bundle

La compilation en bytecode reduit generalement la taille du bundle de 30 a 50% par rapport au JavaScript source, car :

- Les commentaires et whitespace sont elimines
- Les identifiants sont dedupliques dans la string table
- Les constantes sont optimisees
- Les instructions sont encodees de maniere compacte

```
┌──────────────────────────────────────────────────────┐
│           Comparaison tailles typiques                │
├──────────────────────────────────────────────────────┤
│  Source JS minifie       │  4.2 Mo                    │
│  Bytecode Hermes (.hbc)  │  2.8 Mo  (−33%)           │
│  Bytecode + gzip         │  0.9 Mo  (−78%)           │
└──────────────────────────────────────────────────────┘
```

---

## 3. Hermes vs V8 vs JavaScriptCore

### 3.1 Comparatif detaille

| Critere | Hermes | V8 (via jsc-android) | JavaScriptCore |
|---------|--------|---------------------|----------------|
| **Compilation** | AOT → bytecode | JIT (multi-tier) | JIT (DFG + FTL) |
| **Startup time** | Excellent (50-150ms) | Lent (200-600ms) | Moyen (150-400ms) |
| **Throughput** | Bon | Excellent | Tres bon |
| **Memoire idle** | ~30 Mo | ~60 Mo | ~45 Mo |
| **Taille binaire** | ~3 Mo | ~8 Mo | ~4 Mo (iOS inclus) |
| **GC** | GenGC (generationnel) | Orinoco (concurrent) | Riptide (concurrent) |
| **Source maps** | Oui | Oui | Oui |
| **Chrome DevTools** | Oui (CDP) | Natif | Safari DevTools |
| **Platformes RN** | iOS + Android | Android (non officiel) | iOS (systeme) |
| **Proxy/Reflect** | Complet (0.70+) | Complet | Complet |
| **Intl** | Partiel (polyfill) | Complet | Complet |

### 3.2 Quand Hermes est-il avantageux ?

```
┌────────────────────────────────────────────────────────────────┐
│               Scenarios ou Hermes excelle                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Cold start critique                                        │
│     → Apps e-commerce, banques, livraison                      │
│     → Reduction de 200-400ms sur le TTI                        │
│                                                                 │
│  2. Appareils bas/milieu de gamme                              │
│     → RAM limitee (2-4 Go)                                     │
│     → CPU faible (Mediatek, Snapdragon 4xx)                   │
│     → Hermes utilise 50% moins de memoire                      │
│                                                                 │
│  3. Taille de l'APK/IPA                                        │
│     → Hermes binaire ~3 Mo vs V8 ~8 Mo                        │
│     → Bytecode plus compact que JS minifie                     │
│                                                                 │
│  4. Respect de la vie privee                                   │
│     → Pas de JIT = pas de pages memoire W+X                   │
│     → Compatible App Store (pas de code genere a l'execution)  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Limitations de Hermes

Hermes fait des compromis deliberes :

1. **Pas de JIT** : le throughput pur est inferieur a V8 pour les calculs intensifs (10-30% plus lent en boucles numeriques)
2. **Intl partiel** : `Intl.DateTimeFormat`, `Intl.NumberFormat` necessitent des polyfills (fournis par Expo)
3. **eval() desactive** : `eval()` et `new Function()` ne sont pas supportes par defaut (securite)
4. **ES2024 partiel** : certaines fonctionnalites recentes arrivent avec du retard

```typescript
// Ce qui NE fonctionne PAS avec Hermes par defaut :
eval('1 + 1');                    // Error: eval is disabled
new Function('a', 'return a');    // Error: Function constructor disabled

// Alternatives :
// - Utiliser des modules pre-compiles
// - Activer eval dans hermes.config.js (non recommande)
```

---

## 4. Garbage Collection : GenGC

### 4.1 Architecture du garbage collector

Hermes utilise **GenGC** (Generational Garbage Collector), un collecteur generationnel a deux generations, optimise pour les patterns d'allocation mobiles.

```
┌──────────────────────────────────────────────────────────────┐
│                    GenGC — Architecture                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────┐                 │
│  │        Young Generation (YG)             │                 │
│  │                                          │                 │
│  │  ┌──────────┐  ┌──────────┐             │                 │
│  │  │ Semi-A   │  │ Semi-B   │  (copy GC)  │                 │
│  │  │ (from)   │  │ (to)     │             │                 │
│  │  └──────────┘  └──────────┘             │                 │
│  │                                          │                 │
│  │  Taille: 8-32 Mo  │  Collecte: <5ms      │                 │
│  └─────────────────────────────────────────┘                 │
│                    │ promotion                                │
│                    ▼                                          │
│  ┌─────────────────────────────────────────┐                 │
│  │        Old Generation (OG)               │                 │
│  │                                          │                 │
│  │  ┌─────────────────────────────────┐    │                 │
│  │  │  Mark-Compact                    │    │                 │
│  │  │  (mark → sweep → compact)       │    │                 │
│  │  └─────────────────────────────────┘    │                 │
│  │                                          │                 │
│  │  Taille: configurable  │  Collecte: <30ms│                 │
│  └─────────────────────────────────────────┘                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Les deux generations

**Young Generation (YG)** :
- Utilise un algorithme de copie (semi-space copying GC)
- La plupart des objets meurent jeunes ("hypothese generationnelle")
- Collecte tres rapide (< 5ms), frequente
- Taille typique : 8-32 Mo

**Old Generation (OG)** :
- Recoit les objets qui survivent a plusieurs collectes YG
- Algorithme mark-compact (compaction pour eviter la fragmentation)
- Collecte plus lente mais moins frequente (< 30ms)
- Taille configurable selon les ressources de l'appareil

### 4.3 Strategies de collecte

```typescript
// Les differents types de collecte
// (se produisent automatiquement, illustratif uniquement)

// 1. YG Collection (mineure) — tres frequente
//    Declenchee quand la young gen est pleine
//    Copie les objets vivants vers l'autre semi-space
//    Les objets "ages" sont promus vers l'old gen

// 2. OG Collection (majeure) — moins frequente
//    Declenchee quand l'old gen depasse un seuil
//    Phase mark : marque tous les objets accessibles
//    Phase compact : deplace les objets pour eliminer la fragmentation

// 3. Full GC — rare
//    Collecte les deux generations
//    Declenchee en cas de pression memoire critique

// Configuration Hermes GC (avancee)
// Dans le fichier hermes.config.js ou via flags :
// --gc-init-heap=33554432     (32 Mo heap initial)
// --gc-max-heap=536870912     (512 Mo heap max)
// --gc-sanitize-rate=0        (desactiver sanitize en prod)
```

### 4.4 Monitorer le GC en developpement

```typescript
// Obtenir des statistiques GC
if ((global as any).HermesInternal) {
  const gc = (global as any).HermesInternal.getInstrumentedStats();
  console.log('Heap size:', gc['js_heapSize']);
  console.log('Heap used:', gc['js_heapUsed']);
  console.log('GC count (minor):', gc['js_numGCs']);
  console.log('GC time total:', gc['js_gcTime'], 'ms');
}
```

---

## 5. Debugging avec Hermes

### 5.1 Chrome DevTools Protocol (CDP)

Hermes implemente nativement le **Chrome DevTools Protocol**, permettant un debugging riche directement depuis Chrome ou VS Code.

```
┌──────────────────────────────────────────────────────────────┐
│              Architecture de debugging Hermes                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   Chrome DevTools  ◄─── WebSocket ───►  Hermes Inspector     │
│   (ou VS Code)                          (dans l'app)         │
│                                                               │
│   Fonctionnalites :                                          │
│   - Breakpoints (ligne, conditionnel, exception)             │
│   - Step over / into / out                                   │
│   - Watch expressions                                        │
│   - Call stack                                                │
│   - Scope variables                                          │
│   - Console                                                   │
│   - Profiler (CPU sampling)                                  │
│   - Memory (heap snapshots)                                  │
│   - Network (via interceptor)                                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Source maps

Le bytecode Hermes peut inclure des source maps pour mapper les instructions bytecode vers le code TypeScript/JavaScript original :

```bash
# Generer le bundle avec source maps
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output bundle.js \
  --sourcemap-output bundle.js.map

# Compiler avec source maps
hermesc -emit-binary \
  -out bundle.hbc \
  -source-map=bundle.hbc.map \
  bundle.js
```

### 5.3 Configuration VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Hermes",
      "request": "attach",
      "type": "reactnativedirect",
      "cwd": "${workspaceFolder}",
      "port": 8081
    }
  ]
}
```

### 5.4 Console et logging performance

```typescript
// Hermes optimise les appels console en mode release
// En dev, utiliser les groupes pour structurer les logs

console.group('Startup Profiling');
console.time('JS Init');

// ... initialisation

console.timeEnd('JS Init');
console.groupEnd();

// Attention : en production, les console.log sont
// generalement supprimes par Metro (babel-plugin-transform-remove-console)
```

---

## 6. Mode Bridgeless (New Architecture)

### 6.1 L'ancien bridge vs le nouveau mode

Historiquement, React Native utilisait un **bridge asynchrone** pour communiquer entre le thread JavaScript et le thread natif. Ce bridge etait un goulot d'etranglement :

```
┌──────────────────────────────────────────────────────────────┐
│              Ancien modele : Bridge (< 0.74)                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   JS Thread ──► JSON.serialize ──► Bridge ──► Native Thread  │
│                                                               │
│   Problemes :                                                │
│   - Serialisation JSON couteuse                              │
│   - Communication asynchrone uniquement                      │
│   - Pas de references directes aux objets natifs             │
│   - Latence de 1-3 frames pour les updates UI                │
│   - File d'attente saturee = "bridge congestion"             │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              Nouveau modele : Bridgeless (0.74+)              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   JS Thread ──► JSI (C++) ──► Host Objects ──► Native        │
│                                                               │
│   Avantages :                                                │
│   - Appels synchrones via JSI                                │
│   - Zero serialisation (references directes C++)             │
│   - Turbo Modules charges a la demande (lazy loading)        │
│   - Fabric : rendu synchrone et concurrent                   │
│   - Codegen : interfaces typees auto-generees                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Les piliers du mode Bridgeless

```
┌──────────────────────────────────────────────────────────────┐
│                   New Architecture — Piliers                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. JSI (JavaScript Interface)                               │
│     → API C++ pour communication directe JS ↔ Native        │
│     → Remplace le bridge JSON                                │
│     → Permet les appels synchrones                           │
│                                                               │
│  2. Fabric (Nouveau renderer)                                │
│     → Arbre d'ombres (shadow tree) en C++                    │
│     → Rendu concurrent (comme React 18)                      │
│     → Mesure synchrone des layouts                           │
│                                                               │
│  3. Turbo Modules                                            │
│     → Modules natifs charges a la demande                    │
│     → Interfaces typees (codegen depuis Flow/TS)             │
│     → Acces synchrone depuis JS                              │
│                                                               │
│  4. Codegen                                                  │
│     → Genere les bindings C++ depuis les specs TS/Flow       │
│     → Securite de type a la frontiere JS/Native              │
│     → Elimine les erreurs de serialisation                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Activer le mode Bridgeless

Depuis React Native 0.76+ et Expo SDK 52+, le mode Bridgeless est active par defaut. Pour les versions precedentes :

```json
// app.json (Expo)
{
  "expo": {
    "newArchEnabled": true
  }
}
```

```ruby
# ios/Podfile (bare RN)
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

```properties
# android/gradle.properties (bare RN)
newArchEnabled=true
```

### 6.4 JSI en detail

JSI permet a JavaScript d'appeler directement des fonctions C++ sans serialisation :

```typescript
// Avant (bridge) : appel asynchrone, serialisation JSON
// NativeModules.MyModule.getValue() → bridge → JSON → native → JSON → bridge → JS

// Apres (JSI) : appel synchrone, reference directe
// global.__myModule.getValue() → C++ → valeur directe

// Exemple : Turbo Module avec JSI
// Le codegen genere automatiquement les bindings a partir de la spec :

// specs/NativeCalculator.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  add(a: number, b: number): number;        // synchrone !
  multiply(a: number, b: number): number;    // synchrone !
  fetchData(url: string): Promise<string>;   // asynchrone possible aussi
}

export default TurboModuleRegistry.getEnforcing<Spec>('Calculator');
```

### 6.5 Impact sur les performances

```
┌──────────────────────────────────────────────────────────────┐
│           Benchmarks Bridge vs Bridgeless                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Scenario                   │ Bridge    │ Bridgeless │ Gain  │
│  ──────────────────────────────────────────────────────────  │
│  Appel module natif (1x)    │ 0.8ms     │ 0.02ms     │ 40x  │
│  1000 appels natifs         │ 820ms     │ 18ms       │ 45x  │
│  Rendu liste 1000 items     │ 340ms     │ 180ms      │ 1.9x │
│  Update UI (1 propriete)    │ 2.1ms     │ 0.3ms      │ 7x   │
│  Startup (app moyenne)      │ 1200ms    │ 850ms      │ 1.4x │
│  Scroll FPS (60 items)      │ 48 fps    │ 59 fps     │ 1.2x │
│  Memoire idle               │ 85 Mo     │ 65 Mo      │ 1.3x │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 6.6 Migration et compatibilite

```typescript
// Verifier si le mode Bridgeless est actif
import { Platform } from 'react-native';

const isBridgeless = () => {
  // La presence de global.__turboModuleProxy indique le mode Bridgeless
  return !!(global as any).__turboModuleProxy;
};

const isFabricEnabled = () => {
  // Verifier si Fabric est actif
  return !!(global as any).nativeFabricUIManager;
};

console.log('Bridgeless:', isBridgeless());
console.log('Fabric:', isFabricEnabled());
```

> **Compatibilite** : la grande majorite des librairies populaires (react-navigation, reanimated, gesture-handler, expo-*) supportent le mode Bridgeless. Verifiez sur [reactnative.directory](https://reactnative.directory) le tag "New Architecture".

---

## 7. Performance Profiling

### 7.1 Sampling Profiler Hermes

Hermes embarque un sampling profiler qui echantillonne la stack d'appels a intervalles reguliers (typiquement toutes les 1ms) :

```typescript
// Demarrer le profiling depuis le code
if ((global as any).HermesInternal) {
  // Demarrer l'enregistrement
  (global as any).HermesInternal.enableSamplingProfiler();

  // ... code a profiler ...

  // Arreter et sauvegarder le profil
  (global as any).HermesInternal.disableSamplingProfiler();

  // Le profil est sauvegarde automatiquement
  // Recuperable via : adb pull /data/data/<package>/files/sampling-profiler-trace.cpuprofile
}
```

### 7.2 Lire un flame chart

Un flame chart visualise la stack d'appels dans le temps :

```
┌──────────────────────────────────────────────────────────────┐
│                   Flame Chart — Lecture                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Temps ──────────────────────────────────────────────►       │
│                                                               │
│  ┌──────────────────────────────────────────────────┐        │
│  │                    (root)                          │        │
│  ├──────────────┬───────────────────────────────────┤        │
│  │  AppRegistry │          renderApplication         │        │
│  ├──────────────┼──────────┬────────────────────────┤        │
│  │   require()  │ React    │     Navigation.init     │        │
│  ├──────────────┤ render() ├───────────┬────────────┤        │
│  │  metro init  │          │ HomeScreen│ API fetch   │        │
│  └──────────────┴──────────┴───────────┴────────────┘        │
│                                                               │
│  Largeur = temps CPU consomme                                │
│  Profondeur = profondeur de la stack                         │
│  → Chercher les barres larges = fonctions gourmandes         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 React DevTools Profiler

En complement du sampling profiler Hermes, le React DevTools Profiler mesure le temps de rendu des composants :

```typescript
// Wrapping avec Profiler pour mesurer un sous-arbre
import { Profiler } from 'react';

function onRenderCallback(
  id: string,                // Le "id" du Profiler
  phase: 'mount' | 'update', // "mount" ou "update"
  actualDuration: number,    // Temps de rendu en ms
  baseDuration: number,      // Temps sans memoization
  startTime: number,         // Timestamp de debut
  commitTime: number,        // Timestamp de commit
) {
  console.log(`[${id}] ${phase}: ${actualDuration.toFixed(2)}ms`);
}

function App() {
  return (
    <Profiler id="HomeScreen" onRender={onRenderCallback}>
      <HomeScreen />
    </Profiler>
  );
}
```

### 7.4 Performance Observer natif

```typescript
// Mesurer les performances avec performance.now()
// Disponible dans Hermes depuis RN 0.72

const measureStartup = () => {
  const marks: Record<string, number> = {};

  return {
    mark(name: string) {
      marks[name] = performance.now();
    },
    measure(name: string, startMark: string, endMark: string) {
      const start = marks[startMark];
      const end = marks[endMark];
      if (start !== undefined && end !== undefined) {
        console.log(`${name}: ${(end - start).toFixed(2)}ms`);
        return end - start;
      }
      return 0;
    },
  };
};

// Utilisation
const perf = measureStartup();
perf.mark('app_init');
// ... initialisation ...
perf.mark('first_render');
// ... premier rendu ...
perf.mark('interactive');

perf.measure('Init → Render', 'app_init', 'first_render');
perf.measure('Render → Interactive', 'first_render', 'interactive');
perf.measure('Total TTI', 'app_init', 'interactive');
```

---

## 8. Detection de fuites memoire

### 8.1 Sources courantes de fuites

```
┌──────────────────────────────────────────────────────────────┐
│              Sources de fuites memoire en RN                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Event listeners non nettoyes                             │
│     → useEffect sans cleanup function                        │
│     → addEventListener sans removeEventListener              │
│                                                               │
│  2. Timers/Intervals oublies                                 │
│     → setInterval sans clearInterval dans cleanup            │
│     → setTimeout sur composant demonte                       │
│                                                               │
│  3. Closures capturant des objets volumineux                 │
│     → Callbacks gardant une reference au state complet       │
│     → Handlers fermes sur des listes entieres                │
│                                                               │
│  4. Caches illimites                                         │
│     → Map/Set sans eviction                                  │
│     → Images en memoire sans LRU                             │
│                                                               │
│  5. Subscriptions non annulees                               │
│     → Observables RxJS sans unsubscribe                      │
│     → WebSocket sans close                                   │
│     → Firebase listeners sans off()                          │
│                                                               │
│  6. Navigation : ecrans empiles indefiniment                  │
│     → push() sans jamais pop/reset                           │
│     → Closures sur des ecrans non montes                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Heap Snapshots avec Hermes

```typescript
// Capturer un heap snapshot
if ((global as any).HermesInternal) {
  (global as any).HermesInternal.createHeapSnapshot('/path/to/snapshot.heapsnapshot');
  // Ouvrir dans Chrome DevTools → Memory tab → Load
}

// Strategie : comparer deux snapshots
// 1. Snapshot A : apres le premier rendu
// 2. Naviguer vers un ecran puis revenir
// 3. Forcer le GC
// 4. Snapshot B
// → Les objets dans B mais pas dans A = fuite potentielle
```

### 8.3 Patterns de prevention

```typescript
import { useEffect, useRef, useCallback } from 'react';

// Pattern 1 : Cleanup dans useEffect
function SafeComponent() {
  useEffect(() => {
    const subscription = api.subscribe(handleData);
    const timer = setInterval(poll, 5000);

    // CLEANUP — previent les fuites
    return () => {
      subscription.unsubscribe();
      clearInterval(timer);
    };
  }, []);
}

// Pattern 2 : Abort controller pour les requetes
function FetchComponent({ id }: { id: string }) {
  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/data/${id}`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') throw err;
      });

    return () => controller.abort();
  }, [id]);
}

// Pattern 3 : Ref guard pour les callbacks asynchrones
function AsyncSafeComponent() {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAsync = useCallback(async () => {
    const data = await fetchData();
    if (isMounted.current) {
      setState(data); // Safe : on verifie avant de mettre a jour
    }
  }, []);
}

// Pattern 4 : Cache LRU pour les images
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  constructor(private maxSize: number) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Deplacer en fin de Map (plus recent)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    this.cache.delete(key);
    if (this.cache.size >= this.maxSize) {
      // Supprimer le plus ancien (premier element de Map)
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, value);
  }
}
```

---

## 9. Optimiser le temps de demarrage

### 9.1 Les phases du demarrage

```
┌──────────────────────────────────────────────────────────────┐
│              Phases de demarrage React Native                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Native Init          (50-150ms)                          │
│     → Chargement de la librairie native RN                   │
│     → Initialisation de Hermes VM                            │
│     → Chargement du bytecode .hbc                            │
│                                                               │
│  2. JS Init              (50-300ms)                          │
│     → Execution du bundle (require, modules)                 │
│     → Enregistrement de l'app (AppRegistry)                  │
│     → Initialisation des modules natifs                      │
│                                                               │
│  3. Premier Rendu        (30-200ms)                          │
│     → React reconciliation                                   │
│     → Fabric layout (Yoga)                                   │
│     → Commit vers la UI native                               │
│                                                               │
│  4. Interactivite (TTI)  (100-500ms apres render)            │
│     → Chargement des donnees initiales                       │
│     → Navigation prete                                       │
│     → Gestes actifs                                          │
│                                                               │
│  Total typique : 400ms (optimise) → 2000ms+ (non optimise)  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Techniques d'optimisation

```typescript
// 1. Lazy loading des ecrans
import { lazy } from 'react';

// Au lieu de :
// import SettingsScreen from './screens/SettingsScreen';

// Utiliser :
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));

// Avec React Navigation, le lazy loading est integre :
// Les ecrans qui ne sont pas dans la stack active ne sont pas importes


// 2. Reduire le require tree
// Eviter les imports barrels qui chargent tout :
// MAUVAIS :
// import { Button, Card, Modal, Drawer, List } from './components';
// → charge TOUT le dossier components meme si on n'utilise que Button

// BON :
// import { Button } from './components/Button';
// → ne charge que Button


// 3. Inline requires (Metro)
// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,  // Deplace les require() au point d'utilisation
      },
    }),
  },
};

// Avant (inline requires off) :
// const heavyLib = require('heavy-lib');  // Execute au demarrage
// function rarement() { heavyLib.doStuff(); }

// Apres (inline requires on) :
// function rarement() { require('heavy-lib').doStuff(); }  // Execute a l'appel
```

### 9.3 Mesurer le startup concretement

```typescript
// Tracker de startup complet
interface StartupMetrics {
  nativeInit: number;
  jsInit: number;
  firstRender: number;
  tti: number;
  totalStartup: number;
}

class StartupTracker {
  private marks = new Map<string, number>();
  private origin: number;

  constructor() {
    this.origin = performance.now();
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  getMetrics(): StartupMetrics {
    const jsInit = this.marks.get('js_init') ?? this.origin;
    const firstRender = this.marks.get('first_render') ?? jsInit;
    const tti = this.marks.get('tti') ?? firstRender;

    return {
      nativeInit: jsInit - this.origin,
      jsInit: (this.marks.get('js_ready') ?? jsInit) - jsInit,
      firstRender: firstRender - (this.marks.get('js_ready') ?? jsInit),
      tti: tti - firstRender,
      totalStartup: tti - this.origin,
    };
  }

  report(): void {
    const m = this.getMetrics();
    console.log('=== Startup Metrics ===');
    console.log(`  Native init:   ${m.nativeInit.toFixed(1)}ms`);
    console.log(`  JS init:       ${m.jsInit.toFixed(1)}ms`);
    console.log(`  First render:  ${m.firstRender.toFixed(1)}ms`);
    console.log(`  TTI:           ${m.tti.toFixed(1)}ms`);
    console.log(`  TOTAL:         ${m.totalStartup.toFixed(1)}ms`);
  }
}
```

### 9.4 Optimisation du bundle

```bash
# Analyser le contenu du bundle Metro
npx react-native-bundle-visualizer

# Identifier les plus gros modules
# Resultat typique :
#   node_modules/moment  → 287 Ko  → remplacer par date-fns/dayjs
#   node_modules/lodash  → 531 Ko  → importer uniquement les fonctions
#   src/screens/Admin    → 145 Ko  → lazy load
```

```
┌──────────────────────────────────────────────────────────────┐
│           Checklist optimisation startup                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [ ] Hermes active (jsEngine: "hermes")                      │
│  [ ] Bridgeless active (newArchEnabled: true)                │
│  [ ] Inline requires actives                                 │
│  [ ] Lazy loading des ecrans secondaires                     │
│  [ ] Pas d'import barrel (imports directs)                   │
│  [ ] Remplacement librairies lourdes (moment → dayjs)        │
│  [ ] Images optimisees (WebP, taille correcte)               │
│  [ ] Splash screen natif (pas de flash blanc)                │
│  [ ] Preload des donnees critiques (splash pendant fetch)    │
│  [ ] RAM bundle (Android, pour les tres gros bundles)        │
│  [ ] Proguard/R8 active (Android release)                    │
│  [ ] Bitcode strip (iOS release)                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Projet pratique : Profiler et optimiser le startup

### 10.1 Scenario

On dispose d'une application avec un startup lent (2.5 secondes). L'objectif est d'identifier les goulots d'etranglement et de reduire le TTI sous 800ms.

### 10.2 Etape 1 : Mesurer la baseline

```typescript
// index.ts — Point d'entree de l'app
import { AppRegistry } from 'react-native';

// Marquer le debut JS
performance.mark('js_start');

// Imports lourds (problematiques)
import moment from 'moment';                    // 287 Ko
import _ from 'lodash';                          // 531 Ko
import { everything } from './components';       // Import barrel
import { initAnalytics } from './analytics';     // Synchrone au startup

// Marquer la fin des imports
performance.mark('imports_done');

import App from './App';

// Marquer l'enregistrement
performance.mark('register_start');
AppRegistry.registerComponent('MyApp', () => App);
performance.mark('register_done');

// Mesurer
performance.measure('Imports', 'js_start', 'imports_done');
performance.measure('Register', 'register_start', 'register_done');

// Resultat typique :
// Imports: 890ms (!!)
// Register: 12ms
```

### 10.3 Etape 2 : Identifier les problemes

```typescript
// Profiler les require avec le sampling profiler
// Le flame chart revele :
//
//  ├── moment (287ms) ← PROBLEME : charge locales + parsing
//  ├── lodash (180ms) ← PROBLEME : charge 300+ fonctions
//  ├── components/index.ts (220ms) ← PROBLEME : barrel import
//  │   ├── AdminPanel (80ms) ← pas besoin au demarrage
//  │   ├── SettingsForm (60ms) ← pas besoin au demarrage
//  │   └── Chart (80ms) ← pas besoin au demarrage
//  └── analytics.init (190ms) ← PROBLEME : synchrone
```

### 10.4 Etape 3 : Appliquer les optimisations

```typescript
// APRES optimisation — index.ts

import { AppRegistry } from 'react-native';

performance.mark('js_start');

// 1. Remplacer moment par dayjs (2 Ko vs 287 Ko)
// import dayjs from 'dayjs'; // charge seulement si utilise (inline require)

// 2. Remplacer lodash par imports directs
// import debounce from 'lodash/debounce'; // 1 Ko vs 531 Ko

// 3. Supprimer le barrel import — chaque ecran importe directement
// Les composants sont importes la ou ils sont utilises

// 4. Analytics : initialisation differee
// Ne plus bloquer le startup

import App from './App';

performance.mark('imports_done');

AppRegistry.registerComponent('MyApp', () => App);
performance.mark('register_done');

performance.measure('Imports', 'js_start', 'imports_done');
// Resultat : Imports: 95ms (vs 890ms avant = -89%)
```

### 10.5 Etape 4 : Verifier les resultats

```
┌──────────────────────────────────────────────────────────────┐
│           Resultats de l'optimisation                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Metrique          │ Avant    │ Apres    │ Gain              │
│  ─────────────────────────────────────────────────────       │
│  JS Imports        │ 890ms    │ 95ms     │ -89%              │
│  First Render      │ 420ms    │ 280ms    │ -33%              │
│  TTI               │ 2500ms   │ 720ms   │ -71%              │
│  Bundle size       │ 4.2 Mo   │ 2.1 Mo   │ -50%             │
│  Memory at idle    │ 95 Mo    │ 62 Mo    │ -35%              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Resume et aide-memoire

### 11.1 Hermes — points cles

| Concept | Description |
|---------|-------------|
| Compilation AOT | JS → bytecode (.hbc) au build, pas de JIT a l'execution |
| GenGC | GC generationnel : young gen (copy) + old gen (mark-compact) |
| CDP | Chrome DevTools Protocol pour debugging natif |
| Source maps | Mapping bytecode → source TypeScript pour le debugging |
| Pas de eval() | Securite : eval/Function constructor desactives |

### 11.2 Mode Bridgeless — points cles

| Concept | Description |
|---------|-------------|
| JSI | Interface C++ directe entre JS et Native, zero serialisation |
| Fabric | Nouveau renderer concurrent, shadow tree en C++ |
| Turbo Modules | Modules natifs lazy-loaded, appels synchrones |
| Codegen | Generation automatique des bindings types |

### 11.3 Performance — checklist rapide

```
┌──────────────────────────────────────────────────────────────┐
│  Checklist performance Hermes + Bridgeless                    │
│                                                               │
│  [ ] Hermes + Bridgeless actifs                              │
│  [ ] Inline requires actives dans Metro                      │
│  [ ] Imports directs (pas de barrels)                        │
│  [ ] Lazy loading des ecrans non critiques                   │
│  [ ] Librairies legeres (dayjs, lodash-es tree-shaking)      │
│  [ ] Cleanup dans tous les useEffect                         │
│  [ ] AbortController pour les fetch                          │
│  [ ] Pas de cache illimite (utiliser LRU)                    │
│  [ ] Profiling regulier (sampling profiler + heap snapshots) │
│  [ ] Splash screen natif pendant le chargement               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Exercices du module

Rendez-vous au [Lab 25](/labs/lab-25-hermes-bridgeless/) pour pratiquer les concepts vus dans ce module. Le lab simule en TypeScript pur les mecanismes de profiling, d'analyse bytecode, de detection de fuites memoire, de GC et de suivi de startup propres a Hermes et au mode Bridgeless.
