# Screencast 10 — Gestion de l'etat avec Zustand

## Objectifs
- Construire un auth store et un cart store avec Zustand
- Ajouter la persistence avec MMKV
- Montrer l'optimisation des re-renders avec les selecteurs

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : pourquoi un store externe (limites de Context) | Slides |
| 0:30-2:00 | Setup Zustand + creation d'un counter store basique | VS Code + emulateur |
| 2:00-4:00 | Auth store complet : login, logout, refresh, gestion d'erreur | VS Code |
| 4:00-5:30 | Utilisation du auth store dans LoginScreen et RootNavigator | VS Code + emulateur |
| 5:30-7:30 | Cart store : addItem, removeItem, valeurs calculees (total, count) | VS Code |
| 7:30-9:00 | Selecteurs : montrer la difference de re-renders avec/sans selecteur | VS Code + emulateur + React DevTools |
| 9:00-10:30 | Persist middleware avec MMKV : preferences store | VS Code + emulateur |
| 10:30-11:30 | Hydration : attendre la restauration avant d'afficher l'app | VS Code + emulateur |
| 11:30-12:30 | Acces hors React : intercepteur API avec getState() | VS Code |
| 12:30-13:30 | Devtools + immer middleware pour les etats imbriques | VS Code |
| 13:30-14:00 | Recapitulatif : quand Context, quand Zustand | Slides |

## Points cles a montrer
- Le selecteur `(state) => state.count` qui evite les re-renders inutiles
- La difference entre `useStore()` (re-rend tout) et `useStore(s => s.field)` (selectif)
- `useShallow` pour selectionner plusieurs champs sans recreer un objet
- Le persist middleware qui sauvegarde automatiquement dans MMKV
- `getState()` utilise dans un intercepteur Axios hors composant React
- Le pattern de reset de tous les stores a la deconnexion

## Ressources
- Zustand : https://github.com/pmndrs/zustand
- MMKV : https://github.com/mrousavy/react-native-mmkv
