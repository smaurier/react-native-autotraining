# Module 02 — Props et communication

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 2/5        | 60 min        | [Lab 02](../labs/lab-02-props-communication/) | [Quiz 02](../quizzes/quiz-02-props.html) |

## Objectifs

- Typer les props avec des interfaces TypeScript
- Gerer les props requises, optionnelles et les valeurs par defaut
- Maitriser le `children` prop et le pattern render props
- Implementer les callback props pour la communication enfant vers parent
- Comprendre le props drilling et ses limites
- Utiliser les discriminated unions pour les variantes de composants
- Creer des composants generiques avec TypeScript

---

## Les props : canal de communication parent-enfant

En React Native, les **props** (proprietes) sont le mecanisme principal pour passer des donnees d'un composant parent vers un composant enfant. Le flux est **unidirectionnel** : les donnees descendent toujours du parent vers l'enfant.

```
  Parent
    |
    | props (donnees + callbacks)
    v
  Enfant
```

Les props sont **en lecture seule** : un composant ne peut jamais modifier ses propres props. C'est une regle fondamentale de React.

---

## Typer les props avec TypeScript

### Interface de base

```tsx
// ---- BadgeProps.tsx ----
interface BadgeProps {
  label: string;
  count: number;
  color: string;
}

function Badge({ label, count, color }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

// Utilisation
<Badge label="Notifications" count={5} color="#e74c3c" />
```

### Type alias vs interface

Les deux fonctionnent, mais la convention React privilegie les `interface` car elles supportent la fusion de declarations et sont plus explicites :

```tsx
// Interface (prefere)
interface ButtonProps {
  title: string;
  onPress: () => void;
}

// Type alias (equivalent mais moins idiomatique)
type ButtonProps = {
  title: string;
  onPress: () => void;
};
```

### Destructuration dans la signature

```tsx
// Pattern recommande : destructuration directe
function Avatar({ uri, size, borderColor }: AvatarProps) {
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2, borderColor }}
    />
  );
}

// Equivalent avec props nomme
function Avatar(props: AvatarProps) {
  return (
    <Image
      source={{ uri: props.uri }}
      style={{ width: props.size, height: props.size }}
    />
  );
}
```

---

## Props requises vs optionnelles

### Prop optionnelle avec `?`

```tsx
interface CardProps {
  title: string;              // requise
  subtitle?: string;          // optionnelle
  imageUri?: string;          // optionnelle
  onPress?: () => void;       // optionnelle
  elevation?: number;         // optionnelle
}

function Card({ title, subtitle, imageUri, onPress, elevation = 4 }: CardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, { elevation }]}
    >
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );
}

// Seul title est obligatoire
<Card title="Mon article" />
<Card title="Article" subtitle="Description" imageUri="https://..." />
<Card title="Cliquable" onPress={() => console.log('tap')} elevation={8} />
```

### Valeurs par defaut avec la destructuration

```tsx
interface PaginationProps {
  total: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

function Pagination({
  total,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <View style={styles.pagination}>
      <TouchableOpacity
        disabled={currentPage <= 1}
        onPress={() => onPageChange(currentPage - 1)}
      >
        <Text>Precedent</Text>
      </TouchableOpacity>

      <Text>{currentPage} / {totalPages}</Text>

      <TouchableOpacity
        disabled={currentPage >= totalPages}
        onPress={() => onPageChange(currentPage + 1)}
      >
        <Text>Suivant</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### `defaultProps` : a eviter

L'ancienne methode `Component.defaultProps` est **deprecee** dans React 18+. Utilisez toujours les valeurs par defaut dans la destructuration :

```tsx
// MAUVAIS (deprecated)
function Button({ title, variant }: ButtonProps) { /* ... */ }
Button.defaultProps = { variant: 'primary' };

// BON (moderne)
function Button({ title, variant = 'primary' }: ButtonProps) { /* ... */ }
```

---

## Le prop `children`

### ReactNode : le type le plus flexible

Le type `ReactNode` accepte tout ce que React peut rendre : elements JSX, strings, numbers, arrays, fragments, null, undefined, booleans.

```tsx
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  padding?: number;
  backgroundColor?: string;
}

function Container({ children, padding = 16, backgroundColor = '#fff' }: ContainerProps) {
  return (
    <View style={{ padding, backgroundColor }}>
      {children}
    </View>
  );
}

// Utilisation : n'importe quoi entre les balises
<Container padding={24}>
  <Text>Hello</Text>
  <Button title="Click me" />
</Container>

<Container>
  {"Simple texte"}
</Container>

<Container>
  {items.map(item => <ItemRow key={item.id} item={item} />)}
</Container>
```

### Composition de composants

Le pattern `children` est la base de la **composition** en React — une alternative puissante a l'heritage :

```tsx
interface ScreenLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

function ScreenLayout({ children, header, footer }: ScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.screen}>
      {header && <View style={styles.header}>{header}</View>}
      <ScrollView style={styles.content}>{children}</ScrollView>
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  );
}

// Utilisation avec slots nommes
<ScreenLayout
  header={<Text style={styles.title}>Mon ecran</Text>}
  footer={<Button title="Valider" onPress={handleSubmit} />}
>
  <ProfileForm />
  <SettingsList />
</ScreenLayout>
```

### Render props

Le pattern **render props** consiste a passer une **fonction** comme prop. Cette fonction recoit des donnees et retourne du JSX. C'est utile quand le parent veut controller le rendu :

```tsx
interface DataFetcherProps<T> {
  url: string;
  renderLoading: () => ReactNode;
  renderError: (error: Error) => ReactNode;
  renderData: (data: T) => ReactNode;
}

function DataFetcher<T>({
  url,
  renderLoading,
  renderError,
  renderData,
}: DataFetcherProps<T>) {
  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    data: T | null;
  }>({ loading: true, error: null, data: null });

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => setState({ loading: false, error: null, data }))
      .catch(error => setState({ loading: false, error, data: null }));
  }, [url]);

  if (state.loading) return <>{renderLoading()}</>;
  if (state.error) return <>{renderError(state.error)}</>;
  if (state.data) return <>{renderData(state.data)}</>;
  return null;
}

// Utilisation : le parent decide du rendu
<DataFetcher<User[]>
  url="https://api.example.com/users"
  renderLoading={() => <ActivityIndicator />}
  renderError={(err) => <Text style={styles.error}>{err.message}</Text>}
  renderData={(users) => (
    <FlatList
      data={users}
      renderItem={({ item }) => <UserCard user={item} />}
    />
  )}
/>
```

### Children comme fonction (render prop classique)

```tsx
interface ToggleRenderProps {
  children: (props: { isOn: boolean; toggle: () => void }) => ReactNode;
}

function Toggle({ children }: ToggleRenderProps) {
  const [isOn, setIsOn] = useState(false);
  return <>{children({ isOn, toggle: () => setIsOn(prev => !prev) })}</>;
}

// Utilisation
<Toggle>
  {({ isOn, toggle }) => (
    <TouchableOpacity onPress={toggle}>
      <Text>{isOn ? 'ON' : 'OFF'}</Text>
    </TouchableOpacity>
  )}
</Toggle>
```

---

## Callback props : communication enfant vers parent

### Le pattern "data up"

Les donnees descendent via les props, mais les **evenements remontent** via des fonctions callback :

```tsx
// ---- SearchBar.tsx ----
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
}

function SearchBar({ placeholder = 'Rechercher...', onSearch, onClear }: SearchBarProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSearch(text.trim());  // Remonte la donnee au parent
    }
  };

  const handleClear = () => {
    setText('');
    onClear?.();  // Appel conditionnel si la callback existe
  };

  return (
    <View style={styles.searchBar}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        onSubmitEditing={handleSubmit}
      />
      {text.length > 0 && (
        <TouchableOpacity onPress={handleClear}>
          <Text>X</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---- Parent ----
function ProductScreen() {
  const [results, setResults] = useState<Product[]>([]);

  const handleSearch = (query: string) => {
    // La donnee remonte de SearchBar vers ProductScreen
    const filtered = allProducts.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  };

  return (
    <View>
      <SearchBar onSearch={handleSearch} onClear={() => setResults(allProducts)} />
      <ProductList products={results} />
    </View>
  );
}
```

### Conventions de nommage pour les callbacks

```tsx
interface FormFieldProps {
  // Prefixe on* pour les callbacks = convention React
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
  onValidate?: (value: string) => boolean;

  // Prefixe handle* dans le composant qui definit le handler
  // onChange dans les props, handleChange dans le parent
}

// Dans le parent :
function MyForm() {
  const handleNameChange = (value: string) => { /* ... */ };
  const handleNameBlur = () => { /* ... */ };

  return <FormField onChange={handleNameChange} onBlur={handleNameBlur} />;
}
```

### Callback avec donnees structurees

```tsx
interface RatingProps {
  maxStars?: number;
  initialRating?: number;
  onRate: (rating: { stars: number; timestamp: number }) => void;
}

function Rating({ maxStars = 5, initialRating = 0, onRate }: RatingProps) {
  const [rating, setRating] = useState(initialRating);

  const handlePress = (stars: number) => {
    setRating(stars);
    onRate({ stars, timestamp: Date.now() });
  };

  return (
    <View style={styles.stars}>
      {Array.from({ length: maxStars }, (_, i) => (
        <TouchableOpacity key={i} onPress={() => handlePress(i + 1)}>
          <Text style={i < rating ? styles.starFilled : styles.starEmpty}>
            {i < rating ? '\u2605' : '\u2606'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Pattern : evenements avec identifiant

Tres utile dans les listes ou chaque element doit remonter son identifiant :

```tsx
interface TaskItemProps {
  id: string;
  title: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskItem({ id, title, completed, onToggle, onDelete }: TaskItemProps) {
  return (
    <View style={styles.taskItem}>
      <TouchableOpacity onPress={() => onToggle(id)}>
        <Text style={completed ? styles.completed : styles.pending}>
          {completed ? '\u2611' : '\u2610'} {title}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(id)}>
        <Text style={styles.deleteBtn}>Supprimer</Text>
      </TouchableOpacity>
    </View>
  );
}

// Parent : gere la liste complete
function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const handleToggle = (id: string) => {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <FlatList
      data={tasks}
      keyExtractor={t => t.id}
      renderItem={({ item }) => (
        <TaskItem
          id={item.id}
          title={item.title}
          completed={item.completed}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      )}
    />
  );
}
```

---

## Props drilling : le probleme

Le **props drilling** survient quand on passe des props a travers plusieurs niveaux de composants intermediaires qui n'en ont pas besoin :

```tsx
// Niveau 0 : App possede le theme
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <MainScreen theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />
  );
}

// Niveau 1 : MainScreen ne fait que relayer
function MainScreen({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
  return (
    <View>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <Content theme={theme} />
    </View>
  );
}

// Niveau 2 : Header ne fait que relayer aussi
function Header({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
  return (
    <View>
      <Logo theme={theme} />
      <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
    </View>
  );
}

// Niveau 3 : ThemeToggle utilise enfin les props
function ThemeToggle({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
  return (
    <TouchableOpacity onPress={onToggleTheme}>
      <Text>{theme === 'light' ? '\uD83C\uDF19' : '\u2600\uFE0F'}</Text>
    </TouchableOpacity>
  );
}
```

### Pourquoi c'est un probleme

1. **Maintenance** : ajouter/supprimer un prop oblige a modifier tous les composants intermediaires
2. **Lisibilite** : les composants intermediaires sont pollues par des props qu'ils n'utilisent pas
3. **Re-renders** : chaque changement de prop cause un re-render de toute la chaine

### Quand c'est acceptable

Pour 2-3 niveaux, le props drilling est parfaitement acceptable. Au-dela, on utilise :
- **React Context** (module 10)
- **Zustand** (module 10)
- **Composition** (restructurer pour aplatir l'arbre)

### Solution par composition

Avant de recourir au Context, on peut souvent resoudre le drilling en reorganisant les composants :

```tsx
// Au lieu de passer theme a travers 3 niveaux,
// on cree le composant final au niveau du parent :

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <MainScreen
      headerRight={
        <ThemeToggle
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        />
      }
    >
      <Content theme={theme} />
    </MainScreen>
  );
}

function MainScreen({ children, headerRight }: { children: ReactNode; headerRight: ReactNode }) {
  return (
    <View>
      <View style={styles.header}>
        <Logo />
        {headerRight}
      </View>
      {children}
    </View>
  );
}
```

---

## Discriminated unions pour les variantes

### Le probleme : props mutuellement exclusives

Certains composants ont des variantes ou certaines props ne s'appliquent qu'a un mode specifique. Les discriminated unions resolvent cela proprement :

```tsx
// MAUVAIS : tout est optionnel, pas de securite
interface AlertPropsBad {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  retryAction?: () => void;  // Seulement pour error
  autoClose?: number;         // Seulement pour success/info
  warningLevel?: 1 | 2 | 3;  // Seulement pour warning
}
```

```tsx
// BON : discriminated union
type AlertProps =
  | {
      type: 'success';
      message: string;
      autoClose?: number;
    }
  | {
      type: 'error';
      message: string;
      retryAction: () => void;  // Obligatoire pour error !
    }
  | {
      type: 'warning';
      message: string;
      warningLevel: 1 | 2 | 3;
    }
  | {
      type: 'info';
      message: string;
      autoClose?: number;
    };

function Alert(props: AlertProps) {
  const baseStyle = styles[props.type];

  switch (props.type) {
    case 'success':
      return (
        <View style={[styles.alert, baseStyle]}>
          <Text>{props.message}</Text>
          {/* autoClose est accessible ici */}
        </View>
      );
    case 'error':
      return (
        <View style={[styles.alert, baseStyle]}>
          <Text>{props.message}</Text>
          <TouchableOpacity onPress={props.retryAction}>
            <Text>Reessayer</Text>
          </TouchableOpacity>
        </View>
      );
    case 'warning':
      return (
        <View style={[styles.alert, baseStyle]}>
          <Text>Niveau {props.warningLevel} : {props.message}</Text>
        </View>
      );
    case 'info':
      return (
        <View style={[styles.alert, baseStyle]}>
          <Text>{props.message}</Text>
        </View>
      );
  }
}

// TypeScript verifie a la compilation :
<Alert type="error" message="Echec" retryAction={() => fetchData()} />  // OK
// @ts-expect-error — retryAction manquant pour type="error"
<Alert type="error" message="Echec" />
// @ts-expect-error — warningLevel n'existe pas sur type="success"
<Alert type="success" message="OK" warningLevel={2} />
```

### Variantes de boutons

```tsx
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

// Bouton avec icone : exige iconPosition
type ButtonWithIcon = ButtonBaseProps & {
  icon: string;
  iconPosition?: 'left' | 'right';
};

// Bouton sans icone
type ButtonWithoutIcon = ButtonBaseProps & {
  icon?: never;
  iconPosition?: never;
};

type ButtonProps = ButtonWithIcon | ButtonWithoutIcon;

function Button(props: ButtonProps) {
  const {
    title,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
  } = props;

  const sizeStyles = {
    sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12 },
    md: { paddingVertical: 10, paddingHorizontal: 20, fontSize: 16 },
    lg: { paddingVertical: 14, paddingHorizontal: 28, fontSize: 20 },
  };

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={[
        styles.button,
        styles[variant],
        sizeStyles[size],
        fullWidth && { width: '100%' },
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.buttonContent}>
          {props.icon && props.iconPosition !== 'right' && (
            <Text style={styles.icon}>{props.icon}</Text>
          )}
          <Text style={[styles.buttonText, { fontSize: sizeStyles[size].fontSize }]}>
            {title}
          </Text>
          {props.icon && props.iconPosition === 'right' && (
            <Text style={styles.icon}>{props.icon}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Utilisation
<Button title="Sauvegarder" variant="primary" size="lg" />
<Button title="Supprimer" variant="danger" icon="\uD83D\uDDD1" iconPosition="left" />
<Button title="Annuler" variant="ghost" />
<Button title="Chargement..." loading />
```

---

## Composants generiques

### Le pattern List\<T\>

Les generiques TypeScript permettent de creer des composants reutilisables qui conservent le typage :

```tsx
interface ListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  header?: ReactNode;
  footer?: ReactNode;
  separator?: boolean;
}

function List<T>({
  data,
  renderItem,
  keyExtractor,
  emptyMessage = 'Aucun element',
  header,
  footer,
  separator = false,
}: ListProps<T>) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View>
      {header}
      {data.map((item, index) => (
        <View key={keyExtractor(item)}>
          {renderItem(item, index)}
          {separator && index < data.length - 1 && <View style={styles.separator} />}
        </View>
      ))}
      {footer}
    </View>
  );
}

// Utilisation typee : T est infere automatiquement
interface User {
  id: string;
  name: string;
  email: string;
}

const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

<List
  data={users}
  keyExtractor={(user) => user.id}        // user est type User
  renderItem={(user) => (                  // user est type User
    <View>
      <Text>{user.name}</Text>
      <Text>{user.email}</Text>
    </View>
  )}
  emptyMessage="Aucun utilisateur"
  separator
/>
```

### Le pattern Card\<T\>

```tsx
interface CardProps<T> {
  item: T;
  title: (item: T) => string;
  subtitle?: (item: T) => string;
  image?: (item: T) => string | undefined;
  onPress?: (item: T) => void;
  renderBadge?: (item: T) => ReactNode;
}

function Card<T>({
  item,
  title,
  subtitle,
  image,
  onPress,
  renderBadge,
}: CardProps<T>) {
  return (
    <TouchableOpacity
      onPress={() => onPress?.(item)}
      disabled={!onPress}
      style={styles.card}
    >
      {image?.(item) && (
        <Image source={{ uri: image(item) }} style={styles.cardImage} />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title(item)}</Text>
        {subtitle && <Text style={styles.cardSubtitle}>{subtitle(item)}</Text>}
      </View>
      {renderBadge && (
        <View style={styles.cardBadge}>{renderBadge(item)}</View>
      )}
    </TouchableOpacity>
  );
}

// Utilisation avec un type Product
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
}

<Card<Product>
  item={product}
  title={(p) => p.name}
  subtitle={(p) => `${p.price.toFixed(2)} EUR`}
  image={(p) => p.imageUrl}
  onPress={(p) => navigation.navigate('Product', { id: p.id })}
  renderBadge={(p) => (
    <View style={p.inStock ? styles.inStock : styles.outOfStock}>
      <Text>{p.inStock ? 'En stock' : 'Epuise'}</Text>
    </View>
  )}
/>
```

### Select generique

```tsx
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (item: T) => void;
  getLabel: (item: T) => string;
  getKey: (item: T) => string;
  placeholder?: string;
}

function Select<T>({
  options,
  value,
  onChange,
  getLabel,
  getKey,
  placeholder = 'Selectionner...',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.selectTrigger}>
        <Text style={value ? styles.selectValue : styles.selectPlaceholder}>
          {value ? getLabel(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.selectDropdown}>
          {options.map((option) => (
            <TouchableOpacity
              key={getKey(option)}
              onPress={() => {
                onChange(option);
                setIsOpen(false);
              }}
              style={styles.selectOption}
            >
              <Text>{getLabel(option)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// Utilisation
interface Country {
  code: string;
  name: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'FR', name: 'France', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { code: 'BE', name: 'Belgique', flag: '\uD83C\uDDE7\uD83C\uDDEA' },
  { code: 'CH', name: 'Suisse', flag: '\uD83C\uDDE8\uD83C\uDDED' },
];

<Select<Country>
  options={countries}
  value={selectedCountry}
  onChange={setSelectedCountry}
  getLabel={(c) => `${c.flag} ${c.name}`}
  getKey={(c) => c.code}
  placeholder="Choisir un pays"
/>
```

---

## Exemple pratique : DataTable

Un composant generique complet qui combine plusieurs patterns :

```tsx
interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  width?: number;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowPress?: (item: T) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  emptyMessage?: string;
  loading?: boolean;
}

function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowPress,
  sortBy,
  sortOrder = 'asc',
  onSort,
  emptyMessage = 'Aucune donnee',
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <ScrollView horizontal>
      <View>
        {/* En-tete */}
        <View style={styles.headerRow}>
          {columns.map((col) => (
            <TouchableOpacity
              key={col.key}
              onPress={() => col.sortable && onSort?.(col.key)}
              disabled={!col.sortable}
              style={[styles.headerCell, col.width ? { width: col.width } : { flex: 1 }]}
            >
              <Text style={styles.headerText}>
                {col.header}
                {sortBy === col.key && (sortOrder === 'asc' ? ' \u25B2' : ' \u25BC')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Corps */}
        {data.length === 0 ? (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        ) : (
          data.map((item) => (
            <TouchableOpacity
              key={keyExtractor(item)}
              onPress={() => onRowPress?.(item)}
              disabled={!onRowPress}
              style={styles.row}
            >
              {columns.map((col) => (
                <View
                  key={col.key}
                  style={[styles.cell, col.width ? { width: col.width } : { flex: 1 }]}
                >
                  {col.render(item)}
                </View>
              ))}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// Utilisation
interface Employee {
  id: string;
  name: string;
  department: string;
  salary: number;
  active: boolean;
}

const columns: Column<Employee>[] = [
  {
    key: 'name',
    header: 'Nom',
    render: (e) => <Text style={styles.bold}>{e.name}</Text>,
    sortable: true,
    width: 200,
  },
  {
    key: 'department',
    header: 'Departement',
    render: (e) => <Text>{e.department}</Text>,
    sortable: true,
  },
  {
    key: 'salary',
    header: 'Salaire',
    render: (e) => <Text>{e.salary.toLocaleString('fr-FR')} EUR</Text>,
    sortable: true,
    width: 120,
  },
  {
    key: 'status',
    header: 'Statut',
    render: (e) => (
      <View style={[styles.statusBadge, e.active ? styles.active : styles.inactive]}>
        <Text>{e.active ? 'Actif' : 'Inactif'}</Text>
      </View>
    ),
    width: 100,
  },
];

<DataTable<Employee>
  data={employees}
  columns={columns}
  keyExtractor={(e) => e.id}
  onRowPress={(e) => navigation.navigate('Employee', { id: e.id })}
  sortBy={sortColumn}
  sortOrder={sortOrder}
  onSort={handleSort}
  loading={isLoading}
/>
```

---

## Patterns avances pour les props

### Forwarding props avec rest/spread

```tsx
import { ViewProps } from 'react-native';

interface SectionProps extends ViewProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children, style, ...viewProps }: SectionProps) {
  return (
    <View style={[styles.section, style]} {...viewProps}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// Tous les props de View sont acceptes
<Section
  title="Parametres"
  accessibilityLabel="Section parametres"
  testID="settings-section"
>
  <SettingsRow />
</Section>
```

### `Omit` et `Pick` pour composer des interfaces

```tsx
import { TextInputProps } from 'react-native';

// On reutilise TextInputProps mais on remplace onChangeText
interface FormInputProps extends Omit<TextInputProps, 'onChangeText'> {
  label: string;
  error?: string;
  onChangeValue: (value: string) => void;
}

function FormInput({ label, error, onChangeValue, style, ...inputProps }: FormInputProps) {
  return (
    <View style={styles.formField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        onChangeText={onChangeValue}
        {...inputProps}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
```

### `ComponentProps` pour extraire les types

```tsx
import { ComponentProps } from 'react';

// Extraire les props d'un composant existant
type NativeButtonProps = ComponentProps<typeof TouchableOpacity>;

// Etendre un composant existant
interface CustomButtonProps extends ComponentProps<typeof TouchableOpacity> {
  variant: 'primary' | 'secondary';
  title: string;
}
```

---

## Resume des bonnes pratiques

| Pratique | Exemple |
|----------|---------|
| Toujours typer les props | `interface ButtonProps { ... }` |
| Destructurer dans la signature | `function Button({ title, onPress }: ButtonProps)` |
| Valeurs par defaut dans la destructuration | `{ size = 'md' }: Props` |
| `ReactNode` pour children | `children: ReactNode` |
| Callbacks prefixees `on*` | `onPress`, `onChange`, `onSubmit` |
| Handlers prefixes `handle*` | `handlePress`, `handleChange` |
| Discriminated unions pour variantes | `type Props = { type: 'a'; ... } \| { type: 'b'; ... }` |
| Generiques pour composants reutilisables | `function List<T>(props: ListProps<T>)` |
| Composition plutot qu'heritage | Passer des `children` ou des `slots` |
| Props drilling : max 2-3 niveaux | Au-dela, utiliser Context ou composition |

---

## Exercices rapides

### Exercice 1 : Typer un Avatar

```tsx
// Definir l'interface AvatarProps :
// - uri (string, requis)
// - size ('sm' | 'md' | 'lg', optionnel, defaut 'md')
// - online (boolean, optionnel)
// - onPress (callback optionnelle)

// Implementer le composant Avatar
```

### Exercice 2 : Callback pattern

```tsx
// Creer un composant CounterControl avec :
// - value: number (requis)
// - onIncrement: () => void
// - onDecrement: () => void
// - onReset: () => void
// - min?: number (optionnel)
// - max?: number (optionnel)

// Le parent gere l'etat, CounterControl n'a que l'affichage
```

### Exercice 3 : Discriminated union

```tsx
// Creer un composant MediaCard dont le type determine les props :
// - type: 'image' -> necessite uri, alt
// - type: 'video' -> necessite uri, duration, autoPlay?
// - type: 'audio' -> necessite uri, duration, title
// Tous partagent : id, onPress?
```

### Exercice 4 : Composant generique

```tsx
// Creer un composant Autocomplete<T> avec :
// - items: T[]
// - getLabel: (item: T) => string
// - getKey: (item: T) => string
// - onSelect: (item: T) => void
// - filter: (item: T, query: string) => boolean
// - placeholder?: string
```

---

## Points cles a retenir

1. **Les props sont le contrat** entre parent et enfant — toujours les typer
2. **Unidirectionnel** : donnees vers le bas, evenements vers le haut
3. **Composition > heritage** : utiliser `children` et les render props
4. **Discriminated unions** pour les variantes mutuellement exclusives
5. **Generiques** pour les composants reutilisables type-safe
6. **Props drilling** acceptable sur 2-3 niveaux, Context/state manager au-dela

> **Prochain module** : State et cycle de vie — comment gerer l'etat interne des composants avec `useState`, `useEffect`, et les hooks personnalises.
