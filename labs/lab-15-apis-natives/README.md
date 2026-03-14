# Lab 15 — APIs natives essentielles

## Objectif

Implementer en pur TypeScript les abstractions courantes pour interagir avec les APIs natives : permissions, systeme de fichiers, compression d'image, suivi GPS et intents de partage.

## Prerequis

- Module 15 : APIs natives essentielles
- TypeScript : interfaces, Map, formules mathematiques
- Concepts : permissions mobiles, systeme de fichiers, geolocalisation

## Lancement

```bash
# Exercice (tests en echec)
npx tsx labs/lab-15-apis-natives/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-15-apis-natives/solution.ts
```

## Exercices

### Exercice 1 : createPermissionManager (5 tests)

Simulez le modele de permissions d'Expo. Les permissions commencent a `undetermined` et passent a `granted` quand on appelle `request`. Gerez les cas d'erreur (permission inexistante) et les etats `denied`.

### Exercice 2 : createFileManager (5 tests)

Simulez un systeme de fichiers en memoire avec `write`, `read`, `delete`, `exists` et `listDir`. Le path utilise `/` comme separateur. `listDir` ne retourne que les fichiers directement dans le repertoire (pas les sous-repertoires).

### Exercice 3 : compressImageMetadata (3 tests)

Simulez la compression d'image en recalculant les metadonnees. Les dimensions sont multipliees par la quality, la taille est proportionnelle a l'aire (quality^2). Calculez le ratio de compression.

### Exercice 4 : createLocationTracker (5 tests)

Suivez des points GPS et calculez la distance totale (formule de Haversine), la duree et la vitesse moyenne. Gerez les cas limites (< 2 points, duree nulle).

### Exercice 5 : createShareIntent (5 tests)

Construisez un payload de partage adapte a iOS et Android. Sur Android, les URLs sont combinees avec le message. Les fichiers et images incluent un mimeType (defaut `application/octet-stream`).

## Evaluation

- 23 tests au total
- Tous les tests doivent passer
- Les types TypeScript doivent etre corrects
