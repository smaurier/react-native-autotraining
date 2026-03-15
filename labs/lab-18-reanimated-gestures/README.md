# Lab 18 — Reanimated & Gesture Handler (logique pure)

## Objectifs

Comprendre les mécanismes internes de react-native-reanimated et react-native-gesture-handler en implementant leurs concepts fondamentaux en TypeScript pur : shared values, clamping, gestion d'état de gestes, detection de swipe, interpolation, bornes de drag et timelines d'animation.

## Exercices

| # | Fonction | Concept teste | Difficulte |
|---|----------|--------------|------------|
| 1 | `createSharedValue` | Shared values (lecture/écriture réactive) | facile |
| 2 | `clampValue` | Clamping de valeurs (bornes d'animation) | facile |
| 3 | `createGestureState` | État de geste (begin/update/end/reset) | moyen |
| 4 | `createSwipeDetector` | Detection de direction de swipe avec seuil | moyen |
| 5 | `interpolateValue` | Interpolation lineaire multi-segments avec clamping | moyen |
| 6 | `createDragBounds` | Calcul des bornes de déplacement (drag/zoom) | facile |
| 7 | `createAnimationTimeline` | Timeline d'animation avec keyframes | moyen |

## Lancer les tests

```bash
# Exercice (avec TODOs — tous les tests echouent)
npx tsx labs/lab-18-reanimated-gestures/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-18-reanimated-gestures/solution.ts
```

## Concepts clés

- **SharedValue** : valeur accessible depuis le JS thread et le UI thread sans provoquer de re-render React
- **Clamping** : restriction d'une valeur dans un intervalle [min, max] — indispensable pour scale, opacite, translation
- **GestureState** : cycle de vie d'un geste (begin → update → end), similaire aux callbacks de Gesture.Pan()
- **SwipeDetector** : detection de direction basee sur un seuil, comme le SWIPE_THRESHOLD du projet Tinder
- **Interpolation** : mappage lineaire entre plages d'entree et de sortie — coeur de nombreuses animations
- **DragBounds** : limites de déplacement d'un élément dans un conteneur (utile pour pinch-to-zoom)
- **AnimationTimeline** : progression dans le temps avec keyframes, base des animations sequentielles

## Conseils

- L'exercice 5 (interpolateValue) est le plus technique — decomposez en étapes : clamping, recherche du segment, ratio, interpolation
- Pour createSwipeDetector, pensez a comparer les valeurs absolues des deltas pour trouver la direction dominante
- Pour createAnimationTimeline, reutilisez la logique d'interpolation de l'exercice 5
