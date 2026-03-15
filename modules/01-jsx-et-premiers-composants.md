# Module 01 : JSX et premiers composants

| Metadata | Valeur |
|----------|--------|
| **Difficulte** | 1/5 |
| **Duree** | 60 min |
| **Prérequis** | [Module 00 — Prérequis et introduction](/modules/00-prerequis-et-introduction) |
| **Lab** | [Lab 01 — JSX et composants](/labs/lab-01-jsx-composants/) |
| **Quiz** | [Quiz 01 — JSX et composants](/quizzes/quiz-01-jsx-composants.html) |

---

## Objectifs du module

- Maîtriser la syntaxe JSX et ses particularites en React Native
- Connaître les composants de base : View, Text, Image, ScrollView, SafeAreaView
- Créer des composants fonctionnels bien structures
- Composer des interfaces en imbriquant des composants
- Decouvrir les bases du styling avec StyleSheet
- Éviter les erreurs frequentes des débutants

---

## 1. JSX : JavaScript + XML

### 1.1 Qu'est-ce que le JSX ?

JSX est une extension syntaxique de JavaScript qui ressemble a du HTML mais produit des objets JavaScript. En React Native, le JSX est **transforme en appels a `React.createElement()`** par le compilateur.

```typescript
// Ce que vous ecrivez (JSX)
<View style={{ padding: 16 }}>
  <Text>Bonjour</Text>
</View>

// Ce que le compilateur produit
React.createElement(
  View,
  { style: { padding: 16 } },
  React.createElement(Text, null, 'Bonjour')
);

// Ce qui est envoye au renderer natif
{
  type: 'RCTView',   // → UIView (iOS) / android.view.View (Android)
  props: { style: { padding: 16 } },
  children: [
    {
      type: 'RCTText',  // → UILabel (iOS) / TextView (Android)
      props: {},
      children: ['Bonjour']
    }
  ]
}
```

### 1.2 Regles du JSX

```typescript
// Regle 1 : Un seul element racine
// ❌ Erreur
return (
  <Text>Ligne 1</Text>
  <Text>Ligne 2</Text>
);

// ✅ Wrapper avec View
return (
  <View>
    <Text>Ligne 1</Text>
    <Text>Ligne 2</Text>
  </View>
);

// ✅ Fragment (pas de noeud supplementaire dans l'arbre)
return (
  <>
    <Text>Ligne 1</Text>
    <Text>Ligne 2</Text>
  </>
);

// Regle 2 : Fermer toutes les balises
// ❌ <Image src="photo.jpg">
// ✅ <Image source={{ uri: 'photo.jpg' }} />

// Regle 3 : camelCase pour les attributs
// ❌ <View background-color="red">
// ✅ <View style={{ backgroundColor: 'red' }}>

// Regle 4 : className n'existe pas
// ❌ <View className="container">
// ✅ <View style={styles.container}>
```

### 1.3 Expressions JavaScript dans le JSX

Tout ce qui est entre `{}` est évalué comme du JavaScript :

```typescript
function UserGreeting() {
  const name = 'Alice';
  const age = 30;
  const now = new Date();

  return (
    <View style={styles.container}>
      {/* Variable */}
      <Text>Bonjour {name} !</Text>

      {/* Expression */}
      <Text>Age : {age} ans (ne en {now.getFullYear() - age})</Text>

      {/* Template literal */}
      <Text>{`${name} a ${age} ans`}</Text>

      {/* Calcul */}
      <Text>Score : {42 * 2 + 16}</Text>

      {/* Appel de fonction */}
      <Text>Nom majuscule : {name.toUpperCase()}</Text>

      {/* Ternaire */}
      <Text>{age >= 18 ? 'Majeur' : 'Mineur'}</Text>
    </View>
  );
}
```

### 1.4 Rendu conditionnel

Plusieurs patterns pour afficher ou masquer des éléments :

```typescript
interface UserCardProps {
  name: string;
  isPremium: boolean;
  avatar?: string;
  unreadCount: number;
  role: 'user' | 'admin' | 'moderator';
}

function UserCard({ name, isPremium, avatar, unreadCount, role }: UserCardProps) {
  return (
    <View style={styles.card}>
      {/* Pattern 1 : Ternaire (si/sinon) */}
      {isPremium ? (
        <Text style={styles.badge}>Premium</Text>
      ) : (
        <Text style={styles.badge}>Gratuit</Text>
      )}

      {/* Pattern 2 : && (si seulement) */}
      {avatar && (
        <Image source={{ uri: avatar }} style={styles.avatar} />
      )}

      <Text style={styles.name}>{name}</Text>

      {/* Pattern 3 : && avec nombre — ATTENTION au piege ! */}
      {/* ❌ Danger : si unreadCount = 0, affiche "0" */}
      {unreadCount && <Text>{unreadCount} messages</Text>}

      {/* ✅ Correct : convertir en boolean */}
      {unreadCount > 0 && <Text>{unreadCount} messages</Text>}

      {/* Pattern 4 : Variable intermediaire */}
      {(() => {
        switch (role) {
          case 'admin': return <Text style={styles.roleAdmin}>Admin</Text>;
          case 'moderator': return <Text style={styles.roleMod}>Moderateur</Text>;
          default: return <Text style={styles.roleUser}>Utilisateur</Text>;
        }
      })()}

      {/* Pattern 5 : Extraction dans une fonction (prefere) */}
      {renderRoleBadge(role)}
    </View>
  );
}

function renderRoleBadge(role: string) {
  const config: Record<string, { label: string; color: string }> = {
    admin: { label: 'Admin', color: '#e74c3c' },
    moderator: { label: 'Moderateur', color: '#f39c12' },
    user: { label: 'Utilisateur', color: '#3498db' },
  };
  const { label, color } = config[role] ?? config.user;
  return <Text style={{ color, fontWeight: 'bold' }}>{label}</Text>;
}
```

### 1.5 Rendu de listes avec map()

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

function ProductList() {
  const products: Product[] = [
    { id: '1', name: 'iPhone 15', price: 999, inStock: true },
    { id: '2', name: 'Galaxy S24', price: 899, inStock: true },
    { id: '3', name: 'Pixel 8', price: 699, inStock: false },
    { id: '4', name: 'OnePlus 12', price: 799, inStock: true },
  ];

  return (
    <ScrollView style={styles.list}>
      <Text style={styles.title}>
        {products.length} produits ({products.filter(p => p.inStock).length} en stock)
      </Text>

      {products
        .filter(product => product.inStock)
        .map(product => (
          // ⚠️ key est OBLIGATOIRE pour les listes
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>{product.price} EUR</Text>
          </View>
        ))}

      {products.filter(p => !p.inStock).length > 0 && (
        <Text style={styles.outOfStock}>
          {products.filter(p => !p.inStock).length} produit(s) en rupture
        </Text>
      )}
    </ScrollView>
  );
}
```

::: warning Pourquoi la prop `key` ?
React utilise `key` pour identifier chaque élément d'une liste. Sans `key` (où avec `key={index}`), React ne peut pas optimiser les mises a jour et peut produire des bugs visuels.

Utilisez toujours un identifiant **unique et stable** (`id`, `slug`, etc.), jamais l'index du tableau.
:::

### 1.6 Exercice pratique : liste dynamique

```typescript
// Donnees de contacts
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  favorite: boolean;
}

const contacts: Contact[] = [
  { id: '1', firstName: 'Alice', lastName: 'Martin', phone: '06 12 34 56 78', favorite: true },
  { id: '2', firstName: 'Bob', lastName: 'Dupont', phone: '06 98 76 54 32', favorite: false },
  { id: '3', firstName: 'Claire', lastName: 'Bernard', phone: '06 55 44 33 22', favorite: true },
  { id: '4', firstName: 'David', lastName: 'Petit', phone: '06 11 22 33 44', favorite: false },
];

function ContactList() {
  const favorites = contacts.filter(c => c.favorite);
  const others = contacts.filter(c => !c.favorite);

  return (
    <ScrollView style={styles.container}>
      {favorites.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Favoris</Text>
          {favorites.map(contact => (
            <ContactRow key={contact.id} contact={contact} />
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Tous les contacts</Text>
      {others.map(contact => (
        <ContactRow key={contact.id} contact={contact} />
      ))}
    </ScrollView>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  const initials = contact.firstName[0] + contact.lastName[0];

  return (
    <View style={styles.contactRow}>
      <View style={styles.initialsCircle}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>
          {contact.firstName} {contact.lastName}
        </Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
      </View>
      {contact.favorite && (
        <Text style={styles.star}>★</Text>
      )}
    </View>
  );
}
```

---

## 2. Composants de base React Native

### 2.1 View — le conteneur universel

`View` est le composant le plus fondamental. Il remplace `<div>` du web.

```typescript
import { View, StyleSheet } from 'react-native';

// View supporte :
// - Tous les styles Flexbox
// - Couleur de fond, bordures, ombres
// - Gestion des evenements tactiles (onLayout, onStartShouldSetResponder)
// - Accessibilite (accessible, accessibilityLabel)

function LayoutExample() {
  return (
    <View style={styles.container}>
      {/* Row layout */}
      <View style={styles.row}>
        <View style={[styles.box, { backgroundColor: '#e74c3c' }]} />
        <View style={[styles.box, { backgroundColor: '#3498db' }]} />
        <View style={[styles.box, { backgroundColor: '#2ecc71' }]} />
      </View>

      {/* Nested layout */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.dot} />
          <View style={[styles.dot, { backgroundColor: '#f39c12' }]} />
          <View style={[styles.dot, { backgroundColor: '#2ecc71' }]} />
        </View>
        <View style={styles.cardBody}>
          {/* Contenu */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  box: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#16213e',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
  },
  cardBody: {
    padding: 16,
  },
});
```

### 2.2 Text — tout texte doit etre dans Text

C'est la regle n°1 de React Native : **tout texte visible doit etre enveloppe dans `<Text>`**.

```typescript
import { Text, StyleSheet } from 'react-native';

function TextExamples() {
  return (
    <View style={styles.container}>
      {/* Texte simple */}
      <Text style={styles.title}>Titre principal</Text>

      {/* Texte imbrique (heritage de style) */}
      <Text style={styles.paragraph}>
        Ceci est un paragraphe avec du texte{' '}
        <Text style={styles.bold}>en gras</Text> et du texte{' '}
        <Text style={styles.italic}>en italique</Text> et un{' '}
        <Text style={styles.link} onPress={() => console.log('Lien clique')}>
          lien cliquable
        </Text>.
      </Text>

      {/* Nombre de lignes limite */}
      <Text numberOfLines={2} ellipsizeMode="tail" style={styles.truncated}>
        Ce texte est tres long et sera coupe apres deux lignes avec des
        points de suspension a la fin pour indiquer qu'il y a plus de
        contenu a lire mais l'espace est limite.
      </Text>

      {/* Texte selectionnable */}
      <Text selectable style={styles.selectable}>
        Ce texte peut etre selectionne et copie par l'utilisateur.
      </Text>

      {/* Taille adaptative */}
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={styles.adaptive}
      >
        Ce texte reduit automatiquement sa taille pour tenir sur une ligne
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  truncated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  selectable: {
    fontSize: 14,
    color: '#2c3e50',
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  adaptive: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
});
```

### 2.3 Image — affichage d'images

```typescript
import { Image, StyleSheet, View } from 'react-native';

function ImageExamples() {
  return (
    <View style={styles.container}>
      {/* Image distante (URL) */}
      <Image
        source={{ uri: 'https://picsum.photos/200/200' }}
        style={styles.remoteImage}
      />

      {/* Image locale (require) */}
      <Image
        source={require('./assets/logo.png')}
        style={styles.localImage}
      />

      {/* Image avec redimensionnement */}
      <Image
        source={{ uri: 'https://picsum.photos/800/400' }}
        style={styles.coverImage}
        resizeMode="cover"    // cover | contain | stretch | center | repeat
      />

      {/* Image avec placeholder et chargement */}
      <Image
        source={{ uri: 'https://picsum.photos/300/300' }}
        style={styles.roundImage}
        defaultSource={require('./assets/placeholder.png')}
        onLoad={() => console.log('Image chargee')}
        onError={(e) => console.log('Erreur:', e.nativeEvent.error)}
      />

      {/* Image de fond */}
      <ImageBackground
        source={{ uri: 'https://picsum.photos/400/200' }}
        style={styles.backgroundImage}
        imageStyle={{ borderRadius: 12 }}
      >
        <Text style={styles.overlayText}>Texte sur image</Text>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  remoteImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  localImage: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  roundImage: {
    width: 120,
    height: 120,
    borderRadius: 60, // moitie de width/height = cercle
    marginBottom: 12,
  },
  backgroundImage: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  overlayText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
});
```

### 2.4 ScrollView — contenu scrollable

```typescript
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useState } from 'react';

function ScrollViewExample() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simuler un chargement
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {Array.from({ length: 20 }, (_, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.itemText}>Element {i + 1}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ScrollView horizontal
function HorizontalCards() {
  const cards = ['Design', 'Code', 'Test', 'Deploy', 'Monitor'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalContent}
      snapToInterval={220} // snap sur chaque carte
      decelerationRate="fast"
    >
      {cards.map((card, i) => (
        <View key={i} style={styles.horizontalCard}>
          <Text style={styles.cardTitle}>{card}</Text>
          <Text style={styles.cardNumber}>{String(i + 1).padStart(2, '0')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  item: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemText: {
    color: '#fff',
    fontSize: 16,
  },
  horizontalContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalCard: {
    width: 200,
    height: 120,
    backgroundColor: '#0d6efd',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardNumber: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
```

::: warning ScrollView vs FlatList
`ScrollView` rend **tous** ses enfants d'un coup. Pour les longues listes (> 50 éléments), utilisez `FlatList` qui ne rend que les éléments visibles (virtualisation). Nous verrons `FlatList` au module 04.
:::

### 2.5 SafeAreaView — éviter le notch et les barres système

```typescript
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';

// ❌ Sans SafeAreaView — le contenu passe sous le notch
function UnsafeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
      <Text style={{ color: '#fff', fontSize: 20 }}>
        Ce texte est cache sous le notch !
      </Text>
    </View>
  );
}

// ✅ Avec SafeAreaView — le contenu reste visible
function SafeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: '#fff', fontSize: 20 }}>
          Ce texte est bien visible
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ✅ Meilleure option : expo-safe-area-context (plus fiable)
// npx expo install react-native-safe-area-context
import { SafeAreaProvider, SafeAreaView as SafeArea } from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <SafeArea style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, padding: 16 }}>
          <Text>Contenu safe</Text>
        </View>
      </SafeArea>
    </SafeAreaProvider>
  );
}
```

### 2.6 Pressable — zones tactiles modernes

```typescript
import { Pressable, Text, View, StyleSheet } from 'react-native';

function PressableExamples() {
  return (
    <View style={styles.container}>
      {/* Bouton simple */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => console.log('Presse !')}
      >
        {({ pressed }) => (
          <Text style={[styles.buttonText, pressed && { opacity: 0.7 }]}>
            {pressed ? 'Appuye...' : 'Appuyer ici'}
          </Text>
        )}
      </Pressable>

      {/* Bouton avec feedback Android (ripple) */}
      <Pressable
        style={styles.button}
        android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
        onPress={() => console.log('Avec ripple')}
      >
        <Text style={styles.buttonText}>Avec ripple Android</Text>
      </Pressable>

      {/* Zone tactile elargie (hitSlop) */}
      <Pressable
        hitSlop={20}
        onPress={() => console.log('Plus facile a toucher')}
        style={styles.smallButton}
      >
        <Text style={{ color: '#fff', fontSize: 12 }}>Petit bouton</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  button: {
    backgroundColor: '#0d6efd',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#0b5ed7',
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  smallButton: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});
```

---

## 3. Composants fonctionnels

### 3.1 Declaration et export

```typescript
// Pattern 1 : function declaration (recommande)
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text>Profile</Text>
    </View>
  );
}

// Pattern 2 : arrow function (aussi valide)
const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Settings</Text>
    </View>
  );
};
export default SettingsScreen;

// Pattern 3 : composant interne (pas d'export)
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// Pattern 4 : export nomme (pour les composants reutilisables)
export function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}
```

### 3.2 Convention de nommage

```typescript
// ✅ Composants : PascalCase
function UserCard() { ... }
function NavigationBar() { ... }
function ProductListItem() { ... }

// ✅ Fichiers de composants : PascalCase ou kebab-case
// UserCard.tsx ou user-card.tsx

// ✅ Fonctions utilitaires : camelCase
function formatPrice(price: number): string { ... }
function calculateDiscount(price: number, percent: number): number { ... }

// ✅ Constantes : SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// ✅ Types/Interfaces : PascalCase avec suffixe descriptif
interface UserCardProps { ... }
type NavigationRoute = { ... };
```

### 3.3 Structure d'un fichier composant

```typescript
// 1. Imports
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';

// 2. Types
interface ProfileCardProps {
  name: string;
  role: string;
  avatarUrl: string;
  stats: {
    projects: number;
    followers: number;
    stars: number;
  };
  onPress?: () => void;
}

// 3. Composant principal
export default function ProfileCard({
  name,
  role,
  avatarUrl,
  stats,
  onPress,
}: ProfileCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Avatar url={avatarUrl} size={80} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.role}>{role}</Text>
      <StatsRow stats={stats} />
    </Pressable>
  );
}

// 4. Sous-composants (dans le meme fichier si petits)
function Avatar({ url, size }: { url: string; size: number }) {
  return (
    <Image
      source={{ uri: url }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
}

function StatsRow({ stats }: { stats: ProfileCardProps['stats'] }) {
  return (
    <View style={styles.statsRow}>
      <StatItem label="Projets" value={stats.projects} />
      <StatItem label="Followers" value={stats.followers} />
      <StatItem label="Stars" value={stats.stars} />
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// 5. Styles (toujours en bas du fichier)
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  role: {
    fontSize: 14,
    color: '#8892b0',
    marginTop: 4,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
    paddingTop: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4dabf7',
  },
  statLabel: {
    fontSize: 12,
    color: '#8892b0',
    marginTop: 2,
  },
});
```

---

## 4. Composition de composants

### 4.1 Imbrication et children

```typescript
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

// Composant container generique
interface CardProps {
  children: ReactNode;
  title?: string;
  style?: ViewStyle;
}

function Card({ children, title, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}
      {children}
    </View>
  );
}

// Composant Section avec header et contenu
interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightAction?: ReactNode;
}

function Section({ title, subtitle, children, rightAction }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
        {rightAction}
      </View>
      {children}
    </View>
  );
}

// Utilisation composee
function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <Section
        title="Statistiques"
        subtitle="Derniers 30 jours"
        rightAction={
          <Pressable onPress={() => console.log('Voir tout')}>
            <Text style={styles.link}>Voir tout</Text>
          </Pressable>
        }
      >
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>1,234</Text>
            <Text style={styles.statLabel}>Visiteurs</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>56</Text>
            <Text style={styles.statLabel}>Commandes</Text>
          </Card>
        </View>
      </Section>

      <Section title="Activite recente">
        <Card title="Nouvelle commande">
          <Text style={styles.cardText}>Commande #1234 — 89.99 EUR</Text>
        </Card>
        <Card title="Inscription">
          <Text style={styles.cardText}>Alice Martin s'est inscrite</Text>
        </Card>
      </Section>
    </ScrollView>
  );
}
```

### 4.2 Pattern "Slots" (zones nommees)

```typescript
interface PageLayoutProps {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
}

function PageLayout({ header, children, footer, sidebar }: PageLayoutProps) {
  return (
    <SafeAreaView style={styles.page}>
      {/* Header fixe en haut */}
      <View style={styles.header}>{header}</View>

      {/* Corps avec sidebar optionnelle */}
      <View style={styles.body}>
        {sidebar && <View style={styles.sidebar}>{sidebar}</View>}
        <ScrollView style={styles.mainContent}>
          {children}
        </ScrollView>
      </View>

      {/* Footer fixe en bas */}
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  );
}

// Utilisation
function HomeScreen() {
  return (
    <PageLayout
      header={
        <View style={styles.headerContent}>
          <Text style={styles.logo}>MonApp</Text>
          <Pressable onPress={() => {}}>
            <Text>Menu</Text>
          </Pressable>
        </View>
      }
      footer={
        <View style={styles.tabBar}>
          <Text>Accueil</Text>
          <Text>Recherche</Text>
          <Text>Profil</Text>
        </View>
      }
    >
      <Text style={styles.welcomeText}>Bienvenue !</Text>
      {/* Contenu principal */}
    </PageLayout>
  );
}
```

### 4.3 Composants de liste réutilisables

```typescript
// Composant Avatar reutilisable
interface AvatarProps {
  uri?: string;
  name: string;
  size?: 'small' | 'medium' | 'large';
}

const avatarSizes = { small: 32, medium: 48, large: 72 };

function Avatar({ uri, name, size = 'medium' }: AvatarProps) {
  const dimension = avatarSizes[size];
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: dimension * 0.4, fontWeight: 'bold' }}>
        {initials}
      </Text>
    </View>
  );
}

// Composant ListItem generique
interface ListItemProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
}

function ListItem({ title, subtitle, left, right, onPress }: ListItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.listItem,
        pressed && styles.listItemPressed,
      ]}
      onPress={onPress}
    >
      {left && <View style={styles.listItemLeft}>{left}</View>}
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.listItemRight}>{right}</View>}
    </Pressable>
  );
}

// Utilisation combinee
function MemberList() {
  const members = [
    { id: '1', name: 'Alice Martin', role: 'Admin', avatar: 'https://i.pravatar.cc/100?img=1' },
    { id: '2', name: 'Bob Dupont', role: 'Editeur' },
    { id: '3', name: 'Claire Bernard', role: 'Lecteur', avatar: 'https://i.pravatar.cc/100?img=3' },
  ];

  return (
    <View>
      {members.map(member => (
        <ListItem
          key={member.id}
          title={member.name}
          subtitle={member.role}
          left={<Avatar uri={member.avatar} name={member.name} size="medium" />}
          right={<Text style={{ color: '#4dabf7' }}>→</Text>}
          onPress={() => console.log('Selected:', member.name)}
        />
      ))}
    </View>
  );
}
```

---

## 5. Bases du styling

### 5.1 StyleSheet.create

```typescript
import { StyleSheet } from 'react-native';

// ✅ StyleSheet.create optimise les styles
// Les objets sont valides une fois, puis utilises par reference
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  // Proprietes disponibles (selection) :
  // Layout : flex, flexDirection, justifyContent, alignItems, padding, margin, width, height
  // Visuels : backgroundColor, borderRadius, borderWidth, borderColor, opacity
  // Texte : fontSize, fontWeight, fontStyle, color, textAlign, lineHeight, letterSpacing
  // Ombres (iOS) : shadowColor, shadowOffset, shadowOpacity, shadowRadius
  // Ombres (Android) : elevation
  // Transforms : transform: [{ translateX: 10 }, { rotate: '45deg' }, { scale: 1.5 }]
});

// Inline styles — OK pour des valeurs dynamiques
<View style={{ backgroundColor: isActive ? '#0d6efd' : '#6c757d' }} />

// Combinaison de styles (array)
<View style={[styles.container, styles.centered, { marginTop: 20 }]} />

// Styles conditionnels
<Text style={[
  styles.text,
  isError && styles.errorText,
  isDisabled && { opacity: 0.5 },
]} />
```

### 5.2 Differences avec le CSS web

```typescript
// CSS web → React Native
// ──────────────────────

// Noms camelCase
// background-color → backgroundColor
// font-size → fontSize
// border-radius → borderRadius
// text-align → textAlign
// flex-direction → flexDirection

// Pas d'unites — tout est en "density-independent pixels"
// ❌ fontSize: '16px'
// ✅ fontSize: 16

// Pourcentages en string
// ❌ width: 50%
// ✅ width: '50%'

// flexDirection par defaut est 'column' (pas 'row')
// position par defaut est 'relative'
// Il n'y a pas de display: 'grid'
// Il n'y a pas de position: 'fixed' (utiliser position: 'absolute')
// Il n'y a pas d'heritage de style sauf dans <Text> imbrique
// border est decompose : borderWidth, borderColor, borderStyle

// Ombres differentes iOS vs Android
const shadowStyles = StyleSheet.create({
  shadow: {
    // iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android
    elevation: 5,
  },
});
```

### 5.3 Exemple complet : carte produit

```typescript
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

interface ProductCardProps {
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  onPress: () => void;
}

function ProductCard({
  name,
  price,
  originalPrice,
  imageUrl,
  rating,
  reviewCount,
  isNew,
  onPress,
}: ProductCardProps) {
  const discount = originalPrice
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.productCard,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      onPress={onPress}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.productImage} />
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NOUVEAU</Text>
          </View>
        )}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.ratingRow}>
          <Text style={styles.stars}>
            {'★'.repeat(Math.floor(rating))}
            {'☆'.repeat(5 - Math.floor(rating))}
          </Text>
          <Text style={styles.reviewCount}>({reviewCount})</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{price.toFixed(2)} EUR</Text>
          {originalPrice && (
            <Text style={styles.originalPrice}>
              {originalPrice.toFixed(2)} EUR
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0d6efd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    color: '#f1c40f',
    fontSize: 14,
  },
  reviewCount: {
    color: '#8892b0',
    fontSize: 12,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  originalPrice: {
    fontSize: 14,
    color: '#8892b0',
    textDecorationLine: 'line-through',
  },
});
```

---

## 6. Exemples pratiques complets

### 6.1 Header de navigation

```typescript
interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
}

function Header({ title, showBack, onBack, rightAction }: HeaderProps) {
  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.left}>
        {showBack && (
          <Pressable onPress={onBack} hitSlop={12} style={headerStyles.backButton}>
            <Text style={headerStyles.backIcon}>←</Text>
          </Pressable>
        )}
      </View>

      <Text style={headerStyles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={headerStyles.right}>
        {rightAction}
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
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  left: { width: 48 },
  right: { width: 48, alignItems: 'flex-end' },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 24,
    color: '#4dabf7',
  },
});
```

### 6.2 Footer avec onglets

```typescript
interface TabBarProps {
  tabs: { label: string; icon: string }[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}

function TabBar({ tabs, activeIndex, onTabPress }: TabBarProps) {
  return (
    <View style={tabStyles.container}>
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex;
        return (
          <Pressable
            key={tab.label}
            style={tabStyles.tab}
            onPress={() => onTabPress(index)}
          >
            <Text style={[tabStyles.icon, isActive && tabStyles.activeIcon]}>
              {tab.icon}
            </Text>
            <Text style={[tabStyles.label, isActive && tabStyles.activeLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
    paddingBottom: 20, // pour le home indicator iOS
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  icon: {
    fontSize: 24,
    color: '#8892b0',
    marginBottom: 2,
  },
  activeIcon: {
    color: '#4dabf7',
  },
  label: {
    fontSize: 10,
    color: '#8892b0',
  },
  activeLabel: {
    color: '#4dabf7',
    fontWeight: '600',
  },
});

// Utilisation
function AppWithTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { label: 'Accueil', icon: '🏠' },
    { label: 'Recherche', icon: '🔍' },
    { label: 'Favoris', icon: '❤️' },
    { label: 'Profil', icon: '👤' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Contenu selon l'onglet actif */}
        <Text>Onglet {tabs[activeTab].label}</Text>
      </View>
      <TabBar tabs={tabs} activeIndex={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
```

### 6.3 Ecran de profil complet

```typescript
import { ScrollView, View, Text, Image, Pressable, StyleSheet, SafeAreaView } from 'react-native';

interface UserProfile {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  stats: { posts: number; followers: number; following: number };
  isFollowing: boolean;
}

function ProfileScreen() {
  const user: UserProfile = {
    name: 'Alice Martin',
    username: '@alice_dev',
    bio: 'Developpeuse mobile passionnee. React Native & TypeScript. Open source contributor.',
    avatarUrl: 'https://i.pravatar.cc/200?img=68',
    coverUrl: 'https://picsum.photos/800/300',
    stats: { posts: 142, followers: 12400, following: 891 },
    isFollowing: false,
  };

  return (
    <SafeAreaView style={profileStyles.safe}>
      <ScrollView style={profileStyles.container}>
        {/* Cover */}
        <Image source={{ uri: user.coverUrl }} style={profileStyles.cover} />

        {/* Avatar (chevauche le cover) */}
        <View style={profileStyles.avatarContainer}>
          <Image source={{ uri: user.avatarUrl }} style={profileStyles.avatar} />
        </View>

        {/* Info */}
        <View style={profileStyles.info}>
          <Text style={profileStyles.name}>{user.name}</Text>
          <Text style={profileStyles.username}>{user.username}</Text>
          <Text style={profileStyles.bio}>{user.bio}</Text>

          {/* Actions */}
          <View style={profileStyles.actions}>
            <Pressable style={profileStyles.followButton}>
              <Text style={profileStyles.followText}>
                {user.isFollowing ? 'Suivi' : 'Suivre'}
              </Text>
            </Pressable>
            <Pressable style={profileStyles.messageButton}>
              <Text style={profileStyles.messageText}>Message</Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View style={profileStyles.statsRow}>
            <View style={profileStyles.stat}>
              <Text style={profileStyles.statValue}>{user.stats.posts}</Text>
              <Text style={profileStyles.statLabel}>Posts</Text>
            </View>
            <View style={profileStyles.stat}>
              <Text style={profileStyles.statValue}>
                {user.stats.followers >= 1000
                  ? `${(user.stats.followers / 1000).toFixed(1)}k`
                  : user.stats.followers}
              </Text>
              <Text style={profileStyles.statLabel}>Followers</Text>
            </View>
            <View style={profileStyles.stat}>
              <Text style={profileStyles.statValue}>{user.stats.following}</Text>
              <Text style={profileStyles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Posts placeholder */}
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={profileStyles.postCard}>
            <Text style={profileStyles.postTitle}>Post #{i + 1}</Text>
            <Text style={profileStyles.postPreview}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
            <Text style={profileStyles.postMeta}>Il y a {i + 1}h — 12 likes</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const profileStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a1a2e' },
  container: { flex: 1 },
  cover: { width: '100%', height: 180 },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#1a1a2e',
  },
  info: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  username: { fontSize: 14, color: '#8892b0', marginTop: 2 },
  bio: {
    fontSize: 14,
    color: '#c0c0c0',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  followButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  messageButton: {
    borderWidth: 1,
    borderColor: '#4dabf7',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageText: { color: '#4dabf7', fontWeight: '600', fontSize: 14 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#8892b0', marginTop: 2 },
  postCard: {
    backgroundColor: '#16213e',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
  },
  postTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  postPreview: { fontSize: 14, color: '#c0c0c0', lineHeight: 20 },
  postMeta: { fontSize: 12, color: '#8892b0', marginTop: 8 },
});
```

---

## 7. Erreurs courantes et solutions

### 7.1 Texte en dehors de Text

```typescript
// ❌ CRASH: "Text strings must be rendered within a <Text> component"
<View>
  Bonjour le monde
</View>

// ❌ CRASH aussi avec des espaces/retours a la ligne accidentels
<View>
  {' '}
  <Text>OK</Text>
</View>

// ✅ Correct
<View>
  <Text>Bonjour le monde</Text>
</View>
```

### 7.2 Utiliser des balises HTML

```typescript
// ❌ Il n'y a PAS de div, span, p, h1, img, input en React Native
<div><p>Hello</p></div>

// ✅ Equivalents React Native
<View><Text>Hello</Text></View>

// Equivalences :
// <div>    → <View>
// <span>   → <Text> (inline via imbrication dans Text)
// <p>      → <Text>
// <h1>     → <Text style={{ fontSize: 32 }}>
// <img>    → <Image>
// <input>  → <TextInput>
// <button> → <Pressable>
// <a>      → <Pressable> + Linking.openURL()
// <ul/li>  → <FlatList> ou <View> + map
// <table>  → <View> avec Flexbox
```

### 7.3 Styles CSS web non supportes

```typescript
// ❌ Pas de CSS grid
<View style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

// ✅ Utiliser Flexbox
<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
  <View style={{ width: '50%' }}>...</View>
  <View style={{ width: '50%' }}>...</View>
</View>

// ❌ Pas de position fixed
<View style={{ position: 'fixed' }}>

// ✅ Utiliser absolute (relatif au parent)
<View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>

// ❌ Pas de box-shadow en string
<View style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>

// ✅ Syntaxe React Native pour les ombres
<View style={{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 4,  // Android
}}>

// ❌ Pas de transition CSS
<View style={{ transition: 'opacity 300ms' }}>

// ✅ Utiliser l'API Animated (module 17)
```

### 7.4 ScrollView dans ScrollView

```typescript
// ❌ Attention : ScrollView vertical dans ScrollView vertical = conflit de scroll
<ScrollView>
  <ScrollView>  {/* Lequel scroll ? */}
    <Text>Contenu</Text>
  </ScrollView>
</ScrollView>

// ✅ Directions differentes OK
<ScrollView>
  <ScrollView horizontal>
    {/* Carousel horizontal dans page verticale */}
  </ScrollView>
</ScrollView>

// ✅ Utiliser nestedScrollEnabled sur Android si necessaire
<ScrollView>
  <ScrollView nestedScrollEnabled>
    <Text>Contenu imbrique</Text>
  </ScrollView>
</ScrollView>
```

---

## 8. Bonnes pratiques

### 8.1 Organisation des fichiers

```
src/
├── components/
│   ├── common/           # Composants reutilisables
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── ListItem.tsx
│   ├── layout/           # Composants de structure
│   │   ├── Header.tsx
│   │   ├── TabBar.tsx
│   │   └── PageLayout.tsx
│   └── screens/          # Ecrans complets
│       ├── HomeScreen.tsx
│       └── ProfileScreen.tsx
├── types/                # Types partages
│   └── index.ts
└── App.tsx
```

### 8.2 Regles de base

1. **Un composant = un fichier** (sauf sous-composants très simples)
2. **Props typees avec interface** — toujours définir les props explicitement
3. **Styles en bas du fichier** via `StyleSheet.create`
4. **Noms descriptifs** — `ProductCard` pas `Card1`
5. **Composants petits et focuses** — si un composant dépasse 150 lignes, le découper
6. **Pas de logique complexe dans le JSX** — extraire dans des fonctions

```typescript
// ❌ Logique complexe dans le JSX
<Text>
  {items.filter(i => i.active).reduce((sum, i) => sum + i.price, 0).toFixed(2)} EUR
</Text>

// ✅ Extraire dans une variable
const total = items
  .filter(i => i.active)
  .reduce((sum, i) => sum + i.price, 0);

<Text>{total.toFixed(2)} EUR</Text>
```

---

## 9. Récapitulatif

| Concept | Detail |
|---------|--------|
| JSX | Extension syntaxique qui compile vers `React.createElement()` |
| `View` | Conteneur de base (remplace `<div>`) |
| `Text` | Obligatoire pour tout texte affiche |
| `Image` | Images locales (`require`) ou distantes (`{ uri }`) |
| `ScrollView` | Zone scrollable (rend tout d'un coup) |
| `SafeAreaView` | Evite le notch et les barres système |
| `Pressable` | Zone tactile avec feedback |
| `key` | Obligatoire sur les éléments de liste |
| `StyleSheet.create` | Styles optimises, camelCase, pas d'unites |
| Fragments `<>...</>` | Grouper sans noeud supplementaire |

---

## Exercice pratique

Completez le [Lab 01](/labs/lab-01-jsx-composants/) pour pratiquer la logique de composants en TypeScript pur.

Puis testez vos connaissances avec le [Quiz 01](/quizzes/quiz-01-jsx-composants.html).

---

## Ressources

- [React Native Core Components](https://reactnative.dev/docs/components-and-apis)
- [View documentation](https://reactnative.dev/docs/view)
- [Text documentation](https://reactnative.dev/docs/text)
- [Image documentation](https://reactnative.dev/docs/image)
- [JSX in Depth](https://react.dev/learn/writing-markup-with-jsx)
- [Conditional Rendering](https://react.dev/learn/conditional-rendering)
- [Rendering Lists](https://react.dev/learn/rendering-lists)

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 01 jsx composants](../screencasts/screencast-01-jsx-composants.md)
2. **Lab** : [lab-01-jsx-composants](../labs/lab-01-jsx-composants/README)
3. **Quiz** : [quiz 01 jsx composants](../quizzes/quiz-01-jsx-composants.html)
:::
