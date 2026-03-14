# Lab 08 — React Navigation fondamentaux

## Objectif

Implementer en pur TypeScript les mecanismes de base d'un systeme de navigation similaire a React Navigation : pile de navigation, routeur type, serialisation d'etat, options d'ecran et resolution de titre.

## Prerequis

- Module 08 : React Navigation fondamentaux
- TypeScript : generics, Record, unions

## Lancement

```bash
# Exercice (tests en echec)
npx tsx labs/lab-08-navigation-fondamentaux/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-08-navigation-fondamentaux/solution.ts
```

## Exercices

### Exercice 1 : createNavigationStack (8 tests)

Implementez une pile de navigation avec les methodes :

- `push(name, params?)` : ajoute un ecran au sommet
- `pop()` : retire l'ecran au sommet (erreur si un seul ecran)
- `replace(name, params?)` : remplace l'ecran au sommet sans changer la taille de la pile
- `reset(routes)` : reinitialise la pile (erreur si tableau vide)
- `canGoBack()` : `true` si la pile contient plus d'un ecran
- `getCurrentRoute()` : retourne la route au sommet
- `getState()` : retourne `{ routes, index }`

### Exercice 2 : createTypedRouter (4 tests)

Creez un routeur qui valide les noms de routes et les parametres obligatoires a partir d'une definition :

```typescript
const router = createTypedRouter({
  Home: null,           // pas de parametres
  Details: ['id', 'title'], // parametres obligatoires
});
```

### Exercice 3 : serializeNavigationState / deserializeNavigationState (5 tests)

Serialisez un `NavigationState` en JSON et deserialisez-le avec validation :
- JSON invalide -> erreur
- Pas de `routes` -> erreur
- `routes` vide -> erreur
- `index` hors limites -> erreur

### Exercice 4 : createScreenOptions (2 tests)

Fusionnez des options par defaut avec des overrides. Les valeurs `undefined` dans les overrides ne doivent pas ecraser les defaults.

### Exercice 5 : resolveHeaderTitle (3 tests)

Determinez le titre du header selon la priorite : `options.title` > `options.headerTitle` > `routeName`.

## Evaluation

- 15 tests au total
- Tous les tests doivent passer
- Les types TypeScript doivent etre corrects (pas de `any`)
