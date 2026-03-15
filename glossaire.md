# Glossaire React Native

**Animated API** — API declarative de React Native pour créer des animations fluides (timing, spring, decay) executees sur le thread natif.

**AsyncStorage** — Système de stockage clé-valeur asynchrone, persistant et non chiffre pour React Native. Alternative : MMKV.

**Babel** — Transpileur JavaScript utilise par Metro pour convertir JSX et les syntaxes modernes en code compatible.

**Bridge** — Mécanisme de communication asynchrone entre le thread JS et les threads natifs dans l'ancienne architecture React Native. Serialise les messages en JSON.

**Bridgeless Mode** — Mode de la New Architecture qui elimine le Bridge au profit de JSI pour une communication directe et synchrone.

**Codegen** — Outil de génération de code de React Native qui produit du code natif type-safe à partir des specs TypeScript des Turbo Modules et Fabric Components.

**Compound Component** — Pattern de composition ou un composant parent expose des sous-composants (ex: `Select` + `Select.Option`).

**Context API** — Mécanisme React pour partager des valeurs dans l'arbre de composants sans props drilling.

**Detox** — Framework de tests end-to-end pour React Native, développé par Wix. Teste sur de vrais appareils/emulateurs.

**EAS (Expo Application Services)** — Suite d'outils cloud d'Expo pour builder, déployer et mettre a jour les apps React Native.

**EAS Build** — Service cloud pour compiler les binaires iOS et Android sans machine locale.

**EAS Submit** — Service pour soumettre automatiquement les builds a l'App Store et au Play Store.

**EAS Update** — Service de mises a jour OTA (Over-The-Air) pour déployer du code JS sans passer par les stores.

**Expo** — Framework et plateforme pour React Native qui simplifie le développement, le build et le déploiement.

**Expo Router** — Système de navigation file-based pour React Native inspire de Next.js.

**Fabric** — Nouveau système de rendu de React Native (New Architecture) qui remplace le UIManager. Supporte le rendu concurrent et synchrone.

**Fastlane** — Outil d'automatisation pour le build, le signing et le déploiement d'apps mobiles iOS et Android.

**FlatList** — Composant de liste virtualisee performant de React Native. Rend uniquement les items visibles.

**FlashList** — Alternative performante a FlatList par Shopify. Recycle les cellules pour de meilleures performances.

**Flexbox** — Système de layout utilise par React Native. Similaire au CSS Flexbox mais avec `flexDirection: 'column'` par defaut.

**Gesture Handler** — Bibliotheque (`react-native-gesture-handler`) pour gérer les gestes tactiles de manière performante sur le thread natif.

**Hermes** — Moteur JavaScript optimise pour React Native, développé par Meta. Compile en bytecode pour un démarrage rapide.

**HMR (Hot Module Replacement)** — Rechargement a chaud du code modifie sans perdre l'état de l'application.

**JSI (JavaScript Interface)** — Interface C++ permettant au code JavaScript d'appeler directement du code natif sans passer par le Bridge.

**KeyboardAvoidingView** — Composant qui ajuste sa position quand le clavier apparait pour éviter que les inputs soient masques.

**LayoutAnimation** — API simple pour animer automatiquement les changements de layout lors du prochain render.

**Linking** — API pour gérer les deep links (URL scheme et universal links) dans React Native.

**Metro** — Bundler JavaScript utilise par React Native. Compile et sert le code JS pour le runtime.

**MMKV** — Stockage clé-valeur ultra-rapide (10x AsyncStorage) base sur mmap, développé par Tencent.

**Native Module** — Module écrit en code natif (Swift/Kotlin) expose au JavaScript via le Bridge ou JSI.

**NavigationContainer** — Composant racine de React Navigation qui géré l'état de navigation et le linking.

**New Architecture** — Refonte majeure de React Native comprenant JSI, Fabric, Turbo Modules et le mode Bridgeless.

**OTA (Over-The-Air)** — Méthode de mise a jour qui envoie du code JavaScript directement aux appareils sans passer par les stores.

**PanResponder** — API bas niveau de React Native pour gérer les gestes tactiles. Preferer Gesture Handler en pratique.

**Pressable** — Composant moderne de React Native pour gérer les interactions tactiles (remplace TouchableOpacity).

**Props Drilling** — Anti-pattern ou des props sont passees a travers de nombreux niveaux de composants intermédiaires.

**React Navigation** — Bibliotheque de navigation la plus populaire pour React Native. Supporte stack, tabs, drawer.

**React Native Testing Library (RNTL)** — Bibliotheque de test qui encourage les tests centres sur le comportement utilisateur plutot que l'implementation.

**Reanimated** — Bibliotheque d'animation avancee (`react-native-reanimated`) qui exécuté les animations sur le thread UI via des worklets.

**Render Props** — Pattern ou un composant recoit une fonction comme prop pour déléguer le rendu.

**SafeAreaView** — Composant qui géré les zones de sécurité (notch, barre de statut, home indicator).

**SectionList** — Variante de FlatList avec support des sections et headers de section.

**Shadow Thread** — Thread dedie au calcul du layout (Yoga) dans l'architecture React Native.

**Shared Value** — Valeur partagee entre le thread JS et le thread UI dans Reanimated (useSharedValue).

**StyleSheet** — API pour créer des styles optimises dans React Native. Les styles sont valides à la création.

**TanStack Query (React Query)** — Bibliotheque de gestion de l'état serveur : cache, revalidation, mutations, pagination.

**Turbo Modules** — Remplacement des Native Modules dans la New Architecture. Utilise JSI pour une communication synchrone et type-safe.

**UI Thread** — Thread principal natif qui géré le rendu et les interactions utilisateur.

**useAnimatedStyle** — Hook Reanimated pour créer des styles dynamiques qui s'executent sur le thread UI.

**useSharedValue** — Hook Reanimated pour créer une valeur partagee entre les threads JS et UI.

**VirtualizedList** — Composant de base dont heritent FlatList et SectionList. Gere la virtualisation des listes longues.

**Worklet** — Fonction JavaScript executee sur le thread UI par Reanimated, permettant des animations a 60fps.

**Yoga** — Moteur de layout cross-platform développé par Meta, implementant Flexbox pour React Native.

**Zustand** — Bibliotheque de state management legere et performante, alternative populaire a Redux dans l'ecosysteme React Native.
