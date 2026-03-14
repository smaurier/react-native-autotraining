# Screencast 08 — React Navigation fondamentaux

## Informations
- **Duree estimee** : 13-15 min
- **Module** : `modules/08-react-navigation-fondamentaux.md`
- **Lab associe** : Lab 08
- **Prerequis** : Screencast 07

## Setup
- [ ] VS Code ouvert dans un projet Expo ou React Native CLI
- [ ] Terminal integre ouvert
- [ ] React Navigation installe (`@react-navigation/native`, `@react-navigation/native-stack`)
- [ ] Emulateur/simulateur pret
- [ ] Fichier `modules/08-react-navigation-fondamentaux.md` ouvert

## Script

### [00:00-01:30] Introduction — Pourquoi une navigation ?

> Sur le web, le navigateur gere la navigation via les URLs. Sur mobile, il n'y a pas de barre d'adresse. L'application doit gerer elle-meme la pile d'ecrans, les transitions et les gestes. React Navigation est la solution standard.

**Action** : Montrer le modele mental.

```
NAVIGATION MOBILE = PILE D'ECRANS

[Home] → push → [Home][Details] → push → [Home][Details][Profile]
                                   ← pop ← [Home][Details]
```

> Chaque ecran est empile. goBack depile. C'est simple mais puissant.

### [01:30-04:00] Installation et premier navigator

**Action** : Installer les packages.

```bash
npx expo install @react-navigation/native react-native-screens react-native-safe-area-context
npx expo install @react-navigation/native-stack
```

**Action** : Creer le premier navigator dans `App.tsx`.

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Button } from 'react-native';

function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Accueil</Text>
      <Button
        title="Voir les details"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

function DetailsScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Details</Text>
      <Button title="Retour" onPress={() => navigation.goBack()} />
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**Action** : Lancer l'app et montrer la navigation.

> NavigationContainer est obligatoire, c'est le conteneur racine. Le Stack.Navigator gere la pile. Chaque Stack.Screen definit un ecran.

### [04:00-06:30] Passer des parametres types

**Action** : Ajouter le typage TypeScript.

```tsx
type RootStackParamList = {
  Home: undefined;
  Details: { itemId: number; title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
```

> En typant le navigator, TypeScript verifie chaque appel a navigate. Si vous oubliez un parametre ou passez le mauvais type, vous avez une erreur a la compilation.

**Action** : Typer les props des ecrans.

```tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type HomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type DetailsProps = NativeStackScreenProps<RootStackParamList, 'Details'>;

function HomeScreen({ navigation }: HomeProps) {
  return (
    <Button
      title="Produit #42"
      onPress={() => navigation.navigate('Details', { itemId: 42, title: 'Widget' })}
    />
  );
}

function DetailsScreen({ route }: DetailsProps) {
  const { itemId, title } = route.params;
  // itemId: number, title: string — infere automatiquement
  return <Text>{title} (#{itemId})</Text>;
}
```

**Action** : Montrer l'autocompletion TypeScript.

> TypeScript est un game changer pour la navigation. Finis les bugs de parametres manquants ou de mauvais noms d'ecrans.

### [06:30-09:00] Personnaliser le header

**Action** : Ajouter des options de header.

```tsx
<Stack.Navigator
  screenOptions={{
    headerStyle: { backgroundColor: '#6200ee' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
  }}
>
  <Stack.Screen
    name="Home"
    component={HomeScreen}
    options={{
      title: 'Ma Boutique',
      headerRight: () => (
        <Pressable onPress={() => alert('Panier')}>
          <Text style={{ color: '#fff', fontSize: 18 }}>🛒</Text>
        </Pressable>
      ),
    }}
  />
  <Stack.Screen
    name="Details"
    component={DetailsScreen}
    options={({ route }) => ({
      title: route.params.title,
    })}
  />
</Stack.Navigator>
```

> screenOptions s'applique a tous les ecrans. options sur un Screen s'applique a un seul. La fonction dans options recoit { route, navigation } pour les titres dynamiques.

**Action** : Montrer le resultat sur l'emulateur.

### [09:00-11:30] Actions de navigation : navigate, push, replace, reset

**Action** : Demontrer la difference navigate vs push.

```tsx
// Pile : Home -> Details(1)

// navigate — revient a l'instance existante
navigation.navigate('Details', { itemId: 2 });
// Pile : Home -> Details(2)

// push — empile toujours
navigation.push('Details', { itemId: 2 });
// Pile : Home -> Details(1) -> Details(2)
```

> navigate est pour la navigation standard. push est quand vous voulez plusieurs instances du meme ecran.

**Action** : Montrer replace et reset.

```tsx
// Apres un login reussi :
navigation.replace('Dashboard');  // Login remplace par Dashboard
// Ou reinitialiser toute la pile :
navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
```

> replace est pour un seul ecran. reset reinitialise toute la pile. Apres un login, on utilise reset pour empecher le retour au login.

### [11:30-13:00] Animations de transition

**Action** : Montrer les animations disponibles.

```tsx
<Stack.Screen
  name="Details"
  options={{ animation: 'slide_from_right' }}
/>

<Stack.Screen
  name="CreateItem"
  options={{
    presentation: 'modal',
    animation: 'slide_from_bottom',
  }}
/>

<Stack.Screen
  name="Alert"
  options={{
    presentation: 'transparentModal',
    animation: 'fade',
  }}
/>
```

> presentation: 'modal' change le comportement de l'ecran. Il glisse du bas au lieu de la droite. transparentModal cree un overlay transparent.

**Action** : Montrer chaque animation sur l'emulateur.

### [13:00-14:00] Recapitulatif

**Action** : Afficher le recapitulatif.

```
CE QU'IL FAUT RETENIR :
1. NavigationContainer + Stack.Navigator = base de navigation
2. Typer avec RootStackParamList pour la securite TypeScript
3. navigate vs push : reutilise vs empile
4. replace/reset : post-login, changement de flux
5. screenOptions pour le style global, options pour chaque ecran
6. presentation: 'modal' pour les ecrans modaux

PROCHAINE ETAPE :
→ Screencast 09 : Tabs, drawer, deep linking, auth flow
```

## Points d'attention pour l'enregistrement
- L'autocompletion TypeScript est un moment cle — prendre le temps de la montrer
- Montrer navigate vs push cote a cote avec la pile dans la console
- Les animations doivent etre montrees sur un emulateur/simulateur, pas en screenshots
- Le typage RootStackParamList est le concept le plus important — bien insister
