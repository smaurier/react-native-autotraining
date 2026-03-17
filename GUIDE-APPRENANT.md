# Guide de l'apprenant -- React Native

> **Ce guide est ta boussole.** Il t'aide a savoir ou tu en es, par ou passer,
> et quoi faire quand tu bloques. Lis-le avant de commencer, et reviens-y regulierement.
>
> **Temps estime** : ~160-220h (4-6 mois a 10-12h/semaine)
>
> **Philosophie** : React Native, ce n'est pas "du React dans un telephone".
> C'est du React qui parle aux composants natifs. Maitriser React Native,
> c'est comprendre la frontiere entre le monde JavaScript et le monde natif,
> et savoir la traverser sans friction.

---

## Avant de commencer -- Auto-diagnostic

Reponds honnetement. Ce n'est pas un examen -- c'est un GPS.

### Prerequis -- le socle

Coche ce que tu sais faire SANS chercher sur Google :
- [ ] Tu as fait le cours React (08) -- tu maitrises les hooks et le state management
- [ ] Tu sais utiliser `useState`, `useEffect`, `useContext`, `useMemo`
- [ ] Tu es a l'aise avec TypeScript
- [ ] Tu sais ce qu'est Flexbox et comment l'utiliser pour le layout
- [ ] Tu as un environnement de dev mobile configure (Xcode ou Android Studio)
- [ ] Tu connais les bases de la navigation mobile (tabs, stack, drawer)

**6/6** -> Tu es pret. Attaque directement le module 00.
**4-5/6** -> Configure ton environnement mobile (ca prend du temps !), puis lance-toi.
**< 4/6** -> Termine d'abord le cours React (08). React Native sans React solide, c'est le mur garanti.

### React Native -- ou en es-tu deja ?

- [ ] Tu as deja cree une app React Native (meme un Hello World)
- [ ] Tu as deja utilise React Navigation
- [ ] Tu connais la difference entre Expo et bare workflow
- [ ] Tu as deja utilise une API native (camera, geolocation)
- [ ] Tu as deja deploye une app sur un store (App Store ou Google Play)

**5/5** -> Tu as de l'experience. Commence a la Phase 3 (module 15) apres avoir verifie le checkpoint Phase 2.
**2-4/5** -> Tu as des bases. Commence au debut, tu iras vite sur la Phase 1.
**0-1/5** -> Parfait, ce cours est concu pour toi. Le module 00 part de zero.

### Le test decisif

On te demande de creer un ecran avec une liste scrollable, un header fixe, et un bouton flottant.
Comment fais-tu ?

- Si tu penses a : `FlatList` pour la performance, `SafeAreaView`, `position: 'absolute'` pour le bouton, et tu sais que `ScrollView` est a eviter pour les longues listes -> tu connais les bases. Verifie la Phase 2.
- Si tu penses a utiliser `<div>` et du CSS -> React Native n'a pas de DOM. Le module 01 t'explique ca.
- Si tu ne sais pas par ou commencer -> pas de panique, c'est exactement ce qu'on va apprendre.

---

## Les 5 phases de ta progression

### Phase 1 -- Bases (modules 00-07) ~35-45h

> **Objectif** : Comprendre React Native, creer des composants, gerer le layout,
> et construire des interfaces responsives multi-plateformes.
>
> **Analogie** : C'est comme apprendre a cuisiner dans une nouvelle cuisine. Les ingredients (React) sont les memes, mais les ustensiles (composants natifs) sont differents.

| Module | Sujet | Temps | Note |
|---|---|---|---|
| 00 | Prerequis et introduction | 2h | Expo vs bare, architecture, setup |
| 01 | JSX et premiers composants | 3h | **Cours cle** -- View, Text, Image, pas de div/span |
| 02 | Props et communication | 3h | Patterns de communication parent/enfant |
| 03 | State et cycle de vie | 3h | **Cours cle** -- state, effects, AppState |
| 04 | Listes et donnees | 3h | `FlatList`, `SectionList`, performances |
| 05 | Stylesheet et Flexbox | 3h | **Cours cle** -- le layout en React Native (pas de CSS grid) |
| 06 | Responsive et plateformes | 3h | `Platform`, dimensions, safe areas |
| 07 | Composants UI avances | 3h | Modal, ActionSheet, composants custom |

**Exercices Phase 1** : Cree une app simple (liste de taches, carnet de contacts)
pour ancrer les bases. Le layout Flexbox est different du web -- pratique beaucoup.

**Checkpoint Phase 1** :
- [ ] Tu sais creer un composant avec `View`, `Text`, `Image` et `TouchableOpacity`
- [ ] Tu sais utiliser `FlatList` pour une liste performante (pas `ScrollView` + `map`)
- [ ] Tu sais faire un layout complet avec Flexbox (`flexDirection`, `justifyContent`, `alignItems`)
- [ ] Tu sais gerer les differences iOS/Android avec `Platform.OS`
- [ ] Tu sais utiliser `SafeAreaView` et gerer les encoches/notches

> **Test** : Pourquoi utiliser `FlatList` au lieu de `ScrollView` avec un `map` ?
> Si tu reponds "FlatList virtualise les elements hors ecran pour economiser la memoire", c'est bon.

---

### Phase 2 -- Navigation et Etat (modules 08-14) ~35-45h

> **Objectif** : Maitriser la navigation (stacks, tabs, drawer),
> le state management, les formulaires, le networking, et le stockage local.
>
> **Analogie** : Ton app a des fondations. Maintenant tu construis les pieces, les couloirs et la plomberie.

| Module | Sujet | Temps | Note |
|---|---|---|---|
| 08 | React Navigation fondamentaux | 3h | **Cours cle** -- Stack, Tab, configuration |
| 09 | Navigation avancee | 3h | Deep linking, auth flow, nested navigators |
| 10 | Gestion d'etat (Context, Zustand) | 3h | State management adapte au mobile |
| 11 | Formulaires et validation | 3h | React Hook Form, clavier, UX mobile |
| 12 | Networking et API | 3h | Fetch, gestion offline, retry |
| 13 | React Query et cache | 3h | **Cours cle** -- cache, revalidation, optimistic updates |
| 14 | Stockage local et offline-first | 3h | AsyncStorage, MMKV, SQLite, sync |

**Conseil** : La navigation (modules 08-09) est le squelette de l'app.
Un mauvais choix de structure de navigation au debut cause des problemes tout au long du projet.
Prends le temps de bien comprendre les nested navigators.

**Checkpoint Phase 2** :
- [ ] Tu sais configurer une navigation Stack + Tabs + Drawer
- [ ] Tu sais implementer un auth flow avec des ecrans proteges
- [ ] Tu sais gerer le state avec Zustand et persister les donnees
- [ ] Tu sais utiliser React Query pour les appels API avec cache
- [ ] Tu sais stocker des donnees localement et gerer le mode offline

> **Test** : L'utilisateur ouvre un lien profond vers un produit. Comment geres-tu ca ?
> Si tu configures le deep linking dans React Navigation avec le bon schema d'URL, c'est bon.

---

### Phase 3 -- APIs natives (modules 15-16) ~12-15h

> **Objectif** : Acceder aux capteurs et APIs du telephone :
> camera, geolocation, notifications push.
>
> **Analogie** : Tu connectes ton app aux sens du telephone -- la vue (camera), la position (GPS), la voix (notifications).

| Module | Sujet | Temps | Note |
|---|---|---|---|
| 15 | APIs natives essentielles | 4h | **Cours cle** -- camera, galerie, geolocation, permissions |
| 16 | Capteurs et notifications | 4h | Accelerometre, gyroscope, push notifications |

**Attention** : Les permissions natives sont differentes sur iOS et Android.
Teste toujours sur les deux plateformes. Les simulateurs ne supportent pas tous les capteurs.

**Checkpoint Phase 3** :
- [ ] Tu sais utiliser la camera et la galerie avec gestion des permissions
- [ ] Tu sais recuperer la geolocation (foreground et background)
- [ ] Tu sais envoyer et recevoir des notifications push
- [ ] Tu sais gerer les permissions de facon gracieuse (demander, expliquer, fallback)
- [ ] Tu sais tester sur un vrai device (pas seulement le simulateur)

> **Test** : L'utilisateur refuse la permission camera. Que fais-tu ?
> Si tu affiches un ecran explicatif et un bouton vers les reglages, c'est bon.

---

### Phase 4 -- Animations (modules 17-18) ~15-20h

> **Objectif** : Maitriser les animations pour une UX native et fluide.
> Animated API, Reanimated, et Gesture Handler.
>
> **Analogie** : Tu donnes vie a ton app. Les animations sont ce qui distingue une app "web dans un telephone" d'une vraie app native.

| Module | Sujet | Temps | Note |
|---|---|---|---|
| 17 | Animated API et layout animations | 4h | L'API de base, LayoutAnimation |
| 18 | Reanimated et Gesture Handler | 5h | **Cours cle** -- animations 60fps sur le thread UI |

**Conseil** : Reanimated (module 18) est puissant mais a une courbe d'apprentissage.
L'idee cle : les animations tournent sur le thread UI natif, pas sur le thread JS.
C'est pour ca qu'elles sont a 60fps meme si le JS est occupe.

**Checkpoint Phase 4** :
- [ ] Tu sais creer une animation avec l'Animated API (spring, timing, sequence)
- [ ] Tu sais utiliser `LayoutAnimation` pour des transitions simples
- [ ] Tu sais utiliser Reanimated pour des animations performantes (worklets, shared values)
- [ ] Tu sais combiner Gesture Handler avec Reanimated (swipe, pinch, drag)
- [ ] Tu comprends pourquoi les animations doivent tourner sur le thread UI

> **Test** : Une animation saccade quand le JS fait un calcul lourd. Pourquoi ?
> Si tu reponds "parce que l'animation tourne sur le thread JS au lieu du thread UI"
> et que tu proposes Reanimated, c'est bon.

---

### Phase 5 -- Expert (modules 19-27) ~50-70h

> **Objectif** : Performance, testing, deploiement, modules natifs,
> nouvelle architecture, et un projet final complet.
>
> **Analogie** : Tu prepares ton app pour le monde reel -- performance, qualite, et distribution.

| Module | Sujet | Temps | Note |
|---|---|---|---|
| 19 | Performance et optimisation | 4h | **Cours cle** -- Flipper, Hermes, optimisation des renders |
| 20 | Testing React Native | 3h | Jest, Testing Library, mocks natifs |
| 21 | Tests E2E (Detox) | 4h | Tests automatises sur simulateur/device |
| 22 | Deploiement et CI/CD | 4h | EAS Build, Fastlane, App Store, Google Play |
| 23 | Modules natifs et Turbo Modules | 4h | Ecrire du code natif (Swift/Kotlin) appele depuis JS |
| 24 | Nouvelle architecture (Fabric, JSI) | 4h | Le nouveau moteur de React Native |
| 25 | Hermes internals | 3h | Le moteur JS optimise pour le mobile |
| 26 | Patterns avances et monorepo | 3h | Architecture a grande echelle |
| 27 | Projet final | 10h+ | App complete de bout en bout |

**Checkpoint Phase 5** :
- [ ] Tu sais profiler une app avec Flipper et identifier les bottlenecks
- [ ] Tu sais tester tes composants et tes flux E2E avec Detox
- [ ] Tu sais deployer une app sur les stores avec une CI/CD
- [ ] Tu sais ecrire un module natif (Turbo Module) pour iOS ou Android
- [ ] Tu as termine le projet final -- une app complete, testee, et deployable

> **Test** : Ton app met 4 secondes a demarrer. Comment diagnostiques-tu ?
> Si tu utilises Flipper/Hermes profiler, cherches les imports lourds, et proposes
> du lazy loading et de l'inline require, c'est bon.

---

## Quand tu bloques

React Native a ses propres frustrations. Voici comment debloquer :

### "L'environnement de dev ne fonctionne pas (build fails)"
1. C'est le probleme numero 1 de React Native. Ne desespere pas
2. Pour iOS : `cd ios && pod install && cd ..` resout 50% des problemes
3. Pour Android : verifie le JDK, le SDK, et les variables d'environnement
4. Expo simplifie enormement le setup -- utilise Expo si possible
5. `npx react-native doctor` detecte les problemes d'environnement

### "Le layout ne fonctionne pas comme sur le web"
1. React Native utilise Flexbox mais `flexDirection` est `column` par defaut (pas `row`)
2. Il n'y a pas de `display: grid`, `float`, `position: fixed`
3. Les dimensions sont en dp (density-independent pixels), pas en px ou em
4. Utilise les DevTools de React Native pour inspecter le layout (comme les DevTools web)

### "Mon app est lente / les animations saccadent"
1. Verifie que tu utilises `FlatList` (pas `ScrollView` + `map`)
2. Verifie que tu ne re-renders pas toute la liste a chaque changement
3. Pour les animations : utilise Reanimated (thread UI) au lieu d'Animated (thread JS)
4. Active Hermes si ce n'est pas fait -- il accelere le demarrage et reduit la memoire

### "Les permissions/APIs natives ne fonctionnent pas sur simulateur"
1. Certaines APIs (camera, push notifications) ne marchent que sur un vrai device
2. Pour la geolocation sur simulateur iOS : Features > Location > Custom Location
3. Pour les permissions Android : verifie `AndroidManifest.xml`
4. Pour les permissions iOS : verifie `Info.plist`

### "La navigation est un cauchemar (nested navigators)"
1. Dessine l'arbre de navigation sur papier AVANT de coder
2. Un Stack dans un Tab dans un Drawer -- c'est l'ordre le plus courant
3. Pour passer des params entre navigators : utilise les types TypeScript pour la safety
4. Le deep linking doit matcher la structure de navigation -- pas l'inverse

### "Je n'arrive pas a faire l'exercice"
1. Verifie que le build fonctionne (`npx expo start` ou `npx react-native run-ios`)
2. Utilise l'inspecteur d'elements de React Native pour debugger le layout
3. Simplifie : fais marcher un seul ecran avant d'ajouter la navigation

---

## Auto-evaluation par phase

Apres chaque phase, pose-toi ces questions. Si tu ne sais pas repondre,
reviens en arriere -- c'est un signe, pas un echec.

**Apres Phase 1** : "Pourquoi React Native n'utilise pas le DOM ?"
-> Si tu reponds "parce qu'il communique avec les composants natifs (UIView, Android.View) via un bridge/JSI", c'est bon.

**Apres Phase 2** : "Comment geres-tu le mode offline dans une app mobile ?"
-> Si tu proposes "stockage local (MMKV/SQLite) + React Query pour le cache + sync quand le reseau revient", c'est bon.

**Apres Phase 3** : "Un utilisateur refuse une permission critique. Que fais-tu ?"
-> Si tu degrades gracieusement (fallback) et affiches un ecran explicatif avec un lien vers les reglages, c'est bon.

**Apres Phase 4** : "Pourquoi Reanimated est plus performant que l'Animated API ?"
-> Si tu expliques que Reanimated execute les animations sur le thread UI natif via des worklets, c'est bon.

---

## Rythme recommande

| Rythme | Par semaine | Duree totale |
|---|---|---|
| **Decouverte** (a cote du boulot) | 4-6h | 7-8 mois |
| **Regulier** (motivation) | 10-12h | 4-5 mois |
| **Intensif** (objectif pro) | 15-20h | 3-4 mois |

### Conseils concrets

- **1 module = 2-3 sessions.** Les modules avec du natif (15-16, 23) prennent plus longtemps.
- **Teste sur un vrai device des que possible.** Le simulateur ment sur les performances et les capteurs.
- **La navigation (08-09) merite une semaine.** C'est le squelette de l'app.
- **Le projet final (27) vaut 3 semaines.** C'est une vraie app mobile de bout en bout.
- **Prepare ton environnement AVANT de commencer.** Le setup iOS/Android prend du temps.

### Quand faire une pause

- Si le build casse pour la 10e fois -> nettoie les caches (`watchman watch-del-all`, `pod install`), respire
- Si les animations saccadent et tu ne sais pas pourquoi -> profile avec Flipper, ne devine pas
- Si le deploiement sur store te frustre -> c'est normal, c'est bureaucratique par nature

---

## Ressources complementaires

### Quand tu veux approfondir
- [React Native Docs](https://reactnative.dev/) -- documentation officielle
- [Expo Docs](https://docs.expo.dev/) -- si tu utilises Expo
- [React Navigation Docs](https://reactnavigation.org/) -- reference pour la navigation
- *React Native in Action* (Nader Dabit) -- bon livre d'introduction

### Quand tu cherches une reponse rapide
- Flipper -- debugger, profiler, inspecter le reseau
- `npx react-native doctor` -- diagnostiquer les problemes d'environnement
- `npx expo start --clear` -- demarrer avec un cache vierge

---

## Et apres ?

Tu as fini les 28 modules ? Tu es un dev React Native complet.

Voici les prochaines etapes :
1. **Publie une app sur les stores** -- rien ne remplace l'experience du vrai deploiement
2. **Explore les modules natifs** -- ecris du Swift/Kotlin pour des besoins specifiques
3. **Combine avec le testing (cours 04)** -- teste ton app mobile comme un pro
4. **Contribue a l'ecosysteme** -- React Native, Expo, ou les libraries de la communaute
