# Screencast 07 — Composants UI avances

## Informations
- **Duree estimee** : 14-16 min
- **Module** : `modules/07-composants-ui-avances.md`
- **Lab associe** : Lab 07
- **Prérequis** : Screencast 06

## Setup
- [ ] VS Code ouvert dans un projet Expo
- [ ] Terminal intégré ouvert
- [ ] Simulateur iOS et emulateur Android lances
- [ ] Fichier `modules/07-composants-ui-avances.md` ouvert

## Script

### [00:00-02:00] Introduction — Au-dela des composants de base

> On a vu les composants fondamentaux. Maintenant, on va construire des composants avances réutilisables : un système de Toast, un BottomSheet anime et un ThemeProvider complet. On va aussi voir l'accessibilité de chaque composant.

**Action** : Montrer l'objectif final — une app avec un theme sombre/clair, des toasts qui apparaissent en haut et un BottomSheet anime.

### [02:00-04:30] Système de Toast

> Un toast, c'est un message ephemere qui apparait pour confirmer une action. Implementons-le avec un Context React.

**Action** : Créer le type et le Context.

```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const ToastContext = createContext<{
  show: (message: string, type?: Toast['type']) => void;
} | null>(null);
```

**Action** : Implementer le `ToastProvider`.

```typescript
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.toastContainer}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}
```

> Insister sur l'accessibilité : chaque toast a `accessibilityRole="alert"` et `accessibilityLiveRegion="polite"`.

**Action** : Tester avec VoiceOver. Montrer que le lecteur d'ecran annonce le toast.

### [04:30-07:00] BottomSheet anime

> Les BottomSheet sont partout dans les apps mobiles. Construisons-en un avec Animated et Modal.

**Action** : Créer le composant `BottomSheet`.

```typescript
function BottomSheet({ visible, onClose, children, height = '50%' }) {
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.sheet, { height, transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
```

> Points importants : onRequestClose pour Android, overlay cliquable pour fermer, animation spring pour un rendu naturel.

**Action** : Ouvrir/fermer le BottomSheet plusieurs fois pour montrer l'animation fluide.

### [07:00-10:00] ThemeProvider et design tokens

> Un theme coherent evite les valeurs magiques dans les styles. Voyons comment construire un ThemeProvider avec Context.

**Action** : Définir les tokens de theme.

```typescript
const lightTheme = {
  colors: {
    primary: '#2196F3',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 4, md: 8, lg: 16 },
};

const darkTheme = {
  ...lightTheme,
  colors: {
    primary: '#64B5F6',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
  },
};
```

**Action** : Créer le ThemeProvider.

```typescript
function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme: () => setIsDark(p => !p) }}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}
```

**Action** : Créer un composant `ThemedCard` qui utilise `useTheme()`.

```typescript
function ThemedCard({ title, subtitle }) {
  const { theme } = useTheme();

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    }}>
      <Text style={{ color: theme.colors.text, fontSize: 18 }}>{title}</Text>
      <Text style={{ color: theme.colors.textSecondary }}>{subtitle}</Text>
    </View>
  );
}
```

> Montrer le toggle entre theme clair et sombre en temps réel.

### [10:00-12:30] Compound Components — Select

> Le pattern Compound Components offre une API très lisible pour les composants complexes.

**Action** : Montrer la différence entre l'API "props array" et l'API compound.

```typescript
// API classique — les donnees sont separees du rendu
<Select options={[{ label: 'FR', value: 'FR' }]} />

// Compound — le JSX est expressif
<Select value={country} onChange={setCountry}>
  <Select.Option value="FR">France</Select.Option>
  <Select.Option value="BE">Belgique</Select.Option>
  <Select.Divider />
  <Select.Option value="CH">Suisse</Select.Option>
</Select>
```

**Action** : Implementer le Select avec Context interne.

```typescript
const SelectContext = createContext(null);

function Select({ value, onChange, children }) {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ value, onChange }}>
      <Pressable onPress={() => setOpen(!open)}>
        <Text>{value || 'Selectionnez...'}</Text>
      </Pressable>
      {open && <View>{children}</View>}
    </SelectContext.Provider>
  );
}

Select.Option = function Option({ value, children }) {
  const { value: selected, onChange } = useContext(SelectContext);
  return (
    <Pressable onPress={() => onChange(value)}>
      <Text style={value === selected ? styles.selected : undefined}>
        {children}
      </Text>
    </Pressable>
  );
};
```

> Insister sur l'accessibilité : accessibilityRole="button" sur le trigger, accessibilityState avec expanded pour l'état ouvert/ferme.

### [12:30-14:00] Accessibilité — les bases essentielles

> Chaque composant interactif DOIT avoir au minimum : accessibilityRole, accessibilityLabel, accessibilityState.

**Action** : Montrer un toggle sans et avec accessibilité.

```typescript
// AVANT (pas accessible)
<Pressable onPress={() => onToggle(!value)}>
  <View style={value ? styles.on : styles.off} />
</Pressable>

// APRES (accessible)
<Pressable
  onPress={() => onToggle(!value)}
  accessibilityRole="switch"
  accessibilityLabel="Mode sombre"
  accessibilityState={{ checked: value }}
>
  <View style={value ? styles.on : styles.off} />
</Pressable>
```

**Action** : Activer VoiceOver/TalkBack et naviguer dans l'app. Montrer la différence d'annonce.

> Sans les props : "Bouton. Appuyez deux fois pour activer."
> Avec les props : "Mode sombre. Bouton a bascule. Active. Appuyez deux fois pour désactiver."

### [14:00-14:30] Recap

> En résumé : Pressable remplace TouchableOpacity, les Toast et BottomSheet se construisent avec Context et Animated, le ThemeProvider garantit la coherence visuelle, Compound Components offre une API flexible, et l'accessibilité est non-negociable. Passez au Lab 07 pour pratiquer.
