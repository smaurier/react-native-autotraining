# Lab 16 — Capteurs et notifications

## Objectifs

Maitriser le traitement des donnees capteur (filtre passe-bas, moyenne mobile, detection de pas), la planification de notifications locales et la fusion de capteurs accelerometre/gyroscope en TypeScript pur.

## Exercices

### Exercice 1 : lowPassFilter
Appliquez un filtre passe-bas sur un vecteur 3D avec un coefficient alpha. Validez que alpha est entre 0 et 1.

### Exercice 2 : movingAverage
Calculez la moyenne mobile glissante d'un tableau de nombres avec une fenetre de taille configurable.

### Exercice 3 : createStepDetector
Implementez un detecteur de pas base sur la magnitude de l'acceleration : detection de pic (montee au-dessus du seuil puis descente) avec un intervalle minimum de 300ms entre deux pas.

### Exercice 4 : createNotificationScheduler
Creez un planificateur de notifications locales avec schedule, cancel, getScheduled (trie par temps) et cancelAll.

### Exercice 5 : createSensorFusion
Combinez accelerometre et gyroscope via un filtre complementaire pour obtenir une orientation fusionnee (pitch et roll).

## Lancement

```bash
# Exercice
npx tsx labs/lab-16-capteurs-notifications/exercise.ts

# Solution
npx tsx labs/lab-16-capteurs-notifications/solution.ts
```
