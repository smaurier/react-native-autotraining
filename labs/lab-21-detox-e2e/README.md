# Lab 21 — Tests E2E avec Detox

## Objectif

Implementer en pur TypeScript les mecanismes fondamentaux des tests E2E : matchers d'elements, flows de test, simulateur de device, conditions d'attente et reporting.

## Prerequis

- Module 21 : Tests E2E avec Detox
- TypeScript : interfaces, closures, recursion
- Concepts : matchers, assertions, test lifecycle

## Lancement

```bash
# Exercice (tests en echec)
npx tsx labs/lab-21-detox-e2e/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-21-detox-e2e/solution.ts
```

## Exercices

### Exercice 1 : createElementMatcher (3 tests)

Creez un matcher qui localise des elements dans un arbre UI, similaire a `by.id()`, `by.text()`, `by.label()` et `by.type()` de Detox. Le matcher doit pouvoir chercher en profondeur dans les children.

### Exercice 2 : createTestFlow (3 tests)

Implementez un flux de test sequentiel. Chaque etape est executee dans l'ordre. Si une etape echoue, les suivantes sont marquees comme "skipped" — exactement comme Detox arrete un `it()` au premier echec.

### Exercice 3 : createDeviceSimulator (4 tests)

Simulez l'API `device` de Detox avec son cycle de vie : install, launch, reload, send to home, bring to foreground. Gerez les etats et les erreurs (ex: lancer sans installer).

### Exercice 4 : createWaitCondition (3 tests)

Implementez la logique de `waitFor().withTimeout()` de Detox. Un predicat est verifie a intervalles reguliers jusqu'a ce qu'il soit vrai ou que le timeout soit atteint.

### Exercice 5 : createE2EReporter (3 tests)

Generez un rapport de tests E2E avec statistiques : taux de reussite, duree totale, detection des tests lents (par seuil ou par ecart-type).

## Evaluation

- 16 tests au total
- Tous les tests doivent passer
- Les types TypeScript doivent etre corrects
