# Module 23 — Modules natifs et Turbo Modules

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 5/5        | 90 min        | [Lab 23](../labs/lab-23-modules-natifs/) | [Quiz 23](../quizzes/quiz-23-modules-natifs.html) |

## Objectifs

- Comprendre quand et pourquoi créer un module natif
- Maîtriser l'architecture des Turbo Modules (JSI, codegen, type-safe)
- Écrire un fichier spec TypeScript et générer le code natif
- Implementer un Turbo Module sur iOS (Swift / Objective-C++)
- Implementer un Turbo Module sur Android (Kotlin)
- Connaître l'Expo Modules API comme alternative simplifiee
- Tester un module natif

---

:::warning Bienvenue en phase Expert
Les modules 23 a 26 plongent dans les couches internes de React Native : code natif, moteur JavaScript, architecture du renderer. C'est plus exigeant que tout ce qui precede — vous allez écrire du C++, du Swift et du Kotlin. C'est aussi ce qui separe un développeur React Native d'un **expert** React Native. Prenez votre temps, chaque module est independant.
:::

## Pourquoi les modules natifs ?

React Native couvre les besoins les plus courants via ses APIs integrees et l'ecosysteme Expo. Mais certaines situations necessitent un acces direct au code natif :

### Cas d'usage typiques

| Besoin | Exemple | Module existant ? |
|--------|---------|-------------------|
| Hardware spécifique | Lecteur NFC industriel | Non |
| SDK proprietaire | SDK bancaire, SDK d'authentification biometrique avancee | Rarement |
| Performance critique | Traitement d'image en temps réel, cryptographie | Parfois |
| API plateforme recente | API Android 15 / iOS 18 non encore wrappee | Temporairement |
| Code C/C++ existant | Moteur de calcul, parseur binaire | Non |

### Decision tree

```
Besoin natif ?
  |
  +-- Expo module existe ? --> Utiliser le module Expo
  |
  +-- Lib communautaire existe ? --> Evaluer qualite / maintenance
  |
  +-- Besoin simple (une plateforme) ? --> Expo Modules API
  |
  +-- Besoin complexe, multi-plateforme, perf critique ? --> Turbo Module
```

> **Regle d'or** : n'ecrivez du code natif que si aucune solution existante ne repond au besoin. Chaque ligne de code natif est une ligne de plus a maintenir sur 2 plateformes.

---

## Architecture des Turbo Modules

### L'ancien monde : le Bridge

Avant la New Architecture, les modules natifs communiquaient via le Bridge :

```
JavaScript Thread           Bridge (JSON)           Native Thread
      |                         |                        |
  NativeModules.MyModule  -->  serialize  -->   Objective-C / Java
      |                         |                        |
  callback/promise        <--  deserialize  <--   retour natif
```

Problemes :
- **Asynchrone uniquement** : chaque appel traverse le bridge de manière asynchrone
- **Serialisation JSON** : cout de conversion pour chaque appel
- **Pas de typage** : les erreurs ne sont detectees qu'a l'exécution
- **Initialisation eager** : tous les modules sont charges au démarrage

### Le monde actuel : JSI et Turbo Modules

Les Turbo Modules utilisent JSI (JavaScript Interface) pour communiquer directement avec le code natif :

```
JavaScript Thread                     Native (C++ / ObjC++ / JNI)
      |                                         |
  TurboModule.myMethod()  -- JSI (C++) -->  Implementation native
      |                                         |
  retour synchrone         <-- memoire -->    retour direct
```

Avantages :
- **Synchrone possible** : les appels peuvent retourner immediatement
- **Pas de serialisation** : les objets sont partages en mémoire via C++
- **Type-safe** : le codegen généré des interfaces typees à partir du spec
- **Lazy loading** : les modules ne sont charges qu'a leur premier usage

### Schema d'architecture détaillé

```
┌─────────────────────────────────────────────────┐
│                    JavaScript                    │
│                                                  │
│  import { getBatteryLevel } from 'BatteryModule' │
│                                                  │
└───────────────┬─────────────────────────────────┘
                │ JSI (C++ host objects)
                │ Appel synchrone, pas de serialisation
┌───────────────▼─────────────────────────────────┐
│              TurboModule (C++)                   │
│                                                  │
│  - Interface generee par codegen                │
│  - Validation de types a la compilation         │
│  - Dispatch vers implementation plateforme      │
│                                                  │
├──────────────────┬──────────────────────────────┤
│   iOS (ObjC++)   │     Android (JNI/Kotlin)     │
│                  │                               │
│  UIDevice        │  BatteryManager              │
│  .batteryLevel   │  .getIntProperty(...)        │
│                  │                               │
└──────────────────┴──────────────────────────────┘
```

---

## Créer un Turbo Module : le workflow complet

### Étape 1 : le fichier spec (TypeScript)

Le spec est le contrat entre JavaScript et le code natif. Il est écrit en TypeScript et utilise les conventions de codegen.

```typescript
// specs/NativeBatteryModule.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Methode synchrone — retourne directement
  getBatteryLevel(): number;

  // Methode asynchrone — retourne une Promise
  getBatteryState(): Promise<string>;

  // Methode avec parametres
  setBatteryThreshold(threshold: number): void;

  // Constantes exposees au JS
  getConstants(): {
    BATTERY_STATE_CHARGING: string;
    BATTERY_STATE_FULL: string;
    BATTERY_STATE_UNPLUGGED: string;
    BATTERY_STATE_UNKNOWN: string;
  };
}

export default TurboModuleRegistry.getEnforcing<Spec>('BatteryModule');
```

### Conventions du spec

| Convention | Description |
|-----------|-------------|
| Fichier `Native*.ts` | Prefixe `Native` obligatoire pour le codegen |
| `extends TurboModule` | Interface obligatoire |
| `TurboModuleRegistry.getEnforcing` | Crash si le module n'existe pas (vs `get` qui retourne null) |
| Types supportes | `boolean`, `number`, `string`, `Object`, `Array`, `Promise<T>` |
| `getConstants()` | Méthode speciale pour les constantes statiques |

### Types supportes par le codegen

```typescript
// Types primitifs
method1(): boolean;
method2(): number;
method3(): string;
method4(): void;

// Types nullable
method5(): string | null;

// Objets types
method6(): { key: string; value: number };

// Arrays
method7(): string[];

// Promises (methodes async)
method8(): Promise<string>;

// Callbacks (legacy, preferer les Promises)
method9(callback: (result: string) => void): void;

// Enums (via union types)
method10(): 'charging' | 'full' | 'unplugged';

// Types complexes (avec interface)
method11(): BatteryInfo;
```

### Étape 2 : configuration du codegen

Dans le `package.json` du module (où du projet) :

```json
{
  "codegenConfig": {
    "name": "BatteryModuleSpec",
    "type": "modules",
    "jsSrcsDir": "specs",
    "android": {
      "javaPackageName": "com.myapp.battery"
    }
  }
}
```

Le codegen est exécuté automatiquement lors du build :

```bash
# iOS — genere les fichiers dans ios/build/generated/
cd ios && pod install

# Android — genere dans android/app/build/generated/source/codegen/
cd android && ./gradlew generateCodegenArtifactsFromSchema
```

### Ce que généré le codegen

Pour iOS :
```
ios/build/generated/
  ├── BatteryModuleSpec/
  │   ├── BatteryModuleSpec.h        // Interface C++
  │   └── BatteryModuleSpec-generated.mm  // Dispatch table
```

Pour Android :
```
android/app/build/generated/source/codegen/
  ├── java/com/myapp/battery/
  │   └── NativeBatteryModuleSpec.java  // Interface Java
  └── jni/
      ├── BatteryModuleSpec.h           // Interface C++
      └── BatteryModuleSpec-generated.cpp
```

---

## Implementation iOS

### Structure du module iOS

```
ios/
  ├── BatteryModule.h          // Header Objective-C++
  ├── BatteryModule.mm         // Implementation Objective-C++
  └── BatteryModule-Bridging-Header.h  // Si Swift
```

### Implementation en Objective-C++

```objc
// BatteryModule.h
#import <React-RCTFabric/RCTTurboModule.h>
#import <BatteryModuleSpec/BatteryModuleSpec.h>

@interface BatteryModule : NSObject <NativeBatteryModuleSpec>
@end
```

```objc
// BatteryModule.mm
#import "BatteryModule.h"
#import <UIKit/UIKit.h>

@implementation BatteryModule

RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBatteryModuleSpecJSI>(params);
}

- (NSNumber *)getBatteryLevel {
    [UIDevice currentDevice].batteryMonitoringEnabled = YES;
    float level = [UIDevice currentDevice].batteryLevel;
    return @(level); // 0.0 a 1.0, ou -1 si inconnu
}

- (void)getBatteryState:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
    [UIDevice currentDevice].batteryMonitoringEnabled = YES;
    UIDeviceBatteryState state = [UIDevice currentDevice].batteryState;

    NSString *stateStr;
    switch (state) {
        case UIDeviceBatteryStateCharging: stateStr = @"charging"; break;
        case UIDeviceBatteryStateFull: stateStr = @"full"; break;
        case UIDeviceBatteryStateUnplugged: stateStr = @"unplugged"; break;
        default: stateStr = @"unknown"; break;
    }

    resolve(stateStr);
}

- (void)setBatteryThreshold:(double)threshold {
    // Stocker le seuil pour les notifications
    // Implementation specifique...
}

- (NSDictionary *)getConstants {
    return @{
        @"BATTERY_STATE_CHARGING": @"charging",
        @"BATTERY_STATE_FULL": @"full",
        @"BATTERY_STATE_UNPLUGGED": @"unplugged",
        @"BATTERY_STATE_UNKNOWN": @"unknown",
    };
}

@end
```

### Avec Swift (via Bridging Header)

Swift ne peut pas directement implementer un Turbo Module (pas de support C++). On utilise un wrapper Objective-C++ :

```swift
// BatteryModuleImpl.swift
import UIKit

@objc public class BatteryModuleImpl: NSObject {

    @objc public static func getBatteryLevel() -> Float {
        UIDevice.current.isBatteryMonitoringEnabled = true
        return UIDevice.current.batteryLevel
    }

    @objc public static func getBatteryState() -> String {
        UIDevice.current.isBatteryMonitoringEnabled = true
        switch UIDevice.current.batteryState {
        case .charging: return "charging"
        case .full: return "full"
        case .unplugged: return "unplugged"
        @unknown default: return "unknown"
        }
    }
}
```

```objc
// BatteryModule.mm — wrapper ObjC++
#import "BatteryModule.h"
#import "MyApp-Swift.h" // Bridging header genere

@implementation BatteryModule

RCT_EXPORT_MODULE()

- (NSNumber *)getBatteryLevel {
    return @([BatteryModuleImpl getBatteryLevel]);
}

- (void)getBatteryState:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
    resolve([BatteryModuleImpl getBatteryState]);
}

// ... reste de l'implementation

@end
```

---

## Implementation Android

### Structure du module Android

```
android/app/src/main/java/com/myapp/battery/
  ├── BatteryModule.kt           // Implementation Kotlin
  └── BatteryPackage.kt          // Registration du module
```

### Implementation en Kotlin

```kotlin
// BatteryModule.kt
package com.myapp.battery

import android.content.Context
import android.os.BatteryManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.myapp.battery.NativeBatteryModuleSpec

@ReactModule(name = BatteryModule.NAME)
class BatteryModule(reactContext: ReactApplicationContext) :
    NativeBatteryModuleSpec(reactContext) {

    companion object {
        const val NAME = "BatteryModule"
    }

    override fun getName(): String = NAME

    override fun getBatteryLevel(): Double {
        val batteryManager = reactApplicationContext
            .getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val level = batteryManager.getIntProperty(
            BatteryManager.BATTERY_PROPERTY_CAPACITY
        )
        return level.toDouble() / 100.0 // Normaliser entre 0.0 et 1.0
    }

    override fun getBatteryState(promise: Promise) {
        try {
            val batteryManager = reactApplicationContext
                .getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            val status = batteryManager.getIntProperty(
                BatteryManager.BATTERY_PROPERTY_STATUS
            )
            val state = when (status) {
                BatteryManager.BATTERY_STATUS_CHARGING -> "charging"
                BatteryManager.BATTERY_STATUS_FULL -> "full"
                BatteryManager.BATTERY_STATUS_DISCHARGING,
                BatteryManager.BATTERY_STATUS_NOT_CHARGING -> "unplugged"
                else -> "unknown"
            }
            promise.resolve(state)
        } catch (e: Exception) {
            promise.reject("BATTERY_ERROR", e.message, e)
        }
    }

    override fun setBatteryThreshold(threshold: Double) {
        // Implementation specifique...
    }

    override fun getTypedExportedConstants(): Map<String, Any> {
        return mapOf(
            "BATTERY_STATE_CHARGING" to "charging",
            "BATTERY_STATE_FULL" to "full",
            "BATTERY_STATE_UNPLUGGED" to "unplugged",
            "BATTERY_STATE_UNKNOWN" to "unknown",
        )
    }
}
```

### Enregistrement du package

```kotlin
// BatteryPackage.kt
package com.myapp.battery

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class BatteryPackage : TurboReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == BatteryModule.NAME) {
            BatteryModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                BatteryModule.NAME to ReactModuleInfo(
                    BatteryModule.NAME,   // name
                    BatteryModule.NAME,   // className
                    false,                // canOverrideExistingModule
                    false,                // needsEagerInit
                    true,                 // isCxxModule
                    true,                 // isTurboModule
                )
            )
        }
    }
}
```

### Registration dans MainApplication

```kotlin
// MainApplication.kt (extrait)
override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages.toMutableList()
    packages.add(BatteryPackage())
    return packages
}
```

---

## Utilisation cote JavaScript

```typescript
// hooks/useBattery.ts
import { useState, useEffect, useCallback } from 'react';
import BatteryModule from '../specs/NativeBatteryModule';

interface BatteryInfo {
  level: number;
  state: string;
}

export function useBattery() {
  const [battery, setBattery] = useState<BatteryInfo>({
    level: -1,
    state: 'unknown',
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // getBatteryLevel est synchrone (retour immediat via JSI)
      const level = BatteryModule.getBatteryLevel();

      // getBatteryState est asynchrone (Promise)
      const state = await BatteryModule.getBatteryState();

      setBattery({ level, state });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Constantes disponibles immediatement
  const constants = BatteryModule.getConstants();

  return { ...battery, isLoading, refresh, constants };
}
```

```tsx
// components/BatteryIndicator.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useBattery } from '../hooks/useBattery';

export function BatteryIndicator() {
  const { level, state, isLoading, constants } = useBattery();

  if (isLoading) return <Text>Chargement...</Text>;

  const percentage = Math.round(level * 100);
  const isCharging = state === constants.BATTERY_STATE_CHARGING;

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { width: `${percentage}%` }]} />
      <Text style={styles.text}>
        {percentage}% {isCharging ? '(en charge)' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 24,
    backgroundColor: '#333',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  bar: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 12,
  },
  text: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 24,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

---

## Expo Modules API : l'alternative simplifiee

Pour les cas où la complexite d'un Turbo Module complet n'est pas justifiee, Expo propose une API unifiee :

### Avantages de l'Expo Modules API

| Aspect | Turbo Module | Expo Modules API |
|--------|-------------|------------------|
| Boilerplate | Eleve (spec, codegen, package, registration) | Minimal |
| Swift direct | Non (wrapper ObjC++ nécessaire) | Oui |
| Kotlin direct | Oui | Oui |
| Codegen | Manuel | Automatique |
| Type-safe | Oui (via spec) | Oui (via annotations) |
| Ecosysteme | React Native pur | Expo (compatible bare workflow) |

### Créer un module avec expo-modules-core

```bash
# Creer le squelette du module
npx create-expo-module my-battery-module

# Structure generee :
# my-battery-module/
#   ├── src/
#   │   └── MyBatteryModule.ts        # API JavaScript
#   ├── ios/
#   │   └── MyBatteryModule.swift     # Swift direct !
#   ├── android/
#   │   └── src/main/java/.../
#   │       └── MyBatteryModule.kt
#   ├── expo-module.config.json
#   └── package.json
```

### Implementation iOS en Swift

```swift
// ios/MyBatteryModule.swift
import ExpoModulesCore
import UIKit

public class MyBatteryModule: Module {
    public func definition() -> ModuleDefinition {
        Name("MyBatteryModule")

        Constants([
            "CHARGING": "charging",
            "FULL": "full",
            "UNPLUGGED": "unplugged",
        ])

        // Fonction synchrone
        Function("getBatteryLevel") { () -> Double in
            UIDevice.current.isBatteryMonitoringEnabled = true
            return Double(UIDevice.current.batteryLevel)
        }

        // Fonction asynchrone
        AsyncFunction("getBatteryState") { () -> String in
            UIDevice.current.isBatteryMonitoringEnabled = true
            switch UIDevice.current.batteryState {
            case .charging: return "charging"
            case .full: return "full"
            case .unplugged: return "unplugged"
            default: return "unknown"
            }
        }

        // Evenement natif vers JS
        Events("onBatteryStateChanged")

        // Observable
        OnStartObserving {
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(self.batteryStateDidChange),
                name: UIDevice.batteryStateDidChangeNotification,
                object: nil
            )
        }

        OnStopObserving {
            NotificationCenter.default.removeObserver(self)
        }
    }

    @objc private func batteryStateDidChange() {
        sendEvent("onBatteryStateChanged", [
            "state": UIDevice.current.batteryState.rawValue,
        ])
    }
}
```

### Implementation Android en Kotlin

```kotlin
// android/.../MyBatteryModule.kt
package com.myapp.mybattery

import android.content.Context
import android.os.BatteryManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MyBatteryModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("MyBatteryModule")

        Constants(
            "CHARGING" to "charging",
            "FULL" to "full",
            "UNPLUGGED" to "unplugged",
        )

        Function("getBatteryLevel") {
            val bm = appContext.reactContext
                ?.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
            val level = bm?.getIntProperty(
                BatteryManager.BATTERY_PROPERTY_CAPACITY
            ) ?: -1
            level.toDouble() / 100.0
        }

        AsyncFunction("getBatteryState") {
            val bm = appContext.reactContext
                ?.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
            val status = bm?.getIntProperty(
                BatteryManager.BATTERY_PROPERTY_STATUS
            ) ?: -1
            when (status) {
                BatteryManager.BATTERY_STATUS_CHARGING -> "charging"
                BatteryManager.BATTERY_STATUS_FULL -> "full"
                else -> "unplugged"
            }
        }
    }
}
```

### Consommation cote JS

```typescript
// src/MyBatteryModule.ts
import { NativeModule, requireNativeModule } from 'expo-modules-core';

interface MyBatteryModuleType extends NativeModule {
  getBatteryLevel(): number;
  getBatteryState(): Promise<string>;
  CHARGING: string;
  FULL: string;
  UNPLUGGED: string;
}

export default requireNativeModule<MyBatteryModuleType>('MyBatteryModule');
```

---

## Device Info : second exemple pratique

Un module d'information sur l'appareil — un cas classique de Turbo Module.

### Spec TypeScript

```typescript
// specs/NativeDeviceInfoModule.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getDeviceModel(): string;
  getSystemVersion(): string;
  getAppVersion(): string;
  getBundleId(): string;
  getUniqueId(): Promise<string>;
  getDeviceInfo(): Promise<{
    model: string;
    systemVersion: string;
    appVersion: string;
    bundleId: string;
    isEmulator: boolean;
    totalMemory: number;
    screenWidth: number;
    screenHeight: number;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DeviceInfoModule');
```

### iOS

```objc
// DeviceInfoModule.mm (extraits)
- (NSString *)getDeviceModel {
    struct utsname systemInfo;
    uname(&systemInfo);
    return [NSString stringWithCString:systemInfo.machine
                              encoding:NSUTF8StringEncoding];
}

- (NSString *)getSystemVersion {
    return [[UIDevice currentDevice] systemVersion];
}

- (NSString *)getAppVersion {
    return [[NSBundle mainBundle]
        objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
}

- (void)getDeviceInfo:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject
{
    CGRect screenBounds = [[UIScreen mainScreen] bounds];
    CGFloat scale = [[UIScreen mainScreen] scale];

    resolve(@{
        @"model": [self getDeviceModel],
        @"systemVersion": [self getSystemVersion],
        @"appVersion": [self getAppVersion],
        @"bundleId": [[NSBundle mainBundle] bundleIdentifier] ?: @"",
        @"isEmulator": @(TARGET_OS_SIMULATOR != 0),
        @"totalMemory": @([NSProcessInfo processInfo].physicalMemory),
        @"screenWidth": @(screenBounds.size.width * scale),
        @"screenHeight": @(screenBounds.size.height * scale),
    });
}
```

### Android

```kotlin
// DeviceInfoModule.kt (extraits)
override fun getDeviceModel(): String = Build.MODEL

override fun getSystemVersion(): String = Build.VERSION.RELEASE

override fun getAppVersion(): String {
    val context = reactApplicationContext
    val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
    return pInfo.versionName ?: "unknown"
}

override fun getDeviceInfo(promise: Promise) {
    val context = reactApplicationContext
    val dm = context.resources.displayMetrics
    val activityManager = context.getSystemService(
        Context.ACTIVITY_SERVICE
    ) as ActivityManager
    val memInfo = ActivityManager.MemoryInfo()
    activityManager.getMemoryInfo(memInfo)

    val result = Arguments.createMap().apply {
        putString("model", Build.MODEL)
        putString("systemVersion", Build.VERSION.RELEASE)
        putString("appVersion", getAppVersion())
        putString("bundleId", context.packageName)
        putBoolean("isEmulator",
            Build.FINGERPRINT.contains("generic") ||
            Build.FINGERPRINT.contains("emulator"))
        putDouble("totalMemory", memInfo.totalMem.toDouble())
        putDouble("screenWidth", dm.widthPixels.toDouble())
        putDouble("screenHeight", dm.heightPixels.toDouble())
    }
    promise.resolve(result)
}
```

---

## Tester les modules natifs

### Tests unitaires cote JavaScript (mock)

```typescript
// __mocks__/specs/NativeBatteryModule.ts
const BatteryModuleMock = {
  getBatteryLevel: jest.fn().mockReturnValue(0.85),
  getBatteryState: jest.fn().mockResolvedValue('charging'),
  setBatteryThreshold: jest.fn(),
  getConstants: jest.fn().mockReturnValue({
    BATTERY_STATE_CHARGING: 'charging',
    BATTERY_STATE_FULL: 'full',
    BATTERY_STATE_UNPLUGGED: 'unplugged',
    BATTERY_STATE_UNKNOWN: 'unknown',
  }),
};

export default BatteryModuleMock;
```

```typescript
// __tests__/useBattery.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useBattery } from '../hooks/useBattery';
import BatteryModule from '../specs/NativeBatteryModule';

jest.mock('../specs/NativeBatteryModule');

describe('useBattery', () => {
  it('retourne le niveau de batterie', async () => {
    const { result } = renderHook(() => useBattery());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.level).toBe(0.85);
    expect(result.current.state).toBe('charging');
    expect(BatteryModule.getBatteryLevel).toHaveBeenCalled();
  });
});
```

### Tests d'intégration (sur device/simulateur)

```typescript
// e2e/battery.test.ts (Detox / Maestro)
describe('Battery Module', () => {
  it('affiche le niveau de batterie', async () => {
    await element(by.id('battery-indicator')).toBeVisible();
    await expect(element(by.id('battery-percentage')))
      .toHaveText(expect.stringMatching(/\d+%/));
  });
});
```

### Tests natifs (XCTest / JUnit)

```swift
// Tests iOS (XCTest)
import XCTest
@testable import MyApp

class BatteryModuleTests: XCTestCase {
    func testGetBatteryLevel() {
        let module = BatteryModuleImpl()
        let level = module.getBatteryLevel()
        XCTAssertTrue(level >= -1.0 && level <= 1.0)
    }
}
```

```kotlin
// Tests Android (JUnit)
@RunWith(AndroidJUnit4::class)
class BatteryModuleTest {
    @Test
    fun testGetBatteryLevel() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val reactContext = // ... setup
        val module = BatteryModule(reactContext)
        val level = module.getBatteryLevel()
        assertTrue(level in -1.0..1.0)
    }
}
```

---

## Patterns avances

### Événements natifs vers JavaScript

Les Turbo Modules peuvent emettre des événements vers JS :

```typescript
// specs/NativeBatteryModule.ts (avec evenements)
export interface Spec extends TurboModule {
  getBatteryLevel(): number;
  // Methode requise pour le support d'evenements
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}
```

```objc
// iOS — emission d'evenement
#import <React/RCTEventEmitter.h>

@interface BatteryModule : RCTEventEmitter <NativeBatteryModuleSpec>
@end

@implementation BatteryModule

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onBatteryLevelChanged", @"onBatteryStateChanged"];
}

- (void)startObserving {
    [[NSNotificationCenter defaultCenter]
        addObserver:self
        selector:@selector(batteryLevelDidChange:)
        name:UIDeviceBatteryLevelDidChangeNotification
        object:nil];
}

- (void)batteryLevelDidChange:(NSNotification *)notification {
    float level = [UIDevice currentDevice].batteryLevel;
    [self sendEventWithName:@"onBatteryLevelChanged"
                       body:@{ @"level": @(level) }];
}

@end
```

```typescript
// Consommation cote JS
import { NativeEventEmitter } from 'react-native';
import BatteryModule from '../specs/NativeBatteryModule';

const emitter = new NativeEventEmitter(BatteryModule);

function useBatteryEvents() {
  useEffect(() => {
    const sub = emitter.addListener('onBatteryLevelChanged', (event) => {
      console.log('Battery level:', event.level);
    });
    return () => sub.remove();
  }, []);
}
```

### Passage d'objets complexes

```typescript
// Spec avec type complexe
export interface Spec extends TurboModule {
  processImage(config: {
    uri: string;
    width: number;
    height: number;
    format: string;
    quality: number;
  }): Promise<{
    outputUri: string;
    fileSize: number;
    processingTime: number;
  }>;
}
```

### Gestion d'erreurs

```kotlin
// Android — erreurs structurees
override fun processImage(config: ReadableMap, promise: Promise) {
    try {
        val uri = config.getString("uri")
            ?: throw IllegalArgumentException("URI is required")

        // ... traitement

        promise.resolve(result)
    } catch (e: IllegalArgumentException) {
        promise.reject("INVALID_ARGUMENT", e.message, e)
    } catch (e: IOException) {
        promise.reject("IO_ERROR", "Failed to process image", e)
    } catch (e: Exception) {
        promise.reject("UNKNOWN_ERROR", e.message, e)
    }
}
```

```typescript
// Cote JS — traitement des erreurs
try {
  const result = await ImageModule.processImage({
    uri: 'file:///path/to/image.jpg',
    width: 800,
    height: 600,
    format: 'jpeg',
    quality: 0.8,
  });
} catch (error) {
  if (error.code === 'INVALID_ARGUMENT') {
    // Erreur de parametres
  } else if (error.code === 'IO_ERROR') {
    // Erreur I/O
  }
}
```

---

## Debugging des modules natifs

### iOS (Xcode)

1. Ouvrir le workspace iOS dans Xcode
2. Mettre des breakpoints dans le code ObjC++ / Swift
3. Lancer l'app en mode Debug
4. Les breakpoints fonctionnent comme pour une app native

```bash
# Logs natifs iOS
xcrun simctl spawn booted log stream --predicate 'subsystem == "com.myapp"'
```

### Android (Android Studio)

1. Ouvrir le dossier `android/` dans Android Studio
2. Breakpoints dans le code Kotlin
3. Run > Attach Debugger to Android Process

```bash
# Logs natifs Android
adb logcat -s "BatteryModule"
```

### Flipper

Flipper permet d'inspecter les appels aux modules natifs :

- Plugin "Native Modules" : liste tous les modules charges
- Plugin "Network" : appels réseau des modules natifs
- Plugin custom : créer un plugin Flipper pour votre module

---

## Checklist de création d'un Turbo Module

```
[ ] 1. Spec TypeScript (Native*.ts) avec interface et types
[ ] 2. codegenConfig dans package.json
[ ] 3. Implementation iOS (ObjC++ ou Swift + wrapper)
[ ] 4. Implementation Android (Kotlin)
[ ] 5. Registration du package (Android)
[ ] 6. pod install (iOS)
[ ] 7. Mock JS pour les tests unitaires
[ ] 8. Tests natifs (XCTest / JUnit)
[ ] 9. Tests d'integration (hook / composant)
[ ] 10. Documentation du module (API, types, erreurs)
```

---

## Erreurs courantes et solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `TurboModule not found` | Module non enregistre | Vérifier le package (Android) ou le `RCT_EXPORT_MODULE` (iOS) |
| `Codegen type mismatch` | Spec et implementation desynchronisees | Relancer le codegen après modification du spec |
| `Cannot find module 'XxxSpec'` | Codegen pas encore exécuté | `pod install` (iOS) ou `./gradlew generateCodegenArtifacts` (Android) |
| `Method not implemented` | Méthode du spec manquante dans le natif | Implementer toutes les méthodes du spec |
| `Invariant Violation` | `getEnforcing` mais module absent | Utiliser `get` (nullable) ou vérifier l'enregistrement |
| `Thread violation` | Appel UI depuis le JS thread | Dispatcher sur le main thread (iOS) / UI thread (Android) |

---

## Points clés à retenir

1. **Turbo Modules = JSI + codegen** : communication directe, typee, sans serialisation
2. **Le spec est le contrat** : TypeScript généré les interfaces natives automatiquement
3. **Synchrone ou asynchrone** : les méthodes synchrones retournent immediatement via JSI
4. **Expo Modules API** : alternative simplifiee pour les cas courants, Swift direct
5. **Lazy loading** : les modules ne sont charges qu'au premier appel (vs Bridge : eager)
6. **Tester a tous les niveaux** : mock JS, tests natifs, tests d'intégration
7. **N'ecrivez natif que si nécessaire** : chaque module natif double la surface de maintenance

---

## Ressources

- [React Native — Turbo Native Modules](https://reactnative.dev/docs/turbo-native-modules-introduction)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [React Native New Architecture — Working Group](https://github.com/reactwg/react-native-new-architecture)
- [Codegen documentation](https://reactnative.dev/docs/codegen)
- [CallStack — Guide to Turbo Modules](https://www.callstack.com/blog/turbo-modules-guide)

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 23 modules natifs](../screencasts/screencast-23-modules-natifs.md)
2. **Lab** : [lab-23-modules-natifs](../labs/lab-23-modules-natifs/README)
3. **Quiz** : [quiz 23 modules natifs](../quizzes/quiz-23-modules-natifs.html)
:::
