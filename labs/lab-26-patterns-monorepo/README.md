# Lab 26 — Patterns avances et Monorepo

## Objectifs

Maitriser les mecanismes de resolution de workspaces, de detection des packages affectes, de pipeline de design tokens, de publication semantique et de cache de build propres aux monorepos.

## Exercices

### Exercice 1 : createWorkspaceResolver
Resolvez les packages d'un workspace, construisez le graphe de dependances et detectez les dependances circulaires.

### Exercice 2 : createAffectedFilter
Determinez quels packages sont affectes par un changement (directement ou transitivement) pour optimiser la CI.

### Exercice 3 : createDesignTokenPipeline
Transformez des design tokens en variables CSS ou en constantes React Native, generez les fichiers de sortie et validez les tokens.

### Exercice 4 : createPackagePublisher
Gerez le versioning semantique (patch, minor, major) et la publication des packages avec changelog.

### Exercice 5 : createBuildCache
Implementez un cache de build avec suivi du taux de hits pour eviter les rebuilds inutiles.

## Lancement

```bash
# Exercice
npx tsx labs/lab-26-patterns-monorepo/exercise.ts

# Solution
npx tsx labs/lab-26-patterns-monorepo/solution.ts
```
