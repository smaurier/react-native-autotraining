# Screencast 01 — Construire une carte profil pas a pas

| Metadata | Valeur |
|----------|--------|
| **Duree** | ~12 min |
| **Module** | [01 — JSX et premiers composants](/modules/01-jsx-et-premiers-composants) |
| **Outils** | VS Code, Emulateur Android/iOS ou Expo Go |

---

## Plan de tournage

### Intro (0:00 - 0:30)
- "Dans ce screencast, on va construire une carte de profil complete étape par étape. On va découvrir View, Text, Image, les styles et la composition de composants."
- Montrer le résultat final (screenshot de la carte profil terminee)

### Partie 1 — Structure de base avec View et Text (0:30 - 2:30)
- Partir d'un `App.tsx` vierge
- Créer la structure de base :
  ```tsx
  export default function App() {
    return (
      <View style={styles.container}>
        <Text>ProfileCard</Text>
      </View>
    );
  }
  ```
- Expliquer : "View remplace div, Text est obligatoire pour tout texte"
- Montrer l'erreur si on met du texte nu dans View (sans Text)
- Ajouter le nom et le role :
  ```tsx
  <Text style={styles.name}>Alice Martin</Text>
  <Text style={styles.role}>Developpeuse Mobile</Text>
  ```
- Styler avec fontSize, fontWeight, color

### Partie 2 — Ajouter une image (2:30 - 4:30)
- Importer Image depuis react-native
- Ajouter un avatar avec une URL :
  ```tsx
  <Image
    source={{ uri: 'https://i.pravatar.cc/150?img=68' }}
    style={styles.avatar}
  />
  ```
- Expliquer la différence : source avec objet URI vs source avec require local
- Styler l'avatar : width, height, borderRadius (cercle = moitie de width)
- Montrer les différents resizeMode : cover, contain, stretch

### Partie 3 — Créer la carte (Card) (4:30 - 6:30)
- Envelopper le contenu dans une View "card" :
  ```tsx
  <View style={styles.card}>
    {/* avatar, nom, role */}
  </View>
  ```
- Styler la carte :
  - backgroundColor, borderRadius, padding
  - alignItems: 'center' pour centrer le contenu
  - Ombres : shadowColor/shadowOffset/shadowOpacity/shadowRadius (iOS) + elevation (Android)
- Montrer la différence iOS vs Android pour les ombres

### Partie 4 — Ajouter les statistiques (6:30 - 8:30)
- Créer une ligne de stats avec flexDirection: 'row' :
  ```tsx
  <View style={styles.statsRow}>
    <View style={styles.stat}>
      <Text style={styles.statValue}>42</Text>
      <Text style={styles.statLabel}>Projets</Text>
    </View>
    {/* ... */}
  </View>
  ```
- Styler avec justifyContent: 'space-around'
- Ajouter un separateur (borderTopWidth)
- Montrer l'importance de flexDirection: 'row' (defaut = column en RN)

### Partie 5 — Extraire des sous-composants (8:30 - 10:30)
- Refactorer : extraire `StatItem` en composant separe :
  ```tsx
  function StatItem({ label, value }: { label: string; value: number }) {
    return (
      <View style={styles.stat}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    );
  }
  ```
- Extraire `Avatar` en composant separe
- Montrer comment typer les props avec une interface
- Utiliser les composants dans ProfileCard :
  ```tsx
  <Avatar url="https://..." size={100} />
  <StatItem label="Projets" value={42} />
  ```
- Expliquer le principe de composition

### Partie 6 — Rendre interactif avec Pressable (10:30 - 11:30)
- Envelopper la carte dans Pressable :
  ```tsx
  <Pressable
    style={({ pressed }) => [
      styles.card,
      pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
    ]}
    onPress={() => console.log('Card pressed!')}
  >
  ```
- Montrer le feedback visuel au press
- Ajouter android_ripple pour Android
- Montrer le log dans le terminal

### Partie 7 — Rendre scrollable (11:30 - 12:00)
- Dupliquer la carte 5 fois pour montrer le scroll
- Remplacer la View racine par ScrollView
- Montrer le scroll fonctionnel
- Mentionner que FlatList sera vu au module 04 pour les longues listes

### Outro (12:00)
- Recapituler les composants vus : View, Text, Image, Pressable, ScrollView
- "On a appris a créer, styler et composer des composants. Dans le prochain module, on va découvrir les props et la communication entre composants."
- Rappeler le Lab 01 et le Quiz 01

---

## Points a montrer visuellement

- [ ] Split screen : VS Code a gauche, emulateur a droite
- [ ] Fast Refresh à chaque modification
- [ ] Erreur "Text strings must be rendered within Text" (et la correction)
- [ ] Différence ombre iOS vs Android (side by side si possible)
- [ ] Feedback Pressable en action
- [ ] Arbre de composants final (schema)

## Code de depart

```tsx
// App.tsx vierge
import { StyleSheet, View, Text } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

## Code final attendu

Le code final correspond a l'exemple "Ecran de profil complet" du module 01, avec les composants Avatar, StatItem et ProfileCard extraits.
