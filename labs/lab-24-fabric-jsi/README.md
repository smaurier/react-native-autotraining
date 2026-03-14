# Lab 24 — Fabric & JSI (logique pure)

## Objectifs

Comprendre les mecanismes internes de Fabric et JSI en implementant leurs concepts fondamentaux en TypeScript pur : shadow tree (manipulation d'arbre de vues), host objects (interface C++ simulee), diffing d'arbres (calcul de mutations), file de taches concurrentes et specs de composants Fabric.

## Exercices

| # | Fonction | Concept teste | Difficulte |
|---|----------|--------------|------------|
| 1 | `createShadowTree` | Shadow tree Fabric (appendChild, remove, update, flatten) | moyen |
| 2 | `createHostObject` | JSI Host Object (get, set, property names) | facile |
| 3 | `diffShadowTrees` | Diffing d'arbres et generation de mutations | moyen |
| 4 | `createConcurrentQueue` | File de taches concurrentes avec priorites | moyen |
| 5 | `createComponentSpec` | Spec de Fabric Component avec validation et codegen | moyen |

## Lancer les tests

```bash
# Exercice (avec TODOs — tous les tests echouent)
npx tsx labs/lab-24-fabric-jsi/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-24-fabric-jsi/solution.ts
```

## Concepts cles

- **Shadow Tree** : representation intermediaire en C++ de l'arbre de composants React Native. Chaque composant React cree un ShadowNode. Le layout est calcule par Yoga en C++, puis les mutations sont appliquees aux vues natives.
- **Host Object** : objet C++ expose dans le runtime JavaScript via JSI. Permet un acces direct a la memoire native sans serialisation JSON. Les proprietes et methodes sont accessibles de maniere synchrone.
- **Diffing** : comparaison entre l'ancien et le nouveau Shadow Tree pour calculer les mutations minimales (create, delete, update). En production, Fabric fait ce diff en C++ sur le thread de rendu.
- **Concurrent Queue** : file de taches avec priorites (urgent, normal, low). Fabric utilise ce mecanisme pour interrompre le rendu non-urgent quand une interaction utilisateur arrive (urgent).
- **Component Spec** : definition typee d'un Fabric Component (props, evenements). Le codegen React Native genere les interfaces C++, Java et Objective-C a partir de ces specs.

## Conseils

- L'exercice 1 est le plus volumineux — implementez findById d'abord (recursion DFS), puis les autres methodes l'utilisent
- L'exercice 2 est direct — un objet avec deux dictionnaires internes (proprietes et methodes)
- L'exercice 3 : pensez en termes de sets — oldIds vs newIds donne les creates/deletes, l'intersection donne les updates potentiels
- L'exercice 4 : triez par priorite au moment du flush, pas au moment de l'enqueue
- L'exercice 5 : la validation verifie les props requises et les types, generateTypes produit une interface TypeScript formatee
