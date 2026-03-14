# Screencast 23 — Modules natifs et Turbo Modules

## Informations

| Champ | Valeur |
|-------|--------|
| Duree cible | 12-15 min |
| Module | 23 — Modules natifs et Turbo Modules |
| Prerequis | Module 22 (ou equivalent), Xcode installe, Android Studio installe |
| Fichiers demo | Projet Expo bare workflow avec Turbo Module |

---

## Script du screencast

### Intro (0:00 - 0:45)

"Dans ce screencast, on va creer un Turbo Module de bout en bout : un module `BatteryModule` qui expose le niveau de batterie de l'appareil a JavaScript. On va voir le workflow complet : spec TypeScript, codegen, implementation iOS en Objective-C++, implementation Android en Kotlin, et utilisation dans un composant React Native."

"C'est un cas d'usage realiste : l'API batterie n'est pas exposee par React Native par defaut, et on veut un acces synchrone au niveau de batterie — exactement le type de besoin qui justifie un Turbo Module."

### Partie 1 — Le fichier spec (0:45 - 3:00)

**Action** : ouvrir le projet dans VS Code, creer `specs/NativeBatteryModule.ts`

"Le point de depart d'un Turbo Module, c'est toujours le spec. C'est le contrat entre JavaScript et le natif."

```typescript
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getBatteryLevel(): number;
  getBatteryState(): Promise<string>;
  getConstants(): {
    CHARGING: string;
    FULL: string;
    UNPLUGGED: string;
  };
}

export default TurboModuleRegistry.getEnforcing<Spec>('BatteryModule');
```

**Points a souligner** :
- Le prefixe `Native` dans le nom de fichier est obligatoire pour le codegen
- `getBatteryLevel()` retourne `number` — c'est une methode **synchrone** via JSI
- `getBatteryState()` retourne `Promise<string>` — c'est **asynchrone**
- `getEnforcing` crashe si le module n'existe pas — utile en dev

**Action** : montrer le `package.json` avec `codegenConfig`

```json
{
  "codegenConfig": {
    "name": "BatteryModuleSpec",
    "type": "modules",
    "jsSrcsDir": "specs"
  }
}
```

### Partie 2 — Implementation iOS (3:00 - 6:30)

**Action** : ouvrir Xcode, creer `BatteryModule.h` et `BatteryModule.mm`

"Cote iOS, on ecrit en Objective-C++ — le `mm` c'est pour le C++. Swift n'est pas directement supporte pour les Turbo Modules car JSI est en C++."

**Action** : ecrire le header

```objc
#import <BatteryModuleSpec/BatteryModuleSpec.h>

@interface BatteryModule : NSObject <NativeBatteryModuleSpec>
@end
```

"L'interface `NativeBatteryModuleSpec` a ete generee par le codegen. Si on ne respecte pas le spec, ca ne compile pas — c'est le type-safety du codegen."

**Action** : ecrire l'implementation

```objc
- (NSNumber *)getBatteryLevel {
    [UIDevice currentDevice].batteryMonitoringEnabled = YES;
    return @([UIDevice currentDevice].batteryLevel);
}
```

**Point cle** : "Cette methode est synchrone. Quand JavaScript appelle `getBatteryLevel()`, JSI appelle directement cette methode C++ et retourne le resultat. Pas de bridge, pas de JSON, pas d'attente."

**Action** : `pod install` et montrer les fichiers generes

### Partie 3 — Implementation Android (6:30 - 9:30)

**Action** : ouvrir Android Studio, creer `BatteryModule.kt`

```kotlin
@ReactModule(name = BatteryModule.NAME)
class BatteryModule(reactContext: ReactApplicationContext) :
    NativeBatteryModuleSpec(reactContext) {

    override fun getBatteryLevel(): Double {
        val bm = reactApplicationContext
            .getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        return bm.getIntProperty(
            BatteryManager.BATTERY_PROPERTY_CAPACITY
        ).toDouble() / 100.0
    }
}
```

**Action** : creer `BatteryPackage.kt` et l'ajouter dans `MainApplication`

"Cote Android, il faut enregistrer le package manuellement. C'est une etape qu'on oublie souvent — si vous avez l'erreur 'TurboModule not found', verifiez ici."

### Partie 4 — Utilisation en JavaScript (9:30 - 11:30)

**Action** : creer un composant `BatteryIndicator.tsx`

```tsx
import BatteryModule from '../specs/NativeBatteryModule';

export function BatteryIndicator() {
  // Appel synchrone — retour immediat
  const level = BatteryModule.getBatteryLevel();

  return (
    <View>
      <Text>{Math.round(level * 100)}%</Text>
    </View>
  );
}
```

**Action** : lancer l'app sur simulateur iOS, puis emulateur Android

"On voit le niveau de batterie s'afficher. Sur le simulateur iOS c'est -1 parce que le simulateur n'a pas de batterie physique. Sur un vrai device, on aurait la vraie valeur."

### Partie 5 — Alternative Expo Modules API (11:30 - 13:30)

**Action** : montrer brievement le meme module avec l'Expo Modules API

"Si vous utilisez Expo, il y a une alternative beaucoup plus simple. Regardez la difference."

```swift
// Swift direct — pas de wrapper ObjC++ !
public class BatteryModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BatteryModule")
        Function("getBatteryLevel") { () -> Double in
            UIDevice.current.isBatteryMonitoringEnabled = true
            return Double(UIDevice.current.batteryLevel)
        }
    }
}
```

"En une vingtaine de lignes de Swift, on a le meme resultat. Pas de spec, pas de codegen manuel, pas de package registration. Pour les cas simples, c'est clairement le bon choix."

### Conclusion (13:30 - 14:30)

"Recapitulons le workflow Turbo Module :
1. Spec TypeScript — le contrat
2. Codegen — genere les interfaces natives
3. Implementation iOS et Android — le code natif
4. Utilisation en JS — comme n'importe quel module

Le point cle : les appels synchrones via JSI. Pas de bridge, pas de serialisation, pas d'attente. C'est ce qui rend les Turbo Modules 20 a 100 fois plus rapides que les anciens modules Bridge.

N'oubliez pas : n'ecrivez du code natif que si c'est vraiment necessaire. Verifiez d'abord les modules Expo et la communaute. A vous de jouer avec le lab !"

---

## Points a montrer a l'ecran

- [ ] Structure du projet (specs/, ios/, android/)
- [ ] Fichier spec avec types
- [ ] Codegen output (fichiers generes)
- [ ] Code iOS (Objective-C++) dans Xcode
- [ ] Code Android (Kotlin) dans Android Studio
- [ ] pod install et build
- [ ] App tournant sur simulateur avec le composant batterie
- [ ] Expo Modules API en comparaison

## Erreurs a montrer (optionnel)

- Oublier le prefixe `Native` dans le nom du fichier spec → codegen ne le detecte pas
- Oublier d'enregistrer le package Android → `TurboModule not found`
- Type mismatch entre spec et implementation → erreur de compilation
