# Module 24 — New Architecture : Fabric et JSI

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 5/5        | 90 min        | [Lab 24](../labs/lab-24-fabric-jsi/) | [Quiz 24](../quizzes/quiz-24-fabric.html) |

## Objectifs

- Comprendre JSI en profondeur : host objects, mémoire partagee, appels synchrones
- Maîtriser le Fabric renderer : shadow tree, rendering concurrent, layout synchrone
- Créer un Fabric Component (vue native custom)
- Écrire un component spec et générer le code natif via codegen
- Utiliser les fonctionnalites concurrentes (useTransition, useDeferredValue) en contexte React Native
- Migrer un projet vers la New Architecture
- Comparer les performances Bridge vs JSI

---

## JSI : JavaScript Interface

JSI est la couche fondamentale de la New Architecture. C'est une interface C++ qui permet a JavaScript et au code natif de communiquer directement, sans passer par le Bridge.

### Qu'est-ce qu'un Host Object ?

Un Host Object est un objet C++ expose directement dans l'environnement JavaScript. Contrairement au Bridge (serialisation JSON), l'objet natif est accessible en mémoire partagee.

```
┌──────────────────────────────────────────────────────┐
│                    JavaScript VM                      │
│                                                       │
│  const module = global.__turboModuleProxy('Battery')  │
│  const level = module.getBatteryLevel()               │
│         │                                             │
│         │  Appel direct via vtable C++                │
│         ▼                                             │
│  ┌─────────────────────────────────┐                 │
│  │     JSI Host Object (C++)       │                 │
│  │                                  │                 │
│  │  get(runtime, propName)          │                 │
│  │  → retourne une JSI::Value       │                 │
│  │  → pas de serialisation          │                 │
│  │  → pas de file d'attente         │                 │
│  └─────────────────────────────────┘                 │
└──────────────────────────────────────────────────────┘
```

### Anatomie d'un Host Object C++

```cpp
#include <jsi/jsi.h>

using namespace facebook::jsi;

class BatteryHostObject : public HostObject {
public:
    // Appele quand JS lit une propriete : obj.someProperty
    Value get(Runtime& runtime, const PropNameID& name) override {
        std::string propName = name.utf8(runtime);

        if (propName == "level") {
            // Retourne une valeur directement — pas de serialisation
            return Value(getBatteryLevelNative());
        }

        if (propName == "isCharging") {
            return Value(isChargingNative());
        }

        if (propName == "getDetails") {
            // Retourne une fonction callable depuis JS
            return Function::createFromHostFunction(
                runtime,
                PropNameID::forUtf8(runtime, "getDetails"),
                0, // nombre d'arguments
                [](Runtime& rt,
                   const Value& thisVal,
                   const Value* args,
                   size_t count) -> Value {
                    // Creer un objet JS directement en C++
                    Object result(rt);
                    result.setProperty(rt, "level", getBatteryLevelNative());
                    result.setProperty(rt, "isCharging", isChargingNative());
                    result.setProperty(rt, "temperature", getTemperatureNative());
                    return result;
                }
            );
        }

        return Value::undefined();
    }

    // Appele quand JS ecrit une propriete : obj.someProperty = value
    void set(Runtime& runtime, const PropNameID& name, const Value& value) override {
        std::string propName = name.utf8(runtime);

        if (propName == "threshold") {
            double threshold = value.asNumber();
            setThresholdNative(threshold);
        }
    }

    // Liste des proprietes enumerables
    std::vector<PropNameID> getPropertyNames(Runtime& runtime) override {
        std::vector<PropNameID> result;
        result.push_back(PropNameID::forUtf8(runtime, "level"));
        result.push_back(PropNameID::forUtf8(runtime, "isCharging"));
        result.push_back(PropNameID::forUtf8(runtime, "getDetails"));
        result.push_back(PropNameID::forUtf8(runtime, "threshold"));
        return result;
    }

private:
    static double getBatteryLevelNative();
    static bool isChargingNative();
    static double getTemperatureNative();
    static void setThresholdNative(double threshold);
};
```

### Installation d'un Host Object dans le runtime

```cpp
// Installer le host object dans le global JavaScript
void installBatteryModule(Runtime& runtime) {
    auto hostObject = std::make_shared<BatteryHostObject>();

    // Cree un objet JS qui proxy vers le C++
    Object jsObject = Object::createFromHostObject(runtime, hostObject);

    // Accessible comme global.BatteryModule en JS
    runtime.global().setProperty(
        runtime,
        "BatteryModule",
        std::move(jsObject)
    );
}
```

```typescript
// Cote JavaScript — utilisation directe
declare global {
  var BatteryModule: {
    level: number;
    isCharging: boolean;
    threshold: number;
    getDetails(): { level: number; isCharging: boolean; temperature: number };
  };
}

// Appel synchrone — retour immediat
const level = global.BatteryModule.level;
const details = global.BatteryModule.getDetails();
```

### Types JSI fondamentaux

| Type JSI (C++) | Type JavaScript | Description |
|---------------|----------------|-------------|
| `Value::undefined()` | `undefined` | Valeur non definie |
| `Value::null()` | `null` | Null |
| `Value(true)` | `true` | Booleen |
| `Value(42.0)` | `42` | Nombre (toujours double) |
| `String::createFromUtf8(rt, "hello")` | `"hello"` | Chaine |
| `Object(rt)` | `{}` | Objet |
| `Array::createWithElements(rt, ...)` | `[]` | Tableau |
| `Function::createFromHostFunction(...)` | `function` | Fonction |
| `Object::createFromHostObject(...)` | Proxy objet | Host object |

### Gestion mémoire JSI

JSI utilise un système de gestion mémoire spécifique :

```cpp
// Les Value sont des valeurs temporaires sur la stack
Value getLevel(Runtime& rt) {
    return Value(0.85); // Pas d'allocation heap
}

// Les String/Object/Function sont reference-counted
String createString(Runtime& rt) {
    // Alloue sur le heap JS, GC-managed
    return String::createFromUtf8(rt, "hello");
}

// ATTENTION : ne jamais stocker un Runtime& ou Value au-dela de leur scope
// INCORRECT :
Runtime* savedRuntime; // DANGER — le runtime peut etre detruit
Value savedValue;      // DANGER — peut etre GC'ed

// CORRECT : utiliser des shared_ptr pour les HostObjects
auto hostObj = std::make_shared<MyHostObject>();
```

---

## Fabric Renderer

Fabric est le nouveau système de rendu de React Native. Il remplace le Bridge-based renderer par un renderer C++ intégré.

### Architecture du renderer Fabric

```
┌─────────────────────────────────────────────────────────┐
│                    React (JavaScript)                     │
│                                                           │
│  <View style={{ flex: 1 }}>                              │
│    <Text>Hello</Text>                                    │
│    <CircularProgress progress={0.7} />                   │
│  </View>                                                 │
│                                                           │
└────────────────────────┬────────────────────────────────┘
                         │ Fiber tree (React reconciliation)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Shadow Tree (C++)                        │
│                                                           │
│  ShadowNode<View>                                        │
│    ├── ShadowNode<Text>                                  │
│    │     └── "Hello"                                     │
│    └── ShadowNode<CircularProgress>                      │
│          └── props: { progress: 0.7 }                    │
│                                                           │
│  - Layout calcule en C++ (Yoga)                          │
│  - Diff et mutations en C++                              │
│  - Acces synchrone depuis JS via JSI                     │
│                                                           │
└────────────────────────┬────────────────────────────────┘
                         │ Mutations (create, update, delete, insert)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Native Views (plateforme)                    │
│                                                           │
│  iOS: UIView, UILabel, CircularProgressView              │
│  Android: View, TextView, CircularProgressView           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Shadow Tree en detail

Le Shadow Tree est une representation intermédiaire en C++ de l'arbre de composants :

```
Etape 1 : React reconcile (JS)
  → Produit un arbre de Fiber nodes

Etape 2 : Shadow Tree (C++)
  → Chaque Fiber node cree un ShadowNode C++
  → Les props sont convertes en C++ structs (pas de JSON)
  → Le layout est calcule par Yoga (C++)

Etape 3 : Diffing (C++)
  → L'ancien et le nouveau Shadow Tree sont compares
  → Les mutations sont calculees (create, delete, insert, update)

Etape 4 : Mounting (main thread natif)
  → Les mutations sont appliquees aux vues natives
  → Synchrone avec le layout → pas de "layout flash"
```

### Comparaison avec l'ancien renderer

| Aspect | Ancien (Paper) | Nouveau (Fabric) |
|--------|----------------|-------------------|
| Communication | Bridge asynchrone (JSON) | JSI synchrone (C++) |
| Layout | Calcule en JS, transmis via bridge | Calcule en C++ (Yoga), acces synchrone |
| Thread model | 3 threads separes, communication async | Exécution sur n'importe quel thread |
| Mounting | Asynchrone (batched) | Synchrone possible (priorite) |
| Concurrent rendering | Non supporte | Supporte (useTransition, Suspense) |
| Layout flash | Possible (1 frame de retard) | Elimine (layout synchrone) |

---

## Créer un Fabric Component

### Exemple : CircularProgress

Un composant natif qui dessine une barre de progression circulaire — impossible a realiser en pur JS avec les memes performances.

### Étape 1 : le component spec

```typescript
// specs/CircularProgressNativeComponent.ts
import type { ViewProps } from 'react-native';
import type {
  Float,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

interface NativeProps extends ViewProps {
  // Progression de 0.0 a 1.0
  progress: Float;

  // Epaisseur du trait (en points)
  strokeWidth?: WithDefault<Float, 8>;

  // Couleur du trait actif
  strokeColor?: string;

  // Couleur du fond (trait inactif)
  trackColor?: string;

  // Taille du composant
  size?: WithDefault<Int32, 100>;

  // Angle de depart (en degres, 0 = haut)
  startAngle?: WithDefault<Float, -90>;

  // Cap des traits : 'butt' | 'round' | 'square'
  lineCap?: WithDefault<string, 'round'>;

  // Animation de la progression
  animated?: WithDefault<boolean, true>;

  // Duree de l'animation (ms)
  animationDuration?: WithDefault<Int32, 300>;
}

export default codegenNativeComponent<NativeProps>('CircularProgress');
```

### Types codegen disponibles

```typescript
import type {
  Float,              // nombre flottant (CGFloat / float)
  Double,             // nombre double precision
  Int32,              // entier 32 bits
  WithDefault,        // valeur par defaut
  BubblingEventHandler,  // evenement qui remonte (onPress)
  DirectEventHandler,    // evenement direct (onLayout)
} from 'react-native/Libraries/Types/CodegenTypes';
```

### Étape 2 : Implementation iOS (Objective-C++)

```objc
// ios/CircularProgressView.h
#import <UIKit/UIKit.h>

@interface CircularProgressView : UIView

@property (nonatomic, assign) CGFloat progress;
@property (nonatomic, assign) CGFloat strokeWidth;
@property (nonatomic, strong) UIColor *strokeColor;
@property (nonatomic, strong) UIColor *trackColor;
@property (nonatomic, assign) CGFloat size;
@property (nonatomic, assign) CGFloat startAngle;
@property (nonatomic, copy) NSString *lineCap;
@property (nonatomic, assign) BOOL animated;
@property (nonatomic, assign) NSInteger animationDuration;

@end
```

```objc
// ios/CircularProgressView.mm
#import "CircularProgressView.h"

@implementation CircularProgressView {
    CAShapeLayer *_trackLayer;
    CAShapeLayer *_progressLayer;
}

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        _strokeWidth = 8.0;
        _strokeColor = [UIColor systemBlueColor];
        _trackColor = [[UIColor systemGrayColor] colorWithAlphaComponent:0.3];
        _startAngle = -M_PI_2; // -90 degres = haut
        _lineCap = @"round";
        _animated = YES;
        _animationDuration = 300;
        _progress = 0.0;

        _trackLayer = [CAShapeLayer layer];
        _progressLayer = [CAShapeLayer layer];

        [self.layer addSublayer:_trackLayer];
        [self.layer addSublayer:_progressLayer];
    }
    return self;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    [self updateLayers];
}

- (void)updateLayers {
    CGPoint center = CGPointMake(
        CGRectGetMidX(self.bounds),
        CGRectGetMidY(self.bounds)
    );
    CGFloat radius = (MIN(self.bounds.size.width, self.bounds.size.height)
                      - _strokeWidth) / 2.0;

    UIBezierPath *circlePath = [UIBezierPath
        bezierPathWithArcCenter:center
        radius:radius
        startAngle:_startAngle
        endAngle:_startAngle + 2 * M_PI
        clockwise:YES];

    // Track (fond)
    _trackLayer.path = circlePath.CGPath;
    _trackLayer.fillColor = UIColor.clearColor.CGColor;
    _trackLayer.strokeColor = _trackColor.CGColor;
    _trackLayer.lineWidth = _strokeWidth;
    _trackLayer.strokeEnd = 1.0;

    // Progress (actif)
    _progressLayer.path = circlePath.CGPath;
    _progressLayer.fillColor = UIColor.clearColor.CGColor;
    _progressLayer.strokeColor = _strokeColor.CGColor;
    _progressLayer.lineWidth = _strokeWidth;

    if ([_lineCap isEqualToString:@"round"]) {
        _progressLayer.lineCap = kCALineCapRound;
        _trackLayer.lineCap = kCALineCapRound;
    } else if ([_lineCap isEqualToString:@"square"]) {
        _progressLayer.lineCap = kCALineCapSquare;
        _trackLayer.lineCap = kCALineCapSquare;
    } else {
        _progressLayer.lineCap = kCALineCapButt;
        _trackLayer.lineCap = kCALineCapButt;
    }

    [self updateProgress];
}

- (void)setProgress:(CGFloat)progress {
    CGFloat old = _progress;
    _progress = MAX(0.0, MIN(1.0, progress));

    if (_animated && old != _progress) {
        CABasicAnimation *animation = [CABasicAnimation
            animationWithKeyPath:@"strokeEnd"];
        animation.fromValue = @(old);
        animation.toValue = @(_progress);
        animation.duration = _animationDuration / 1000.0;
        animation.timingFunction = [CAMediaTimingFunction
            functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
        [_progressLayer addAnimation:animation forKey:@"progressAnimation"];
    }

    _progressLayer.strokeEnd = _progress;
}

- (void)updateProgress {
    _progressLayer.strokeEnd = _progress;
}

@end
```

### Component Manager iOS (Fabric)

```objc
// ios/CircularProgressComponentView.mm
#import <React/RCTViewComponentView.h>
#import <react/renderer/components/CircularProgressSpec/ComponentDescriptors.h>
#import <react/renderer/components/CircularProgressSpec/Props.h>
#import "CircularProgressView.h"

using namespace facebook::react;

@interface CircularProgressComponentView : RCTViewComponentView
@end

@implementation CircularProgressComponentView {
    CircularProgressView *_circularView;
}

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps =
            std::make_shared<const CircularProgressProps>();
        _props = defaultProps;

        _circularView = [[CircularProgressView alloc] initWithFrame:frame];
        self.contentView = _circularView;
    }
    return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps
{
    const auto &newViewProps =
        *std::static_pointer_cast<CircularProgressProps const>(props);
    const auto &oldViewProps =
        *std::static_pointer_cast<CircularProgressProps const>(
            _props ?: std::make_shared<CircularProgressProps>());

    if (newViewProps.progress != oldViewProps.progress) {
        _circularView.progress = newViewProps.progress;
    }

    if (newViewProps.strokeWidth != oldViewProps.strokeWidth) {
        _circularView.strokeWidth = newViewProps.strokeWidth;
    }

    if (newViewProps.strokeColor != oldViewProps.strokeColor) {
        _circularView.strokeColor = RCTUIColorFromSharedColor(
            newViewProps.strokeColor);
    }

    if (newViewProps.size != oldViewProps.size) {
        _circularView.size = newViewProps.size;
    }

    [super updateProps:props oldProps:oldProps];
}

@end

// Enregistrement Fabric
Class<RCTComponentViewProtocol> CircularProgressCls(void) {
    return CircularProgressComponentView.class;
}
```

### Étape 3 : Implementation Android (Kotlin)

```kotlin
// android/.../CircularProgressView.kt
package com.myapp.circularprogress

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator

class CircularProgressView(context: Context) : View(context) {

    var progress: Float = 0f
        set(value) {
            val old = field
            field = value.coerceIn(0f, 1f)
            if (animated && old != field) {
                animateProgress(old, field)
            } else {
                currentProgress = field
                invalidate()
            }
        }

    var strokeWidth: Float = 8f.dpToPx()
        set(value) { field = value; invalidate() }

    var strokeColor: Int = Color.parseColor("#2196F3")
        set(value) { field = value; invalidate() }

    var trackColor: Int = Color.parseColor("#E0E0E0")
        set(value) { field = value; invalidate() }

    var startAngle: Float = -90f
        set(value) { field = value; invalidate() }

    var lineCap: Paint.Cap = Paint.Cap.ROUND
        set(value) { field = value; invalidate() }

    var animated: Boolean = true
    var animationDuration: Int = 300

    private var currentProgress: Float = 0f
    private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val progressPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val rectF = RectF()
    private var animator: ValueAnimator? = null

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val sw = strokeWidth
        rectF.set(sw / 2, sw / 2, width - sw / 2, height - sw / 2)

        // Track
        trackPaint.style = Paint.Style.STROKE
        trackPaint.strokeWidth = sw
        trackPaint.color = trackColor
        trackPaint.strokeCap = lineCap
        canvas.drawArc(rectF, 0f, 360f, false, trackPaint)

        // Progress
        progressPaint.style = Paint.Style.STROKE
        progressPaint.strokeWidth = sw
        progressPaint.color = strokeColor
        progressPaint.strokeCap = lineCap
        val sweepAngle = 360f * currentProgress
        canvas.drawArc(rectF, startAngle, sweepAngle, false, progressPaint)
    }

    private fun animateProgress(from: Float, to: Float) {
        animator?.cancel()
        animator = ValueAnimator.ofFloat(from, to).apply {
            duration = animationDuration.toLong()
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { anim ->
                currentProgress = anim.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    private fun Float.dpToPx(): Float =
        this * context.resources.displayMetrics.density
}
```

### View Manager Android (Fabric)

```kotlin
// android/.../CircularProgressManager.kt
package com.myapp.circularprogress

import android.graphics.Color
import android.graphics.Paint
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.CircularProgressManagerDelegate
import com.facebook.react.viewmanagers.CircularProgressManagerInterface

@ReactModule(name = CircularProgressManager.NAME)
class CircularProgressManager :
    SimpleViewManager<CircularProgressView>(),
    CircularProgressManagerInterface<CircularProgressView> {

    companion object {
        const val NAME = "CircularProgress"
    }

    private val delegate = CircularProgressManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<CircularProgressView> = delegate

    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): CircularProgressView {
        return CircularProgressView(context)
    }

    @ReactProp(name = "progress")
    override fun setProgress(view: CircularProgressView, progress: Float) {
        view.progress = progress
    }

    @ReactProp(name = "strokeWidth", defaultFloat = 8f)
    override fun setStrokeWidth(view: CircularProgressView, strokeWidth: Float) {
        view.strokeWidth = strokeWidth
    }

    @ReactProp(name = "strokeColor")
    override fun setStrokeColor(view: CircularProgressView, color: String?) {
        view.strokeColor = Color.parseColor(color ?: "#2196F3")
    }

    @ReactProp(name = "trackColor")
    override fun setTrackColor(view: CircularProgressView, color: String?) {
        view.trackColor = Color.parseColor(color ?: "#E0E0E0")
    }

    @ReactProp(name = "size", defaultInt = 100)
    override fun setSize(view: CircularProgressView, size: Int) {
        val px = (size * view.context.resources.displayMetrics.density).toInt()
        view.layoutParams = view.layoutParams?.apply {
            width = px
            height = px
        }
    }

    @ReactProp(name = "lineCap")
    override fun setLineCap(view: CircularProgressView, cap: String?) {
        view.lineCap = when (cap) {
            "square" -> Paint.Cap.SQUARE
            "butt" -> Paint.Cap.BUTT
            else -> Paint.Cap.ROUND
        }
    }

    @ReactProp(name = "animated", defaultBoolean = true)
    override fun setAnimated(view: CircularProgressView, animated: Boolean) {
        view.animated = animated
    }

    @ReactProp(name = "animationDuration", defaultInt = 300)
    override fun setAnimationDuration(view: CircularProgressView, duration: Int) {
        view.animationDuration = duration
    }
}
```

### Utilisation cote React Native

```tsx
// components/CircularProgress.tsx
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import NativeCircularProgress from '../specs/CircularProgressNativeComponent';

interface CircularProgressProps {
  progress: number;          // 0 to 1
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  trackColor?: string;
  showLabel?: boolean;
  labelFormat?: (progress: number) => string;
}

export function CircularProgress({
  progress,
  size = 100,
  strokeWidth = 8,
  strokeColor = '#2196F3',
  trackColor = '#E0E0E0',
  showLabel = true,
  labelFormat = (p) => `${Math.round(p * 100)}%`,
}: CircularProgressProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <NativeCircularProgress
        style={{ width: size, height: size }}
        progress={progress}
        strokeWidth={strokeWidth}
        strokeColor={strokeColor}
        trackColor={trackColor}
        size={size}
      />
      {showLabel && (
        <Text style={[styles.label, { fontSize: size * 0.2 }]}>
          {labelFormat(progress)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    fontWeight: '700',
    color: '#333',
  },
});
```

---

## Fabric Component avec événements

### Spec avec événements

```typescript
// specs/CircularProgressNativeComponent.ts (version avec events)
import type { ViewProps } from 'react-native';
import type {
  Float,
  Int32,
  WithDefault,
  DirectEventHandler,
} from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type OnProgressCompleteEvent = Readonly<{
  progress: Float;
  duration: Int32;
}>;

type OnProgressChangeEvent = Readonly<{
  progress: Float;
  previousProgress: Float;
}>;

interface NativeProps extends ViewProps {
  progress: Float;
  strokeWidth?: WithDefault<Float, 8>;
  strokeColor?: string;
  trackColor?: string;
  size?: WithDefault<Int32, 100>;
  animated?: WithDefault<boolean, true>;
  animationDuration?: WithDefault<Int32, 300>;

  // Evenements
  onProgressComplete?: DirectEventHandler<OnProgressCompleteEvent>;
  onProgressChange?: DirectEventHandler<OnProgressChangeEvent>;
}

export default codegenNativeComponent<NativeProps>('CircularProgress');
```

### Emission d'événements cote iOS

```objc
// Emettre un evenement depuis le composant natif iOS
- (void)setProgress:(CGFloat)progress {
    CGFloat old = _progress;
    _progress = MAX(0.0, MIN(1.0, progress));

    if (old != _progress && _eventEmitter) {
        CircularProgressEventEmitter::OnProgressChange event = {
            .progress = _progress,
            .previousProgress = old,
        };
        std::static_pointer_cast<const CircularProgressEventEmitter>(
            _eventEmitter)->onProgressChange(event);

        if (_progress >= 1.0) {
            CircularProgressEventEmitter::OnProgressComplete completeEvent = {
                .progress = _progress,
                .duration = _animationDuration,
            };
            std::static_pointer_cast<const CircularProgressEventEmitter>(
                _eventEmitter)->onProgressComplete(completeEvent);
        }
    }
}
```

### Consommation des événements en JS

```tsx
<CircularProgress
  progress={downloadProgress}
  onProgressComplete={(event) => {
    console.log('Terminé !', event.nativeEvent.progress);
    showSuccessToast();
  }}
  onProgressChange={(event) => {
    console.log(
      `${event.nativeEvent.previousProgress} → ${event.nativeEvent.progress}`
    );
  }}
/>
```

---

## Concurrent Features en React Native

Fabric active le support du rendering concurrent de React 18+, permettant d'utiliser `useTransition` et `useDeferredValue`.

### useTransition

Marque une mise a jour comme non-urgente. L'UI reste responsive pendant la transition.

```tsx
import { useState, useTransition } from 'react';
import { View, TextInput, FlatList, ActivityIndicator, Text } from 'react-native';

function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleSearch(text: string) {
    // Mise a jour urgente : le champ de saisie reste reactif
    setQuery(text);

    // Mise a jour non-urgente : le filtrage peut etre interrompu
    startTransition(() => {
      const filtered = heavyFilterOperation(text);
      setResults(filtered);
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        value={query}
        onChangeText={handleSearch}
        placeholder="Rechercher..."
      />
      {isPending && <ActivityIndicator />}
      <FlatList
        data={results}
        renderItem={({ item }) => <Text>{item}</Text>}
        keyExtractor={(item) => item}
      />
    </View>
  );
}
```

### useDeferredValue

Differe la mise a jour d'une valeur jusqu'a ce que le rendering soit idle.

```tsx
import { useState, useDeferredValue, memo } from 'react';
import { View, TextInput, Text, ScrollView } from 'react-native';

function ProductList() {
  const [filter, setFilter] = useState('');
  // La liste recoit la valeur differee → pas de lag sur la saisie
  const deferredFilter = useDeferredValue(filter);

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        value={filter}
        onChangeText={setFilter}
        placeholder="Filtrer les produits..."
      />
      <ProductGrid filter={deferredFilter} />
    </View>
  );
}

// memo() est essentiel ici : sans memo, le composant re-render a chaque keystroke
const ProductGrid = memo(function ProductGrid({ filter }: { filter: string }) {
  // Ce rendu peut etre interrompu par Fabric si une saisie urgente arrive
  const products = expensiveFilter(allProducts, filter);

  return (
    <ScrollView>
      {products.map((p) => (
        <Text key={p.id}>{p.name}</Text>
      ))}
    </ScrollView>
  );
});
```

### Suspense en React Native

```tsx
import { Suspense } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <UserProfile userId="123" />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
      <Text>Chargement du profil...</Text>
    </View>
  );
}
```

---

## Migration vers la New Architecture

### Activer la New Architecture

Depuis React Native 0.76, la New Architecture est activee par defaut. Pour les projets plus anciens :

```ruby
# ios/Podfile
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

```properties
# android/gradle.properties
newArchEnabled=true
```

### Vérifier la compatibilite des librairies

```bash
# Outil de verification de compatibilite
npx react-native-new-arch-check

# Resultat typique :
# ✅ react-native-reanimated (3.x) — Fabric + TurboModules
# ✅ react-native-gesture-handler (2.x) — Fabric
# ✅ react-native-screens (4.x) — Fabric
# ⚠️ react-native-maps (1.x) — Interop layer
# ❌ react-native-old-lib (0.x) — Bridge only
```

### Interop Layer

Pour les librairies non migrees, React Native fournit un interop layer automatique :

```
Lib ancienne (Bridge API)
        │
        ▼
┌─────────────────────┐
│   Interop Layer      │
│                      │
│  Bridge API ←→ JSI   │
│  Paper ←→ Fabric     │
│                      │
└─────────────────────┘
        │
        ▼
New Architecture (Fabric + JSI)
```

L'interop layer est transparent mais implique un cout de performance (conversion Bridge ↔ JSI).

### Pitfalls courants de migration

| Problème | Symptome | Solution |
|----------|----------|----------|
| `requireNativeComponent` deprecated | Warning au runtime | Migrer vers `codegenNativeComponent` |
| `UIManager.dispatchViewManagerCommand` | Crash | Utiliser les refs et les commandes natives |
| Module Bridge-only | `TurboModule not found` | Attendre la migration ou contribuer |
| `setNativeProps` supprime | Props ne se mettent pas a jour | Utiliser `useState` + re-render |
| `findNodeHandle` deprecated | Warning | Utiliser les refs directement |

### Avant / Après

```typescript
// AVANT (Paper / Bridge)
import { requireNativeComponent, UIManager, findNodeHandle } from 'react-native';

const NativeCircularProgress = requireNativeComponent('CircularProgress');

// Commande imperative via le bridge
UIManager.dispatchViewManagerCommand(
  findNodeHandle(ref.current),
  UIManager.getViewManagerConfig('CircularProgress').Commands.reset,
  []
);
```

```typescript
// APRES (Fabric / JSI)
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';

const NativeCircularProgress = codegenNativeComponent<NativeProps>('CircularProgress');

interface NativeCommands {
  reset: (viewRef: React.ElementRef<typeof NativeCircularProgress>) => void;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['reset'],
});

// Commande imperative via JSI (synchrone)
Commands.reset(ref.current);
```

---

## Benchmarks : Bridge vs JSI

### Méthodologie de mesure

```typescript
// benchmark.ts — mesure de latence
function benchmarkModuleCall(iterations: number) {
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    // Appel synchrone JSI
    BatteryModule.getBatteryLevel();
  }

  const end = performance.now();
  return {
    totalMs: end - start,
    avgMicroseconds: ((end - start) / iterations) * 1000,
  };
}

// Resultat typique (iPhone 15 Pro, release build) :
// Bridge: ~0.5ms par appel (serialisation JSON aller-retour)
// JSI:    ~0.005ms par appel (100x plus rapide)
```

### Comparaison sur des cas réels

| Operation | Bridge (ms) | JSI (ms) | Speedup |
|-----------|------------|----------|---------|
| Lecture d'une valeur | 0.5 | 0.005 | 100x |
| Appel de méthode sans args | 0.8 | 0.01 | 80x |
| Passage d'un objet (10 props) | 1.2 | 0.03 | 40x |
| Passage d'un tableau (100 items) | 3.5 | 0.15 | 23x |
| Event natif → JS | 1.0 | 0.02 | 50x |
| Layout synchrone | 16+ (1 frame) | < 1 | 16x+ |

### Impact sur le rendering

```
Bridge rendering (Paper) :
  Frame 1: JS calcule le layout → envoie via bridge
  Frame 2: Natif recoit → applique le layout
  → 1 frame de latence minimum = "layout flash"

Fabric rendering :
  Frame 1: JS calcule → C++ layout (Yoga) → natif applique
  → 0 frame de latence = pas de flash
```

---

## Écrire un module JSI pur (sans Turbo Module)

Pour les cas où les performances sont critiques (>10 000 appels/s), on peut écrire un module JSI pur en C++ :

```cpp
// jsi/MathModule.cpp
#include <jsi/jsi.h>
#include <cmath>

using namespace facebook::jsi;

void installMathModule(Runtime& runtime) {
    auto mathObj = Object(runtime);

    // Fonction synchrone ultra-rapide
    mathObj.setProperty(
        runtime,
        "fastLerp",
        Function::createFromHostFunction(
            runtime,
            PropNameID::forUtf8(runtime, "fastLerp"),
            3, // 3 arguments
            [](Runtime& rt, const Value& thisVal,
               const Value* args, size_t count) -> Value {
                double a = args[0].asNumber();
                double b = args[1].asNumber();
                double t = args[2].asNumber();
                return Value(a + (b - a) * t);
            }
        )
    );

    mathObj.setProperty(
        runtime,
        "fastDistance",
        Function::createFromHostFunction(
            runtime,
            PropNameID::forUtf8(runtime, "fastDistance"),
            4,
            [](Runtime& rt, const Value& thisVal,
               const Value* args, size_t count) -> Value {
                double dx = args[0].asNumber() - args[2].asNumber();
                double dy = args[1].asNumber() - args[3].asNumber();
                return Value(std::sqrt(dx * dx + dy * dy));
            }
        )
    );

    runtime.global().setProperty(runtime, "NativeMath", std::move(mathObj));
}
```

```typescript
// TypeScript declarations
declare global {
  var NativeMath: {
    fastLerp(a: number, b: number, t: number): number;
    fastDistance(x1: number, y1: number, x2: number, y2: number): number;
  };
}

// Usage — appels synchrones, zero overhead
const value = global.NativeMath.fastLerp(0, 100, 0.5); // 50
const dist = global.NativeMath.fastDistance(0, 0, 3, 4); // 5
```

---

## Architecture complete : vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application                              │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ React        │  │ Turbo        │  │ Fabric             │    │
│  │ Components   │  │ Modules      │  │ Components         │    │
│  │ (JSX)        │  │ (specs)      │  │ (native views)     │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘    │
│         │                  │                    │                 │
│  ┌──────▼──────────────────▼────────────────────▼───────────┐   │
│  │                    JSI (C++)                               │   │
│  │  Host Objects | Functions | Shared Memory | No Bridge     │   │
│  └──────┬──────────────────┬────────────────────┬───────────┘   │
│         │                  │                    │                 │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌────────▼───────────┐   │
│  │ Fabric       │  │ TurboModule  │  │ Yoga Layout        │   │
│  │ Renderer     │  │ System       │  │ Engine (C++)       │   │
│  │ (C++)        │  │ (C++)        │  │                     │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘   │
│         │                  │                    │                 │
│  ┌──────▼──────────────────▼────────────────────▼───────────┐   │
│  │              Platform Layer (iOS / Android)               │   │
│  │  UIKit / SwiftUI    |    Android Views / Compose          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist de création d'un Fabric Component

```
[ ] 1. Component spec (codegenNativeComponent)
[ ] 2. Types codegen (Float, Int32, WithDefault, DirectEventHandler)
[ ] 3. Vue native iOS (UIView ou SwiftUI via UIViewRepresentable)
[ ] 4. ComponentView iOS (RCTViewComponentView)
[ ] 5. Vue native Android (custom View)
[ ] 6. ViewManager Android (SimpleViewManager + delegate)
[ ] 7. Commandes natives (codegenNativeCommands) si imperatif
[ ] 8. Evenements (DirectEventHandler / BubblingEventHandler)
[ ] 9. Wrapper React (composant TS avec props typees)
[ ] 10. Tests : mock du composant natif + tests visuels
```

---

## Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Invariant: Native component not found` | Spec name ≠ natif name | Vérifier le name dans le spec et le ViewManager |
| `Props type mismatch` | Type codegen incorrect | Utiliser les bons types (`Float` vs `Double`, `Int32`) |
| `Cannot read property of null (shadowNode)` | Composant pas encore monte | Vérifier le lifecycle, utiliser `useLayoutEffect` |
| `Thread assertion failed` | Acces UI depuis le wrong thread | Dispatcher sur le main thread |
| `Codegen error: unknown type` | Type non supporte | Utiliser les types primitifs ou des interfaces plates |
| `Interop layer crash` | Librairie ancienne incompatible | Mettre a jour la librairie ou contribuer la migration |

---

## Points clés à retenir

1. **JSI = C++ direct** : pas de serialisation, pas de bridge, appels synchrones possibles
2. **Host Objects** : objets C++ exposes directement dans le runtime JavaScript
3. **Fabric = rendering C++** : shadow tree, layout Yoga, diffing et mutations en C++
4. **Layout synchrone** : plus de "layout flash", le layout est calcule et applique dans le même frame
5. **Concurrent rendering** : `useTransition` et `useDeferredValue` fonctionnent grâce à Fabric
6. **Codegen** : le spec TypeScript généré automatiquement les interfaces natives
7. **Interop layer** : les anciennes librairies fonctionnent via un wrapper automatique
8. **Performances** : JSI est 20 a 100x plus rapide que le Bridge selon l'operation

---

## Ressources

- [React Native — Architecture Overview](https://reactnative.dev/architecture/overview)
- [Fabric Renderer](https://reactnative.dev/architecture/fabric-renderer)
- [JSI Deep Dive (React Native Blog)](https://reactnative.dev/blog)
- [Creating a Fabric Component](https://reactnative.dev/docs/fabric-native-components-introduction)
- [React Native New Architecture Working Group](https://github.com/reactwg/react-native-new-architecture)
- [Yoga Layout Engine](https://yogalayout.dev/)
- [Software Mansion — Fabric Components Guide](https://blog.swmansion.com/)

---

## Navigation

| Précédent | Suivant |
|:---------:|:-------:|
| [Module 23 — Modules natifs et Turbo Modules](./23-modules-natifs-turbo-modules.md) | [Module 25 — Hermes et mode Bridgeless](./25-hermes-internals-bridgeless.md) |

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 24 fabric](../screencasts/screencast-24-fabric.md)
2. **Lab** : [lab-24-fabric-jsi](../labs/lab-24-fabric-jsi/README)
3. **Visualisation** : [Bridge vs JSI](../visualizations/bridge-vs-jsi.html)
4. **Quiz** : [quiz 24 fabric](../quizzes/quiz-24-fabric.html)
:::
