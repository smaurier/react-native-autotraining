# Module 06 — Responsive et plateformes

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 3/5        | 60 min        | [Lab 06](../labs/lab-06-responsive-plateformes/) | [Quiz 06](../quizzes/quiz-06-responsive.html) |

## Objectifs

- Recuperer les dimensions de l'ecran avec `Dimensions` et `useWindowDimensions`
- Adapter le layout en fonction de la plateforme avec `Platform`
- Gérer les zones securisees avec `SafeAreaView`
- Personnaliser la barre de statut
- Créer un système de breakpoints responsive
- Comprendre le pixel ratio et le scaling de polices
- Gérer les changements d'orientation

---

## Dimensions API

### Recuperer les dimensions

React Native fournit l'API `Dimensions` pour obtenir la taille de l'ecran ou de la fenêtre :

```typescript
import { Dimensions } from 'react-native';

// Taille de la fenetre (exclut la barre de statut sur Android)
const { width, height } = Dimensions.get('window');

// Taille de l'ecran complet (inclut la barre de statut)
const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

console.log(`Fenetre: ${width}x${height}`);
console.log(`Ecran: ${screenWidth}x${screenHeight}`);
```

### Différence entre 'window' et 'screen'

| Propriété | `window` | `screen` |
|-----------|----------|----------|
| iOS | Identique a screen | Taille physique de l'ecran |
| Android | Exclut la barre de statut et la barre de navigation | Inclut toutes les barres système |
| Utilisation | Layout de l'app | Calculs de résolution |

### Ecouter les changements de dimensions

Quand l'utilisateur fait pivoter l'appareil, les dimensions changent. `Dimensions` emet un événement :

```typescript
import { Dimensions } from 'react-native';
import { useEffect, useState } from 'react';

function useScreenDimensions() {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  return dimensions;
}

// Usage
function MyComponent() {
  const { width, height } = useScreenDimensions();

  return (
    <View style={{ width: width * 0.9, height: height * 0.5 }}>
      <Text>Ecran: {width}x{height}</Text>
    </View>
  );
}
```

> **Attention** : `Dimensions.get()` retourne la valeur au moment de l'appel. Si vous l'appelez au top level d'un module, la valeur ne sera pas mise a jour après rotation. Utilisez toujours `addEventListener` ou le hook `useWindowDimensions`.

---

## useWindowDimensions hook

React Native fournit un hook intégré plus pratique que `Dimensions` :

```typescript
import { useWindowDimensions } from 'react-native';

function ResponsiveComponent() {
  const { width, height, fontScale, scale } = useWindowDimensions();

  const isLandscape = width > height;

  return (
    <View style={{
      flexDirection: isLandscape ? 'row' : 'column',
      padding: width * 0.05,
    }}>
      <Text style={{ fontSize: 16 / fontScale }}>
        {isLandscape ? 'Mode paysage' : 'Mode portrait'}
      </Text>
    </View>
  );
}
```

### Proprietes retournees

| Propriété | Type | Description |
|-----------|------|-------------|
| `width` | number | Largeur de la fenêtre en points |
| `height` | number | Hauteur de la fenêtre en points |
| `scale` | number | Ratio pixels physiques / points logiques |
| `fontScale` | number | Facteur d'echelle des polices (accessibilité) |

### Pourquoi préférer useWindowDimensions a Dimensions ?

```typescript
// ❌ Mauvais : valeur statique, pas reactive
const SCREEN_WIDTH = Dimensions.get('window').width;

function BadComponent() {
  // SCREEN_WIDTH ne change jamais apres rotation
  return <View style={{ width: SCREEN_WIDTH * 0.5 }} />;
}

// ✅ Bon : reactif aux changements
function GoodComponent() {
  const { width } = useWindowDimensions();
  // width est mis a jour automatiquement
  return <View style={{ width: width * 0.5 }} />;
}
```

| Critere | `Dimensions.get()` | `useWindowDimensions` |
|---------|--------------------|-----------------------|
| Reactif | Non (valeur ponctuelle) | Oui (re-render auto) |
| Usage dans un composant | Necessite addEventListener | Direct |
| Rotation | Doit etre géré manuellement | Automatique |
| Disponibilité | Partout (même hors composant) | Uniquement dans un composant |

---

## Platform API

### Platform.OS

`Platform.OS` retourne la plateforme courante sous forme de string :

```typescript
import { Platform } from 'react-native';

console.log(Platform.OS); // 'ios' | 'android' | 'web' | 'windows' | 'macos'

// Conditionnel simple
const paddingTop = Platform.OS === 'ios' ? 44 : 0;

// Dans un style
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
});
```

### Platform.select

`Platform.select` est une méthode plus elegante pour du code conditionnel multi-plateforme :

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      default: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
      },
    }),
  },
});
```

La clé `default` est utilisee comme fallback si la plateforme n'est pas listee (utile pour le web).

### Platform.Version

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  // Android: nombre (API level)
  console.log(Platform.Version); // 33 (Android 13)

  if (Platform.Version >= 31) {
    // Material You disponible (Android 12+)
  }
}

if (Platform.OS === 'ios') {
  // iOS: string
  console.log(Platform.Version); // '17.0'

  if (parseInt(Platform.Version, 10) >= 16) {
    // Dynamic Island disponible (iPhone 14 Pro+)
  }
}
```

### Fichiers spécifiques à la plateforme

React Native resout automatiquement les fichiers selon la plateforme :

```
components/
  Button.tsx          // Partage (fallback)
  Button.ios.tsx      // Utilise sur iOS
  Button.android.tsx  // Utilise sur Android
  Button.web.tsx      // Utilise sur le web (si configure)
```

```typescript
// L'import est le meme — React Native choisit le bon fichier
import Button from './components/Button';
// Sur iOS → Button.ios.tsx
// Sur Android → Button.android.tsx
// Ailleurs → Button.tsx (fallback)
```

---

## SafeAreaView et zones securisees

### Le problème

Les appareils modernes ont des encoches, des barres de statut dynamiques, des coins arrondis et des barres de navigation gestuelles. Le contenu peut se retrouver cache derriere ces éléments :

```
┌──────────────────────┐
│  ███ Encoche ███     │  ← Contenu masque !
│  Texte coupe...      │
│                      │
│                      │
│                      │
│  ████████████████    │  ← Barre de navigation gestuelle
└──────────────────────┘
```

### SafeAreaView natif (iOS uniquement)

```typescript
import { SafeAreaView, Text } from 'react-native';

function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Ce texte est dans la zone securisee</Text>
    </SafeAreaView>
  );
}
```

> **Limitation** : `SafeAreaView` de React Native ne fonctionne que sur iOS. Sur Android, il n'a aucun effet.

### react-native-safe-area-context (recommande)

La librairie `react-native-safe-area-context` est la solution cross-platform :

```bash
npx expo install react-native-safe-area-context
```

```typescript
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets }
  from 'react-native-safe-area-context';

// 1. Wrappez l'application dans le Provider
function App() {
  return (
    <SafeAreaProvider>
      <MainContent />
    </SafeAreaProvider>
  );
}

// 2a. Utilisez SafeAreaView (le plus simple)
function MainContent() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Contenu protege</Text>
    </SafeAreaView>
  );
}

// 2b. Ou utilisez le hook pour un controle fin
function CustomHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      backgroundColor: '#2196F3',
    }}>
      <Text style={{ color: '#fff', fontSize: 18 }}>Mon Header</Text>
    </View>
  );
}
```

### Proprietes de useSafeAreaInsets

```typescript
const insets = useSafeAreaInsets();

// insets.top    — hauteur de la barre de statut / encoche
// insets.bottom — hauteur de la barre de navigation gestuelle
// insets.left   — marge gauche (rotation paysage)
// insets.right  — marge droite (rotation paysage)

// Valeurs typiques (iPhone 14 Pro) :
// { top: 59, bottom: 34, left: 0, right: 0 }  — portrait
// { top: 0, bottom: 21, left: 59, right: 0 }   — paysage
```

### Edges selectifs

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

// Seulement le haut et le bas
<SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
  <Text>Protege en haut et en bas uniquement</Text>
</SafeAreaView>

// Seulement le bas (par exemple un TabBar)
<SafeAreaView edges={['bottom']}>
  <TabBar />
</SafeAreaView>
```

---

## StatusBar

### Personnaliser la barre de statut

```typescript
import { StatusBar } from 'react-native';

function App() {
  return (
    <>
      <StatusBar
        barStyle="light-content"    // 'default' | 'light-content' | 'dark-content'
        backgroundColor="#1a1a2e"   // Android uniquement
        translucent={true}          // Android : contenu passe sous la barre
        hidden={false}              // Masquer completement
        animated={true}             // Animer les transitions
      />
      <MainContent />
    </>
  );
}
```

### StatusBar imperatif

```typescript
import { StatusBar } from 'react-native';

// Changer dynamiquement le style
function onDarkScreen() {
  StatusBar.setBarStyle('light-content', true);
}

function onLightScreen() {
  StatusBar.setBarStyle('dark-content', true);
}

// Android uniquement
StatusBar.setBackgroundColor('#1a1a2e', true);
StatusBar.setTranslucent(true);
```

### StatusBar par ecran (avec React Navigation)

Chaque ecran peut définir son propre style de StatusBar :

```typescript
function HomeScreen() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <Text>Home — barre sombre sur fond blanc</Text>
      </View>
    </>
  );
}

function ProfileScreen() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
        <Text style={{ color: '#fff' }}>Profil — barre claire sur fond sombre</Text>
      </View>
    </>
  );
}
```

---

## Breakpoints responsive

### Définir un système de breakpoints

```typescript
// utils/responsive.ts

export const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'phone';
}
```

### Hook useBreakpoint

```typescript
import { useWindowDimensions } from 'react-native';

function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return getBreakpoint(width);
}

// Usage
function ProductGrid() {
  const breakpoint = useBreakpoint();

  const numColumns = {
    phone: 2,
    tablet: 3,
    desktop: 4,
  }[breakpoint];

  return (
    <FlatList
      data={products}
      numColumns={numColumns}
      key={numColumns}  // Force re-render quand numColumns change
      renderItem={({ item }) => (
        <ProductCard product={item} width={`${100 / numColumns}%`} />
      )}
    />
  );
}
```

### Valeurs responsives

```typescript
type ResponsiveValue<T> = {
  phone: T;
  tablet: T;
  desktop: T;
};

function createResponsiveValue<T>(
  phone: T,
  tablet: T,
  desktop: T,
): ResponsiveValue<T> {
  return { phone, tablet, desktop };
}

function useResponsiveValue<T>(responsiveValue: ResponsiveValue<T>): T {
  const breakpoint = useBreakpoint();
  return responsiveValue[breakpoint];
}

// Usage
function AdaptiveLayout() {
  const columns = useResponsiveValue(
    createResponsiveValue(1, 2, 3)
  );
  const fontSize = useResponsiveValue(
    createResponsiveValue(14, 16, 18)
  );
  const padding = useResponsiveValue(
    createResponsiveValue(8, 16, 24)
  );

  return (
    <View style={{ padding }}>
      <Text style={{ fontSize }}>
        Layout a {columns} colonne(s)
      </Text>
    </View>
  );
}
```

### Composant responsive conditionnel

```typescript
function ResponsiveOnly({
  breakpoints,
  children,
}: {
  breakpoints: Breakpoint[];
  children: React.ReactNode;
}) {
  const current = useBreakpoint();

  if (!breakpoints.includes(current)) {
    return null;
  }

  return <>{children}</>;
}

// Usage
function Layout() {
  return (
    <View style={{ flexDirection: 'row' }}>
      <ResponsiveOnly breakpoints={['tablet', 'desktop']}>
        <SidebarMenu />
      </ResponsiveOnly>
      <MainContent />
    </View>
  );
}
```

---

## PixelRatio et font scaling

### PixelRatio

`PixelRatio` donne le ratio entre pixels physiques et points logiques :

```typescript
import { PixelRatio } from 'react-native';

// Ratio de densite de pixels
const ratio = PixelRatio.get();
// iPhone SE: 2 (Retina)
// iPhone 14 Pro: 3 (Super Retina)
// Android mid-range: 2-2.5

// Arrondir a la taille pixel la plus proche
const borderWidth = PixelRatio.roundToNearestPixel(1.5);
// Sur un ecran 3x: 1.333... → 1.333 (1px / 3 = 0.333)
// Sur un ecran 2x: 1.5 → 1.5 (3px / 2 = 1.5)

// Obtenir la taille en pixels physiques
const physicalPixels = PixelRatio.getPixelSizeForLayoutSize(100);
// Sur un ecran 3x: 300
// Sur un ecran 2x: 200
```

### Hairline width (bordure la plus fine possible)

```typescript
import { StyleSheet, PixelRatio } from 'react-native';

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth, // = 1 / PixelRatio.get()
    backgroundColor: '#ccc',
  },
});

// iPhone 14 Pro (3x): hairlineWidth = 0.333...
// Pixel 7 (2.625x): hairlineWidth = 0.380...
```

### Font scaling (accessibilité)

Les utilisateurs peuvent changer la taille des polices dans les reglages de leur appareil. React Native respecte ce paramètre par defaut :

```typescript
import { PixelRatio, useWindowDimensions } from 'react-native';

// Obtenir le facteur d'echelle des polices
const fontScale = PixelRatio.getFontScale();
// 1.0 = normal
// 1.3 = grandes polices
// 2.0 = tres grandes polices (accessibilite)

// Un texte de fontSize: 16 sera affiche a :
// fontScale 1.0 → 16pt
// fontScale 1.3 → 20.8pt
// fontScale 2.0 → 32pt
```

### Limiter le scaling des polices

Parfois, un scaling trop important casse le layout. Vous pouvez le limiter :

```typescript
function scaleFont(baseSize: number, fontScale: number, maxScale: number = 1.3): number {
  const clampedScale = Math.min(fontScale, maxScale);
  return Math.round(baseSize * clampedScale);
}

// Usage
function HeaderTitle({ text }: { text: string }) {
  const { fontScale } = useWindowDimensions();
  const fontSize = scaleFont(24, fontScale, 1.5);

  return <Text style={{ fontSize }}>{text}</Text>;
}
```

> **Bonne pratique** : Limitez le scaling pour les éléments de layout (headers, badges), mais laissez-le libre pour le texte de contenu (articles, descriptions) afin de respecter l'accessibilité.

### Propriété maxFontSizeMultiplier

React Native fournit aussi une prop directe sur `<Text>` :

```typescript
// Limite le scaling a 1.5x la taille de base
<Text maxFontSizeMultiplier={1.5} style={{ fontSize: 14 }}>
  Ce texte ne depassera jamais 21pt
</Text>

// Desactive completement le scaling (deconseille pour l'accessibilite)
<Text maxFontSizeMultiplier={1}>
  Taille fixe : 14pt quoi qu'il arrive
</Text>
```

---

## Gestion de l'orientation

### Detecter l'orientation

```typescript
import { useWindowDimensions } from 'react-native';

type Orientation = 'portrait' | 'landscape';

function useOrientation(): Orientation {
  const { width, height } = useWindowDimensions();
  return width > height ? 'landscape' : 'portrait';
}
```

### Adapter le layout a l'orientation

```typescript
function PhotoViewer({ photos }: { photos: string[] }) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <View style={{ flex: 1 }}>
      {isLandscape ? (
        // Paysage : photo plein ecran avec miniatures en colonne a droite
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <View style={{ flex: 3 }}>
            <Image
              source={{ uri: photos[0] }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          <ScrollView style={{ flex: 1 }}>
            {photos.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={{ width: '100%', aspectRatio: 1 }}
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        // Portrait : photo en haut, miniatures en grille en bas
        <View style={{ flex: 1 }}>
          <Image
            source={{ uri: photos[0] }}
            style={{ width: '100%', height: height * 0.6 }}
            resizeMode="contain"
          />
          <FlatList
            data={photos}
            numColumns={3}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width: width / 3, aspectRatio: 1 }}
              />
            )}
          />
        </View>
      )}
    </View>
  );
}
```

### Verrouiller l'orientation

Dans `app.json` (Expo) :

```json
{
  "expo": {
    "orientation": "portrait",
    // ou "landscape", ou "default" (les deux)
  }
}
```

Pour un verrouillage dynamique, utilisez `expo-screen-orientation` :

```typescript
import * as ScreenOrientation from 'expo-screen-orientation';

// Verrouiller en portrait
await ScreenOrientation.lockAsync(
  ScreenOrientation.OrientationLock.PORTRAIT_UP
);

// Autoriser toutes les orientations
await ScreenOrientation.lockAsync(
  ScreenOrientation.OrientationLock.ALL
);
```

---

## Exemples pratiques

### Layout adaptatif complet

```typescript
import { useWindowDimensions, Platform, StyleSheet, View, Text }
  from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function AdaptiveScreen() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const breakpoint = getBreakpoint(width);
  const isLandscape = width > height;

  const containerStyle = {
    flex: 1,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: Math.max(insets.left, breakpoint === 'phone' ? 16 : 24),
    paddingRight: Math.max(insets.right, breakpoint === 'phone' ? 16 : 24),
  };

  return (
    <View style={containerStyle}>
      {/* Header adaptatif */}
      <View style={[
        styles.header,
        isLandscape && styles.headerLandscape,
      ]}>
        <Text style={{
          fontSize: scaleFont(breakpoint === 'phone' ? 20 : 28, fontScale, 1.4),
          fontWeight: '700',
        }}>
          Dashboard
        </Text>
      </View>

      {/* Contenu en grille responsive */}
      <View style={{
        flexDirection: isLandscape ? 'row' : 'column',
        gap: breakpoint === 'phone' ? 8 : 16,
        flex: 1,
      }}>
        <DashboardCard flex={isLandscape ? 2 : undefined} />
        <DashboardCard flex={isLandscape ? 1 : undefined} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerLandscape: {
    paddingVertical: 8,
  },
});
```

### Grille responsive

```typescript
function ResponsiveGrid<T>({
  data,
  renderItem,
  spacing = 8,
}: {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  spacing?: number;
}) {
  const { width } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);

  const numColumns = { phone: 2, tablet: 3, desktop: 4 }[breakpoint];
  const totalSpacing = spacing * (numColumns + 1);
  const itemWidth = (width - totalSpacing) / numColumns;

  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: spacing,
      gap: spacing,
    }}>
      {data.map((item, index) => (
        <View key={index} style={{ width: itemWidth }}>
          {renderItem(item, index)}
        </View>
      ))}
    </View>
  );
}
```

### UI spécifique par plateforme

```typescript
function PlatformButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        Platform.select({
          ios: {
            opacity: pressed ? 0.6 : 1,
          },
          android: {},
        }),
      ]}
      android_ripple={{
        color: 'rgba(0,0,0,0.12)',
        borderless: false,
      }}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Platform.select({ ios: 10, android: 4, default: 8 }),
    backgroundColor: '#2196F3',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

---

## Récapitulatif

| Concept | API / Outil | Quand l'utiliser |
|---------|-------------|------------------|
| Dimensions | `useWindowDimensions` | Layout réactif, calculs de taille |
| Plateforme | `Platform.OS`, `Platform.select` | Code conditionnel par OS |
| Fichiers plateforme | `.ios.tsx`, `.android.tsx` | Composants entièrement différents par OS |
| Zone securisee | `react-native-safe-area-context` | Éviter les encoches et barres système |
| Barre de statut | `StatusBar` | Style et couleur de la barre système |
| Breakpoints | `getBreakpoint(width)` | Phone / tablet / desktop adaptatif |
| Pixel ratio | `PixelRatio` | Bordures fines, images haute résolution |
| Font scaling | `fontScale`, `maxFontSizeMultiplier` | Accessibilité et controle des polices |
| Orientation | `width > height` | Layout portrait vs paysage |

---

## Bonnes pratiques

1. **Preferez `useWindowDimensions`** a `Dimensions.get()` pour la réactivité
2. **Utilisez `Platform.select`** au lieu de ternaires multiples pour du code lisible
3. **Testez sur les deux plateformes** : des différences subtiles existent toujours
4. **N'ignorez pas le font scaling** : beaucoup d'utilisateurs augmentent la taille des polices
5. **Utilisez `react-native-safe-area-context`** au lieu du `SafeAreaView` natif
6. **Evitez les dimensions absolues en pixels** : preferez les pourcentages et flex
7. **Testez en mode paysage** : beaucoup de développeurs l'oublient et le layout casse
8. **Definissez un système de breakpoints clair** des le debut du projet

---

## Exercices

Passez au [Lab 06](../labs/lab-06-responsive-plateformes/) pour implementer un système de breakpoints, du font scaling adaptatif et du code platform-specific en TypeScript pur.

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 06 responsive](../screencasts/screencast-06-responsive.md)
2. **Lab** : [lab-06-responsive-plateformes](../labs/lab-06-responsive-plateformes/README)
3. **Quiz** : [quiz 06 responsive](../quizzes/quiz-06-responsive.html)
:::
