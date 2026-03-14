# Lab 05 — StyleSheet et Flexbox

## Objectif

Implementer les algorithmes de layout et de gestion de styles utilises dans React Native : calcul de positions Flexbox, fusion de styles, valeurs responsives, grilles et styles par plateforme.

## Concepts cles

### Algorithme Flexbox simplifie

L'algorithme de distribution Flexbox fonctionne en 3 etapes :
1. Calculer la taille de base de chaque enfant (`flexBasis`)
2. Calculer l'espace libre (`containerSize - somme des bases`)
3. Distribuer l'espace libre selon `flexGrow` (espace positif) ou retrecir selon `flexShrink` (espace negatif)

### Fusion de styles

React Native accepte des tableaux de styles `[style1, condition && style2]`. La strategie est "last-wins" : la derniere valeur definie pour une propriete l'emporte.

### Valeurs responsives

Les breakpoints definissent des seuils de largeur d'ecran. La valeur responsive correspond au plus grand breakpoint actif.

### Grille reguliere

Dans une grille de N colonnes avec un gap, la largeur de chaque element est :
`(containerWidth - gap * (columns + 1)) / columns`

### Styles par plateforme

On fusionne les styles `common` avec les styles specifiques a la plateforme (`ios` ou `android`), les styles de plateforme ecrasant les valeurs communes.

## Exercices

```bash
npx tsx exercise.ts
```
