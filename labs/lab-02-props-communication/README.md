# Lab 02 — Props et communication

## Objectif

Pratiquer les concepts fondamentaux de la communication par props en React Native, sans runtime React : validation de props, fusion de defaults, event emitter, proxy de props, et discriminated unions.

## Prérequis

- Module 02 : Props et communication
- TypeScript : interfaces, génériques, unions discriminees

## Lancer les tests

```bash
# Exercice (les tests echouent — a vous de completer)
npx tsx labs/lab-02-props-communication/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-02-props-communication/solution.ts
```

## Exercices

### 1. `validateProps(schema, props)` — Validation de props

Implementez un validateur qui vérifié un objet de props contre un schema :
- Props requises presentes
- Types corrects (`string`, `number`, `boolean`, `function`, `object`, `array`)
- Validator personnalise respecte

### 2. `mergeDefaultProps(schema, props)` — Fusion de defaults

Fusionnez les props fournies avec les `defaultValue` du schema. Les props fournies ont priorite.

### 3. `createEventEmitter<Events>()` — Event emitter

Creez un bus d'événements générique avec :
- `on(event, listener)` : enregistrer un listener
- `off(event, listener)` : retirer un listener
- `emit(event, payload)` : declencher les listeners
- `listenerCount(event)` : nombre de listeners

### 4. `createPropsProxy(props, defaults)` — Proxy de props

Creez un objet qui retourne la prop si elle existe, sinon le default. Avec `getKeys()` et `toObject()`.

### 5. Type guards pour discriminated unions

Implementez `isErrorAlert`, `isSuccessAlert`, `isWarningAlert`, `isIconButton` et `getAlertDescription` qui généré une description texte selon le type d'alerte.

## Nombre de tests : 15

## Duree estimee : 30-40 min
