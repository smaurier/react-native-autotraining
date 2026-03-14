# Screencast 09 — Navigation avancee

## Objectifs
- Construire un shell d'application complet avec tabs, stack et auth flow
- Configurer le deep linking et les universal links
- Implementer un drawer navigator avec contenu personnalise

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : au-dela du stack navigator | Slides |
| 0:30-2:00 | Bottom Tab Navigator : icones, badges, style | VS Code + emulateur |
| 2:00-3:30 | Custom Tab Bar : composant personnalise | VS Code + emulateur |
| 3:30-5:00 | Drawer Navigator : menu lateral, contenu custom | VS Code + emulateur |
| 5:00-7:00 | Nested navigators : stack dans tabs, modal par-dessus | VS Code + emulateur |
| 7:00-9:00 | Auth flow : ecrans conditionnels selon l'etat connecte | VS Code + emulateur |
| 9:00-11:00 | Deep linking : configuration URL scheme, test avec adb/xcrun | VS Code + terminal |
| 11:00-12:00 | Navigation state persistence (AsyncStorage) | VS Code |
| 12:00-13:00 | TypeScript : typer les nested navigators | VS Code |
| 13:00-14:00 | Recapitulatif de l'architecture complete | Slides schema |

## Points cles a montrer
- Le pattern de composition : TabNavigator contient des StackNavigators
- L'auth flow avec des ecrans qui apparaissent/disparaissent selon isLoggedIn
- Comment tester un deep link sur emulateur (adb shell am start / xcrun simctl openurl)
- Le typage TypeScript complet pour les navigateurs imbriques

## Ressources
- React Navigation : https://reactnavigation.org/
- Deep linking : https://reactnavigation.org/docs/deep-linking/
