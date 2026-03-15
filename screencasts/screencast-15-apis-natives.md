# Screencast 15 — APIs natives essentielles

## Objectifs
- Implementer un flux complet de capture photo avec geolocalisation
- Gérer les permissions de manière UX-friendly
- Manipuler le système de fichiers, le partage et les retours haptiques

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : acceder aux capteurs et fonctionnalites natives via Expo | Slides |
| 0:30-2:00 | Modèle de permissions Expo : useCameraPermissions, ensurePermission pattern, Linking.openSettings | VS Code + emulateur |
| 2:00-3:30 | expo-camera : capture photo, configuration (quality, exif), retournement front/back | VS Code + emulateur |
| 3:30-4:30 | Scan de codes-barres : barcodeScannerSettings, overlay de visee, anti-doublon (scanned state) | VS Code + emulateur |
| 4:30-6:00 | expo-image-picker : selection galerie, prise de photo, recadrage (allowsEditing, aspect) | VS Code + emulateur |
| 6:00-7:00 | Compression d'image : expo-image-manipulator, resize + compress, comparaison avant/après | VS Code + emulateur |
| 7:00-8:30 | expo-location : position courante, watchPositionAsync, geocodage inverse | VS Code + emulateur |
| 8:30-9:30 | Suivi GPS background : permissions, TaskManager, foregroundService notification, barre bleue iOS | VS Code + emulateur |
| 9:30-10:30 | expo-file-system : écriture, lecture, telechargement avec progression, répertoires | VS Code + emulateur |
| 10:30-11:30 | Partage : Share API native, expo-sharing pour fichiers, adaptation iOS/Android | VS Code + emulateur |
| 11:30-12:30 | expo-clipboard et expo-haptics : copier/coller, feedback tactile adapte à chaque action | VS Code + emulateur |
| 12:30-14:00 | Demo complete : capture photo geolocalisee, compression, sauvegarde locale, partage | VS Code + emulateur |
| 14:00-15:00 | Récapitulatif et bonnes pratiques (permissions, compression, batterie) | Slides |

## Points clés a montrer
- Le flow de permissions avec ecran explicatif avant le dialogue système
- La capture photo avec preview et bouton retourner (front/back)
- Le scan de code-barres avec overlay de visee et feedback haptique
- La différence de taille avant/après compression (afficher les Ko)
- Le suivi GPS en temps réel avec affichage des coordonnees
- Le telechargement de fichier avec barre de progression
- Le partage adapte iOS vs Android (Platform.select)

## Ressources
- expo-camera : https://docs.expo.dev/versions/latest/sdk/camera/
- expo-image-picker : https://docs.expo.dev/versions/latest/sdk/imagepicker/
- expo-location : https://docs.expo.dev/versions/latest/sdk/location/
- expo-file-system : https://docs.expo.dev/versions/latest/sdk/filesystem/
- expo-sharing : https://docs.expo.dev/versions/latest/sdk/sharing/
- expo-haptics : https://docs.expo.dev/versions/latest/sdk/haptics/
