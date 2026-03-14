# Screencast 22 — Deploiement et CI/CD

## Objectifs
- Configurer EAS Build avec trois profils (dev, preview, production)
- Soumettre une app aux stores avec EAS Submit
- Deployer un hotfix OTA avec EAS Update
- Mettre en place un pipeline CI/CD complet avec GitHub Actions

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : du code local a l'App Store | Slides |
| 0:30-2:00 | Signature iOS et Android : concepts et diagrammes | Slides |
| 2:00-4:00 | Configuration eas.json : profils development, preview, production | VS Code |
| 4:00-5:30 | Premier build avec EAS : eas build --profile development | Terminal + Expo dashboard |
| 5:30-7:00 | EAS Submit : configurer App Store Connect et Google Play Console | VS Code + navigateur |
| 7:00-9:00 | EAS Update : publier un hotfix OTA, verifier sur l'app | Terminal + simulateur |
| 9:00-10:30 | Canaux et branches : preview vs production, rollback | Terminal + Expo dashboard |
| 10:30-12:00 | Versioning : semver, build numbers, runtime version, autoIncrement | VS Code |
| 12:00-14:00 | CI/CD GitHub Actions : workflow complet (lint, test, build, submit) | VS Code + GitHub |
| 14:00-15:30 | Variables d'environnement et app.config.ts dynamique | VS Code |
| 15:30-17:00 | Gestion des secrets EAS et bonnes pratiques de securite | Terminal |
| 17:00-18:00 | Demo du workflow complet : PR → merge → deploy automatique | GitHub + Expo dashboard |
| 18:00-19:00 | Recapitulatif et mention de Fastlane comme alternative | Slides |

## Points cles a montrer
- EAS gere automatiquement les credentials iOS (certificats, provisioning profiles)
- La difference entre EAS Build (nouveau binaire) et EAS Update (OTA JS bundle)
- Le flag --auto-submit pour combiner build + soumission en une commande
- La runtime version "fingerprint" pour detecter automatiquement les changements natifs
- Le workflow CI : quality gate sur PR, OTA sur develop, build+submit sur main
- Comment deployer un hotfix urgent via EAS Update sans attendre la review store

## Ressources
- EAS Build : https://docs.expo.dev/build/introduction/
- EAS Submit : https://docs.expo.dev/submit/introduction/
- EAS Update : https://docs.expo.dev/eas-update/introduction/
- GitHub Actions + Expo : https://docs.expo.dev/build/building-on-ci/
