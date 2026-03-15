# Module 07 — Composants UI avances

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 3/5        | 75 min        | [Lab 07](../labs/lab-07-composants-ui-avances/) | [Quiz 07](../quizzes/quiz-07-composants-ui.html) |

## Objectifs

- Maîtriser `Pressable` et ses propriétés avancees
- Migrer de `TouchableOpacity` vers `Pressable`
- Utiliser `Modal` avec les bonnes pratiques
- Gérer les états de chargement avec `ActivityIndicator`
- Adapter le clavier avec `KeyboardAvoidingView`
- Construire des composants réutilisables (BottomSheet, Toast, Chip, Badge, Avatar)
- Implementer le pattern Compound Components
- Créer un système de theme (ThemeProvider, useTheme)
- Intégrer l'accessibilité dans chaque composant

---

## Pressable

### Le composant d'interaction universel

`Pressable` est le composant recommande pour toutes les interactions tactiles. Il remplace `TouchableOpacity`, `TouchableHighlight` et `TouchableWithoutFeedback` :

```typescript
import { Pressable, Text, StyleSheet } from 'react-native';

function BasicButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
    >
      {({ pressed }) => (
        <Text style={[styles.text, pressed && styles.textPressed]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#2196F3',
  },
  buttonPressed: {
    backgroundColor: '#1976D2',
    transform: [{ scale: 0.97 }],
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  textPressed: {
    opacity: 0.9,
  },
});
```

### hitSlop — zone tactile elargie

`hitSlop` agrandit la zone cliquable sans modifier la taille visuelle du composant. Crucial pour les petits éléments (icones, boutons de fermeture) :

```typescript
// La zone tactile est 20pt plus grande de chaque cote
<Pressable
  onPress={onClose}
  hitSlop={20}
  style={styles.closeButton}
>
  <Text style={{ fontSize: 14 }}>✕</Text>
</Pressable>

// Ou avec des valeurs specifiques par cote
<Pressable
  onPress={onPress}
  hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
>
  <Text>Petit texte</Text>
</Pressable>
```

> **Regle d'or** : La cible tactile minimale recommandee est 44x44 points (Apple) ou 48x48 dp (Google). Utilisez `hitSlop` pour atteindre cette taille si le composant visuel est plus petit.

### pressRetentionOffset — tolerance de glissement

`pressRetentionOffset` définit la distance que le doigt peut parcourir hors du bouton avant d'annuler le press :

```typescript
<Pressable
  onPress={onPress}
  pressRetentionOffset={{ top: 30, bottom: 30, left: 30, right: 30 }}
>
  <Text>Bouton tolerant au glissement</Text>
</Pressable>
```

Sans cette prop, le moindre mouvement du doigt hors de la zone annule le press. Avec `pressRetentionOffset`, l'utilisateur à une marge de manoeuvre.

### android_ripple — effet Material Design

```typescript
<Pressable
  onPress={onPress}
  android_ripple={{
    color: 'rgba(0, 0, 0, 0.12)', // Couleur du ripple
    borderless: false,              // false = confine au conteneur
    foreground: true,               // true = par-dessus le contenu (API 28+)
    radius: 100,                    // Rayon du ripple (optionnel)
  }}
  style={styles.button}
>
  <Text>Bouton avec ripple</Text>
</Pressable>
```

### Événements de Pressable

```typescript
<Pressable
  onPress={() => console.log('Tap rapide')}
  onLongPress={() => console.log('Appui long (500ms par defaut)')}
  onPressIn={() => console.log('Doigt pose')}
  onPressOut={() => console.log('Doigt releve')}
  delayLongPress={800} // Delai avant onLongPress (ms)
  unstable_pressDelay={100} // Delai avant visual feedback (evite flash au scroll)
>
  <Text>Interactions avancees</Text>
</Pressable>
```

Chronologie des événements :

```
Doigt pose → onPressIn → (maintien) → onLongPress
                                    OU
Doigt pose → onPressIn → onPressOut → onPress (relache rapide)
```

---

## TouchableOpacity vs Pressable — guide de migration

### Pourquoi migrer ?

`TouchableOpacity` est fonctionnel mais limite :

| Critere | TouchableOpacity | Pressable |
|---------|-----------------|-----------|
| Style dynamique | Non (seulement opacity) | Oui (fonction style) |
| Children dynamiques | Non | Oui (render function) |
| android_ripple | Non | Oui |
| hitSlop | Oui | Oui |
| pressRetentionOffset | Non | Oui |
| unstable_pressDelay | Non | Oui (evite flash au scroll) |
| Maintenabilite | Legacy | Recommande |

### Migration pas a pas

```typescript
// ❌ Avant : TouchableOpacity
import { TouchableOpacity, Text } from 'react-native';

<TouchableOpacity
  onPress={onPress}
  activeOpacity={0.7}
  style={styles.button}
>
  <Text>Ancien bouton</Text>
</TouchableOpacity>

// ✅ Apres : Pressable equivalent
import { Pressable, Text } from 'react-native';

<Pressable
  onPress={onPress}
  style={({ pressed }) => [
    styles.button,
    { opacity: pressed ? 0.7 : 1 },
  ]}
>
  <Text>Nouveau bouton</Text>
</Pressable>
```

### Reproduire l'effet opacity avec Pressable

```typescript
// Composant reutilisable qui remplace TouchableOpacity
function PressableOpacity({
  children,
  activeOpacity = 0.7,
  style,
  ...props
}: PressableProps & { activeOpacity?: number }) {
  return (
    <Pressable
      style={({ pressed }) => [
        typeof style === 'function' ? style({ pressed }) : style,
        { opacity: pressed ? activeOpacity : 1 },
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
```

---

## Modal

### Usage de base

```typescript
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';

function ModalExample() {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setVisible(true)} style={styles.openBtn}>
        <Text style={styles.btnText}>Ouvrir la modale</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"        // 'none' | 'slide' | 'fade'
        presentationStyle="pageSheet" // iOS: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen'
        transparent={false}           // true = fond transparent
        onRequestClose={() => {
          // OBLIGATOIRE sur Android (bouton retour hardware)
          setVisible(false);
        }}
        onShow={() => console.log('Modale affichee')}
        onDismiss={() => console.log('Modale fermee')} // iOS uniquement
      >
        <View style={styles.modalContent}>
          <Text style={styles.title}>Contenu de la modale</Text>
          <Pressable onPress={() => setVisible(false)} style={styles.closeBtn}>
            <Text style={styles.btnText}>Fermer</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
```

### Modal avec overlay transparent

```typescript
function OverlayModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay cliquable pour fermer */}
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        {/* Contenu : stopPropagation via un Pressable interne */}
        <Pressable
          style={styles.modalBox}
          onPress={() => {}}  // Empeche le tap de traverser au overlay
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
});
```

### onRequestClose — Android back button

> **Critique** : Si vous ne gerez pas `onRequestClose`, le bouton retour Android ne fermera pas la modale. C'est une source frequente de bugs.

```typescript
<Modal
  visible={visible}
  onRequestClose={() => {
    // Appelee quand l'utilisateur :
    // - Appuie sur le bouton retour (Android)
    // - Fait un geste de retour (Android 13+)
    // - Appuie sur la touche Menu (TV)
    setVisible(false);
  }}
>
```

---

## ActivityIndicator

### Spinner de chargement

```typescript
import { ActivityIndicator, View, Text } from 'react-native';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator
        size="large"           // 'small' | 'large' | number (Android uniquement)
        color="#2196F3"        // Couleur du spinner
        animating={true}       // false pour cacher (conserve l'espace)
        hidesWhenStopped={true} // iOS: masque quand animating=false
      />
      <Text style={{ marginTop: 16, color: '#666' }}>
        Chargement en cours...
      </Text>
    </View>
  );
}
```

### Pattern de chargement réutilisable

```typescript
interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function LoadingWrapper<T>({
  state,
  renderData,
  renderError,
  loadingMessage = 'Chargement...',
}: {
  state: LoadingState<T>;
  renderData: (data: T) => React.ReactNode;
  renderError?: (error: string) => React.ReactNode;
  loadingMessage?: string;
}) {
  if (state.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 12, color: '#888' }}>{loadingMessage}</Text>
      </View>
    );
  }

  if (state.error) {
    return renderError ? (
      <>{renderError(state.error)}</>
    ) : (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#d32f2f', fontSize: 16 }}>
          Erreur : {state.error}
        </Text>
      </View>
    );
  }

  if (state.data) {
    return <>{renderData(state.data)}</>;
  }

  return null;
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error } = useFetch(`/users/${userId}`);

  return (
    <LoadingWrapper
      state={{ data, loading, error }}
      renderData={(user) => (
        <View>
          <Text>{user.name}</Text>
          <Text>{user.email}</Text>
        </View>
      )}
    />
  );
}
```

### Skeleton loading (placeholder)

```typescript
function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <View style={{
        width: '100%',
        height: 200,
        backgroundColor: '#e0e0e0',
        borderRadius: 12,
        marginBottom: 8,
      }} />
      <View style={{
        width: '60%',
        height: 20,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginBottom: 4,
      }} />
      <View style={{
        width: '40%',
        height: 16,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
      }} />
    </Animated.View>
  );
}
```

---

## KeyboardAvoidingView

### Le problème

Quand le clavier s'ouvre, il recouvre les champs de saisie en bas de l'ecran. `KeyboardAvoidingView` ajuste automatiquement le layout :

```typescript
import { KeyboardAvoidingView, Platform, TextInput, StyleSheet }
  from 'react-native';

function LoginForm() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.form}>
        <TextInput placeholder="Email" style={styles.input} />
        <TextInput placeholder="Mot de passe" style={styles.input} secureTextEntry />
        <Pressable style={styles.submitBtn}>
          <Text style={styles.submitText}>Se connecter</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
```

### behavior par plateforme

| Valeur | Effet | Plateforme recommandee |
|--------|-------|----------------------|
| `padding` | Ajoute du padding en bas | iOS |
| `height` | Reduit la hauteur du conteneur | Android |
| `position` | Change la position du conteneur | Cas spécifiques |

```typescript
// Pattern recommande
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
```

### keyboardVerticalOffset

Si un header (React Navigation par exemple) est present au-dessus du `KeyboardAvoidingView`, il faut compenser sa hauteur :

```typescript
import { useHeaderHeight } from '@react-navigation/elements';

function FormScreen() {
  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
      style={{ flex: 1 }}
    >
      {/* ... */}
    </KeyboardAvoidingView>
  );
}
```

### Alternatives a KeyboardAvoidingView

```typescript
// 1. react-native-keyboard-aware-scroll-view (plus robuste)
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

function Form() {
  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      extraScrollHeight={20}
    >
      <TextInput placeholder="Champ 1" />
      <TextInput placeholder="Champ 2" />
      <TextInput placeholder="Champ 3" />
    </KeyboardAwareScrollView>
  );
}

// 2. Keyboard.dismiss() pour fermer le clavier
import { Keyboard, Pressable } from 'react-native';

<Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
  {/* Tap n'importe ou pour fermer le clavier */}
</Pressable>
```

---

## Composants réutilisables

### Chip (etiquette)

```typescript
interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  variant?: 'filled' | 'outlined';
}

function Chip({
  label,
  selected = false,
  onPress,
  icon,
  variant = 'outlined',
}: ChipProps) {
  const isFilled = variant === 'filled' || selected;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isFilled && styles.chipFilled,
        pressed && styles.chipPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {icon && <View style={styles.chipIcon}>{icon}</View>}
      <Text style={[
        styles.chipText,
        isFilled && styles.chipTextFilled,
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipFilled: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextFilled: {
    color: '#fff',
  },
});
```

### Badge

```typescript
interface BadgeProps {
  count?: number;
  maxCount?: number;
  visible?: boolean;
  dot?: boolean;
  color?: string;
  children: React.ReactNode;
}

function Badge({
  count = 0,
  maxCount = 99,
  visible = true,
  dot = false,
  color = '#d32f2f',
  children,
}: BadgeProps) {
  const displayCount = count > maxCount ? `${maxCount}+` : `${count}`;
  const showBadge = visible && (dot || count > 0);

  return (
    <View style={{ position: 'relative' }}>
      {children}
      {showBadge && (
        <View
          style={[
            styles.badge,
            { backgroundColor: color },
            dot && styles.badgeDot,
          ]}
          accessibilityLabel={dot ? 'Notification' : `${count} notifications`}
        >
          {!dot && (
            <Text style={styles.badgeText}>{displayCount}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeDot: {
    minWidth: 10,
    height: 10,
    borderRadius: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
```

### Avatar

```typescript
interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
  status?: 'online' | 'offline' | 'away';
}

function Avatar({ uri, name, size = 48, status }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ff9800'];
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bgColor = colors[colorIndex % colors.length];

  const statusColors = {
    online: '#4caf50',
    offline: '#9e9e9e',
    away: '#ff9800',
  };

  return (
    <View
      style={{ width: size, height: size, position: 'relative' }}
      accessibilityLabel={`Avatar de ${name}`}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{
            color: '#fff',
            fontSize: size * 0.4,
            fontWeight: '700',
          }}>
            {initials}
          </Text>
        </View>
      )}

      {status && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: size * 0.15,
          backgroundColor: statusColors[status],
          borderWidth: 2,
          borderColor: '#fff',
        }} />
      )}
    </View>
  );
}
```

### Toast system

```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// Context pour le systeme de toast
const ToastContext = createContext<{
  show: (message: string, type?: Toast['type'], duration?: number) => void;
} | null>(null);

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((
    message: string,
    type: Toast['type'] = 'info',
    duration = 3000,
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const bgColors = {
    success: '#4caf50',
    error: '#d32f2f',
    info: '#2196f3',
    warning: '#ff9800',
  };

  return (
    <View
      style={[styles.toast, { backgroundColor: bgColors[toast.type] }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.toastText}>{toast.message}</Text>
    </View>
  );
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

// Usage
function SaveButton() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.show('Sauvegarde reussie !', 'success');
    } catch {
      toast.show('Erreur lors de la sauvegarde', 'error');
    }
  };

  return <Pressable onPress={handleSave}><Text>Sauvegarder</Text></Pressable>;
}
```

### BottomSheet simplifie

```typescript
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | string;
}

function BottomSheet({
  visible,
  onClose,
  children,
  height = '50%',
}: BottomSheetProps) {
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
  }, [visible, translateY]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheetContent,
            { height, transform: [{ translateY }] },
          ]}
        >
          <Pressable onPress={() => {}}>
            <View style={styles.sheetHandle} />
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
});
```

---

## Pattern Compound Components

### Le problème

Comment créer un composant `Select` avec des options qui communiquent implicitement avec le parent ?

```typescript
// ❌ API classique : tout passe en props
<Select
  value={value}
  onChange={onChange}
  options={[
    { label: 'France', value: 'FR' },
    { label: 'Belgique', value: 'BE' },
    { label: 'Suisse', value: 'CH' },
  ]}
/>

// ✅ Compound components : API plus naturelle et flexible
<Select value={value} onChange={onChange}>
  <Select.Option value="FR">France</Select.Option>
  <Select.Option value="BE">Belgique</Select.Option>
  <Select.Option value="CH">Suisse</Select.Option>
  <Select.Divider />
  <Select.Option value="OTHER">Autre</Select.Option>
</Select>
```

### Implementation avec Context

```typescript
// 1. Contexte interne partage
interface SelectContextType {
  value: string;
  onChange: (value: string) => void;
}

const SelectContext = createContext<SelectContextType | null>(null);

function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select.Option must be used inside <Select>');
  return ctx;
}

// 2. Composant parent
interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  label?: string;
}

function Select({ value, onChange, children, label }: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onChange }}>
      <View>
        {label && <Text style={styles.label}>{label}</Text>}
        <Pressable
          onPress={() => setOpen(!open)}
          style={styles.trigger}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ expanded: open }}
        >
          <Text>{value || 'Selectionnez...'}</Text>
        </Pressable>
        {open && (
          <View style={styles.dropdown}>
            {children}
          </View>
        )}
      </View>
    </SelectContext.Provider>
  );
}

// 3. Sous-composant Option
interface OptionProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function Option({ value, children, disabled = false }: OptionProps) {
  const { value: selectedValue, onChange } = useSelectContext();
  const isSelected = value === selectedValue;

  return (
    <Pressable
      onPress={() => !disabled && onChange(value)}
      style={[
        styles.option,
        isSelected && styles.optionSelected,
        disabled && styles.optionDisabled,
      ]}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: isSelected, disabled }}
    >
      <Text style={[
        styles.optionText,
        isSelected && styles.optionTextSelected,
      ]}>
        {children}
      </Text>
    </Pressable>
  );
}

// 4. Sous-composant Divider
function Divider() {
  return <View style={styles.divider} />;
}

// 5. Attacher les sous-composants
Select.Option = Option;
Select.Divider = Divider;

// Usage
function CountryPicker() {
  const [country, setCountry] = useState('');

  return (
    <Select value={country} onChange={setCountry} label="Pays">
      <Select.Option value="FR">France</Select.Option>
      <Select.Option value="BE">Belgique</Select.Option>
      <Select.Divider />
      <Select.Option value="CH">Suisse</Select.Option>
    </Select>
  );
}
```

### Avantages du pattern

| Aspect | Props array | Compound Components |
|--------|-------------|---------------------|
| Flexibilite | Limitee à la forme des donnees | Totale (custom rendering) |
| Lisibilite | Donnees mixees avec le JSX | Structure claire et declarative |
| Extensibilite | Modifier l'interface de l'objet | Ajouter des sous-composants |
| Separation | Tout dans le parent | Logique distribuee |

---

## Système de theme

### Design tokens

```typescript
// theme/tokens.ts

export interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  typography: {
    h1: { fontSize: number; fontWeight: string; lineHeight: number };
    h2: { fontSize: number; fontWeight: string; lineHeight: number };
    body: { fontSize: number; fontWeight: string; lineHeight: number };
    caption: { fontSize: number; fontWeight: string; lineHeight: number };
  };
}

export const lightTheme: ThemeTokens = {
  colors: {
    primary: '#2196F3',
    secondary: '#FF9800',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 4, md: 8, lg: 16, full: 9999 },
  typography: {
    h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
    h2: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
};

export const darkTheme: ThemeTokens = {
  ...lightTheme,
  colors: {
    primary: '#64B5F6',
    secondary: '#FFB74D',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
  },
};
```

### ThemeProvider et useTheme

```typescript
// theme/ThemeContext.tsx

interface ThemeContextType {
  theme: ThemeTokens;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const theme = isDark ? darkTheme : lightTheme;
  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

// Usage dans un composant
function ThemedCard({ title, subtitle }: { title: string; subtitle: string }) {
  const { theme } = useTheme();

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    }}>
      <Text style={{
        ...theme.typography.h2,
        color: theme.colors.text,
      }}>
        {title}
      </Text>
      <Text style={{
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
      }}>
        {subtitle}
      </Text>
    </View>
  );
}
```

### Fusion de themes (theming partiel)

```typescript
function mergeThemes(
  base: ThemeTokens,
  override: Partial<ThemeTokens>,
): ThemeTokens {
  return {
    ...base,
    colors: { ...base.colors, ...override.colors },
    spacing: { ...base.spacing, ...override.spacing },
    borderRadius: { ...base.borderRadius, ...override.borderRadius },
    typography: { ...base.typography, ...override.typography },
  };
}

// Usage : theme de marque base sur le theme clair
const brandTheme = mergeThemes(lightTheme, {
  colors: {
    primary: '#6200EE',    // Material Purple
    secondary: '#03DAC5',  // Teal
  },
});
```

---

## Accessibilité

### Proprietes essentielles

React Native fournit un ensemble riche de propriétés d'accessibilité :

```typescript
<Pressable
  onPress={onPress}
  // Role semantique (annonce par le lecteur d'ecran)
  accessibilityRole="button"
  // Label lu par le lecteur d'ecran
  accessibilityLabel="Ajouter au panier"
  // Description complementaire
  accessibilityHint="Ajoute cet article a votre panier"
  // Etat du composant
  accessibilityState={{
    disabled: false,
    selected: false,
    checked: false,    // Pour les checkboxes/toggles
    busy: false,       // Pendant un chargement
    expanded: false,   // Pour les accordeons/dropdowns
  }}
  // Valeur (sliders, progress bars)
  accessibilityValue={{
    min: 0,
    max: 100,
    now: 42,
    text: '42%',
  }}
>
  <Text>Ajouter au panier</Text>
</Pressable>
```

### Roles disponibles

| Role | Usage | Equivalent web |
|------|-------|----------------|
| `button` | Élément cliquable | `<button>` |
| `link` | Navigation | `<a>` |
| `search` | Champ de recherche | `<input type="search">` |
| `image` | Image | `<img>` |
| `header` | Titre de section | `<h1>`-`<h6>` |
| `alert` | Message urgent | `role="alert"` |
| `checkbox` | Case a cocher | `<input type="checkbox">` |
| `switch` | Toggle on/off | `<input type="checkbox" role="switch">` |
| `progressbar` | Barre de progression | `<progress>` |
| `tab` | Onglet | `role="tab"` |
| `tabbar` | Barre d'onglets | `role="tablist"` |

### Composant accessible complet

```typescript
function AccessibleToggle({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[
        styles.toggle,
        value && styles.toggleActive,
      ]}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      accessibilityValue={{ text: value ? 'Active' : 'Desactive' }}
    >
      <View style={[
        styles.toggleThumb,
        value && styles.toggleThumbActive,
      ]} />
    </Pressable>
  );
}
```

### Regrouper les éléments

```typescript
// Grouper plusieurs elements en une seule annonce
<View
  accessible={true}
  accessibilityLabel="Prix: 29,99 euros, livraison gratuite"
>
  <Text>29,99 EUR</Text>
  <Text style={{ color: '#4caf50' }}>Livraison gratuite</Text>
</View>

// Sans accessible={true}, le lecteur d'ecran lit chaque Text separement
```

### Live regions (annonces dynamiques)

```typescript
// Annonce automatiquement les changements de contenu
<Text
  accessibilityRole="alert"
  accessibilityLiveRegion="polite"  // 'none' | 'polite' | 'assertive'
>
  {errorMessage}
</Text>

// 'polite' : attend la fin de l'annonce en cours
// 'assertive' : interrompt l'annonce en cours (erreurs critiques)
```

### Tester l'accessibilité

```bash
# iOS Simulator : Cmd+Shift+A pour ouvrir Accessibility Inspector
# Android : TalkBack dans Parametres > Accessibilite

# Avec un vrai appareil (recommande) :
# iOS : Reglages > Accessibilite > VoiceOver
# Android : Parametres > Accessibilite > TalkBack
```

---

## Récapitulatif

| Composant | Usage | Points clés |
|-----------|-------|-------------|
| `Pressable` | Toute interaction tactile | hitSlop, android_ripple, style function |
| `Modal` | Contenu superpose | onRequestClose obligatoire (Android) |
| `ActivityIndicator` | Spinner de chargement | Pattern LoadingWrapper réutilisable |
| `KeyboardAvoidingView` | Adapter au clavier | behavior varie par plateforme |
| Compound Components | API composant flexible | Context interne, sous-composants attaches |
| Theme system | Design coherent | ThemeProvider + useTheme + tokens |
| Accessibilité | Inclusivite | Role, label, state sur chaque élément interactif |

---

## Bonnes pratiques

1. **Utilisez `Pressable`** au lieu de `TouchableOpacity` pour les nouveaux composants
2. **Toujours définir `onRequestClose`** sur les `Modal` (bouton retour Android)
3. **hitSlop >= 44pt** pour les petites cibles tactiles
4. **Un `accessibilityLabel`** sur chaque élément interactif
5. **Le pattern Compound Components** pour les composants complexes avec sous-éléments
6. **Design tokens** plutot que des valeurs en dur dans les styles
7. **LoadingWrapper** pour gérer uniformement les 3 états : loading, error, data
8. **Testez avec VoiceOver/TalkBack** au moins une fois par ecran

---

## Exercices

Passez au [Lab 07](../labs/lab-07-composants-ui-avances/) pour implementer un système de theme, une file de toasts, des props d'accessibilité et un arbre de compound components en TypeScript pur.

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 07 composants ui](../screencasts/screencast-07-composants-ui.md)
2. **Lab** : [lab-07-composants-ui-avances](../labs/lab-07-composants-ui-avances/README)
3. **Quiz** : [quiz 07 composants ui](../quizzes/quiz-07-composants-ui.html)
:::
