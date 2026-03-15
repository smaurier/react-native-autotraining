# Screencast 24 — New Architecture : Fabric et JSI

## Informations

| Champ | Valeur |
|-------|--------|
| Duree cible | 12-15 min |
| Module | 24 — New Architecture : Fabric et JSI |
| Prérequis | Module 23 (Turbo Modules), Xcode, Android Studio |
| Fichiers demo | Projet avec Fabric Component custom (CircularProgress) |

---

## Script du screencast

### Intro (0:00 - 1:00)

"Dans ce screencast, on va créer un Fabric Component de bout en bout : un composant `CircularProgress` natif qui dessine une barre de progression circulaire. C'est un excellent cas d'usage : un rendu de ce type en pur JavaScript serait bien moins performant qu'en natif, surtout avec des animations."

"On va voir le workflow complet : component spec avec codegen, implementation iOS avec Core Animation, implementation Android avec Canvas, et utilisation dans un composant React."

### Partie 1 — Le component spec (1:00 - 3:30)

**Action** : créer `specs/CircularProgressNativeComponent.ts`

```typescript
import type { ViewProps } from 'react-native';
import type { Float, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

interface NativeProps extends ViewProps {
  progress: Float;
  strokeWidth?: WithDefault<Float, 8>;
  strokeColor?: string;
  trackColor?: string;
  size?: WithDefault<Int32, 100>;
  animated?: WithDefault<boolean, true>;
}

export default codegenNativeComponent<NativeProps>('CircularProgress');
```

**Points a souligner** :
- `extends ViewProps` — hérité de toutes les props de base (style, testID, etc.)
- `Float` et `Int32` — types codegen spécifiques, pas `number`
- `WithDefault<Float, 8>` — valeur par defaut cote natif, prop optionnelle cote JS
- `codegenNativeComponent` au lieu de `codegenNativeModule` — c'est un composant, pas un module

**Action** : montrer la différence avec un module spec

"Attention a ne pas confondre : `codegenNativeComponent` pour les vues, `TurboModuleRegistry` pour les modules. Ce sont deux systèmes différents du codegen."

### Partie 2 — Implementation iOS (3:30 - 7:00)

**Action** : ouvrir Xcode, créer `CircularProgressView.mm`

"Cote iOS, on va utiliser Core Animation avec deux CAShapeLayer : un pour le track (le fond gris), un pour la progression."

```objc
- (void)updateLayers {
    CGPoint center = CGPointMake(CGRectGetMidX(self.bounds),
                                 CGRectGetMidY(self.bounds));
    CGFloat radius = (MIN(self.bounds.size.width,
                          self.bounds.size.height) - _strokeWidth) / 2.0;

    UIBezierPath *path = [UIBezierPath bezierPathWithArcCenter:center
                                                        radius:radius
                                                    startAngle:-M_PI_2
                                                      endAngle:-M_PI_2 + 2*M_PI
                                                     clockwise:YES];

    _progressLayer.path = path.CGPath;
    _progressLayer.strokeEnd = _progress;
}
```

**Action** : créer le ComponentView (pont Fabric)

```objc
- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
    const auto &newProps = *std::static_pointer_cast<CircularProgressProps const>(props);
    const auto &oldProps_ = *std::static_pointer_cast<CircularProgressProps const>(_props);

    if (newProps.progress != oldProps_.progress) {
        _circularView.progress = newProps.progress;
    }
    // ... autres props
}
```

"C'est ici que Fabric brille : `updateProps` recoit les nouvelles et anciennes props en C++. Pas de serialisation, pas de bridge. On compare directement les valeurs et on ne met a jour que ce qui a change."

**Action** : `pod install`, build, montrer sur simulateur

### Partie 3 — Implementation Android (7:00 - 10:00)

**Action** : ouvrir Android Studio, créer `CircularProgressView.kt`

```kotlin
override fun onDraw(canvas: Canvas) {
    val sw = strokeWidth
    rectF.set(sw/2, sw/2, width - sw/2, height - sw/2)

    // Track
    canvas.drawArc(rectF, 0f, 360f, false, trackPaint)

    // Progress
    val sweepAngle = 360f * currentProgress
    canvas.drawArc(rectF, startAngle, sweepAngle, false, progressPaint)
}
```

"Android utilise `Canvas.drawArc()` pour dessiner l'arc. Même résultat visuel, API différente."

**Action** : créer le ViewManager avec delegate

```kotlin
@ReactProp(name = "progress")
override fun setProgress(view: CircularProgressView, progress: Float) {
    view.progress = progress
}
```

"Le ViewManager utilise un delegate généré par codegen. Si on oublie une prop du spec, ça ne compile pas."

### Partie 4 — Utilisation React (10:00 - 12:00)

**Action** : créer le wrapper React

```tsx
import NativeCircularProgress from '../specs/CircularProgressNativeComponent';

export function CircularProgress({ progress, size = 100, ...rest }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <NativeCircularProgress
        style={{ width: size, height: size }}
        progress={progress}
        {...rest}
      />
      <Text style={{ position: 'absolute' }}>
        {Math.round(progress * 100)}%
      </Text>
    </View>
  );
}
```

**Action** : utiliser dans un ecran avec un slider pour modifier la progression en temps réel

"Regardez : quand on bouge le slider, la progression se met a jour immediatement. Il n'y a pas de retard visible entre le mouvement du slider et la mise a jour du cercle. C'est le layout synchrone de Fabric."

**Action** : montrer l'animation native

"Et l'animation de transition est faite cote natif — Core Animation sur iOS, ValueAnimator sur Android. Zero travail cote JS pour l'animation."

### Partie 5 — Concurrent rendering demo (12:00 - 13:30)

**Action** : montrer useTransition avec une liste lourde + le CircularProgress

```tsx
const [isPending, startTransition] = useTransition();

function handleSlider(value) {
  setProgress(value); // urgent — met a jour le cercle immediatement
  startTransition(() => {
    setFilteredItems(heavyFilter(value)); // non-urgent — peut etre interrompu
  });
}
```

"Ici on combine notre Fabric Component avec le concurrent rendering. Le cercle se met a jour immediatement (c'est urgent), mais le filtrage de la liste peut etre interrompu si l'utilisateur continue a bouger le slider. L'UI reste toujours fluide."

### Conclusion (13:30 - 14:30)

"Recapitulons ce qu'on a vu :
1. Component spec avec `codegenNativeComponent` et les types Fabric (Float, Int32, WithDefault)
2. Implementation iOS avec CAShapeLayer et le ComponentView Fabric
3. Implementation Android avec Canvas et le ViewManager avec delegate
4. Wrapper React qui rend le composant natif utilisable comme n'importe quel composant JSX
5. Concurrent rendering avec useTransition

Le point clé : Fabric et JSI eliminent la latence du Bridge. Le layout est synchrone, les props sont comparees en C++, et le concurrent rendering permet de prioriser les interactions utilisateur. C'est ce qui fait que React Native en 2025 peut rivaliser avec le natif pur en termes de performance. A vous de jouer avec le lab !"

---

## Points a montrer a l'ecran

- [ ] Component spec vs module spec (la différence)
- [ ] Types codegen (Float, Int32, WithDefault)
- [ ] Code iOS : CAShapeLayer + ComponentView
- [ ] Code Android : Canvas.drawArc + ViewManager
- [ ] Build et exécution sur les deux plateformes
- [ ] Slider interactif avec mise a jour en temps réel
- [ ] Animation native fluide (pas de frame drop)
- [ ] useTransition avec liste lourde + composant natif

## Erreurs a montrer (optionnel)

- Utiliser `number` au lieu de `Float` dans le spec → erreur codegen
- Oublier `extends ViewProps` → les props de base (style, testID) ne marchent pas
- Nom du composant dans le spec différent du ViewManager → "Native component not found"
