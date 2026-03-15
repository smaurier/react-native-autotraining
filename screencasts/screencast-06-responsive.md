# Screencast 06 — Responsive et plateformes

## Informations
- **Duree estimee** : 10-12 min
- **Module** : `modules/06-responsive-et-plateformes.md`
- **Lab associe** : Lab 06
- **Prérequis** : Screencast 05

## Setup
- [ ] VS Code ouvert dans un projet Expo
- [ ] Terminal intégré ouvert
- [ ] Simulateur iOS et emulateur Android lances
- [ ] Fichier `modules/06-responsive-et-plateformes.md` ouvert

## Script

### [00:00-01:30] Introduction — Pourquoi le responsive en React Native

> Le responsive en mobile, ce n'est pas que la taille d'ecran. C'est aussi la plateforme, l'orientation, les zones securisees, le scaling des polices. Dans ce screencast, on va construire un layout qui s'adapte a tout ça.

**Action** : Montrer un même ecran sur iPhone SE, iPhone 14 Pro, iPad et Android.

```
iPhone SE    → phone (375pt)
iPhone 14    → phone (393pt)
iPad Air     → tablet (820pt)
iPad Pro 12" → desktop (1024pt)
Android      → phone/tablet selon appareil
```

### [01:30-03:30] Breakpoints et useWindowDimensions

> Definissons un système de breakpoints. La clé, c'est d'utiliser useWindowDimensions, pas Dimensions.get().

**Action** : Créer `utils/responsive.ts`.

```typescript
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

**Action** : Créer le hook `useBreakpoint`.

```typescript
import { useWindowDimensions } from 'react-native';

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return getBreakpoint(width);
}
```

> Montrer que useWindowDimensions est réactif en pivotant le simulateur.

### [03:30-05:30] Layout adaptatif avec breakpoints

> Utilisons notre breakpoint pour créer un layout qui passe de 1 colonne sur phone a 2 sur tablet.

**Action** : Créer un composant `AdaptiveLayout`.

```typescript
function AdaptiveLayout() {
  const { width, height } = useWindowDimensions();
  const breakpoint = useBreakpoint();
  const isLandscape = width > height;

  const numColumns = { phone: 1, tablet: 2, desktop: 3 }[breakpoint];

  return (
    <FlatList
      data={items}
      numColumns={numColumns}
      key={numColumns}
      renderItem={({ item }) => <Card item={item} />}
      contentContainerStyle={{ padding: breakpoint === 'phone' ? 8 : 16 }}
    />
  );
}
```

> Insister sur `key={numColumns}` — sans ça, FlatList ne se re-layout pas.

**Action** : Pivoter le simulateur pour montrer le passage portrait/paysage.

### [05:30-07:30] Platform.select et code spécifique

> React Native offre Platform.select pour écrire du code conditionnel par plateforme de manière elegante.

**Action** : Créer un bouton avec des ombres platform-specific.

```typescript
const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: Platform.select({ ios: 12, android: 4, default: 8 }),
    backgroundColor: '#2196F3',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

> Montrer la différence visuelle entre iOS (ombre CSS) et Android (elevation Material).

### [07:30-09:00] Safe area et StatusBar

> Les encoches et les barres de navigation gestuelles peuvent masquer votre contenu. Voyons comment s'en proteger.

**Action** : Installer et configurer `react-native-safe-area-context`.

```typescript
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <Screen />
    </SafeAreaProvider>
  );
}

function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }}>
      <StatusBar barStyle="light-content" />
      <Text>Contenu protege des encoches</Text>
    </View>
  );
}
```

> Montrer les valeurs de insets sur iPhone 14 Pro (top: 59, bottom: 34) vs un appareil sans encoche.

### [09:00-10:30] Font scaling et accessibilité

> Beaucoup d'utilisateurs augmentent la taille des polices. Il faut le supporter.

**Action** : Montrer l'effet du fontScale sur un layout.

```typescript
function Header({ title }: { title: string }) {
  const { fontScale } = useWindowDimensions();
  const fontSize = scaleFont(24, fontScale, 1.4);

  return (
    <Text style={{ fontSize }}>{title}</Text>
  );
}
```

> Aller dans les reglages du simulateur, augmenter la taille des polices, montrer l'impact. Montrer comment maxFontSizeMultiplier protege les éléments de layout.

### [10:30-11:00] Recap

> En résumé : useWindowDimensions pour la réactivité, un système de breakpoints pour les layouts, Platform.select pour le code conditionnel, safe area context pour les zones securisees, et scaleFont pour l'accessibilité. Passez au Lab 06 pour pratiquer tout ça.
