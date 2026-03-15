# Lab 01 — JSX et premiers composants (logique pure)

## Objectifs

Comprendre la mecanique interne de JSX en implementant un mini-système d'éléments sans runtime React Native. Vous allez créer, manipuler et transformer des arbres d'éléments comme le fait React en interne.

## Exercices

| # | Fonction | Concept teste | Difficulte |
|---|----------|--------------|------------|
| 1 | `createElement` | Fabrique d'éléments (comme React.createElement) | facile |
| 2 | `renderToString` | Serialisation d'arbre, récursion, indentation | moyen |
| 3 | `flattenChildren` | Parcours d'arbre depth-first | facile |
| 4 | `extractTextContent` | Extraction de texte, filtrage récursif | moyen |
| 5 | `conditionalRender` | Rendu conditionnel (pattern &&, ternaire) | facile |
| 6 | `mapToElements` | Rendu de listes avec key (pattern .map) | moyen |
| 7 | `buildStyleSheet` | Validation de styles (StyleSheet.create) | moyen |

## Lancer les tests

```bash
# Exercice (avec TODOs — tous les tests echouent)
npx tsx labs/lab-01-jsx-composants/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-01-jsx-composants/solution.ts
```

## Concepts clés

- **ElementNode** : structure `{ type, props, children }` — c'est ce que JSX produit après compilation
- **Rendu conditionnel** : `condition && element` ou `condition ? elementA : elementB`
- **Listes** : `items.map(item => <Element key={item.id} />)` — la prop `key` est essentielle
- **StyleSheet** : validateur de styles — React Native n'accepte pas toutes les propriétés CSS

## Conseils

- L'exercice 2 (renderToString) est le plus technique — gerez d'abord le cas de base puis les cas récursifs
- Pour flattenChildren, pensez "depth-first traversal"
- Les types TypeScript sont vos allies — laissez l'IDE vous guider
