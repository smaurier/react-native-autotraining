# 05 — StyleSheet et Flexbox

| Difficulte | Duree estimee | Lab | Quiz |
|:----------:|:-------------:|:---:|:----:|
| 2/5        | 75 min        | [Lab 05](../labs/lab-05-stylesheet-flexbox/) | [Quiz 05](../quizzes/quiz-05-stylesheet-flexbox.html) |

## Objectifs pedagogiques

A la fin de ce module, vous serez capable de :

- Utiliser `StyleSheet.create` pour definir des styles types et optimises
- Maitriser Flexbox dans React Native (differences avec le CSS web)
- Controler la direction, l'alignement et la distribution avec les proprietes Flex
- Utiliser `flex`, `flexGrow`, `flexShrink` et `flexBasis` pour le dimensionnement
- Gerer le wrapping et les gaps entre elements
- Positionner des elements avec `position: relative` et `absolute`
- Creer des layouts responsifs avec `Dimensions` et les pourcentages
- Appliquer des styles conditionnels par plateforme avec `Platform.OS`
- Composer des styles avec les tableaux, le spread et les ternaires

---

:::tip Changement de perspective
Jusqu'ici, vous avez appris a **afficher des donnees** : composants, props, state, listes. A partir de ce module, vous allez apprendre a **disposer ces donnees sur l'ecran**. On passe de "quoi afficher" a "ou et comment l'afficher". C'est un mode de pensee different — plus spatial, plus visuel — mais les concepts sont simples une fois qu'on a compris le modele Flexbox.
:::

<details>
<summary>Rappel du module precedent</summary>

- **FlatList** : liste virtualisee avec `data`, `renderItem`, `keyExtractor`
- **SectionList** : listes groupees avec `sections` et `renderSectionHeader`
- **Pull-to-refresh** : `onRefresh` + `refreshing`
- **Scroll infini** : `onEndReached` + `onEndReachedThreshold`
- **Performance** : `getItemLayout`, `windowSize`, `maxToRenderPerBatch`, `React.memo`

</details>

---

## StyleSheet.create : pourquoi et comment

### Le probleme des styles inline

En React Native, vous pouvez ecrire des styles directement en inline :

```tsx
// ❌ Fonctionne mais sous-optimal
function InlineCard() {
  return (
    <View style={{
      padding: 16,
      margin: 8,
      backgroundColor: '#fff',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>
        Titre
      </Text>
    </View>
  );
}
```

**Problemes** :
1. Un nouvel objet est cree a chaque rendu → comparaisons echouent
2. Pas de validation des proprietes → fautes de frappe silencieuses
3. Code difficile a maintenir quand les styles grandissent

### StyleSheet.create a la rescousse

```tsx
import { View, Text, StyleSheet } from 'react-native';

function Card() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Titre</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
```

### Avantages de StyleSheet.create

| Avantage | Detail |
|----------|--------|
| **References stables** | L'objet est cree une seule fois, pas a chaque rendu |
| **Validation TypeScript** | Les proprietes invalides sont detectees a la compilation |
| **Optimisation bridge** | React Native peut envoyer un ID de style au lieu de l'objet complet via le bridge |
| **Lisibilite** | Separation claire entre logique et presentation |
| **Reutilisabilite** | Styles facilement partageables entre composants |

### StyleSheet.flatten et StyleSheet.compose

```tsx
// flatten : convertit un tableau de styles en un seul objet
const flatStyle = StyleSheet.flatten([
  styles.base,
  styles.active,
  { opacity: 0.5 },
]);
// → { padding: 16, backgroundColor: '#007AFF', opacity: 0.5 }

// compose : combine deux styles (plus performant que flatten pour 2 styles)
const combined = StyleSheet.compose(styles.base, styles.active);
```

### StyleSheet.absoluteFill et hairlineWidth

```tsx
// absoluteFill : raccourci pour position absolute plein ecran
const overlay = StyleSheet.absoluteFill;
// Equivalent a : { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }

// hairlineWidth : la plus fine ligne possible sur le device
const borderStyle = {
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: '#ccc',
};
```

---

## Flexbox dans React Native

React Native utilise Flexbox pour le layout, mais avec des **differences importantes** par rapport au CSS web.

### Differences cles avec le CSS

| Propriete | CSS Web | React Native |
|-----------|---------|--------------|
| `flexDirection` | `row` (defaut) | **`column`** (defaut) |
| `alignContent` | `stretch` | `flex-start` |
| `flexShrink` | 1 (defaut) | **0** (defaut) |
| Unites | px, em, rem, vw, % | **Nombres** (= dp) et **%** |
| `display` | block, flex, grid, inline... | **`flex`** ou `none` |
| `gap` | Support complet | Supporte depuis RN 0.71 |
| `auto` margin | Oui (hack d'alignement) | **Non supporte** |

:::warning Difference majeure : flexDirection
En CSS web, les elements s'affichent en ligne (`row`) par defaut. En React Native, ils s'empilent en colonne (`column`). C'est la source de confusion la plus frequente pour les developpeurs web.
:::

### Le modele mental

```
CSS Web (defaut: row)              React Native (defaut: column)
┌────────────────────┐              ┌────────────────────┐
│ [A] [B] [C]        │              │ [A]                │
│                    │              │ [B]                │
│                    │              │ [C]                │
└────────────────────┘              └────────────────────┘
```

---

## flexDirection

Definit l'axe principal (main axis) le long duquel les enfants sont disposes :

```tsx
// Colonne (defaut en RN)
<View style={{ flexDirection: 'column' }}>
  <View style={styles.box} />   {/* En haut */}
  <View style={styles.box} />   {/* Au milieu */}
  <View style={styles.box} />   {/* En bas */}
</View>

// Ligne
<View style={{ flexDirection: 'row' }}>
  <View style={styles.box} />   {/* A gauche */}
  <View style={styles.box} />   {/* Au centre */}
  <View style={styles.box} />   {/* A droite */}
</View>

// Colonne inversee
<View style={{ flexDirection: 'column-reverse' }}>
  <View style={styles.box} />   {/* En bas (premier element rendu en bas) */}
  <View style={styles.box} />
  <View style={styles.box} />   {/* En haut */}
</View>

// Ligne inversee
<View style={{ flexDirection: 'row-reverse' }}>
  <View style={styles.box} />   {/* A droite */}
  <View style={styles.box} />
  <View style={styles.box} />   {/* A gauche */}
</View>
```

### Schema des axes

```
flexDirection: 'column'           flexDirection: 'row'
      Main Axis                        Cross Axis
        ↓                                ↓
  ┌───────────┐                    ┌───────────┐
  │   [A]     │ ←Cross Axis       │ [A][B][C] │ ←Main Axis
  │   [B]     │                    │           │
  │   [C]     │                    │           │
  └───────────┘                    └───────────┘
```

---

## justifyContent

Controle la distribution des enfants le long de l'**axe principal** :

```tsx
const containers = [
  'flex-start',      // Debut (defaut)
  'flex-end',        // Fin
  'center',          // Centre
  'space-between',   // Espace entre les elements
  'space-around',    // Espace autour de chaque element
  'space-evenly',    // Espace egal partout
];
```

### Illustration (flexDirection: 'row')

```
flex-start:      [A][B][C]              |
flex-end:                    |[A][B][C] |
center:              |[A][B][C]|        |
space-between:   [A]      [B]      [C] |
space-around:     [A]    [B]    [C]     |
space-evenly:      [A]   [B]   [C]     |
```

### Exemple concret

```tsx
function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={goBack}>
        <Text>← Retour</Text>
      </Pressable>
      <Text style={styles.headerTitle}>Mon App</Text>
      <Pressable onPress={openMenu}>
        <Text>☰</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',  // ← Espace le contenu
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});
```

---

## alignItems

Controle l'alignement des enfants le long de l'**axe croise** (cross axis) :

```tsx
const values = [
  'stretch',     // Etire pour remplir (defaut)
  'flex-start',  // Debut de l'axe croise
  'flex-end',    // Fin de l'axe croise
  'center',      // Centre de l'axe croise
  'baseline',    // Aligne sur la ligne de base du texte
];
```

### Illustration (flexDirection: 'row')

```
stretch:     ┌────┬────┬────┐     Chaque enfant prend
             │ A  │ B  │ C  │     toute la hauteur
             └────┴────┴────┘

flex-start:  ┌────┬────┬────┐
             │ A  │ B  │ C  │     Alignes en haut
             │    │    │    │
             └────┴────┴────┘

center:      ┌────────────────┐
             │ ┌──┬──┬──┐    │     Centres verticalement
             │ │A ││B ││C │    │
             │ └──┴──┴──┘    │
             └────────────────┘

flex-end:    ┌────────────────┐
             │                │     Alignes en bas
             │ A    B    C    │
             └────────────────┘
```

### alignSelf : surcharge par enfant

Un enfant peut surcharger l'`alignItems` de son parent :

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', height: 100 }}>
  <View style={{ alignSelf: 'flex-start', width: 40, height: 40, backgroundColor: 'red' }} />
  <View style={{ width: 40, height: 40, backgroundColor: 'blue' }} />  {/* center via parent */}
  <View style={{ alignSelf: 'flex-end', width: 40, height: 40, backgroundColor: 'green' }} />
</View>
```

```
┌──────────────────────────┐
│ [R]                      │  ← alignSelf: flex-start
│        [B]               │  ← alignItems: center (du parent)
│              [V]         │  ← alignSelf: flex-end
└──────────────────────────┘
```

---

## flex, flexGrow, flexShrink, flexBasis

### flex : le raccourci

En React Native, `flex` est un **nombre unique** (pas un raccourci comme en CSS) :

```tsx
// flex: 1 → l'element prend tout l'espace disponible
<View style={{ flex: 1 }}>
  <Text>Je remplis tout</Text>
</View>

// Repartition proportionnelle
<View style={{ flex: 1, flexDirection: 'row' }}>
  <View style={{ flex: 1, backgroundColor: 'red' }} />    {/* 1/3 */}
  <View style={{ flex: 2, backgroundColor: 'blue' }} />   {/* 2/3 */}
</View>
```

### Comment flex fonctionne en React Native

```
flex: N  (N > 0)  →  flexGrow: N,  flexShrink: 1,  flexBasis: 0
flex: 0           →  flexGrow: 0,  flexShrink: 0,  flexBasis: 0
flex: -1          →  flexGrow: 0,  flexShrink: 1,  flexBasis: auto
```

:::tip Astuce
`flex: 1` est le pattern le plus courant pour faire qu'un element occupe tout l'espace restant. C'est l'equivalent du "layout remplissant" omnipresent dans les apps mobiles.
:::

### flexGrow

Definit combien d'espace supplementaire l'element prend parmi l'espace libre :

```tsx
<View style={{ flexDirection: 'row', height: 100 }}>
  <View style={{ width: 60, backgroundColor: 'red' }} />
  <View style={{ flexGrow: 1, backgroundColor: 'blue' }} />  {/* Prend le reste */}
</View>
```

```
Conteneur: 360px de large
┌──────────┬──────────────────────────────────────────┐
│  Rouge   │           Bleu (flexGrow: 1)             │
│  60px    │           300px restant                   │
└──────────┴──────────────────────────────────────────┘
```

### flexShrink

Definit combien un element retrecit quand l'espace est insuffisant :

```tsx
<View style={{ flexDirection: 'row', width: 300 }}>
  <View style={{ width: 200, flexShrink: 1, backgroundColor: 'red' }} />
  <View style={{ width: 200, flexShrink: 0, backgroundColor: 'blue' }} />
</View>
```

```
Espace total necessaire: 400px, disponible: 300px → deficit: 100px
Rouge: flexShrink 1 → absorbe 100px → taille finale: 100px
Bleu:  flexShrink 0 → ne retrecit pas → taille finale: 200px
```

:::warning flexShrink en RN vs CSS
En CSS, `flexShrink` vaut **1** par defaut. En React Native, il vaut **0** par defaut. Cela signifie que les elements debordent au lieu de retrecir si vous ne specifiez pas `flexShrink`.
:::

### flexBasis

La taille initiale de l'element avant la distribution de l'espace libre :

```tsx
<View style={{ flexDirection: 'row' }}>
  <View style={{ flexBasis: 100, flexGrow: 1, backgroundColor: 'red' }} />
  <View style={{ flexBasis: 200, flexGrow: 1, backgroundColor: 'blue' }} />
</View>
```

```
Conteneur: 400px
Bases: 100 + 200 = 300px. Reste: 100px, partage equitablement.
Rouge: 100 + 50 = 150px
Bleu:  200 + 50 = 250px
```

### Algorithme Flexbox simplifie

L'algorithme de distribution Flexbox fonctionne en 3 etapes :

1. **Calcul de la taille de base** : `flexBasis` ou `width`/`height` selon l'axe
2. **Calcul de l'espace libre** : `containerSize - sum(bases)`
3. **Distribution** :
   - Si espace > 0 : distribuer selon `flexGrow`
   - Si espace < 0 : retrecir selon `flexShrink`

```
Espace libre = taille conteneur - somme des bases

Si espace libre > 0 :
  taille enfant = base + (espace libre * flexGrow / total flexGrow)

Si espace libre < 0 :
  taille enfant = base + (deficit * flexShrink / total flexShrink)
```

---

## flexWrap, gap, rowGap, columnGap

### flexWrap

Par defaut (`nowrap`), les enfants restent sur une seule ligne/colonne. Avec `wrap`, ils passent a la ligne :

```tsx
<View style={{
  flexDirection: 'row',
  flexWrap: 'wrap',
}}>
  {tags.map(tag => (
    <View key={tag} style={styles.tag}>
      <Text style={styles.tagText}>{tag}</Text>
    </View>
  ))}
</View>
```

```
flexWrap: 'nowrap' (defaut)       flexWrap: 'wrap'
┌──────────────────────┐          ┌──────────────────────┐
│ [Tag1][Tag2][Tag3]..│→deborde   │ [Tag1][Tag2][Tag3]   │
│                      │          │ [Tag4][Tag5]         │
└──────────────────────┘          └──────────────────────┘
```

### gap, rowGap, columnGap

Depuis React Native 0.71, vous pouvez utiliser `gap` pour espacer les enfants sans marges :

```tsx
<View style={{
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,            // Espace entre tous les elements
  // OU
  rowGap: 12,        // Espace vertical entre les lignes
  columnGap: 8,      // Espace horizontal entre les colonnes
}}>
  <View style={styles.gridItem} />
  <View style={styles.gridItem} />
  <View style={styles.gridItem} />
  <View style={styles.gridItem} />
</View>
```

:::tip gap vs margin
`gap` est preferable aux marges pour l'espacement dans les layouts Flex car :
- Pas de marge en trop sur le premier/dernier element
- Pas besoin de calculs `marginRight` / `marginBottom` conditionnels
- Plus simple et plus lisible
:::

---

## position : relative vs absolute

### relative (defaut)

L'element est positionne normalement dans le flux Flex, puis decale par `top`, `right`, `bottom`, `left` :

```tsx
<View style={{
  position: 'relative',  // Defaut, optionnel
  top: 10,               // Decale de 10 vers le bas
  left: 5,               // Decale de 5 vers la droite
}}>
  <Text>Decale</Text>
</View>
```

### absolute

L'element est **retire du flux** Flex et positionne par rapport a son parent :

```tsx
function BadgeIcon() {
  return (
    <View style={styles.iconContainer}>
      <Image source={bellIcon} style={styles.icon} />
      {/* Badge positionne en absolute en haut a droite */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>3</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    // position relative implicite (defaut)
  },
  icon: {
    width: 40,
    height: 40,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
```

### Overlay plein ecran

```tsx
function Modal() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.overlay} />
      <View style={styles.modalContent}>
        <Text>Contenu du modal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    top: '20%',
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
});
```

### Differences avec le CSS web

| Aspect | CSS Web | React Native |
|--------|---------|--------------|
| Contexte de positionnement | Ancetre avec `position: relative` | **Toujours le parent direct** |
| `z-index` | Crée un stacking context | Fonctionne mais moins previsible |
| `position: fixed` | Fixe par rapport au viewport | **N'existe pas** |
| `position: sticky` | Colle lors du scroll | **N'existe pas** (sauf `stickyHeaderIndices`) |

:::warning position: absolute en RN
En React Native, un element `absolute` est **toujours** positionne par rapport a son parent direct, pas par rapport au premier ancetre avec `position: relative` comme en CSS. C'est plus simple mais different.
:::

---

## Dimensions, pourcentages, valeurs responsives

### Unites en React Native

React Native utilise des **density-independent pixels** (dp) par defaut :

```tsx
// Valeurs en dp (pas en px CSS)
const styles = StyleSheet.create({
  box: {
    width: 100,      // 100 dp
    height: 50,       // 50 dp
    margin: 16,       // 16 dp
    borderRadius: 8,  // 8 dp
  },
});
```

### Pourcentages

Certaines proprietes acceptent des pourcentages (en string) :

```tsx
const styles = StyleSheet.create({
  halfWidth: {
    width: '50%',
    height: '100%',
  },
  thirdWidth: {
    width: '33.333%',
  },
});
```

### API Dimensions

```tsx
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// ⚠️ Valeurs statiques au moment de l'appel
const styles = StyleSheet.create({
  banner: {
    width: width,
    height: width * 0.5625,  // Ratio 16:9
  },
});
```

### useWindowDimensions (recommande)

Le hook `useWindowDimensions` se met a jour automatiquement lors des rotations :

```tsx
import { useWindowDimensions } from 'react-native';

function ResponsiveGrid() {
  const { width } = useWindowDimensions();

  // Nombre de colonnes adaptatif
  const numColumns = width >= 768 ? 3 : width >= 480 ? 2 : 1;
  const itemWidth = (width - 16 * (numColumns + 1)) / numColumns;

  return (
    <FlatList
      key={`grid-${numColumns}`}
      data={items}
      renderItem={({ item }) => (
        <View style={[styles.card, { width: itemWidth }]}>
          <Text>{item.name}</Text>
        </View>
      )}
      numColumns={numColumns}
      columnWrapperStyle={
        numColumns > 1 ? styles.row : undefined
      }
    />
  );
}
```

### Valeurs responsives avec breakpoints

```tsx
type Breakpoints = Record<string, number>;

function resolveResponsiveValue(
  value: Record<string, number>,
  screenWidth: number,
  breakpoints: Breakpoints
): number {
  // Trier les breakpoints du plus grand au plus petit
  const sortedBreakpoints = Object.entries(breakpoints)
    .sort(([, a], [, b]) => b - a);

  for (const [name, minWidth] of sortedBreakpoints) {
    if (screenWidth >= minWidth && value[name] !== undefined) {
      return value[name];
    }
  }

  // Fallback : valeur 'base' ou premiere valeur
  return value.base ?? Object.values(value)[0];
}

// Utilisation
const breakpoints = {
  lg: 1024,
  md: 768,
  sm: 480,
  base: 0,
};

const padding = resolveResponsiveValue(
  { base: 8, sm: 12, md: 16, lg: 24 },
  screenWidth,
  breakpoints
);
```

---

## Platform.OS : styles conditionnels par plateforme

### Platform.OS

```tsx
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    // Shadow iOS
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {}),
    // Elevation Android
    ...(Platform.OS === 'android' ? {
      elevation: 3,
    } : {}),
  },
});
```

### Platform.select

Plus lisible pour les valeurs differentes par plateforme :

```tsx
const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.select({
      ios: 44,        // Barre de statut iOS
      android: 24,    // Barre de statut Android
      default: 0,
    }),
    fontFamily: Platform.select({
      ios: 'San Francisco',
      android: 'Roboto',
      default: 'System',
    }),
  },
});
```

### Fichiers specifiques par plateforme

React Native resout automatiquement les fichiers par plateforme :

```
components/
  Button.tsx            ← Partage (fallback)
  Button.ios.tsx        ← Utilise sur iOS
  Button.android.tsx    ← Utilise sur Android
```

### Extraction de styles par plateforme

```tsx
interface PlatformStyle {
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
  common?: Record<string, unknown>;
}

function extractPlatformStyle(
  style: PlatformStyle,
  platform: 'ios' | 'android'
): Record<string, unknown> {
  return {
    ...style.common,
    ...style[platform],
  };
}

// Utilisation
const cardStyle = extractPlatformStyle({
  common: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: {
    elevation: 3,
  },
}, Platform.OS);
```

---

## Composition de styles

### Tableaux de styles

React Native accepte un tableau de styles (le dernier gagne en cas de conflit) :

```tsx
<View style={[styles.card, styles.highlighted]}>
  <Text style={[styles.text, isActive && styles.activeText]}>
    Contenu
  </Text>
</View>
```

### Styles conditionnels

```tsx
// Avec ternaire
<View style={[styles.button, isDisabled ? styles.disabled : styles.enabled]}>

// Avec short-circuit (undefined est ignore)
<View style={[styles.button, isActive && styles.active]}>

// Combinaison complexe
<View style={[
  styles.base,
  variant === 'primary' && styles.primary,
  variant === 'secondary' && styles.secondary,
  size === 'large' && styles.large,
  isDisabled && styles.disabled,
]}>
```

### mergeStyles : fusion avec last-wins

```tsx
function mergeStyles(
  ...styles: (Record<string, unknown> | undefined | false | null)[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const style of styles) {
    if (style) {
      Object.assign(result, style);
    }
  }

  return result;
}

// Utilisation
const finalStyle = mergeStyles(
  styles.base,
  styles.variant,
  isActive && styles.active,
  customStyle,
);
```

### Pattern : styles de composant configurable

```tsx
interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

function Button({ title, variant = 'primary', size = 'md', disabled, style }: ButtonProps) {
  return (
    <Pressable
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        style,  // Style externe en dernier (override)
      ]}
      disabled={disabled}
    >
      <Text style={[
        styles.text,
        textVariantStyles[variant],
        textSizeStyles[size],
      ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: '#007AFF' },
  secondary: { backgroundColor: '#E5E5EA' },
  ghost: { backgroundColor: 'transparent' },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: 6, paddingHorizontal: 12 },
  md: { paddingVertical: 10, paddingHorizontal: 20 },
  lg: { paddingVertical: 14, paddingHorizontal: 28 },
});

const textVariantStyles = StyleSheet.create({
  primary: { color: '#fff' },
  secondary: { color: '#333' },
  ghost: { color: '#007AFF' },
});

const textSizeStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
});
```

---

## Construire des layouts courants

### Layout header / content / footer

```tsx
function AppLayout({ children }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon App</Text>
      </View>

      <View style={styles.content}>
        {children}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,               // Remplit tout l'ecran
    backgroundColor: '#f5f5f5',
  },
  header: {
    // Pas de flex → taille determinee par le contenu
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,               // Prend tout l'espace restant
    padding: 16,
  },
  footer: {
    // Pas de flex → taille determinee par le contenu
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
```

```
┌────────────────────────┐
│ Header (taille fixe)   │
├────────────────────────┤
│                        │
│ Content (flex: 1)      │
│ Prend tout l'espace    │
│ restant                │
│                        │
├────────────────────────┤
│ Footer (taille fixe)   │
└────────────────────────┘
```

### Layout sidebar

```tsx
function SidebarLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.menuItem}>Accueil</Text>
        <Text style={styles.menuItem}>Profil</Text>
        <Text style={styles.menuItem}>Parametres</Text>
      </View>
      <View style={styles.mainContent}>
        <Text>Contenu principal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#1a1a2e',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  mainContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  menuItem: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
});
```

### Layout grille

```tsx
function GridLayout() {
  const { width } = useWindowDimensions();
  const numColumns = 3;
  const gap = 8;
  const itemSize = (width - gap * (numColumns + 1)) / numColumns;

  return (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.gridItem,
            {
              width: itemSize,
              height: itemSize,
              marginLeft: gap,
              marginTop: gap,
            },
          ]}
        >
          <Text>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### Calcul programmatique de grille

```tsx
interface GridItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createGridLayout(
  columns: number,
  gap: number,
  containerWidth: number,
  itemCount: number
): GridItem[] {
  const itemWidth = (containerWidth - gap * (columns + 1)) / columns;
  const itemHeight = itemWidth; // Carre par defaut

  const items: GridItem[] = [];

  for (let i = 0; i < itemCount; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    items.push({
      x: gap + col * (itemWidth + gap),
      y: gap + row * (itemHeight + gap),
      width: itemWidth,
      height: itemHeight,
    });
  }

  return items;
}
```

### Layout carte

```tsx
function Card({ title, subtitle, image, actions }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.cardActions}>
        {actions}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    margin: 8,
    // Shadow cross-platform
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    gap: 8,
  },
});
```

---

## Calcul de layout Flexbox en TypeScript

Pour comprendre en profondeur Flexbox, voici un algorithme simplifie de calcul de positions :

```tsx
interface FlexChild {
  flexGrow: number;
  flexShrink: number;
  flexBasis: number;
}

interface LayoutResult {
  offset: number;
  size: number;
}

function computeFlexLayout(
  containerSize: number,
  children: FlexChild[]
): LayoutResult[] {
  // 1. Calculer la somme des bases
  const totalBasis = children.reduce((sum, c) => sum + c.flexBasis, 0);

  // 2. Calculer l'espace libre
  const freeSpace = containerSize - totalBasis;

  // 3. Distribuer l'espace
  const sizes: number[] = [];

  if (freeSpace >= 0) {
    // Espace positif → distribuer selon flexGrow
    const totalGrow = children.reduce((sum, c) => sum + c.flexGrow, 0);

    for (const child of children) {
      if (totalGrow > 0) {
        sizes.push(child.flexBasis + freeSpace * (child.flexGrow / totalGrow));
      } else {
        sizes.push(child.flexBasis);
      }
    }
  } else {
    // Espace negatif → retrecir selon flexShrink
    const totalShrink = children.reduce((sum, c) => sum + c.flexShrink, 0);

    for (const child of children) {
      if (totalShrink > 0) {
        sizes.push(child.flexBasis + freeSpace * (child.flexShrink / totalShrink));
      } else {
        sizes.push(child.flexBasis);
      }
    }
  }

  // 4. Calculer les offsets
  let offset = 0;
  const results: LayoutResult[] = [];

  for (const size of sizes) {
    results.push({ offset, size });
    offset += size;
  }

  return results;
}
```

---

## Erreurs courantes

### 1. Oublier flex: 1 sur le conteneur racine

```tsx
// ❌ Rien ne s'affiche ou contenu tronque
function App() {
  return (
    <View>
      <Text>Contenu</Text>
    </View>
  );
}

// ✅ Le conteneur occupe tout l'ecran
function App() {
  return (
    <View style={{ flex: 1 }}>
      <Text>Contenu</Text>
    </View>
  );
}
```

### 2. Confondre flexDirection defaut

```tsx
// ❌ Penser que c'est en ligne comme en CSS
<View>
  <View style={{ width: 50, height: 50, backgroundColor: 'red' }} />
  <View style={{ width: 50, height: 50, backgroundColor: 'blue' }} />
</View>
// → Empile verticalement (column) !

// ✅ Explicitement en ligne
<View style={{ flexDirection: 'row' }}>
  <View style={{ width: 50, height: 50, backgroundColor: 'red' }} />
  <View style={{ width: 50, height: 50, backgroundColor: 'blue' }} />
</View>
```

### 3. Tenter margin: 'auto' pour centrer

```tsx
// ❌ N'existe pas en RN
<View style={{ margin: 'auto' }}>
  <Text>Centre ?</Text>
</View>

// ✅ Utiliser Flexbox
<View style={{
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
}}>
  <Text>Centre !</Text>
</View>
```

### 4. Oublier que flexShrink est 0 par defaut

```tsx
// ❌ Le texte deborde sans retour a la ligne
<View style={{ flexDirection: 'row' }}>
  <Image source={avatar} style={{ width: 50, height: 50 }} />
  <Text>Un tres long texte qui ne va pas tenir sur une seule ligne...</Text>
</View>

// ✅ Permettre au texte de retrecir
<View style={{ flexDirection: 'row' }}>
  <Image source={avatar} style={{ width: 50, height: 50 }} />
  <Text style={{ flex: 1 }}>
    Un tres long texte qui va maintenant wrapper correctement.
  </Text>
</View>
```

### 5. Melanger les pourcentages et les nombres

```tsx
// ❌ Erreur de type
const styles = StyleSheet.create({
  box: {
    width: '50%',
    marginRight: '16',  // String alors qu'un nombre est attendu
  },
});

// ✅ Coherent
const styles = StyleSheet.create({
  box: {
    width: '50%',       // Pourcentage en string
    marginRight: 16,    // Nombre en dp
  },
});
```

---

## Resume

### StyleSheet

| API | Usage |
|-----|-------|
| `StyleSheet.create({})` | Creer des styles types et optimises |
| `StyleSheet.flatten([])` | Fusionner un tableau en un objet |
| `StyleSheet.compose(a, b)` | Combiner 2 styles efficacement |
| `StyleSheet.absoluteFill` | Raccourci position absolute plein ecran |
| `StyleSheet.hairlineWidth` | Plus fine ligne possible |

### Flexbox

| Propriete | Defaut RN | Description |
|-----------|-----------|-------------|
| `flexDirection` | `column` | Axe principal |
| `justifyContent` | `flex-start` | Distribution axe principal |
| `alignItems` | `stretch` | Alignement axe croise |
| `alignSelf` | `auto` | Override alignItems par enfant |
| `flex` | 0 | Raccourci grow/shrink/basis |
| `flexGrow` | 0 | Croissance dans l'espace libre |
| `flexShrink` | 0 | Retrecissement si debordement |
| `flexBasis` | `auto` | Taille initiale |
| `flexWrap` | `nowrap` | Retour a la ligne |
| `gap` | 0 | Espacement entre enfants |
| `position` | `relative` | Positionnement |

### Checklist layout

- [ ] `flex: 1` sur le conteneur racine
- [ ] `flexDirection: 'row'` explicite pour les lignes
- [ ] `flex: 1` ou `flexShrink: 1` sur les elements qui doivent s'adapter
- [ ] `Platform.select` ou `Platform.OS` pour les styles specifiques
- [ ] `useWindowDimensions` pour les layouts responsifs
- [ ] `StyleSheet.create` au lieu de styles inline
- [ ] Styles composes avec tableaux `[style1, condition && style2]`

---

## Exercice pratique

Rendez-vous dans le [Lab 05](../labs/lab-05-stylesheet-flexbox/) pour implementer :
- Calcul de layout Flexbox (positions des enfants)
- Fusion de styles avec strategie last-wins
- Valeurs responsives avec breakpoints
- Calcul de positions de grille
- Extraction de styles par plateforme

```bash
cd labs/lab-05-stylesheet-flexbox
npx tsx exercise.ts
```
