# Lab 22 — Déploiement et CI/CD

## Objectif

Implementer en pur TypeScript les mécanismes de déploiement et CI/CD : gestion de version semver, configuration de build EAS, checklist de release, canaux de mise a jour OTA et pipeline d'intégration continue.

## Prérequis

- Module 22 : Déploiement et CI/CD
- TypeScript : interfaces, Record, enums
- Concepts : semver, build profiles, OTA updates, CI/CD pipelines

## Lancement

```bash
# Exercice (tests en echec)
npx tsx labs/lab-22-deploiement-ci-cd/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-22-deploiement-ci-cd/solution.ts
```

## Exercices

### Exercice 1 : createVersionManager (3 tests)

Gerez le versioning semver (MAJOR.MINOR.PATCH) avec bump, build number auto-incremente et runtime version. L'historique conserve chaque version produite.

### Exercice 2 : createBuildConfig (3 tests)

Generez une configuration de build EAS selon la plateforme (ios/android) et le profil (development/preview/production). Chaque combinaison produit des options spécifiques : distribution, channel, variables d'environnement, options plateforme.

### Exercice 3 : createReleaseChecklist (3 tests)

Gerez une checklist de pre-release avec items bloquants et non-bloquants. La release est "complete" quand tous les items bloquants sont coches, même si des items non-bloquants restent.

### Exercice 4 : createUpdateChannel (3 tests)

Simulez un canal de mise a jour OTA (EAS Update) avec publication, rollback et historique. Le rollback supprime le dernier update et retourne au précédent.

### Exercice 5 : createCIPipeline (3 tests)

Simulez un pipeline CI/CD sequentiel. Si un stage echoue, les stages suivants sont "skipped". Le pipeline rapporte son status global, sa duree et le stage en echec.

## Évaluation

- 15 tests au total
- Tous les tests doivent passer
- Les types TypeScript doivent etre corrects
