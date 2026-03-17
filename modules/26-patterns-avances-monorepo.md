# Module 26 : Patterns avances et Monorepo

| Metadata | Valeur |
|----------|--------|
| **Difficulte** | 5/5 |
| **Duree** | 75 min |
| **Prérequis** | Modules 01-25, experience pnpm/npm, notions CI/CD |
| **Lab** | [Lab 26 — Patterns Monorepo](/labs/lab-26-patterns-monorepo/) |
| **Quiz** | [Quiz 26 — Patterns Monorepo](/quizzes/quiz-26-patterns.html) |

---

## Objectifs du module

- Structurer un monorepo React Native avec Turborepo et pnpm workspaces
- Créer des packages partages : UI library, config, utils
- Mettre en place un design system avec tokens, composants et Storybook
- Gérer plusieurs applications dans un même depot (main, admin, storybook)
- Comprendre les patterns de module federation en mobile
- Partager du code entre React Native et web via react-native-web
- Configurer une CI/CD optimisee pour monorepos (affected-only builds, caching)
- Maîtriser la gestion des dépendances : hoisting, peer deps, resolutions

---

## 1. Introduction aux monorepos

### 1.1 Pourquoi un monorepo ?

Un monorepo est un depot unique contenant plusieurs packages et applications. Pour les projets React Native d'envergure, c'est souvent la meilleure approche :

```
┌──────────────────────────────────────────────────────────────┐
│              Monorepo vs Multi-repo                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Multi-repo                  │ Monorepo                      │
│  ─────────────────────────────────────────────────           │
│  ✗ Duplication de config     │ ✓ Config partagee              │
│  ✗ Versions desynchronisees  │ ✓ Tout en sync (atomic commit)│
│  ✗ Cross-repo PRs penibles   │ ✓ PR unique multi-packages    │
│  ✗ CI/CD par repo            │ ✓ CI/CD intelligente          │
│  ✗ Decouverte difficile      │ ✓ Code navigable              │
│  ✓ Isolation forte           │ ~ Necessite des boundaries    │
│  ✓ Permissions granulaires   │ ~ CODEOWNERS par dossier      │
│                                                               │
│  Recommande pour RN quand :                                  │
│  - 2+ apps (main + admin, iOS + Android custom)              │
│  - UI lib partagee                                           │
│  - Config/utils communs                                      │
│  - Equipe > 5 devs                                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 L'ecosysteme d'outils

```
┌──────────────────────────────────────────────────────────────┐
│              Outils pour monorepos JS/TS                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Orchestration    │ Turborepo, Nx, Lerna                     │
│  Package Manager  │ pnpm (recommande), yarn berry, npm       │
│  Bundler          │ Metro (RN), Vite (web), tsup (libs)      │
│  Versioning       │ Changesets, Conventional Commits          │
│  CI/CD            │ GitHub Actions, GitLab CI, CircleCI       │
│                                                               │
│  Notre choix :                                               │
│  → Turborepo + pnpm = rapidite + simplicite                  │
│  → tsup pour builder les packages internes                   │
│  → Changesets pour le versioning                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Setup du monorepo avec Turborepo + pnpm

### 2.1 Initialisation

```bash
# Creer le monorepo
npx create-turbo@latest my-rn-monorepo --package-manager pnpm

# Structure resultante :
my-rn-monorepo/
├── apps/
│   ├── mobile/          # App React Native principale
│   └── admin/           # App admin (RN ou web)
├── packages/
│   ├── ui/              # Composants partages
│   ├── config/          # Configs partagees (TS, ESLint, etc.)
│   ├── utils/           # Utilitaires communs
│   └── tokens/          # Design tokens
├── turbo.json           # Configuration Turborepo
├── pnpm-workspace.yaml  # Workspace pnpm
├── package.json         # Root package.json
└── tsconfig.base.json   # TypeScript config partagee
```

### 2.2 Configuration pnpm workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// package.json (racine)
{
  "name": "my-rn-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.6.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

### 2.3 Configuration Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".expo/**"],
      "cache": true
    },
    "dev": {
      "dependsOn": ["^build"],
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

> **`dependsOn: ["^build"]`** signifie : "avant de builder cette tache, builder d'abord toutes les dépendances internes". Le `^` indique les dépendances upstream (packages dont on depend).

### 2.4 Graphe de dépendances

```
┌──────────────────────────────────────────────────────────────┐
│              Graphe de dependances du monorepo                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  apps/mobile ──────► packages/ui                             │
│       │                   │                                   │
│       │                   ├──► packages/tokens                │
│       │                   │                                   │
│       ├──────────► packages/utils                            │
│       │                                                       │
│       └──────────► packages/config                           │
│                                                               │
│  apps/admin ───────► packages/ui                             │
│       │                                                       │
│       ├──────────► packages/utils                            │
│       │                                                       │
│       └──────────► packages/config                           │
│                                                               │
│  Turbo respecte ce graphe pour l'ordre d'execution            │
│  et l'invalidation du cache.                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Packages partages

### 3.1 Package UI Library

```json
// packages/ui/package.json
{
  "name": "@monorepo/ui",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "clean": "rm -rf dist",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@monorepo/tokens": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-native": ">=0.74.0"
  },
  "devDependencies": {
    "@monorepo/config": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.6.0"
  }
}
```

```typescript
// packages/ui/src/index.ts
export { Button } from './components/Button';
export { Card } from './components/Card';
export { Input } from './components/Input';
export { Typography } from './components/Typography';
export { Avatar } from './components/Avatar';
export { Badge } from './components/Badge';
export { Spacer } from './components/Spacer';

// Re-export des types
export type { ButtonProps } from './components/Button';
export type { CardProps } from './components/Card';
export type { InputProps } from './components/Input';
```

```typescript
// packages/ui/src/components/Button.tsx
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { tokens } from '@monorepo/tokens';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const containerStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        ...containerStyles,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#fff' : tokens.colors.primary}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: tokens.colors.primary,
  },
  secondary: {
    backgroundColor: tokens.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: tokens.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_sm: {
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    minHeight: 32,
  },
  size_md: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: '#ffffff',
  },
  text_secondary: {
    color: '#ffffff',
  },
  text_outline: {
    color: tokens.colors.primary,
  },
  text_ghost: {
    color: tokens.colors.primary,
  },
  textSize_sm: {
    fontSize: tokens.fontSizes.sm,
  },
  textSize_md: {
    fontSize: tokens.fontSizes.md,
  },
  textSize_lg: {
    fontSize: tokens.fontSizes.lg,
  },
  textDisabled: {
    color: tokens.colors.textMuted,
  },
});
```

### 3.2 Package Utils

```json
// packages/utils/package.json
{
  "name": "@monorepo/utils",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  }
}
```

```typescript
// packages/utils/src/index.ts
export { formatCurrency, formatDate, formatNumber } from './formatters';
export { debounce, throttle, memoize } from './performance';
export { isEmail, isPhone, isURL } from './validators';
export { storage } from './storage';
export type { StorageAdapter } from './storage';
```

```typescript
// packages/utils/src/formatters.ts
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale: string = 'fr-FR',
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale: string = 'fr-FR',
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}
```

### 3.3 Package Config

```json
// packages/config/package.json
{
  "name": "@monorepo/config",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "files": [
    "src",
    "eslint",
    "tsconfig"
  ]
}
```

```json
// packages/config/tsconfig/react-native.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React Native",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "types": ["react-native"]
  }
}
```

```javascript
// packages/config/eslint/react-native.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
```

---

## 4. Design System

### 4.1 Design Tokens

Les design tokens sont les valeurs atomiques du design system : couleurs, espacements, typographies, ombres, rayons.

```json
// packages/tokens/package.json
{
  "name": "@monorepo/tokens",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "generate": "tsx scripts/generate-tokens.ts"
  }
}
```

```typescript
// packages/tokens/src/index.ts
export const tokens = {
  colors: {
    primary: '#0066FF',
    primaryLight: '#4D94FF',
    primaryDark: '#0047B3',
    secondary: '#6C63FF',
    secondaryLight: '#9D96FF',
    secondaryDark: '#4B45B3',

    success: '#00C48C',
    warning: '#FFB800',
    error: '#FF4D4D',
    info: '#0099FF',

    background: '#FFFFFF',
    backgroundSecondary: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    text: '#1A1A2E',
    textSecondary: '#4A4A68',
    textMuted: '#8892B0',
    textInverse: '#FFFFFF',

    border: '#E2E8F0',
    borderFocus: '#0066FF',
    divider: '#F0F0F5',

    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },

  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  radii: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    },
  },

  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  breakpoints: {
    phone: 0,
    tablet: 768,
    desktop: 1024,
  },
} as const;

export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;
export type FontSizeToken = keyof typeof tokens.fontSizes;
export type RadiusToken = keyof typeof tokens.radii;
```

### 4.2 Pipeline de génération de tokens

```typescript
// packages/tokens/scripts/generate-tokens.ts
// Genere des tokens pour differentes plateformes a partir d'une source unique

interface TokenSource {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  fontSizes: Record<string, number>;
}

function generateCSS(source: TokenSource): string {
  let css = ':root {\n';
  for (const [key, value] of Object.entries(source.colors)) {
    css += `  --color-${kebabCase(key)}: ${value};\n`;
  }
  for (const [key, value] of Object.entries(source.spacing)) {
    css += `  --spacing-${key}: ${value}px;\n`;
  }
  for (const [key, value] of Object.entries(source.fontSizes)) {
    css += `  --font-size-${key}: ${value}px;\n`;
  }
  css += '}\n';
  return css;
}

function generateReactNative(source: TokenSource): string {
  return `// Auto-generated — do not edit
export const tokens = ${JSON.stringify(source, null, 2)} as const;
`;
}

function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
```

### 4.3 Storybook pour React Native

```bash
# Installation dans le monorepo
cd apps/storybook
npx sb@latest init --type react_native
pnpm add @monorepo/ui @monorepo/tokens
```

```typescript
// apps/storybook/.storybook/main.ts
import type { StorybookConfig } from '@storybook/react-native';

const config: StorybookConfig = {
  stories: [
    '../../../packages/ui/src/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-actions',
  ],
};

export default config;
```

```typescript
// packages/ui/src/components/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    title: 'Valider',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    title: 'Annuler',
    variant: 'secondary',
    size: 'md',
  },
};

export const Loading: Story = {
  args: {
    title: 'Chargement...',
    variant: 'primary',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    title: 'Desactive',
    variant: 'primary',
    disabled: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <>
      <Button title="Petit" size="sm" onPress={() => {}} />
      <Button title="Moyen" size="md" onPress={() => {}} />
      <Button title="Grand" size="lg" onPress={() => {}} />
    </>
  ),
};
```

---

## 5. Multiple applications

### 5.1 Structure des apps

```
apps/
├── mobile/                  # App principale
│   ├── app.json
│   ├── package.json
│   ├── metro.config.js      # Config Metro pour monorepo
│   ├── src/
│   │   ├── screens/
│   │   ├── navigation/
│   │   └── App.tsx
│   └── tsconfig.json
│
├── admin/                   # App d'administration
│   ├── app.json
│   ├── package.json
│   ├── metro.config.js
│   ├── src/
│   │   ├── screens/
│   │   └── App.tsx
│   └── tsconfig.json
│
└── storybook/               # Storybook RN
    ├── app.json
    ├── package.json
    └── .storybook/
```

### 5.2 Configuration Metro pour monorepo

Metro (le bundler RN) doit etre configure pour résoudre les packages du monorepo :

```javascript
// apps/mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Racine du monorepo
const monorepoRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(__dirname);

// Permettre a Metro de resoudre les packages du monorepo
config.watchFolders = [monorepoRoot];

// Eviter les resolutions en double pour React et React Native
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Resoudre les symlinks pnpm
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
```

### 5.3 App package.json

```json
// apps/mobile/package.json
{
  "name": "@monorepo/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "lint": "eslint src/",
    "test": "jest"
  },
  "dependencies": {
    "@monorepo/ui": "workspace:*",
    "@monorepo/utils": "workspace:*",
    "@monorepo/tokens": "workspace:*",
    "expo": "~52.0.0",
    "react": "^18.3.1",
    "react-native": "0.76.0"
  },
  "devDependencies": {
    "@monorepo/config": "workspace:*"
  }
}
```

### 5.4 Partager la navigation

```typescript
// packages/ui/src/navigation/routes.ts
// Types de routes partages entre les apps

export type SharedRoutes = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
  Notifications: undefined;
};

export type AdminRoutes = SharedRoutes & {
  Dashboard: undefined;
  Users: undefined;
  UserDetail: { userId: string };
  Analytics: undefined;
};

// Les deep links sont aussi partages
export const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: '',
      Profile: 'profile/:userId',
      Settings: 'settings',
      Notifications: 'notifications',
    },
  },
};
```

---

## 6. Module Federation et micro-frontends mobile

### 6.1 Le concept

Le module federation permet a différentes équipes de développer et déployer independamment des parties d'une application :

```
┌──────────────────────────────────────────────────────────────┐
│              Module Federation en mobile                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Shell App (host)                                            │
│  ┌────────────────────────────────────────────┐              │
│  │  Navigation │ Auth │ Theme                  │              │
│  ├─────────┬─────────┬─────────┬──────────────┤              │
│  │ Feature │ Feature │ Feature │ Feature      │              │
│  │  Home   │ Profile │ Payment │ Social       │              │
│  │ (local) │ (local) │ (remote)│ (remote)     │              │
│  └─────────┴─────────┴─────────┴──────────────┘              │
│                         │              │                      │
│                    CDN/Bundle     CDN/Bundle                  │
│                    Federation    Federation                   │
│                                                               │
│  Avantages :                                                 │
│  - Equipes independantes                                     │
│  - Deploiement decouple                                      │
│  - Scalabilite organisationnelle                             │
│                                                               │
│  Attention en mobile :                                       │
│  - Plus complexe qu'en web (pas de module federation natif)  │
│  - Utiliser re.pack (Webpack pour RN) pour le federation     │
│  - Ou pattern "mini-app" avec navigation dynamique           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Pattern mini-app

```typescript
// packages/feature-registry/src/index.ts

interface FeatureModule {
  name: string;
  version: string;
  screens: Record<string, React.ComponentType<any>>;
  navigationConfig?: object;
}

class FeatureRegistry {
  private features = new Map<string, FeatureModule>();

  register(feature: FeatureModule): void {
    this.features.set(feature.name, feature);
  }

  getScreen(featureName: string, screenName: string): React.ComponentType<any> | null {
    const feature = this.features.get(featureName);
    return feature?.screens[screenName] ?? null;
  }

  getAllFeatures(): FeatureModule[] {
    return Array.from(this.features.values());
  }
}

export const registry = new FeatureRegistry();
```

```typescript
// Chaque feature s'enregistre au demarrage
// features/payment/src/index.ts
import { registry } from '@monorepo/feature-registry';
import { PaymentScreen } from './screens/PaymentScreen';
import { PaymentHistoryScreen } from './screens/PaymentHistoryScreen';

registry.register({
  name: 'payment',
  version: '1.2.0',
  screens: {
    Payment: PaymentScreen,
    PaymentHistory: PaymentHistoryScreen,
  },
});
```

### 6.3 Re.pack pour le module federation

```javascript
// webpack.config.js (apps/mobile avec re.pack)
const { createWebpackConfig } = require('@callstack/repack');
const { ModuleFederationPlugin } = require('@callstack/repack/plugins');

module.exports = (env) => {
  const config = createWebpackConfig(env);

  config.plugins.push(
    new ModuleFederationPlugin({
      name: 'host',
      shared: {
        react: { singleton: true, eager: true },
        'react-native': { singleton: true, eager: true },
      },
    }),
  );

  return config;
};
```

---

## 7. Code sharing : React Native + Web

### 7.1 react-native-web

`react-native-web` permet d'exécuter des composants React Native dans le navigateur :

```
┌──────────────────────────────────────────────────────────────┐
│              Architecture cross-platform                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  packages/ui/                                                │
│  ├── src/                                                    │
│  │   ├── Button.tsx          # Code partage (RN primitives)  │
│  │   ├── Button.web.tsx      # Override web si necessaire    │
│  │   └── Button.native.tsx   # Override natif si necessaire  │
│  │                                                           │
│  │   Metro resout .native.tsx sur mobile                     │
│  │   Vite/Webpack resout .web.tsx sur web                    │
│  │                                                           │
│  └── La majorite du code est partagee (>80%)                │
│                                                               │
│  apps/                                                       │
│  ├── mobile/    → Metro + react-native                       │
│  ├── web/       → Vite + react-native-web                    │
│  └── admin/     → Next.js + react-native-web                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Configuration web (Vite)

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
  },
  optimizeDeps: {
    include: ['react-native-web'],
  },
});
```

### 7.3 Composant cross-platform

```typescript
// packages/ui/src/components/Card.tsx
// Ce composant fonctionne sur mobile ET web sans modification

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@monorepo/tokens';

export interface CardProps {
  title: string;
  description?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

export function Card({ title, description, onPress, children }: CardProps) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={[styles.container, tokens.shadows.md]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {children && <View style={styles.content}>{children}</View>}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.fontSizes.lg,
    fontWeight: tokens.fontWeights.semibold,
    color: tokens.colors.text,
    marginBottom: tokens.spacing.xs,
  },
  description: {
    fontSize: tokens.fontSizes.md,
    color: tokens.colors.textSecondary,
    lineHeight: tokens.fontSizes.md * tokens.lineHeights.normal,
  },
  content: {
    marginTop: tokens.spacing.sm,
  },
});
```

### 7.4 Gestion des différences platform-specific

```typescript
// packages/utils/src/storage.ts

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// packages/utils/src/storage.native.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage: StorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

// packages/utils/src/storage.web.ts
export const storage: StorageAdapter = {
  getItem: async (key) => localStorage.getItem(key),
  setItem: async (key, value) => localStorage.setItem(key, value),
  removeItem: async (key) => localStorage.removeItem(key),
};
```

---

## 8. CI/CD pour monorepos

### 8.1 Principe : affected-only builds

Le gain principal d'un monorepo en CI est de ne builder/tester que les packages affectes par un changement :

```
┌──────────────────────────────────────────────────────────────┐
│              Affected-only builds                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Changement dans packages/utils                              │
│                                                               │
│  Graphe de dependances :                                     │
│  packages/utils ◄── packages/ui ◄── apps/mobile              │
│                                  ◄── apps/admin              │
│  packages/tokens ◄── packages/ui                             │
│  packages/config                                             │
│                                                               │
│  Packages affectes :                                         │
│  ✓ packages/utils    (modifie directement)                   │
│  ✓ packages/ui       (depend de utils)                       │
│  ✓ apps/mobile       (depend de ui et utils)                 │
│  ✓ apps/admin        (depend de ui et utils)                 │
│  ✗ packages/tokens   (pas affecte)                           │
│  ✗ packages/config   (pas affecte)                           │
│                                                               │
│  → On build/test seulement les 4 packages affectes           │
│  → Gain : 40-60% du temps CI sur un monorepo typique        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Turborepo Remote Cache

Turborepo peut cacher les résultats des taches dans un cache distant (Vercel, S3, ou custom) :

```bash
# Authentification au remote cache Vercel
npx turbo login

# Lier le projet
npx turbo link

# Les builds suivants utilisent le cache distant
turbo build
# >>> FULL TURBO: packages/tokens build cache hit
# >>> FULL TURBO: packages/config build cache hit
# >>> packages/ui: building... (seul package modifie)
```

```json
// turbo.json — avec remote cache
{
  "$schema": "https://turbo.build/schema.json",
  "remoteCache": {
    "signature": true
  },
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true
    }
  }
}
```

### 8.3 GitHub Actions pour monorepo

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Necessaire pour detecter les changements

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      # Turbo ne lance que les taches affectees grace au cache
      - name: Lint
        run: pnpm turbo lint --filter="...[origin/main]"

      - name: Test
        run: pnpm turbo test --filter="...[origin/main]"

      - name: Type check
        run: pnpm turbo typecheck --filter="...[origin/main]"

  build-mobile:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: |
      contains(github.event.pull_request.labels.*.name, 'mobile') ||
      github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Build preview
        run: cd apps/mobile && eas build --profile preview --platform all --non-interactive
```

### 8.4 Filtre Turborepo avance

```bash
# Filtrer par package
turbo build --filter=@monorepo/mobile

# Filtrer par changement depuis main
turbo build --filter="...[origin/main]"

# Filtrer un package ET ses dependances
turbo build --filter=@monorepo/mobile...

# Filtrer par repertoire
turbo build --filter="./packages/*"

# Combiner les filtres
turbo test --filter="@monorepo/ui...[origin/main]"
# → Teste ui et ses dependants, mais seulement si ui a change
```

---

## 9. Gestion des dépendances

### 9.1 Hoisting et phantom dependencies

```
┌──────────────────────────────────────────────────────────────┐
│              Hoisting — le probleme                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Avec npm/yarn classique, les deps sont "hoistees" :         │
│                                                               │
│  node_modules/                                               │
│  ├── react/              ← hoiste depuis apps/mobile         │
│  ├── lodash/             ← hoiste depuis packages/utils      │
│  └── @monorepo/          │                                   │
│      ├── mobile/ → ../../apps/mobile                         │
│      └── utils/  → ../../packages/utils                      │
│                                                               │
│  PROBLEME : packages/ui peut importer lodash                 │
│  meme si lodash n'est PAS dans ses dependencies !            │
│  → C'est une "phantom dependency"                            │
│  → Ca marche en dev, ca casse en prod                        │
│                                                               │
│  SOLUTION : pnpm avec hoisting strict                        │
│  pnpm utilise des symlinks et un store partage :             │
│  chaque package ne voit QUE ses deps declarees.              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Configuration pnpm stricte

```yaml
# .npmrc
# Mode strict : chaque package ne voit que ses propres deps
shamefully-hoist=false
strict-peer-dependencies=true
auto-install-peers=true

# Sauf pour React Native qui en a besoin
public-hoist-pattern[]=react
public-hoist-pattern[]=react-native
public-hoist-pattern[]=react-native-*
public-hoist-pattern[]=@react-native/*
public-hoist-pattern[]=expo
public-hoist-pattern[]=expo-*
```

### 9.3 Peer dependencies

```json
// packages/ui/package.json — les bonnes pratiques
{
  "name": "@monorepo/ui",
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-native": ">=0.74.0"
  },
  "peerDependenciesMeta": {
    "react-native": {
      "optional": true
    }
  },
  "devDependencies": {
    "react": "^18.3.1",
    "react-native": "0.76.0"
  }
}
```

> **Regle** : les librairies partagees (`packages/ui`, `packages/utils`) declarent `react` et `react-native` en `peerDependencies`. Seules les apps les ont en `dependencies`. Cela evite les doublons de React dans le bundle.

### 9.4 Resolution de conflits

```json
// package.json (racine) — forcer une version
{
  "pnpm": {
    "overrides": {
      "react": "^18.3.1",
      "react-native": "0.76.0",
      "typescript": "^5.6.0"
    },
    "peerDependencyRules": {
      "ignoreMissing": [
        "@babel/*",
        "metro-*"
      ],
      "allowedVersions": {
        "react": "18"
      }
    }
  }
}
```

---

## 10. Projet pratique : monorepo avec shared UI + 2 apps

### 10.1 Récapitulatif de l'architecture

```
┌──────────────────────────────────────────────────────────────┐
│              Architecture du projet final                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  my-rn-monorepo/                                             │
│  ├── apps/                                                   │
│  │   ├── mobile/          # App client principale            │
│  │   │   ├── src/                                            │
│  │   │   │   ├── screens/HomeScreen.tsx                      │
│  │   │   │   ├── screens/ProfileScreen.tsx                   │
│  │   │   │   └── App.tsx                                     │
│  │   │   └── metro.config.js                                 │
│  │   │                                                       │
│  │   └── admin/           # App administration               │
│  │       ├── src/                                            │
│  │       │   ├── screens/DashboardScreen.tsx                 │
│  │       │   ├── screens/UsersScreen.tsx                     │
│  │       │   └── App.tsx                                     │
│  │       └── metro.config.js                                 │
│  │                                                           │
│  ├── packages/                                               │
│  │   ├── ui/              # Button, Card, Input, etc.        │
│  │   ├── tokens/          # Couleurs, spacing, fonts         │
│  │   ├── utils/           # Formatters, validators           │
│  │   └── config/          # ESLint, TSconfig partages        │
│  │                                                           │
│  ├── turbo.json                                              │
│  ├── pnpm-workspace.yaml                                     │
│  └── package.json                                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 10.2 HomeScreen utilisant les packages partages

```typescript
// apps/mobile/src/screens/HomeScreen.tsx
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Button, Card, Typography, Spacer } from '@monorepo/ui';
import { tokens } from '@monorepo/tokens';
import { formatCurrency, formatDate } from '@monorepo/utils';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Restaurant', amount: -42.5, date: '2025-03-14' },
  { id: '2', description: 'Salaire', amount: 3200, date: '2025-03-01' },
  { id: '3', description: 'Courses', amount: -87.3, date: '2025-03-10' },
];

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Typography variant="h1">Mon compte</Typography>
      <Spacer size="md" />

      <FlatList
        data={TRANSACTIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card title={item.description}>
            <Typography
              variant="body"
              color={item.amount > 0 ? 'success' : 'error'}
            >
              {formatCurrency(item.amount)}
            </Typography>
            <Typography variant="caption" color="textMuted">
              {formatDate(item.date)}
            </Typography>
          </Card>
        )}
      />

      <Button
        title="Nouvelle transaction"
        variant="primary"
        size="lg"
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background,
  },
});
```

### 10.3 DashboardScreen (admin)

```typescript
// apps/admin/src/screens/DashboardScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Typography, Badge, Spacer } from '@monorepo/ui';
import { tokens } from '@monorepo/tokens';
import { formatNumber } from '@monorepo/utils';

// Les memes composants @monorepo/ui, les memes tokens
// Seules les screens et la logique metier different

export function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Typography variant="h1">Dashboard Admin</Typography>
      <Spacer size="lg" />

      <View style={styles.grid}>
        <Card title="Utilisateurs actifs">
          <Typography variant="display">
            {formatNumber(12847)}
          </Typography>
          <Badge variant="success" label="+12% ce mois" />
        </Card>

        <Card title="Revenus">
          <Typography variant="display">
            {formatNumber(94523, { style: 'currency', currency: 'EUR' })}
          </Typography>
          <Badge variant="warning" label="-3% ce mois" />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background,
  },
  grid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
});
```

### 10.4 Commandes de travail quotidien

```bash
# Demarrer l'app mobile
turbo dev --filter=@monorepo/mobile

# Demarrer l'app admin
turbo dev --filter=@monorepo/admin

# Lancer les tests de tous les packages affectes
turbo test --filter="...[HEAD~1]"

# Builder toute la chaine pour mobile
turbo build --filter=@monorepo/mobile...

# Ajouter une dependance a un package
pnpm --filter @monorepo/ui add react-native-reanimated

# Ajouter un package interne comme dependance
pnpm --filter @monorepo/mobile add @monorepo/ui@workspace:*
```

---

## 11. Résumé et aide-mémoire

### 11.1 Structure type

| Élément | Emplacement | Role |
|---------|-------------|------|
| Apps | `apps/` | Applications deployables |
| Packages | `packages/` | Librairies partagees internes |
| Config | `packages/config/` | ESLint, TSConfig, Prettier partages |
| Tokens | `packages/tokens/` | Design tokens (couleurs, espaces) |
| UI | `packages/ui/` | Composants partages |
| Utils | `packages/utils/` | Utilitaires (formatters, validators) |

### 11.2 Commandes essentielles

| Commande | Action |
|----------|--------|
| `turbo build` | Builder tout (avec cache) |
| `turbo dev --filter=app` | Dev sur une app spécifique |
| `turbo test --filter="...[origin/main]"` | Tester les packages affectes |
| `pnpm --filter @pkg add dep` | Ajouter une dépendance à un package |
| `pnpm install --frozen-lockfile` | Install CI (lockfile strict) |

### 11.3 Checklist monorepo RN

```
┌──────────────────────────────────────────────────────────────┐
│  Checklist Monorepo React Native                              │
│                                                               │
│  [ ] pnpm-workspace.yaml configure (apps/* + packages/*)     │
│  [ ] turbo.json avec dependsOn et outputs corrects           │
│  [ ] Metro config avec watchFolders pour les packages        │
│  [ ] .npmrc : hoist patterns pour RN + strict mode           │
│  [ ] Peer dependencies correctes dans les packages           │
│  [ ] TSConfig extends depuis packages/config                 │
│  [ ] ESLint extends depuis packages/config                   │
│  [ ] Design tokens dans un package dedie                     │
│  [ ] CI avec --filter pour affected-only                     │
│  [ ] Remote cache Turbo (Vercel ou custom)                   │
│  [ ] CODEOWNERS par dossier pour les reviews                 │
│  [ ] README dans chaque package                              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Exercices du module

Rendez-vous au [Lab 26](/labs/lab-26-patterns-monorepo/) pour pratiquer les concepts vus dans ce module. Le lab simule en TypeScript pur les mécanismes de résolution de workspaces, de detection des packages affectes, de pipeline de tokens, de publication et de build cache propres aux monorepos.

---

## Navigation

| Précédent | Suivant |
|:---------:|:-------:|
| [Module 25 — Hermes et mode Bridgeless](./25-hermes-internals-bridgeless.md) | [Module 27 — Projet final](./27-projet-final.md) |

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 26 patterns](../screencasts/screencast-26-patterns.md)
2. **Lab** : [lab-26-patterns-monorepo](../labs/lab-26-patterns-monorepo/README)
3. **Quiz** : [quiz 26 patterns](../quizzes/quiz-26-patterns.html)
:::
