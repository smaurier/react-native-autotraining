# Lab 17 — Animated API et LayoutAnimation

## Objectifs

Maîtriser les concepts fondamentaux de l'Animated API en TypeScript pur : valeurs animees avec interpolation, animations timing avec easing, simulation de ressort (spring), calcul de delai stagger, sequences d'animations et fonctions d'easing.

## Exercices

### Exercice 1 : createAnimatedValue
Creez une valeur animee avec getValue, setValue et interpolate. L'interpolation supporte plusieurs segments, et trois modes d'extrapolation (extend, clamp, identity).

### Exercice 2 : createTimingAnimation
Implementez une animation timing qui interpole lineairement (où via une fonction d'easing) entre deux valeurs sur une duree donnee.

### Exercice 3 : createSpringAnimation
Simulez une animation spring avec les forces de ressort (tension) et de friction. La méthode step(dt) avance la simulation pas a pas.

### Exercice 4 : staggerDelay
Calculez le delai de démarrage d'un élément dans une liste animee en stagger.

### Exercice 5 : createAnimationSequence
Creez une sequence d'animations qui s'executent l'une après l'autre, avec getValueAtTime pour interroger la valeur a tout instant.

### Exercice 6 : createEasingFunctions
Implementez cinq fonctions d'easing : linear, easeIn, easeOut, easeInOut et bounce.

## Lancement

```bash
# Exercice
npx tsx labs/lab-17-animated-api/exercise.ts

# Solution
npx tsx labs/lab-17-animated-api/solution.ts
```
