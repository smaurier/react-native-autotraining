# Lab 23 — Modules natifs et Turbo Modules (logique pure)

## Objectifs

Comprendre les mécanismes internes des Turbo Modules de React Native en implementant leurs concepts fondamentaux en TypeScript pur : création de specs, génération de code (codegen), proxies de validation, adaptateur async-to-sync et registre de modules.

## Exercices

| # | Fonction | Concept teste | Difficulte |
|---|----------|--------------|------------|
| 1 | `createModuleSpec` | Spec de module natif avec validation | moyen |
| 2 | `createCodegenOutput` | Génération de signatures de méthodes (codegen) | moyen |
| 3 | `createNativeModuleProxy` | Proxy de validation des appels natifs | moyen |
| 4 | `createAsyncToSync` | Adaptateur async → sync (pattern JSI) | moyen |
| 5 | `createModuleRegistry` | Registre de modules (TurboModuleRegistry) | moyen |

## Lancer les tests

```bash
# Exercice (avec TODOs — tous les tests echouent)
npx tsx labs/lab-23-modules-natifs/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-23-modules-natifs/solution.ts
```

## Concepts clés

- **ModuleSpec** : contrat TypeScript qui définit les méthodes d'un module natif, leurs paramètres et types de retour. Le codegen React Native généré les interfaces natives à partir de ces specs.
- **Codegen** : génération automatique de code C++, Objective-C++ et Java/Kotlin à partir du spec TypeScript. Garantit la coherence des types entre JS et natif.
- **NativeModuleProxy** : couche de validation qui intercepte les appels de méthodes pour vérifier qu'ils correspondent au spec (méthode existante, nombre d'arguments). En production, JSI fait cette validation à la compilation.
- **AsyncToSync** : pattern utilise par JSI pour transformer des appels asynchrones en valeurs accessibles de manière synchrone via un cache avec TTL.
- **ModuleRegistry** : équivalent simplifie de `TurboModuleRegistry` qui géré l'enregistrement, la recherche et la validation des modules natifs.

## Conseils

- L'exercice 1 nécessité 3 validations : nom non vide, pas de doublons, coherence async/Promise
- L'exercice 2 est une transformation de donnees — generez les signatures sous forme de strings formatees
- L'exercice 3 est le plus complet — combinez validation, delegation et journalisation des appels
- L'exercice 4 est court mais important : il illustre comment JSI géré les valeurs asynchrones
- L'exercice 5 est un pattern Map classique — pensez a valider que chaque méthode du spec à une implementation correspondante
