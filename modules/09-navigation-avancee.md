# Module 09 — Navigation avancee

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 3/5        | 75 min        | [Lab 09](../labs/lab-09-navigation-avancee/) | [Quiz 09](../quizzes/quiz-09-navigation-avancee.html) |

## Objectifs

- Creer un Bottom Tab Navigator avec icones, badges et tab bar personnalisee
- Creer un Drawer Navigator avec contenu custom
- Imbriquer des navigateurs (stack dans tabs, modale sur tabs)
- Configurer le deep linking (URL scheme, universal links)
- Implementer un flux d'authentification avec ecrans conditionnels
- Persister l'etat de navigation
- Decouvrir les shared element transitions (React Navigation 7)

---

## Bottom Tab Navigator

### Installation

```bash
npx expo install @react-navigation/bottom-tabs
```

### Configuration de base

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

type TabParamList = {
  Home: undefined;
  Search: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Recherche',
          tabBarIcon: ({ color, size }) => (
            <Icon name="search" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color, size }) => (
            <Icon name="heart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

### Icones sans bibliotheque externe

```tsx
// Icones textuelles simples
function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    home: '🏠',
    search: '🔍',
    heart: '❤️',
    person: '👤',
    cart: '🛒',
    settings: '⚙️',
  };

  return <Text style={{ fontSize: 22, color }}>{icons[name] ?? '?'}</Text>;
}

// Ou avec @expo/vector-icons (inclus dans Expo)
import { Ionicons } from '@expo/vector-icons';

<Tab.Screen
  name="Home"
  component={HomeScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="home-outline" size={size} color={color} />
    ),
  }}
/>
```

### Badges

```tsx
<Tab.Screen
  name="Cart"
  component={CartScreen}
  options={{
    tabBarBadge: 3,         // Nombre
    tabBarBadgeStyle: {
      backgroundColor: '#ff3b30',
      fontSize: 10,
      minWidth: 18,
      height: 18,
    },
  }}
/>
```

Pour un badge dynamique :

```tsx
function AppNavigator() {
  const cartCount = useCartStore((s) => s.items.length);

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
    </Tab.Navigator>
  );
}
```

### Tab bar personnalisee

```tsx
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={tabBarStyles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[
              tabBarStyles.tab,
              isFocused && tabBarStyles.tabActive,
            ]}
          >
            {options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? '#1a73e8' : '#999',
              size: 24,
            })}
            <Text
              style={[
                tabBarStyles.label,
                { color: isFocused ? '#1a73e8' : '#999' },
              ]}
            >
              {typeof label === 'string' ? label : route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20, // safe area
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: '#1a73e8',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});

// Utilisation
<Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />}>
  {/* ... */}
</Tab.Navigator>
```

---

## Drawer Navigator

### Installation

```bash
npx expo install @react-navigation/drawer react-native-gesture-handler react-native-reanimated
```

### Configuration de base

```tsx
import { createDrawerNavigator } from '@react-navigation/drawer';

type DrawerParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  About: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#1a73e8',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#1a73e8',
        },
        headerTintColor: '#fff',
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Accueil',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mon profil',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Parametres',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
```

### Contenu du drawer personnalise

```tsx
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';

function CustomDrawerContent(props) {
  const { navigation } = props;

  return (
    <DrawerContentScrollView {...props}>
      {/* En-tete du drawer */}
      <View style={drawerStyles.header}>
        <View style={drawerStyles.avatar}>
          <Text style={drawerStyles.avatarText}>AM</Text>
        </View>
        <Text style={drawerStyles.name}>Alice Martin</Text>
        <Text style={drawerStyles.email}>alice@example.com</Text>
      </View>

      {/* Items de navigation par defaut */}
      <DrawerItemList {...props} />

      {/* Separateur */}
      <View style={drawerStyles.separator} />

      {/* Items personnalises */}
      <DrawerItem
        label="Aide"
        icon={({ color, size }) => (
          <Ionicons name="help-circle-outline" size={size} color={color} />
        )}
        onPress={() => Linking.openURL('https://help.myapp.com')}
      />
      <DrawerItem
        label="Deconnexion"
        icon={({ color, size }) => (
          <Ionicons name="log-out-outline" size={size} color={color} />
        )}
        labelStyle={{ color: '#dc3545' }}
        onPress={() => handleLogout()}
      />
    </DrawerContentScrollView>
  );
}

const drawerStyles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  name: { fontSize: 18, fontWeight: '600' },
  email: { fontSize: 14, color: '#666', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 10 },
});

// Utilisation
<Drawer.Navigator
  drawerContent={(props) => <CustomDrawerContent {...props} />}
>
  {/* ... */}
</Drawer.Navigator>
```

### Ouvrir/fermer le drawer par programme

```tsx
function HomeScreen({ navigation }) {
  return (
    <View>
      <Pressable onPress={() => navigation.openDrawer()}>
        <Text>Ouvrir le menu</Text>
      </Pressable>
      <Pressable onPress={() => navigation.toggleDrawer()}>
        <Text>Basculer le menu</Text>
      </Pressable>
    </View>
  );
}
```

---

## Navigateurs imbriques

### Stack dans Tabs

Le pattern le plus courant : chaque tab contient sa propre pile de navigation.

```tsx
// Types
type TabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  ProfileTab: undefined;
};

type HomeStackParamList = {
  HomeList: undefined;
  HomeDetails: { id: number };
};

type SearchStackParamList = {
  SearchMain: undefined;
  SearchResults: { query: string };
  SearchDetails: { id: number };
};

type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

// Stack pour chaque tab
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeList" component={HomeListScreen} />
      <HomeStack.Screen name="HomeDetails" component={HomeDetailsScreen} />
    </HomeStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen name="SearchMain" component={SearchMainScreen} />
      <SearchStack.Screen name="SearchResults" component={SearchResultsScreen} />
      <SearchStack.Screen name="SearchDetails" component={SearchDetailsScreen} />
    </SearchStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileMain" component={ProfileMainScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

// Tab Navigator qui contient les stacks
const Tab = createBottomTabNavigator<TabParamList>();

function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          headerShown: false, // Le stack a son propre header
          title: 'Accueil',
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackNavigator}
        options={{
          headerShown: false,
          title: 'Recherche',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          headerShown: false,
          title: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
}
```

### Modal Stack au-dessus des Tabs

Pour presenter des ecrans modaux au-dessus de toute l'application :

```tsx
type RootStackParamList = {
  MainTabs: undefined;
  CreatePost: undefined;
  ImageViewer: { imageUrl: string };
  Settings: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <RootStack.Navigator>
      {/* Les tabs sont le premier ecran du stack racine */}
      <RootStack.Screen
        name="MainTabs"
        component={AppNavigator}  // Le TabNavigator ci-dessus
        options={{ headerShown: false }}
      />

      {/* Ecrans modaux au-dessus des tabs */}
      <RootStack.Group screenOptions={{
        presentation: 'modal',
        animation: 'slide_from_bottom',
      }}>
        <RootStack.Screen name="CreatePost" component={CreatePostScreen} />
        <RootStack.Screen name="ImageViewer" component={ImageViewerScreen} />
      </RootStack.Group>

      {/* Ecrans plein ecran au-dessus des tabs */}
      <RootStack.Group screenOptions={{
        presentation: 'card',
        animation: 'slide_from_right',
      }}>
        <RootStack.Screen name="Settings" component={SettingsScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}
```

### Naviguer entre navigateurs imbriques

```tsx
// Depuis un ecran dans HomeStack, ouvrir une modale du RootStack
navigation.navigate('CreatePost');

// Depuis un ecran dans HomeStack, aller dans le ProfileTab
navigation.navigate('ProfileTab', {
  screen: 'EditProfile',
});

// Navigation profonde : aller dans SearchTab > SearchResults
navigation.navigate('SearchTab', {
  screen: 'SearchResults',
  params: { query: 'react native' },
});
```

---

## Deep linking

### Configuration du deep linking

Le deep linking permet d'ouvrir un ecran specifique via une URL.

```tsx
// navigation/linking.ts
import type { LinkingOptions } from '@react-navigation/native';

const linking: LinkingOptions<RootStackParamList> = {
  // Prefixes d'URL acceptes
  prefixes: [
    'myapp://',                    // URL scheme custom
    'https://myapp.com',           // Universal link (iOS)
    'https://myapp.page.link',     // Dynamic link (Firebase)
  ],

  // Mapping URL -> ecran
  config: {
    screens: {
      MainTabs: {
        screens: {
          HomeTab: {
            screens: {
              HomeList: '',
              HomeDetails: 'item/:id',
            },
          },
          SearchTab: {
            screens: {
              SearchMain: 'search',
              SearchResults: 'search/:query',
            },
          },
          ProfileTab: {
            screens: {
              ProfileMain: 'profile',
              EditProfile: 'profile/edit',
            },
          },
        },
      },
      CreatePost: 'create',
      Settings: 'settings',
    },
  },
};
```

### URL scheme (iOS)

Dans `ios/MyApp/Info.plist` :

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>myapp</string>
    </array>
  </dict>
</array>
```

### URL scheme (Android)

Dans `android/app/src/main/AndroidManifest.xml` :

```xml
<activity
  android:name=".MainActivity"
  android:launchMode="singleTask">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="myapp" />
  </intent-filter>
</activity>
```

### Universal links (iOS) et App Links (Android)

Pour les liens `https://` qui ouvrent l'application :

```tsx
// iOS : apple-app-site-association sur votre serveur
// https://myapp.com/.well-known/apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [{
      "appIDs": ["TEAM_ID.com.myapp"],
      "paths": ["/item/*", "/profile/*", "/search/*"]
    }]
  }
}

// Android : assetlinks.json
// https://myapp.com/.well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.myapp",
    "sha256_cert_fingerprints": ["..."]
  }
}]
```

### Tester le deep linking

```bash
# iOS (simulateur)
npx uri-scheme open myapp://item/42 --ios

# Android (emulateur)
adb shell am start -a android.intent.action.VIEW -d "myapp://item/42"

# Expo
npx expo start --scheme myapp
```

### Parametres dans les URLs

```tsx
// URL: myapp://item/42?tab=reviews&sort=recent
// Configuration:
config: {
  screens: {
    HomeDetails: {
      path: 'item/:id',
      parse: {
        id: (id: string) => parseInt(id, 10),
      },
      // Les query params (?tab=reviews) sont automatiquement
      // ajoutes aux params de la route
    },
  },
},
```

---

## Flux d'authentification

### Pattern recommande

React Navigation recommande un pattern declaratif pour l'authentification :

```tsx
function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator>
      {isLoggedIn ? (
        // Ecrans authentifies
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        // Ecrans non authentifies
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false, animationTypeForReplace: 'pop' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Creer un compte' }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Mot de passe oublie' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
```

### Hook useAuth

```tsx
// hooks/useAuth.ts
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isLoggedIn: false,
  });

  // Verifier le token au demarrage
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem('auth-token');
        if (token) {
          const user = await api.getProfile(token);
          setState({ token, user, isLoading: false, isLoggedIn: true });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    await AsyncStorage.setItem('auth-token', token);
    setState({ token, user, isLoading: false, isLoggedIn: true });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('auth-token');
    setState({ token: null, user: null, isLoading: false, isLoggedIn: false });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const { token, user } = await api.register(data);
    await AsyncStorage.setItem('auth-token', token);
    setState({ token, user, isLoading: false, isLoggedIn: true });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Animation de transition auth

```tsx
<Stack.Screen
  name="Login"
  component={LoginScreen}
  options={{
    // Quand on passe de Login a Home (apres login),
    // l'animation sera un "pop" (retour) au lieu d'un "push"
    animationTypeForReplace: 'pop',
  }}
/>
```

---

## Navigation state persistence

### Sauvegarder et restaurer l'etat

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<any>(undefined);

  useEffect(() => {
    const restoreState = async () => {
      try {
        // Ne restaurer qu'en development
        if (!__DEV__) return;

        const savedState = await AsyncStorage.getItem(PERSISTENCE_KEY);
        if (savedState) {
          setInitialState(JSON.parse(savedState));
        }
      } catch (e) {
        console.warn('Failed to restore navigation state:', e);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) => {
        AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
      }}
    >
      <AppNavigator />
    </NavigationContainer>
  );
}
```

### Cas d'usage

- **Developpement** : reprendre la ou on en etait apres un hot reload
- **Production** : restaurer l'ecran apres un crash ou un kill en arriere-plan
- **Onboarding** : sauvegarder la progression de l'utilisateur

### Precautions

```tsx
// Ne pas restaurer un etat trop ancien
const savedState = await AsyncStorage.getItem(PERSISTENCE_KEY);
if (savedState) {
  const parsed = JSON.parse(savedState);
  const savedAt = parsed._timestamp;
  const isRecent = Date.now() - savedAt < 24 * 60 * 60 * 1000; // 24h
  if (isRecent) {
    setInitialState(parsed);
  }
}

// Sauvegarder avec un timestamp
onStateChange={(state) => {
  const stateWithTimestamp = { ...state, _timestamp: Date.now() };
  AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(stateWithTimestamp));
}}
```

---

## Shared element transitions

### React Navigation 7 (experimental)

React Navigation 7 introduit les shared element transitions pour creer des animations fluides entre ecrans.

```tsx
import { SharedTransition, SharedElement } from '@react-navigation/native-stack';

// Ecran liste
function ProductListScreen({ navigation }) {
  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <Pressable onPress={() => navigation.navigate('Details', { id: item.id })}>
          <SharedElement id={`product.${item.id}.image`}>
            <Image source={{ uri: item.image }} style={styles.thumbnail} />
          </SharedElement>
          <SharedElement id={`product.${item.id}.title`}>
            <Text style={styles.title}>{item.title}</Text>
          </SharedElement>
        </Pressable>
      )}
    />
  );
}

// Ecran details
function ProductDetailsScreen({ route }) {
  const { id } = route.params;
  const product = getProduct(id);

  return (
    <ScrollView>
      <SharedElement id={`product.${id}.image`}>
        <Image source={{ uri: product.image }} style={styles.heroImage} />
      </SharedElement>
      <SharedElement id={`product.${id}.title`}>
        <Text style={styles.heroTitle}>{product.title}</Text>
      </SharedElement>
    </ScrollView>
  );
}
```

### Configuration de la transition

```tsx
<Stack.Screen
  name="Details"
  component={ProductDetailsScreen}
  options={{
    animation: 'fade',
    // La shared element transition est automatique
    // quand les SharedElement ont le meme id
  }}
/>
```

### Alternative : react-native-shared-element

Pour React Navigation 6, utilisez la bibliotheque `react-navigation-shared-element` :

```bash
npm install react-navigation-shared-element react-native-shared-element
```

```tsx
import { createSharedElementStackNavigator } from 'react-navigation-shared-element';

const Stack = createSharedElementStackNavigator();

<Stack.Screen
  name="Details"
  component={DetailsScreen}
  sharedElements={(route) => {
    const { id } = route.params;
    return [`product.${id}.image`, `product.${id}.title`];
  }}
/>
```

---

## Exemple pratique : application complete

### Architecture de navigation

```
RootStack (Native Stack)
  ├── AuthStack (si non connecte)
  │     ├── Login
  │     ├── Register
  │     └── ForgotPassword
  │
  ├── MainTabs (si connecte)
  │     ├── HomeTab (Stack)
  │     │     ├── HomeList
  │     │     └── HomeDetails
  │     ├── SearchTab (Stack)
  │     │     ├── SearchMain
  │     │     └── SearchResults
  │     └── ProfileTab (Stack)
  │           ├── ProfileMain
  │           ├── EditProfile
  │           └── Settings
  │
  └── Modals (Group)
        ├── CreatePost
        └── ImageViewer
```

### Types complets

```tsx
// types/navigation.ts
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string };
};

// Home Stack (dans les tabs)
export type HomeStackParamList = {
  HomeList: undefined;
  HomeDetails: { id: number; title: string };
};

// Search Stack
export type SearchStackParamList = {
  SearchMain: undefined;
  SearchResults: { query: string };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

// Tab Navigator
export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<TabParamList>;
  CreatePost: undefined;
  ImageViewer: { imageUrl: string };
};

// Props composites pour les ecrans dans les tabs
export type HomeListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'HomeList'>,
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList, 'HomeTab'>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

// Typage global
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

### Deep linking complet

```tsx
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      MainTabs: {
        screens: {
          HomeTab: {
            screens: {
              HomeList: '',
              HomeDetails: 'item/:id',
            },
          },
          SearchTab: {
            screens: {
              SearchMain: 'search',
              SearchResults: 'search/:query',
            },
          },
          ProfileTab: {
            screens: {
              ProfileMain: 'profile',
              EditProfile: 'profile/edit',
              Settings: 'settings',
            },
          },
        },
      },
      CreatePost: 'create',
      ImageViewer: 'image',
    },
  },
};
```

### Navigateur racine complet

```tsx
// navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <RootStack.Screen name="MainTabs" component={TabNavigator} />
            <RootStack.Group
              screenOptions={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            >
              <RootStack.Screen name="CreatePost" component={CreatePostScreen} />
              <RootStack.Screen name="ImageViewer" component={ImageViewerScreen} />
            </RootStack.Group>
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Patterns avances

### Masquer la tab bar sur certains ecrans

```tsx
// Dans un ecran du HomeStack
function HomeDetailsScreen({ navigation }) {
  React.useLayoutEffect(() => {
    // Masquer la tab bar quand cet ecran est visible
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      // La rendre visible au retour
      navigation.getParent()?.setOptions({
        tabBarStyle: undefined,
      });
    };
  }, [navigation]);

  return (/* ... */);
}

// Alternative plus propre : mettre l'ecran dans le RootStack
// au lieu du HomeStack (au-dessus des tabs)
```

### Naviguer vers un tab specifique au clic

```tsx
// Depuis n'importe quel ecran, ouvrir SearchTab avec une recherche
navigation.navigate('MainTabs', {
  screen: 'SearchTab',
  params: {
    screen: 'SearchResults',
    params: { query: 'react native' },
  },
});
```

### Reset conditionnel apres action

```tsx
// Apres avoir cree un post, revenir au HomeTab et rafraichir
navigation.reset({
  index: 0,
  routes: [
    {
      name: 'MainTabs',
      state: {
        routes: [
          {
            name: 'HomeTab',
            state: {
              routes: [{ name: 'HomeList' }],
            },
          },
        ],
      },
    },
  ],
});
```

---

## Erreurs courantes

### 1. Double header

```tsx
// Probleme : le TabNavigator ET le Stack ont chacun un header
// Solution : desactiver le header du Tab pour les ecrans avec stack
<Tab.Screen
  name="HomeTab"
  component={HomeStackNavigator}
  options={{ headerShown: false }}  // Le stack gere le header
/>
```

### 2. Deep linking qui ne fonctionne pas

```tsx
// Verifier que les prefixes correspondent exactement
// Verifier que la config de screens correspond a la hierarchie des navigateurs
// Tester avec : npx uri-scheme open "myapp://item/42" --ios
```

### 3. Typage des navigateurs imbriques

```tsx
// Utiliser NavigatorScreenParams pour les ecrans qui contiennent un navigateur
type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;  // Correct
  // MainTabs: undefined;  // Incorrect — perd le typage des tabs
};

// Utiliser CompositeScreenProps pour les ecrans profondement imbriques
type HomeListProps = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'HomeList'>,
  BottomTabScreenProps<TabParamList>
>;
```

### 4. Etat de navigation stale

```tsx
// Le deep linking peut creer un etat stale si l'ecran parent n'est pas charge
// Solution : utiliser navigation.reset au lieu de navigate pour les deep links complexes
```

---

## Recapitulatif

| Concept | Cle |
|---------|-----|
| Bottom Tabs | `createBottomTabNavigator`, icones, badges |
| Drawer | `createDrawerNavigator`, contenu personnalise |
| Imbrication | Stack dans Tabs, Modal au-dessus des Tabs |
| Deep linking | `prefixes` + `config.screens`, URL scheme + universal links |
| Auth flow | Ecrans conditionnels basees sur `isLoggedIn` |
| Persistence | `initialState` + `onStateChange` avec AsyncStorage |
| Shared transitions | `SharedElement` avec id commun entre ecrans |
| Types imbriques | `NavigatorScreenParams`, `CompositeScreenProps` |

---

**Prochain module** : [Module 10 — Gestion d'etat : Context et Zustand](./10-gestion-etat-context-zustand.md)
