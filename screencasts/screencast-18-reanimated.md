# Screencast 18 — Swipeable Card Stack et Pinch-to-Zoom

| Metadata | Valeur |
|----------|--------|
| **Duree** | ~14 min |
| **Module** | [18 — Reanimated et Gesture Handler](/modules/18-reanimated-et-gesture-handler) |
| **Outils** | VS Code, Emulateur iOS/Android ou appareil physique, Expo |

---

## Plan de tournage

### Intro (0:00 - 0:40)
- "Dans ce screencast, on va construire deux composants interactifs complets : un swipeable card stack à la Tinder et un pinch-to-zoom image viewer. On va utiliser Reanimated 3 et la Gesture API de react-native-gesture-handler."
- Montrer le résultat final des deux composants (video ou GIF)
- "On va voir en pratique les shared values, withSpring, withTiming, interpolate, Gesture.Pan, Gesture.Pinch, et Gesture.Simultaneous."

### Partie 1 — Setup du projet (0:40 - 1:30)
- Installer les dépendances :
  ```bash
  npx expo install react-native-reanimated react-native-gesture-handler
  ```
- Configurer `babel.config.js` (plugin Reanimated en dernier)
- Envelopper l'app dans `GestureHandlerRootView`
- "Ce wrapper est obligatoire — sans lui, aucun geste ne sera détecté."

### Partie 2 — Shared Values et premier Animated.View (1:30 - 3:00)
- Créer un composant `SwipeCard` basique
- Introduire `useSharedValue` pour translateX et translateY :
  ```tsx
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  ```
- Créer le style anime avec `useAnimatedStyle` :
  ```tsx
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));
  ```
- "useAnimatedStyle est un worklet — il s'exécuté sur le UI thread, a 60 fps, sans re-render React."
- Tester en modifiant manuellement la shared value avec un bouton

### Partie 3 — Ajouter le geste Pan (3:00 - 5:00)
- Importer `Gesture` et `GestureDetector`
- Créer le geste Pan :
  ```tsx
  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });
  ```
- Montrer la carte qui suit le doigt et revient au centre
- Expliquer withSpring : "L'animation de ressort est plus naturelle que withTiming pour le retour — pas besoin de choisir une duree."
- Ajuster les paramètres spring en live : montrer l'effet de `damping: 6` vs `damping: 20`

### Partie 4 — Rotation et overlays Like/Nope (5:00 - 7:00)
- Ajouter la rotation avec `interpolate` :
  ```tsx
  const rotation = interpolate(
    translateX.value,
    [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    [-15, 0, 15],
    Extrapolation.CLAMP,
  );
  ```
- "interpolate mappe une plage d'entree vers une plage de sortie. Ici, quand le doigt va a droite, la carte tourne a droite."
- Ajouter les overlays LIKE et NOPE avec opacite interpolee
- Montrer en live : la carte tourne et affiche LIKE ou NOPE selon la direction

### Partie 5 — Logique de swipe et seuil (7:00 - 9:00)
- Définir le seuil de swipe : `SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3`
- Implementer la logique dans onEnd :
  ```tsx
  .onEnd((event) => {
    if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
      // Animer la sortie
      const dest = translateX.value > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      translateX.value = withTiming(dest, { duration: 300 }, () => {
        runOnJS(handleSwipeComplete)(direction);
      });
    } else {
      // Retour au centre
      translateX.value = withSpring(0);
    }
  })
  ```
- Expliquer `runOnJS` : "On est dans un worklet — pour appeler du code JS (setState, navigation), on utilise runOnJS."
- Implementer le CardStack avec plusieurs cartes empilees
- Montrer la carte arriere qui s'agrandit pendant le swipe (interpolation du scale)

### Partie 6 — Pinch-to-Zoom Image Viewer (9:00 - 12:00)
- Nouveau composant `PinchToZoom`
- Ajouter le geste Pinch :
  ```tsx
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });
  ```
- "savedScale garde la dernière valeur de zoom entre les gestes."
- Ajouter le Pan pour deplacer l'image zoomee
- Composer avec `Gesture.Simultaneous(pinch, pan)` :
  - "Simultaneous permet au pinch et au pan de fonctionner en même temps — essentiel pour un vrai zoom."
- Ajouter le double tap pour toggle zoom :
  ```tsx
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((e) => {
      // Toggle entre 1x et 3x
    });
  ```
- Composer le tout : `Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, Gesture.Tap()))`
- "Exclusive fait que le double tap est prioritaire sur le single tap."
- Ajouter le clamping du scale (min 1, max 5) et les bornes de translation
- Tester sur emulateur (Ctrl+Scroll pour simuler le pinch)

### Partie 7 — Peaufinage et bonnes pratiques (12:00 - 13:30)
- Ajouter le rebond elastique quand on dépasse les bornes du zoom :
  ```tsx
  if (scale.value < MIN_SCALE) {
    scale.value = withSpring(MIN_SCALE);
  }
  ```
- Montrer `cancelAnimation` : "Toujours annuler une animation en cours avant d'en lancer une nouvelle."
- Recapituler les regles de performance :
  - "useSharedValue pour tout ce qui bouge"
  - "useAnimatedStyle = pur worklet, jamais de setState dedans"
  - "withSpring pour les interactions, withTiming pour les transitions UI"
  - "runOnJS uniquement quand nécessaire"

### Conclusion (13:30 - 14:00)
- Recapituler : "On a vu les shared values, 4 types d'animation (timing, spring, decay, repeat), interpolate, 3 gestes (Pan, Pinch, Tap), et 2 compositions (Simultaneous, Exclusive)."
- "Ces patterns couvrent 90% des besoins d'animation dans une app React Native. Experimentez avec les paramètres de spring et les compositions de gestes."
- Mentionner le lab 18 pour pratiquer la logique sous-jacente
