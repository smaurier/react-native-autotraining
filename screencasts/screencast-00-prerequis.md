# Screencast 00 — Installation et premier projet Expo

| Metadata | Valeur |
|----------|--------|
| **Duree** | ~10 min |
| **Module** | [00 — Prérequis et introduction](/modules/00-prerequis-et-introduction) |
| **Outils** | Terminal, VS Code, Expo Go (telephone) |

---

## Plan de tournage

### Intro (0:00 - 0:30)
- "Dans ce screencast, on va installer tout l'environnement React Native avec Expo et lancer notre première application sur un emulateur et un telephone physique."
- Afficher le plan du screencast a l'ecran

### Partie 1 — Vérifier les prérequis (0:30 - 2:00)
- Ouvrir un terminal
- Vérifier Node.js : `node --version` (montrer qu'il faut >= 18)
- Vérifier npm : `npm --version`
- Si Node.js manque, montrer rapidement le site nodejs.org
- Vérifier que `npx` fonctionne : `npx --version`
- Installer Watchman si macOS : `brew install watchman`

### Partie 2 — Créer le projet (2:00 - 4:00)
- Exécuter `npx create-expo-app@latest MonApp --template blank-typescript`
- Pendant que ça installe, expliquer :
  - "Expo créé un projet React Native pre-configure avec TypeScript"
  - "Pas besoin d'Android Studio ou Xcode pour commencer"
- `cd MonApp`
- Explorer la structure dans VS Code :
  - `App.tsx` — point d'entree, montrer le code
  - `app.json` — configuration Expo
  - `package.json` — dépendances (react, react-native, expo)
  - `tsconfig.json` — configuration TypeScript

### Partie 3 — Lancer sur emulateur (4:00 - 6:30)
- `npx expo start`
- Montrer le QR code et les options dans le terminal
- Appuyer sur `a` pour Android (si emulateur disponible)
- Appuyer sur `i` pour iOS (si Xcode disponible)
- Montrer l'application "Hello World" sur l'emulateur
- Modifier le texte dans `App.tsx` : "Bonjour React Native !"
- Montrer le **Fast Refresh** : le changement apparait instantanement

### Partie 4 — Lancer sur telephone physique (6:30 - 8:00)
- Montrer l'application Expo Go sur le telephone
- Scanner le QR code depuis le terminal
- L'application se charge sur le telephone
- Modifier le texte a nouveau pour montrer le Fast Refresh sur device

### Partie 5 — Explorer et modifier (8:00 - 9:30)
- Modifier `App.tsx` pour créer une mini carte :
  ```tsx
  <View style={styles.container}>
    <View style={styles.card}>
      <Text style={styles.title}>Mon premier composant</Text>
      <Text style={styles.subtitle}>React Native + Expo</Text>
    </View>
  </View>
  ```
- Ajouter des styles :
  - `card` : backgroundColor, borderRadius, padding
  - `title` : fontSize, fontWeight, color
  - `subtitle` : fontSize, color
- Montrer le résultat en temps réel

### Partie 6 — Debug basique (9:30 - 10:00)
- Ajouter un `console.log('Hello depuis RN')` dans App.tsx
- Montrer le log dans le terminal
- Appuyer sur `m` dans l'app pour le menu développeur
- Mentionner React DevTools pour plus tard

### Outro (10:00)
- "Vous avez maintenant un environnement fonctionnel. Dans le prochain module, on va découvrir JSX et les composants de base."
- Rappeler de faire le Lab 00 et le Quiz 00

---

## Points a montrer visuellement

- [ ] Terminal avec les commandes
- [ ] VS Code avec la structure du projet
- [ ] Emulateur avec l'application
- [ ] Fast Refresh en action (split screen code + emulateur)
- [ ] QR code Expo pour telephone physique

## Erreurs courantes a anticiper

- Node.js trop ancien → montrer comment mettre a jour
- Port 8081 déjà utilise → `npx expo start --port 8082`
- Emulateur non détecté → vérifier ANDROID_HOME
- Expo Go version incompatible → mettre a jour l'app
