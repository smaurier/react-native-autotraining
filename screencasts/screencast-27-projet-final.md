# Screencast 27 — Projet final NomadNote

## Objectifs
- Presenter l'architecture complete de NomadNote et les decisions de conception
- Demontrer le fonctionnement offline-first avec synchronisation
- Montrer la collaboration en temps réel et la résolution de conflits
- Illustrer les choix de performance (cache LRU, Hermes, FlashList)

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-1:30 | Introduction : présentation de NomadNote, tour des fonctionnalites | Slides avec diagramme d'architecture |
| 1:30-3:00 | Structure du projet : monorepo, packages partages, convention de dossiers | VS Code — arborescence du projet |
| 3:00-5:00 | State management : separation Zustand (UI) vs React Query (serveur), pourquoi pas un seul store | VS Code — stores/ et hooks/ |
| 5:00-7:00 | Demo CRUD : création d'une note, edition avec tags, validation Zod en temps réel | Emulateur + VS Code |
| 7:00-9:00 | Offline-first : couper le réseau, créer/editer des notes, voir la queue grandir | Emulateur + DevTools réseau |
| 9:00-11:00 | Retour en ligne : sync automatique, push des operations, pull des modifications distantes | Emulateur + logs console |
| 11:00-13:00 | Resolution de conflits : deux appareils editent la même note, merge LWW par champ | Deux emulateurs cote a cote |
| 13:00-15:00 | Performance : FlashList vs FlatList, cache LRU en action, profiling startup Hermes | Emulateur + Flipper/Flashlight |
| 15:00-17:00 | Turbo Module crypto : demo chiffrement/dechiffrement synchrone via JSI, comparaison avec le bridge | VS Code + emulateur + metriques |
| 17:00-19:00 | Tests et CI/CD : lancement des tests unitaires, intégration et E2E Detox, pipeline GitHub Actions | Terminal + GitHub Actions UI |
| 19:00-20:00 | Récapitulatif : les 12 jalons, conseils pour le projet, prochaines étapes | Slides de synthese |

## Points clés a montrer
- La separation claire entre état client (Zustand) et état serveur (React Query) dans le code
- Le fonctionnement réel du mode offline : couper le WiFi, manipuler les notes, observer la queue
- La résolution de conflits en direct avec deux appareils (où emulateurs) modifiant la même note
- Le gain de performance mesurable du cache LRU (hit rate dans les DevTools)
- La différence de démarrage entre bytecode Hermes precompile et interpretation classique
- La pyramide de tests en action : unitaires rapides, intégration avec RNTL, E2E avec Detox
- Le déploiement OTA via expo-updates pour un correctif sans passer par les stores

## Ressources
- Expo Router : https://docs.expo.dev/router/introduction/
- React Query : https://tanstack.com/query/latest
- Zustand : https://github.com/pmndrs/zustand
- FlashList : https://shopify.github.io/flash-list/
- Hermes : https://hermesengine.dev/
- Detox : https://wix.github.io/Detox/
- EAS Build : https://docs.expo.dev/build/introduction/
