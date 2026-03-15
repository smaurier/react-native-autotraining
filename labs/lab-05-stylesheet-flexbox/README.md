# Lab 05 — StyleSheet et Flexbox

## Objectif

Implementer les algorithmes de layout et de gestion de styles utilises dans React Native : calcul de positions Flexbox, fusion de styles, valeurs responsives, grilles et styles par plateforme.

## Concepts clés

### Algorithme Flexbox simplifie

L'algorithme de distribution Flexbox fonctionne en 3 étapes :
1. Calculer la taille de base de chaque enfant (`flexBasis`)
2. Calculer l'espace libre (`containerSize - somme des bases`)
3. Distribuer l'espace libre selon `flexGrow` (espace positif) ou retrecir selon `flexShrink` (espace negatif)

### Fusion de styles

React Native accepte des tableaux de styles `[style1, condition && style2]`. La stratégie est "last-wins" : la dernière valeur definie pour une propriété l'emporte.

### Valeurs responsives

Les breakpoints definissent des seuils de largeur d'ecran. La valeur responsive correspond au plus grand breakpoint actif.

### Grille reguliere

Dans une grille de N colonnes avec un gap, la largeur de chaque élément est :
`(containerWidth - gap * (columns + 1)) / columns`

### Styles par plateforme

On fusionne les styles `common` avec les styles spécifiques à la plateforme (`ios` ou `android`), les styles de plateforme ecrasant les valeurs communes.

## Exercices

```bash
npx tsx exercise.ts
```
