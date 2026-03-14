# Lab 09 — Navigation avancee

## Objectif

Implementer en pur TypeScript les mecanismes avances de navigation : deep linking, flux d'authentification, etat imbrique, gestion de badges et matching d'URLs.

## Prerequis

- Module 09 : Navigation avancee
- Lab 08 : React Navigation fondamentaux
- TypeScript : Record, Map, recursion

## Lancement

```bash
# Exercice (tests en echec)
npx tsx labs/lab-09-navigation-avancee/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-09-navigation-avancee/solution.ts
```

## Exercices

### Exercice 1 : createDeepLinkConfig (3 tests)

Creez une configuration de deep linking a partir d'un mapping `{ routeName: urlPath }`. Retourne un objet `{ screens: { ... } }` conforme au format attendu par React Navigation.

### Exercice 2 : createAuthNavigator (3 tests)

Filtrez les routes selon l'etat d'authentification :
- Utilisateur connecte : ne voir que les routes avec `requiresAuth: true`
- Utilisateur deconnecte : ne voir que les routes avec `requiresAuth: false`

C'est le pattern declaratif recommande par React Navigation pour les flux d'auth.

### Exercice 3 : buildNestedState (3 tests)

Construisez un etat de navigation imbrique a partir d'un chemin separe par des `/`. Les parametres optionnels sont attaches au dernier segment.

Exemple : `'MainTabs/HomeTab/Details'` produit une structure recursive `{ routeName, child: { routeName, child: { routeName } } }`.

### Exercice 4 : createTabBadgeManager (5 tests)

Gerez les badges numeriques des onglets (comme les notifications non lues) :
- `increment(tab)` : +1 (erreur si tab inexistant)
- `reset(tab)` : remet a 0
- `getCount(tab)` : compteur courant
- `getTabs()` : liste des tabs
- `getTotalCount()` : somme de tous les compteurs

### Exercice 5 : matchDeepLink (4 tests)

Faites correspondre une URL a une route en utilisant un pattern matching avec segments dynamiques (`:param`). Supportez les URLs vides, les parametres et les segments statiques.

## Evaluation

- 18 tests au total
- Tous les tests doivent passer
- Les types TypeScript doivent etre corrects
