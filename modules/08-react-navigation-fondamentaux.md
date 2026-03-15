# Module 08 — React Navigation v7 : fondamentaux

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 3/5        | 90 min        | [Lab 08](../labs/lab-08-navigation-fondamentaux/) | [Quiz 08](../quizzes/quiz-08-navigation.html) |

## Objectifs

- Installer et configurer React Navigation dans un projet React Native
- Comprendre le `NavigationContainer` et le systeme de linking
- Creer un Stack Navigator avec `createNativeStackNavigator`
- Personnaliser les ecrans : titre, header, couleurs, boutons
- Maitriser les actions de navigation : `navigate`, `push`, `goBack`, `replace`, `reset`
- Passer et lire des parametres de route types
- Typer la navigation avec TypeScript (`RootStackParamList`, `NativeStackScreenProps`)
- Personnaliser le header avec un composant custom
- Configurer les animations de transition

---

## Introduction a React Navigation

### Pourquoi React Navigation ?

React Navigation v7 est la bibliotheque de navigation standard pour React Native. Contrairement au web ou le navigateur gere la navigation via l'URL, une application mobile doit gerer elle-meme la pile d'ecrans, les transitions et les gestes.

| Fonctionnalite | React Navigation v7 | React Native Navigation (Wix) |
|----------------|---------------------|-------------------------------|
| Installation | JS pure, facile | Natif, config complexe |
| Performance | Tres bonne (v7) | Native, excellente |
| Personnalisation | Tres flexible | Limitee au natif |
| TypeScript | Support complet | Support partiel |
| Expo | Compatible | Non compatible |
| Communaute | La plus large | Plus petite |

### Architecture de la navigation

```
NavigationContainer
  └── Stack.Navigator
        ├── Stack.Screen name="Home"
        ├── Stack.Screen name="Details"
        └── Stack.Screen name="Profile"
```

La navigation React Native fonctionne comme une **pile (stack)** : chaque ecran est empile au-dessus du precedent. L'utilisateur peut revenir en arriere en depilant l'ecran courant.

---

## Installation et setup

### Packages necessaires

```bash
# Package principal
npx expo install @react-navigation/native

# Dependances pour Expo
npx expo install react-native-screens react-native-safe-area-context

# Stack Navigator
npx expo install @react-navigation/native-stack
```

Pour un projet React Native CLI (sans Expo) :

```bash
npm install @react-navigation/native
npm install react-native-screens react-native-safe-area-context
npm install @react-navigation/native-stack

# iOS uniquement
cd ios && pod install
```

### Configuration de react-native-screens

Pour Android, ajoutez dans `MainActivity.kt` :

```kotlin
// android/app/src/main/java/com/yourapp/MainActivity.kt
import android.os.Bundle

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null) // Important : null pour react-native-screens
  }
}
```

---

## NavigationContainer

### Le conteneur racine

Le `NavigationContainer` est le composant racine qui enveloppe toute la navigation. Il gere l'etat de navigation, le deep linking et l'integration avec le systeme.

```tsx
// App.tsx
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <NavigationContainer>
      {/* Les navigateurs vont ici */}
    </NavigationContainer>
  );
}
```

### Proprietes du NavigationContainer

```tsx
<NavigationContainer
  // Etat initial (pour la persistence ou le deep linking)
  initialState={initialState}

  // Callback quand l'etat change
  onStateChange={(state) => {
    console.log('Navigation state:', state);
  }}

  // Configuration du deep linking
  linking={linkingConfig}

  // Theme personnalise
  theme={MyTheme}

  // Reference pour la navigation imperative
  ref={navigationRef}
>
  {/* ... */}
</NavigationContainer>
```

### Configuration du linking

Le linking permet d'associer des URLs a des ecrans :

```tsx
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: '',
      Details: 'details/:id',
      Profile: 'profile/:userId',
    },
  },
};

<NavigationContainer linking={linking}>
  {/* ... */}
</NavigationContainer>
```

---

## Stack Navigator

### createNativeStackNavigator

Le Stack Navigator utilise les APIs natives (`UINavigationController` sur iOS, `Fragment` sur Android) pour des performances optimales.

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
```

### Proprietes du Navigator

```tsx
<Stack.Navigator
  // Ecran affiche par defaut
  initialRouteName="Home"

  // Options par defaut pour tous les ecrans
  screenOptions={{
    headerStyle: { backgroundColor: '#6200ee' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
  }}
>
  {/* ... */}
</Stack.Navigator>
```

### Premier exemple complet

```tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ecran d'accueil</Text>
      <Button
        title="Voir les details"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

function DetailsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details</Text>
      <Button
        title="Retour"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Accueil' }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{ title: 'Details du produit' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
});
```

---

## Screen Options

### Options statiques

Les options definissent l'apparence et le comportement de chaque ecran :

```tsx
<Stack.Screen
  name="Home"
  component={HomeScreen}
  options={{
    // Titre dans le header
    title: 'Accueil',

    // Style du header
    headerStyle: {
      backgroundColor: '#f4511e',
    },

    // Couleur du texte et des icones du header
    headerTintColor: '#fff',

    // Style du titre
    headerTitleStyle: {
      fontWeight: 'bold',
      fontSize: 20,
    },

    // Afficher ou masquer le header
    headerShown: true,

    // Bouton droit du header
    headerRight: () => (
      <Pressable onPress={() => alert('Menu')}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Menu</Text>
      </Pressable>
    ),

    // Bouton gauche du header
    headerLeft: () => (
      <Pressable onPress={() => alert('Drawer')}>
        <Text style={{ color: '#fff' }}>☰</Text>
      </Pressable>
    ),
  }}
/>
```

### Options dynamiques

Les options peuvent dependre des parametres de route :

```tsx
<Stack.Screen
  name="Details"
  component={DetailsScreen}
  options={({ route }) => ({
    title: route.params?.title ?? 'Details',
  })}
/>
```

### Options depuis le composant

Un ecran peut modifier ses propres options via `navigation.setOptions` :

```tsx
function DetailsScreen({ navigation, route }) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: route.params.title,
      headerRight: () => (
        <Pressable onPress={() => handleShare()}>
          <Text>Partager</Text>
        </Pressable>
      ),
    });
  }, [navigation, route.params.title]);

  return (/* ... */);
}
```

### Liste des options principales

| Option | Type | Description |
|--------|------|-------------|
| `title` | `string` | Titre affiche dans le header |
| `headerShown` | `boolean` | Afficher/masquer le header |
| `headerStyle` | `ViewStyle` | Style du conteneur du header |
| `headerTintColor` | `string` | Couleur du texte et icones |
| `headerTitleStyle` | `TextStyle` | Style du titre |
| `headerRight` | `() => ReactNode` | Composant a droite |
| `headerLeft` | `() => ReactNode` | Composant a gauche |
| `headerTitle` | `string \| () => ReactNode` | Titre ou composant titre |
| `headerBackTitle` | `string` | Texte du bouton retour (iOS) |
| `headerBackVisible` | `boolean` | Afficher le bouton retour |
| `headerShadowVisible` | `boolean` | Ombre sous le header |
| `headerLargeTitle` | `boolean` | Grand titre (iOS) |
| `presentation` | `'card' \| 'modal' \| ...` | Mode de presentation |
| `animation` | `'default' \| 'fade' \| ...` | Animation de transition |
| `gestureEnabled` | `boolean` | Geste swipe-back (iOS) |
| `statusBarStyle` | `'dark' \| 'light'` | Style de la barre de statut |

---

## Actions de navigation

### navigate

`navigate` va vers un ecran. Si l'ecran est deja dans la pile, il revient a cette instance au lieu d'en creer une nouvelle.

```tsx
// Naviguer vers un ecran
navigation.navigate('Details');

// Naviguer avec des parametres
navigation.navigate('Details', { itemId: 42 });

// Naviguer vers un ecran dans un navigateur imbrique
navigation.navigate('Settings', {
  screen: 'Notifications',
  params: { enablePush: true },
});
```

### push

`push` empile toujours un nouvel ecran, meme s'il est deja dans la pile. Utile quand vous voulez plusieurs instances du meme ecran.

```tsx
// Empiler un nouvel ecran Details (meme si un Details existe deja)
navigation.push('Details', { itemId: 43 });
navigation.push('Details', { itemId: 44 });
// La pile contient maintenant : Home -> Details(43) -> Details(44)
```

### Difference entre navigate et push

```tsx
// Scenario : pile = Home -> Details(42)
navigation.navigate('Details', { itemId: 43 });
// Resultat : Home -> Details(43) — remplace les params de l'instance existante

navigation.push('Details', { itemId: 43 });
// Resultat : Home -> Details(42) -> Details(43) — nouvelle instance
```

### goBack

Revenir a l'ecran precedent :

```tsx
// Revenir en arriere
navigation.goBack();

// Verifier si on peut revenir
if (navigation.canGoBack()) {
  navigation.goBack();
}
```

### replace

Remplacer l'ecran courant sans ajouter a la pile :

```tsx
// Remplacer l'ecran courant
navigation.replace('Home');

// Utile apres un login : remplacer Login par Home
// pour que l'utilisateur ne puisse pas revenir au login
navigation.replace('Dashboard');
```

### reset

Reinitialiser toute la pile de navigation :

```tsx
// Reinitialiser avec un seul ecran
navigation.reset({
  index: 0,
  routes: [{ name: 'Home' }],
});

// Reinitialiser avec un historique
navigation.reset({
  index: 1,
  routes: [
    { name: 'Home' },
    { name: 'Details', params: { itemId: 42 } },
  ],
});
```

### popToTop

Revenir au premier ecran de la pile :

```tsx
navigation.popToTop();
```

### Recapitulatif des actions

| Action | Comportement | Cas d'usage |
|--------|-------------|-------------|
| `navigate` | Va vers l'ecran, reutilise l'instance existante | Navigation standard |
| `push` | Empile toujours une nouvelle instance | Meme ecran avec params differents |
| `goBack` | Depile l'ecran courant | Bouton retour |
| `replace` | Remplace l'ecran courant | Post-login, post-onboarding |
| `reset` | Reinitialise toute la pile | Logout, changement de flux |
| `popToTop` | Revient au premier ecran | Bouton "Accueil" |

---

## Route params

### Passer des parametres

```tsx
// Depuis l'ecran source
navigation.navigate('Details', {
  itemId: 42,
  title: 'Mon article',
  author: { name: 'Alice', avatar: 'https://...' },
});
```

### Lire les parametres

```tsx
function DetailsScreen({ route }) {
  const { itemId, title, author } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text>ID: {itemId}</Text>
      <Text>Par: {author.name}</Text>
    </View>
  );
}
```

### Parametres initiaux

```tsx
<Stack.Screen
  name="Details"
  component={DetailsScreen}
  initialParams={{ itemId: 0, title: 'Chargement...' }}
/>
```

### Mettre a jour les parametres

```tsx
// Depuis l'ecran lui-meme
navigation.setParams({ title: 'Nouveau titre' });
```

### Passer des callbacks (a eviter)

```tsx
// Anti-pattern : passer une fonction en parametre
navigation.navigate('CreateItem', {
  onCreated: (item) => setItems([...items, item]),
});

// Mieux : utiliser un state global (Context, Zustand) ou des events
```

---

## TypeScript : typage de la navigation

### Definir les types de parametres

La premiere etape est de definir un type qui associe chaque ecran a ses parametres :

```tsx
// types/navigation.ts
export type RootStackParamList = {
  Home: undefined;                          // Pas de parametres
  Details: { itemId: number; title: string }; // Parametres obligatoires
  Profile: { userId: string };
  Settings: undefined;
  Search: { query?: string };               // Parametre optionnel
};
```

### Typer le Navigator

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Maintenant TypeScript verifie les noms d'ecrans et les parametres
function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      {/* @ts-expect-error — 'Unknown' n'existe pas dans RootStackParamList */}
      <Stack.Screen name="Unknown" component={UnknownScreen} />
    </Stack.Navigator>
  );
}
```

### Typer les props des ecrans

```tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types/navigation';

// Props completes (navigation + route)
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'Details'>;

function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <View>
      <Button
        title="Details"
        onPress={() => {
          // TypeScript verifie les parametres
          navigation.navigate('Details', { itemId: 42, title: 'Article' });

          // @ts-expect-error — manque 'title'
          navigation.navigate('Details', { itemId: 42 });
        }}
      />
    </View>
  );
}

function DetailsScreen({ route, navigation }: DetailsScreenProps) {
  // TypeScript infere le type des parametres
  const { itemId, title } = route.params;
  // itemId: number, title: string — types inferes automatiquement

  return (
    <View>
      <Text>{title} (#{itemId})</Text>
    </View>
  );
}
```

### Typer navigation et route separement

```tsx
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

// Navigation seule (pour les composants enfants)
type DetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Details'
>;

// Route seule (pour acceder aux params)
type DetailsRouteProp = RouteProp<RootStackParamList, 'Details'>;

// Utilisation avec useNavigation et useRoute
function ChildComponent() {
  const navigation = useNavigation<DetailsNavigationProp>();
  const route = useRoute<DetailsRouteProp>();

  return (
    <Text>{route.params.title}</Text>
  );
}
```

### Type global pour useNavigation

Pour eviter de typer `useNavigation` partout :

```tsx
// types/navigation.ts
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Maintenant useNavigation() est type automatiquement
function AnyComponent() {
  const navigation = useNavigation(); // Type infere
  navigation.navigate('Details', { itemId: 42, title: 'Article' });
}
```

### Exemple complet avec TypeScript

```tsx
// types/navigation.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  ProductList: { categoryId: string };
  ProductDetails: { productId: number; productName: string };
  Cart: undefined;
  Checkout: { totalAmount: number };
};

export type HomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ProductListProps = NativeStackScreenProps<RootStackParamList, 'ProductList'>;
export type ProductDetailsProps = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;
export type CartProps = NativeStackScreenProps<RootStackParamList, 'Cart'>;
export type CheckoutProps = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProductList" component={ProductListScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Header personnalise

### Composant header custom

Pour un controle total sur le header :

```tsx
import { getHeaderTitle } from '@react-navigation/elements';

function CustomHeader({ navigation, route, options, back }) {
  const title = getHeaderTitle(options, route.name);

  return (
    <View style={headerStyles.container}>
      {back && (
        <Pressable onPress={navigation.goBack} style={headerStyles.backButton}>
          <Text style={headerStyles.backText}>← Retour</Text>
        </Pressable>
      )}
      <Text style={headerStyles.title}>{title}</Text>
      <View style={headerStyles.actions}>
        <Pressable onPress={() => navigation.navigate('Cart')}>
          <Text style={headerStyles.icon}>🛒</Text>
        </Pressable>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#6200ee',
  },
  backButton: { padding: 8 },
  backText: { color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 12 },
  icon: { fontSize: 20 },
});
```

### Utiliser le header custom

```tsx
<Stack.Navigator
  screenOptions={{
    header: (props) => <CustomHeader {...props} />,
  }}
>
  <Stack.Screen name="Home" component={HomeScreen} />
  <Stack.Screen name="Details" component={DetailsScreen} />
</Stack.Navigator>
```

### Header avec recherche

```tsx
function SearchHeader({ navigation, route, options }) {
  const [query, setQuery] = React.useState('');

  return (
    <View style={searchStyles.container}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={searchStyles.back}>←</Text>
      </Pressable>
      <TextInput
        style={searchStyles.input}
        placeholder="Rechercher..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => {
          navigation.navigate('SearchResults', { query });
        }}
        autoFocus
      />
    </View>
  );
}

const searchStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  back: { fontSize: 24, marginRight: 12, color: '#333' },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
```

### Header transparent (overlay)

```tsx
<Stack.Screen
  name="PhotoViewer"
  component={PhotoViewerScreen}
  options={{
    headerTransparent: true,
    headerTitle: '',
    headerTintColor: '#fff',
    headerStyle: {
      backgroundColor: 'transparent',
    },
  }}
/>
```

---

## Animations de transition

### Animations predefinies

React Navigation 7 offre plusieurs animations :

```tsx
<Stack.Screen
  name="Details"
  component={DetailsScreen}
  options={{
    // Animations predefinies
    animation: 'default',          // Slide depuis la droite (iOS) / fade (Android)
    animation: 'slide_from_right', // Slide depuis la droite
    animation: 'slide_from_left',  // Slide depuis la gauche
    animation: 'slide_from_bottom',// Slide depuis le bas
    animation: 'fade',             // Fondu
    animation: 'fade_from_bottom', // Fondu + slide du bas
    animation: 'flip',             // Retournement
    animation: 'simple_push',      // Push simple
    animation: 'none',             // Pas d'animation
  }}
/>
```

### Presentation modale

```tsx
// Ecran presente comme une modale (slide du bas)
<Stack.Screen
  name="CreateItem"
  component={CreateItemScreen}
  options={{
    presentation: 'modal',
    animation: 'slide_from_bottom',
  }}
/>

// Modale transparente (overlay)
<Stack.Screen
  name="Alert"
  component={AlertScreen}
  options={{
    presentation: 'transparentModal',
    animation: 'fade',
  }}
/>

// Modale avec formulaire (iOS style)
<Stack.Screen
  name="EditProfile"
  component={EditProfileScreen}
  options={{
    presentation: 'formSheet',
    // iOS 16+ : taille personnalisable
    sheetAllowedDetents: [0.5, 1.0],
    sheetGrabberVisible: true,
  }}
/>
```

### Animations par plateforme

```tsx
import { Platform } from 'react-native';

<Stack.Navigator
  screenOptions={{
    animation: Platform.select({
      ios: 'default',       // iOS: slide natif avec geste
      android: 'fade_from_bottom', // Android: Material motion
    }),
  }}
>
```

### Animation personnalisee

Pour un controle fin, utilisez `customAnimationOnGesture` et `transitionSpec` :

```tsx
<Stack.Screen
  name="Details"
  component={DetailsScreen}
  options={{
    animation: 'fade',
    animationDuration: 300,
    customAnimationOnGesture: true,
  }}
/>
```

---

## Exemple pratique : application multi-ecrans typee

### Structure du projet

```
src/
  navigation/
    types.ts          # Types de navigation
    AppNavigator.tsx   # Navigateur principal
  screens/
    HomeScreen.tsx
    ProductListScreen.tsx
    ProductDetailsScreen.tsx
    CartScreen.tsx
    CheckoutScreen.tsx
  components/
    CustomHeader.tsx
    ProductCard.tsx
```

### Types de navigation

```tsx
// src/navigation/types.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  ProductList: { categoryId: string; categoryName: string };
  ProductDetails: { productId: number; productName: string; price: number };
  Cart: undefined;
  Checkout: { totalAmount: number };
  OrderConfirmation: { orderId: string };
};

// Types pour chaque ecran
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ProductListScreenProps = NativeStackScreenProps<RootStackParamList, 'ProductList'>;
export type ProductDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;
export type CartScreenProps = NativeStackScreenProps<RootStackParamList, 'Cart'>;
export type CheckoutScreenProps = NativeStackScreenProps<RootStackParamList, 'Checkout'>;
export type OrderConfirmationScreenProps = NativeStackScreenProps<RootStackParamList, 'OrderConfirmation'>;

// Typage global pour useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

### Navigateur principal

```tsx
// src/navigation/AppNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { CustomHeader } from '../components/CustomHeader';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#1a73e8' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Ma Boutique',
          headerRight: () => (
            <Pressable onPress={() => {}}>
              <Text style={{ color: '#fff' }}>🛒</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={({ route }) => ({
          title: route.params.categoryName,
        })}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={({ route }) => ({
          title: route.params.productName,
          animation: 'slide_from_right',
        })}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Mon Panier',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: 'Paiement',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="OrderConfirmation"
        component={OrderConfirmationScreen}
        options={{
          title: 'Commande confirmee',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
```

### Ecran d'accueil

```tsx
// src/screens/HomeScreen.tsx
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { HomeScreenProps } from '../navigation/types';

const CATEGORIES = [
  { id: 'electronics', name: 'Electronique', icon: '📱' },
  { id: 'clothing', name: 'Vetements', icon: '👕' },
  { id: 'books', name: 'Livres', icon: '📚' },
  { id: 'sports', name: 'Sport', icon: '⚽' },
];

export function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <View style={homeStyles.container}>
      <Text style={homeStyles.welcome}>Bienvenue dans Ma Boutique</Text>
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <Pressable
            style={homeStyles.card}
            onPress={() =>
              navigation.navigate('ProductList', {
                categoryId: item.id,
                categoryName: item.name,
              })
            }
          >
            <Text style={homeStyles.icon}>{item.icon}</Text>
            <Text style={homeStyles.cardText}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const homeStyles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  welcome: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: {
    flex: 1, margin: 8, padding: 24, backgroundColor: '#fff',
    borderRadius: 12, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  icon: { fontSize: 40, marginBottom: 8 },
  cardText: { fontSize: 16, fontWeight: '500' },
});
```

### Ecran de details produit

```tsx
// src/screens/ProductDetailsScreen.tsx
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { ProductDetailsScreenProps } from '../navigation/types';

export function ProductDetailsScreen({ route, navigation }: ProductDetailsScreenProps) {
  const { productId, productName, price } = route.params;

  const handleAddToCart = () => {
    // Ajouter au panier (via Context ou Zustand)
    navigation.navigate('Cart');
  };

  const handleBuyNow = () => {
    navigation.navigate('Checkout', { totalAmount: price });
  };

  return (
    <ScrollView style={detailStyles.container}>
      <View style={detailStyles.imageContainer}>
        <Text style={detailStyles.imagePlaceholder}>Image #{productId}</Text>
      </View>

      <View style={detailStyles.info}>
        <Text style={detailStyles.name}>{productName}</Text>
        <Text style={detailStyles.price}>{price.toFixed(2)} EUR</Text>
        <Text style={detailStyles.description}>
          Description du produit {productName}. Lorem ipsum dolor sit amet,
          consectetur adipiscing elit.
        </Text>
      </View>

      <View style={detailStyles.actions}>
        <Pressable style={detailStyles.cartButton} onPress={handleAddToCart}>
          <Text style={detailStyles.cartButtonText}>Ajouter au panier</Text>
        </Pressable>
        <Pressable style={detailStyles.buyButton} onPress={handleBuyNow}>
          <Text style={detailStyles.buyButtonText}>Acheter maintenant</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const detailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageContainer: {
    height: 300, backgroundColor: '#e0e0e0',
    justifyContent: 'center', alignItems: 'center',
  },
  imagePlaceholder: { fontSize: 48, color: '#999' },
  info: { padding: 16 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: 22, color: '#1a73e8', fontWeight: '600', marginBottom: 12 },
  description: { fontSize: 16, color: '#666', lineHeight: 24 },
  actions: { padding: 16, gap: 12 },
  cartButton: {
    backgroundColor: '#e3f2fd', padding: 16, borderRadius: 8, alignItems: 'center',
  },
  cartButtonText: { color: '#1a73e8', fontSize: 16, fontWeight: '600' },
  buyButton: {
    backgroundColor: '#1a73e8', padding: 16, borderRadius: 8, alignItems: 'center',
  },
  buyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

### Ecran de confirmation

```tsx
// src/screens/OrderConfirmationScreen.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { OrderConfirmationScreenProps } from '../navigation/types';

export function OrderConfirmationScreen({
  route,
  navigation,
}: OrderConfirmationScreenProps) {
  const { orderId } = route.params;

  const handleGoHome = () => {
    // Reinitialiser la pile pour empecher le retour au checkout
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <View style={confirmStyles.container}>
      <Text style={confirmStyles.emoji}>✅</Text>
      <Text style={confirmStyles.title}>Commande confirmee !</Text>
      <Text style={confirmStyles.orderId}>N° {orderId}</Text>
      <Text style={confirmStyles.message}>
        Votre commande a ete envoyee. Vous recevrez un email de confirmation.
      </Text>
      <Pressable style={confirmStyles.button} onPress={handleGoHome}>
        <Text style={confirmStyles.buttonText}>Retour a l'accueil</Text>
      </Pressable>
    </View>
  );
}

const confirmStyles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, backgroundColor: '#f0fdf4',
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  orderId: { fontSize: 18, color: '#666', marginBottom: 16 },
  message: { fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 32 },
  button: {
    backgroundColor: '#1a73e8', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

---

## Hooks de navigation

### useNavigation

Acceder a la navigation depuis n'importe quel composant :

```tsx
import { useNavigation } from '@react-navigation/native';

function AddToCartButton({ productId, productName, price }) {
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.navigate('Cart')}
      style={styles.button}
    >
      <Text>Ajouter au panier</Text>
    </Pressable>
  );
}
```

### useRoute

Acceder aux parametres de la route :

```tsx
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

function ProductPrice() {
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetails'>>();
  const { price } = route.params;

  return <Text>{price.toFixed(2)} EUR</Text>;
}
```

### useFocusEffect

Executer du code quand l'ecran obtient le focus :

```tsx
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

function ProductListScreen({ route }: ProductListScreenProps) {
  const [products, setProducts] = React.useState([]);

  useFocusEffect(
    useCallback(() => {
      // Se declenche chaque fois que l'ecran est au premier plan
      fetchProducts(route.params.categoryId).then(setProducts);

      return () => {
        // Cleanup quand l'ecran perd le focus
        setProducts([]);
      };
    }, [route.params.categoryId])
  );

  return (/* ... */);
}
```

### useIsFocused

Savoir si l'ecran est actuellement visible :

```tsx
import { useIsFocused } from '@react-navigation/native';

function CameraScreen() {
  const isFocused = useIsFocused();

  // Ne pas activer la camera si l'ecran n'est pas visible
  if (!isFocused) return null;

  return <Camera style={styles.camera} />;
}
```

---

## Patterns courants

### Ecran conditionnel (chargement)

```tsx
function SplashScreen({ navigation }) {
  React.useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        navigation.replace('Home');
      } else {
        navigation.replace('Login');
      }
    };
    checkAuth();
  }, [navigation]);

  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" />
    </View>
  );
}
```

### Navigation imperative (sans hook)

Pour naviguer en dehors des composants (ex: intercepteur API) :

```tsx
// navigationRef.ts
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

// App.tsx
<NavigationContainer ref={navigationRef}>
  {/* ... */}
</NavigationContainer>

// api/interceptor.ts
import { navigate } from '../navigation/navigationRef';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      navigate('Login');
    }
    return Promise.reject(error);
  }
);
```

---

## Exercice guide : construire un flux de navigation complet

### Etape 1 : Definir les types

Definissez un `RootStackParamList` pour une application de gestion de taches avec les ecrans : `TaskList`, `TaskDetails`, `CreateTask`, `EditTask`.

### Etape 2 : Creer le navigateur

Configurez le Stack Navigator avec des options de header personnalisees et des animations adaptees (modale pour `CreateTask`).

### Etape 3 : Implementer les ecrans

Ajoutez la navigation entre les ecrans avec passage de parametres types.

### Etape 4 : Tester la navigation

Verifiez que :
- Les parametres sont correctement passes
- Le bouton retour fonctionne
- `replace` et `reset` se comportent comme attendu
- Les animations sont fluides

---

## Erreurs courantes

### 1. Oublier le NavigationContainer

```tsx
// Erreur : pas de NavigationContainer
function App() {
  return (
    <Stack.Navigator>
      {/* ... */}
    </Stack.Navigator>
  );
}

// Correct
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* ... */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 2. Passer des objets non serialisables

```tsx
// Mauvais : fonction en parametre
navigation.navigate('Details', {
  onRefresh: () => fetchData(),  // Non serialisable
});

// Bon : utiliser un state global ou un event
```

### 3. Oublier de typer les parametres

```tsx
// Mauvais : pas de types
const Stack = createNativeStackNavigator();

// Bon : type generic
const Stack = createNativeStackNavigator<RootStackParamList>();
```

### 4. Confondre navigate et push

```tsx
// Si Details est deja dans la pile, navigate revient a cette instance
// push cree toujours une nouvelle instance
```

---

## Recapitulatif

| Concept | Cle |
|---------|-----|
| `NavigationContainer` | Conteneur racine obligatoire |
| `createNativeStackNavigator` | Pile d'ecrans avec animations natives |
| `screenOptions` | Options globales ou par ecran |
| `navigate` vs `push` | Reutilise vs empile toujours |
| `goBack` / `replace` / `reset` | Navigation arriere, remplacement, reinitialisation |
| `RootStackParamList` | Type des parametres par ecran |
| `NativeStackScreenProps` | Props typees des ecrans |
| `useNavigation` / `useRoute` | Hooks pour naviguer et lire les params |
| `useFocusEffect` | Effet lie au focus de l'ecran |
| `presentation: 'modal'` | Ecran presente en modale |
| `animation` | Animations de transition configurables |

---

> **Static API (React Navigation v7)** : v7 introduit `createStaticNavigation()` comme approche recommandee pour les nouveaux projets. Elle offre un typage automatique des routes sans maintenir manuellement un `RootParamList`. L'API dynamique avec `NavigationContainer` (enseignee dans ce module) reste fonctionnelle et est l'approche la plus documentee. Pour les projets existants, aucune migration n'est necessaire.

**Prochain module** : [Module 09 — Navigation avancee](./09-navigation-avancee.md) (tabs, drawer, deep linking, auth flow)
