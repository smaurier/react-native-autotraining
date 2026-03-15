# Screencast 05 — StyleSheet et Flexbox

## Objectifs
- Maîtriser le modèle Flexbox de React Native (différences avec CSS)
- Construire des layouts courants : header/content/footer, grille, sidebar
- Gérer les styles conditionnels et la composition de styles

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : Flexbox en RN vs CSS (column par defaut) | Slides |
| 0:30-2:00 | flexDirection, justifyContent, alignItems : demo live | VS Code + emulateur |
| 2:00-3:30 | flex, flexGrow, flexShrink, flexBasis : repartition | VS Code + emulateur |
| 3:30-5:00 | Layout header/content/footer avec flex: 1 | VS Code + emulateur |
| 5:00-6:30 | Grille responsive avec flexWrap et gap | VS Code + emulateur |
| 6:30-8:00 | Position absolute : overlay, badge, FAB | VS Code + emulateur |
| 8:00-10:00 | Composition de styles : arrays, spread, conditionnel | VS Code |
| 10:00-12:00 | Platform.select pour styles spécifiques iOS/Android | VS Code + 2 emulateurs |
| 12:00-13:00 | StyleSheet.create : pourquoi et quand l'utiliser | VS Code |
| 13:00-14:00 | Récapitulatif des patterns essentiels | Slides |

## Points clés a montrer
- Que flexDirection est 'column' par defaut (pas 'row' comme en CSS web)
- Le pattern flex: 1 pour occuper l'espace restant
- Comment gap simplifie les espacements (vs margin sur chaque enfant)
- La composition de styles avec un array : `[styles.base, isActive && styles.active]`

## Ressources
- Flexbox RN : https://reactnative.dev/docs/flexbox
- Yoga layout engine : https://yogalayout.dev/
