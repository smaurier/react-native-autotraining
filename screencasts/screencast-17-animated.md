# Screencast 17 — Animated API et LayoutAnimation

## Informations
- **Duree estimee** : 18-20 min
- **Module** : `modules/17-animated-api-layout-animation.md`
- **Lab associe** : Lab 17
- **Prerequis** : Screencast 16

## Setup
- [ ] VS Code ouvert dans un projet Expo
- [ ] Terminal integre ouvert
- [ ] Simulateur iOS et emulateur Android lances
- [ ] Fichier `modules/17-animated-api-layout-animation.md` ouvert

## Script

### [00:00-02:00] Introduction — Pourquoi l'Animated API ?

> Les animations sont essentielles pour une bonne UX mobile. L'Animated API de React Native permet de creer des animations fluides a 60 fps en les executant directement sur le thread natif, sans passer par React.

**Action** : Montrer deux versions d'un bouton presse : sans animation (changement instantane) et avec animation spring (retour elastique). La difference est frappante.

> Le concept cle : Animated.Value est un nombre mutable qui bypass React. Au lieu de setState → re-render → commit, le thread natif met a jour la propriete directement.

### [02:00-05:00] Animated.Value et timing

> Animated.Value se cree avec useRef pour survivre aux re-renders sans en declencher.

**Action** : Creer une animation fade-in avec Animated.timing.

```typescript
const opacity = useRef(new Animated.Value(0)).current;

const fadeIn = () => {
  Animated.timing(opacity, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start();
};

return (
  <Animated.View style={{ opacity }}>
    <Text>Contenu</Text>
  </Animated.View>
);
```

**Action** : Tester avec differentes durees (100ms, 300ms, 1000ms) et courbes d'easing.

```typescript
// Easing standard
easing: Easing.ease

// Deceleration douce (pour les apparitions)
easing: Easing.out(Easing.cubic)

// Rebond
easing: Easing.bounce
```

**Action** : Montrer visuellement la difference entre linear, ease-in, ease-out, et bounce.

### [05:00-08:00] Animated.spring — animations physiques

> Spring simule un ressort physique. Pas de duree fixe — le ressort s'arrete quand l'equilibre est atteint. C'est parfait pour les interactions utilisateur.

**Action** : Creer un bouton avec scale spring.

```typescript
const scale = useRef(new Animated.Value(1)).current;

<Pressable
  onPressIn={() => {
    Animated.spring(scale, {
      toValue: 0.95,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }}
  onPressOut={() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }}
>
  <Animated.View style={{ transform: [{ scale }] }}>
    <Text>Appuyez</Text>
  </Animated.View>
</Pressable>
```

**Action** : Comparer differents parametres de spring.
- tension haute + friction basse : tres rebondissant
- tension haute + friction haute : rapide et precis
- tension basse + friction basse : lent et doux

> Regle : Spring pour les interactions (tap, drag), Timing pour les transitions automatiques (ecran, fade).

### [08:00-11:00] Interpolation — l'outil le plus puissant

> L'interpolation mappe une valeur d'entree vers une valeur de sortie. Une seule Animated.Value peut piloter plusieurs proprietes simultanement.

**Action** : Creer un header qui reagit au scroll.

```typescript
const scrollY = useRef(new Animated.Value(0)).current;

const headerOpacity = scrollY.interpolate({
  inputRange: [0, 150],
  outputRange: [1, 0],
  extrapolate: 'clamp',
});

const headerScale = scrollY.interpolate({
  inputRange: [0, 150],
  outputRange: [1, 0.8],
  extrapolate: 'clamp',
});
```

**Action** : Scroller pour montrer le header qui disparait progressivement.

> 'clamp' est crucial : sans lui, l'opacite pourrait devenir negative (quand scrollY depasse 150). Toujours penser a clamp pour les animations liees au scroll.

**Action** : Montrer l'interpolation multi-segments.

```typescript
const backgroundColor = progress.interpolate({
  inputRange: [0, 0.5, 1],
  outputRange: ['#FF0000', '#FFFF00', '#00FF00'],
});
```

### [11:00-14:00] Combinaisons : stagger et sequence

> On peut combiner des animations pour creer des effets complexes.

**Action** : Creer une liste avec entree staggeree.

```typescript
const animations = items.map(() => new Animated.Value(0));

Animated.stagger(80, animations.map(anim =>
  Animated.spring(anim, {
    toValue: 1,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  })
)).start();
```

**Action** : Montrer l'effet cascade — chaque element apparait 80ms apres le precedent.

**Action** : Creer une sequence bounce-in (scale 0 → 1.2 → 1).

```typescript
Animated.sequence([
  Animated.timing(scale, {
    toValue: 1.2,
    duration: 200,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }),
  Animated.spring(scale, {
    toValue: 1,
    tension: 100,
    friction: 5,
    useNativeDriver: true,
  }),
]).start();
```

**Action** : Montrer le resultat — l'element grossit puis revient avec un rebond.

### [14:00-16:00] LayoutAnimation — simplicite maximale

> LayoutAnimation anime automatiquement les changements de layout au prochain render. Une seule ligne suffit.

**Action** : Activer le flag experimental Android.

```typescript
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}
```

**Action** : Creer une liste avec ajout/suppression animes.

```typescript
const addItem = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setItems([...items, `Item ${items.length + 1}`]);
};

const removeItem = (index) => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setItems(items.filter((_, i) => i !== index));
};
```

**Action** : Ajouter et supprimer des elements — les autres elements se decalent avec une animation fluide.

> Attention : LayoutAnimation est experimental sur Android et peut causer des bugs avec FlatList. Pour les listes, preferez l'Animated API avec stagger.

### [16:00-18:00] useNativeDriver — les pieges

> useNativeDriver: true execute l'animation sur le thread natif. Mais toutes les proprietes ne sont pas supportees.

**Action** : Montrer l'erreur quand on utilise useNativeDriver: true avec width.

```typescript
// CRASH
Animated.timing(width, {
  toValue: 200,
  useNativeDriver: true, // "Style property 'width' is not supported"
});
```

**Action** : Montrer la solution — utiliser scaleX au lieu de width.

```typescript
// OK
Animated.timing(scaleX, {
  toValue: targetWidth / initialWidth,
  useNativeDriver: true,
});
```

> Regle : opacity et transform sont supportes. Tout le reste (width, height, margin, backgroundColor) necessite useNativeDriver: false, ce qui est acceptable pour les animations ponctuelles.

**Action** : Montrer le crash quand on mixe les drivers sur la meme Animated.Value.

> Une Animated.Value ne peut pas changer de driver. Si vous animez avec useNativeDriver: true, vous ne pouvez pas ensuite l'animer avec useNativeDriver: false. Utilisez deux valeurs separees si necessaire.

### [18:00-19:00] Recap

> En resume : Animated.Value + useRef est la base. Timing pour les transitions programmees, Spring pour les interactions. Interpolation pour piloter plusieurs proprietes depuis une seule valeur. Stagger et sequence pour les effets complexes. LayoutAnimation pour le layout simple. Et toujours useNativeDriver: true quand c'est possible. Passez au Lab 17 pour implementer tout cela.
