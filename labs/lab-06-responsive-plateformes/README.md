# Lab 06 — Responsive et plateformes

## Objectifs

Maîtriser les breakpoints responsive, le scaling de polices, la selection par plateforme, la detection d'orientation et les calculs de grille en TypeScript pur.

## Exercices

### Exercice 1 : getBreakpoint
Implementez la logique de breakpoint : phone (<768), tablet (768-1023), desktop (>=1024).

### Exercice 2 : scaleFont
Calculez une taille de police mise a l'echelle avec un facteur maximum (clamp).

### Exercice 3 : platformSelect
Selectionnez une valeur en fonction de la plateforme (ios, android, web) avec fallback sur default.

### Exercice 4 : getOrientation
Detectez l'orientation (portrait/landscape) à partir de la largeur et la hauteur.

### Exercice 5 : createResponsiveValue
Creez un objet contenant une valeur pour chaque breakpoint.

### Exercice 6 : resolveResponsiveValue
Resolvez la valeur correspondant au breakpoint courant.

### Exercice 7 : computeSafeAreaPadding
Combinez les insets de zone securisee avec un padding minimum.

### Exercice 8 : getScreenInfo
Construisez un objet complet d'informations sur l'ecran.

### Exercice 9 : scaleDimension
Calculez les dimensions physiques en pixels à partir du pixel ratio.

### Exercice 10 : computeGridColumns
Calculez le nombre de colonnes d'une grille responsive.

## Lancement

```bash
# Exercice
npx tsx labs/lab-06-responsive-plateformes/exercise.ts

# Solution
npx tsx labs/lab-06-responsive-plateformes/solution.ts
```
