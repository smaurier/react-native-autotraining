# Screencast 21 — Tests E2E avec Detox

## Objectifs
- Configurer Detox dans un projet Expo avec prebuild
- Écrire des tests E2E complets pour un flux de login et de CRUD
- Utiliser le Page Object Pattern pour structurer les tests
- Gérer la synchronisation et les attentes asynchrones

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : pourquoi des tests E2E, pyramide de tests | Slides |
| 0:30-2:00 | Setup Detox : installation, .detoxrc.js, jest config | VS Code + terminal |
| 2:00-3:30 | Ajouter des testID aux composants React Native | VS Code |
| 3:30-5:00 | Premier test : vérifier la visibilite de l'ecran de login | VS Code + simulateur |
| 5:00-7:00 | Matchers : by.id, by.text, by.label, combinaisons | VS Code + simulateur |
| 7:00-9:00 | Actions : typeText, tap, scroll, swipe | VS Code + simulateur |
| 9:00-11:00 | Flux complet : login → navigation → création de tache → vérification | VS Code + simulateur |
| 11:00-12:30 | waitFor().withTimeout() : gérer les chargements asynchrones | VS Code + simulateur |
| 12:30-14:00 | Page Object Pattern : refactorer les tests | VS Code |
| 14:00-15:00 | Lancer sur Android et comparer | VS Code + emulateur |
| 15:00-16:00 | Mention rapide de Maestro et recap | Slides |

## Points clés a montrer
- La synchronisation automatique de Detox : pas de sleep(), pas de polling
- Comment ajouter des testID sans impacter l'accessibilité (testID est separe de accessibilityLabel)
- Le cycle beforeAll(launchApp) / beforeEach(reloadReactNative)
- Le Page Object Pattern pour la maintenabilité
- Les screenshots et videos en cas d'echec (--take-screenshots failing)

## Ressources
- Detox : https://wix.github.io/Detox/
- Detox + Expo : https://docs.expo.dev/build-référence/e2e-tests/
- Maestro : https://maestro.mobile.dev/
