# Screencast 14 — Stockage local et offline-first

## Objectifs
- Comparer AsyncStorage, MMKV et expo-sqlite en pratique
- Construire une architecture offline-first avec queue de synchronisation
- Implementer la résolution de conflits et la detection réseau

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : pourquoi le stockage local est critique sur mobile | Slides |
| 0:30-1:30 | AsyncStorage : API de base, serialisation JSON, limites (6 MB) | VS Code + emulateur |
| 1:30-3:00 | MMKV : installation, API synchrone, chiffrement AES-256, benchmark vs AsyncStorage | VS Code + emulateur |
| 3:00-4:30 | MMKV + Zustand : persistance du store avec createJSONStorage et adaptateur MMKV | VS Code + emulateur |
| 4:30-6:30 | expo-sqlite : création de base, CRUD type, transactions atomiques | VS Code + emulateur |
| 6:30-8:00 | Migrations SQLite : schema_version, application sequentielle des migrations | VS Code |
| 8:00-10:00 | Architecture offline-first : écriture locale d'abord, queue de sync, indicateur visuel | VS Code + emulateur |
| 10:00-11:30 | Resolution de conflits : Last-Write-Wins vs merge champ par champ vs résolution manuelle | VS Code + slides |
| 11:30-12:30 | NetInfo : detection réseau, listener, banniere hors ligne | VS Code + emulateur |
| 12:30-13:30 | Background fetch : TaskManager, registerTaskAsync, limites iOS/Android | VS Code |
| 13:30-14:30 | Cache LRU : principe, eviction, intégration avec couche API | VS Code |
| 14:30-15:00 | Récapitulatif : arbre de decision (quel stockage pour quel besoin) | Slides schema |

## Points clés a montrer
- Le benchmark MMKV vs AsyncStorage (1000 lectures/ecritures) pour montrer la différence concrete
- Le flow offline complet : couper le WiFi, créer des taches, reactiver et voir la sync automatique
- La banniere "Mode hors ligne" qui apparait/disparait en temps réel
- Le pattern Zustand persist avec MMKV (3 fichiers : store, adaptateur, composant)
- Les migrations SQLite appliquees sequentiellement (schema_version incremente)

## Ressources
- react-native-mmkv : https://github.com/mrousavy/react-native-mmkv
- expo-sqlite : https://docs.expo.dev/versions/latest/sdk/sqlite/
- NetInfo : https://github.com/react-native-community/react-native-netinfo
- expo-background-fetch : https://docs.expo.dev/versions/latest/sdk/background-fetch/
