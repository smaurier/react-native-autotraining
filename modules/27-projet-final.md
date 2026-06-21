# Module 27 : Projet final — NomadNote

| Metadata       | Valeur                                                       |
| -------------- | ------------------------------------------------------------ |
| **Difficulte** | 5/5                                                          |
| **Duree**      | 480 min (8 heures, reparties sur plusieurs sessions)         |
| **Prérequis**  | Modules 00-26 (l'ensemble du parcours)                       |
| **Lab**        | [Lab 27 — Projet final](/labs/lab-27-projet-final/)          |
| **Quiz**       | [Quiz 27 — Projet final](/quizzes/quiz-27-projet-final.html) |

---

## Objectifs du module

- Intégrer l'ensemble des compétences acquises dans les modules 00-26
- Concevoir et implementer une application mobile complete, production-ready
- Appliquer les patterns d'architecture offline-first avec synchronisation
- Mettre en place un système de collaboration en temps réel
- Construire une pipeline CI/CD complete avec EAS
- Maîtriser le cycle complet : conception, implementation, tests, déploiement

---

## Vue d'ensemble du projet

### NomadNote — Application de notes collaborative offline-first

NomadNote est une application de prise de notes collaborative concu pour les utilisateurs nomades. Elle fonctionne parfaitement hors ligne et synchronise automatiquement les donnees lorsque la connectivite est retrouvee. Les notes peuvent etre enrichies de photos, de positions geographiques et partagees entre collaborateurs.

```
┌──────────────────────────────────────────────────────────────────────┐
│                     NomadNote — Architecture                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐  │
│   │  Ecran Notes  │     │  Ecran Edition   │     │  Ecran Profil  │  │
│   │  (FlatList)   │     │  (RichText)      │     │  (Settings)    │  │
│   └──────┬───────┘     └────────┬─────────┘     └───────┬────────┘  │
│          │                      │                       │            │
│   ┌──────┴──────────────────────┴───────────────────────┴──────┐    │
│   │                    Navigation (React Navigation)            │    │
│   │              Tabs + Stack + Auth Flow + Deep Links          │    │
│   └──────────────────────────┬─────────────────────────────────┘    │
│                              │                                       │
│   ┌──────────────────────────┴─────────────────────────────────┐    │
│   │                     State Management                        │    │
│   │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │    │
│   │  │   Zustand    │  │ React Query  │  │  Offline Queue   │  │    │
│   │  │ (UI state)   │  │ (server)     │  │  (sync engine)   │  │    │
│   │  └─────────────┘  └──────────────┘  └──────────────────┘  │    │
│   └──────────────────────────┬─────────────────────────────────┘    │
│                              │                                       │
│   ┌──────────────────────────┴─────────────────────────────────┐    │
│   │                     Couche donnees                          │    │
│   │  ┌──────────┐  ┌──────────────┐  ┌─────────────────────┐  │    │
│   │  │ MMKV /   │  │ SQLite       │  │  API REST + WebSocket│  │    │
│   │  │ AsyncStor │  │ (WatermelonDB│  │  (serveur distant)  │  │    │
│   │  └──────────┘  └──────────────┘  └─────────────────────┘  │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                     Couche native                          │    │
│   │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │    │
│   │  │ Turbo Module │  │  Fabric Comp │  │  Expo Modules  │  │    │
│   │  │ (encryption) │  │ (rich text)  │  │ (camera, geo)  │  │    │
│   │  └──────────────┘  └──────────────┘  └────────────────┘  │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 1. Specification fonctionnelle

### 1.1 Fonctionnalites principales

| Fonctionnalite   | Description                           | Module(s)  |
| ---------------- | ------------------------------------- | ---------- |
| Authentification | Inscription, connexion, token refresh | 08, 09, 12 |
| Liste de notes   | Affichage, tri, filtrage, recherche   | 01-04      |
| Edition de notes | Texte riche, Markdown, tags           | 07, 11, 24 |
| Photos           | Capture camera, galerie, miniatures   | 15         |
| Geolocalisation  | Taguer une note avec un lieu          | 15         |
| Offline-first    | Lecture/écriture sans connexion       | 14         |
| Synchronisation  | Push/pull, résolution de conflits     | 14         |
| Collaboration    | Partage, permissions, notifications   | 16         |
| Chiffrement      | E2E encryption des notes privees      | 23         |
| Animations       | Transitions fluides, gestes swipe     | 17, 18     |
| Performance      | Optimisation startup, listes, mémoire | 19, 25     |
| Tests            | Unit, intégration, E2E complets       | 20, 21     |
| CI/CD            | Pipeline EAS, OTA updates             | 22         |
| Monorepo         | Extension web optionnelle             | 26         |

### 1.2 User stories prioritaires

**P0 — Critique (MVP)**

- En tant qu'utilisateur, je peux créer, editer et supprimer des notes
- En tant qu'utilisateur, je peux utiliser l'application hors ligne
- En tant qu'utilisateur, je peux me connecter et retrouver mes notes

**P1 — Important**

- En tant qu'utilisateur, je peux organiser mes notes avec des tags
- En tant qu'utilisateur, je peux rechercher dans mes notes
- En tant qu'utilisateur, je peux ajouter des photos a mes notes
- En tant qu'utilisateur, je peux partager une note avec un collaborateur

**P2 — Nice to have**

- En tant qu'utilisateur, je recois des notifications quand une note partagee est modifiee
- En tant qu'utilisateur, je peux chiffrer mes notes sensibles
- En tant qu'utilisateur, je peux taguer mes notes avec ma position

---

## 2. Architecture technique

### 2.1 Structure du projet

```
nomad-note/
├── apps/
│   └── mobile/                    # Application React Native
│       ├── app/                   # Ecrans (Expo Router)
│       │   ├── (auth)/            # Groupe auth (login, register)
│       │   ├── (tabs)/            # Navigation par onglets
│       │   │   ├── notes/         # Stack notes (list, detail, edit)
│       │   │   ├── search/        # Recherche globale
│       │   │   └── profile/       # Profil et parametres
│       │   ├── _layout.tsx        # Root layout
│       │   └── +not-found.tsx     # 404
│       ├── components/            # Composants reutilisables
│       │   ├── ui/                # Design system (Button, Input, Card...)
│       │   ├── notes/             # Composants metier notes
│       │   └── shared/            # Composants partages
│       ├── hooks/                 # Hooks personnalises
│       ├── stores/                # Zustand stores
│       ├── services/              # API client, sync engine
│       ├── utils/                 # Utilitaires purs
│       ├── theme/                 # Tokens, theming
│       └── __tests__/             # Tests
├── packages/
│   ├── shared/                    # Code partage mobile/web
│   │   ├── models/                # Types et schemas Zod
│   │   ├── validation/            # Regles de validation
│   │   └── crypto/                # Utilitaires cryptographiques
│   └── turbo-encryption/          # Turbo Module natif
└── tools/                         # Scripts CI, configs
```

### 2.2 Choix techniques justifies

#### State management — Pourquoi Zustand + React Query (modules 10, 13)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Separation des etats                          │
├──────────────────────────┬──────────────────────────────────────┤
│       Zustand            │           React Query                │
│  (etat client/UI)        │       (etat serveur)                 │
├──────────────────────────┼──────────────────────────────────────┤
│  - Theme actif           │  - Liste des notes                   │
│  - Sidebar ouverte/fermee│  - Detail d'une note                 │
│  - Brouillon en cours    │  - Profil utilisateur                │
│  - Filtres actifs        │  - Liste collaborateurs              │
│  - Mode hors ligne       │  - Statut de synchronisation         │
└──────────────────────────┴──────────────────────────────────────┘
```

Le choix Zustand + React Query suit le principe de **separation des responsabilites** :

- **Zustand** géré l'état qui n'existe que cote client (UI, preferences, brouillons)
- **React Query** géré l'état qui vient du serveur (cache, revalidation, pagination)
- Cette separation evite la duplication d'état et les bugs de desynchronisation

#### Offline-first — Stratégie de synchronisation (module 14)

```
┌────────────────────────────────────────────────────────────────────┐
│                  Flux de synchronisation                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐    ┌───────────────┐    ┌────────────────────────┐  │
│  │  Action   │───>│  Offline Queue │───>│  Sync Engine           │  │
│  │  utilisat │    │  (FIFO)        │    │                        │  │
│  └──────────┘    └───────────────┘    │  1. Push local changes  │  │
│                                        │  2. Pull remote changes │  │
│  ┌──────────┐    ┌───────────────┐    │  3. Resolve conflicts   │  │
│  │  UI       │<───│  Local DB      │<───│  4. Update local DB    │  │
│  │  (React   │    │  (MMKV/SQLite) │    │  5. Notify UI          │  │
│  │   Query)  │    │                │    └────────────────────────┘  │
│  └──────────┘    └───────────────┘                                 │
│                                                                    │
│  Resolution de conflits :                                          │
│  - Last-Write-Wins (LWW) par defaut                               │
│  - Merge automatique pour les champs non conflictuels              │
│  - Prompt utilisateur pour les conflits sur le meme champ          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.3 Modèle de donnees

```typescript
// ─── Note ────────────────────────────────────────────────────
interface Note {
  id: string; // UUID v4
  title: string;
  content: string; // Markdown ou texte riche
  tags: string[];
  authorId: string;
  collaborators: Collaborator[];
  location?: GeoLocation;
  attachments: Attachment[];
  isEncrypted: boolean;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: number; // Timestamp ms
  updatedAt: number;
  syncVersion: number; // Pour resolution de conflits
  deletedAt?: number; // Soft delete
}

// ─── Types secondaires ───────────────────────────────────────
interface GeoLocation {
  latitude: number;
  longitude: number;
  label?: string;
}

interface Attachment {
  id: string;
  type: "image" | "file";
  uri: string;
  thumbnailUri?: string;
  size: number;
  createdAt: number;
}

interface Collaborator {
  userId: string;
  email: string;
  permission: "read" | "write" | "admin";
  addedAt: number;
}
```

### 2.4 Schema de validation Zod (module 11)

```typescript
import { z } from "zod";

const GeoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: z.string().max(100).optional(),
});

const AttachmentSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["image", "file"]),
  uri: z.string().url(),
  thumbnailUri: z.string().url().optional(),
  size: z.number().positive(),
  createdAt: z.number().positive(),
});

const CollaboratorSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  permission: z.enum(["read", "write", "admin"]),
  addedAt: z.number().positive(),
});

const NoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().max(50000),
  tags: z.array(z.string().min(1).max(50)).max(20),
  authorId: z.string().uuid(),
  collaborators: z.array(CollaboratorSchema),
  location: GeoLocationSchema.optional(),
  attachments: z.array(AttachmentSchema),
  isEncrypted: z.boolean(),
  isArchived: z.boolean(),
  isPinned: z.boolean(),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
  syncVersion: z.number().int().nonnegative(),
  deletedAt: z.number().positive().optional(),
});

// Schema pour le formulaire de creation
const CreateNoteSchema = NoteSchema.pick({
  title: true,
  content: true,
  tags: true,
}).extend({
  location: GeoLocationSchema.optional(),
});
```

---

## 3. Jalons d'implementation

Le projet se decompose en 12 jalons progressifs. Chaque jalon produit un increment fonctionnel testable.

---

### Jalon 1 : Scaffolding et design system (60 min)

**Modules appliques** : 05 (StyleSheet), 06 (Flexbox/responsive), 07 (composants réutilisables)

#### Objectif

Mettre en place le socle du projet : structure de dossiers, theme, composants UI de base.

#### Etapes

1. Initialiser le projet Expo avec le template `expo-router`
2. Configurer TypeScript strict, ESLint, Prettier
3. Créer le système de tokens/theming

```typescript
// theme/tokens.ts
export const tokens = {
  colors: {
    // Palette principale
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
    },
    // Surfaces
    surface: {
      background: "#ffffff",
      card: "#f8fafc",
      elevated: "#ffffff",
    },
    // Semantique
    semantic: {
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
    // Texte
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      disabled: "#94a3b8",
      inverse: "#ffffff",
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: "700" as const, lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: "600" as const, lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: "600" as const, lineHeight: 28 },
    body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  },
} as const;
```

4. Implementer les composants UI de base

```typescript
// components/ui/Button.tsx
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { tokens } from '@/theme/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={tokens.colors.text.inverse} />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`]]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: tokens.colors.primary[600],
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.primary[600],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_sm: {
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
  },
  size_md: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
  },
  size_lg: {
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  text: {
    ...tokens.typography.body,
    fontWeight: '600',
  },
  text_primary: { color: tokens.colors.text.inverse },
  text_secondary: { color: tokens.colors.primary[600] },
  text_ghost: { color: tokens.colors.primary[600] },
});
```

5. Implementer `Card`, `Input`, `Badge`, `Avatar`, `EmptyState`

#### Validation du jalon

- [ ] Les composants UI sont isoles et réutilisables
- [ ] Le theming fonctionne avec des tokens centralises
- [ ] Le responsive s'adapte a différentes tailles d'ecran
- [ ] Accessibilité : chaque composant a des `accessibilityRole` et `accessibilityLabel` corrects

---

### Jalon 2 : Navigation et authentification (45 min)

**Modules appliques** : 08 (navigation), 09 (deep links, auth flow), 12 (API client)

#### Objectif

Mettre en place la navigation complete et le flux d'authentification.

#### Etapes

1. Configurer Expo Router avec la structure de fichiers

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
      <Stack.Screen
        name="note/[id]"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  );
}
```

2. Configurer les onglets de navigation

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tokens.colors.primary[600],
        tabBarInactiveTintColor: tokens.colors.text.disabled,
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

3. Implementer le store d'authentification

```typescript
// stores/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "@/utils/storage";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await apiClient.post("/auth/login", {
          email,
          password,
        });
        set({
          token: response.data.token,
          refreshToken: response.data.refreshToken,
          user: response.data.user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;
        const response = await apiClient.post("/auth/refresh", {
          refreshToken,
        });
        set({
          token: response.data.token,
          refreshToken: response.data.refreshToken,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
```

4. Configurer le deep linking

```typescript
// app.config.ts (extrait)
export default {
  scheme: "nomadnote",
  plugins: [
    [
      "expo-linking",
      {
        prefixes: ["nomadnote://", "https://nomadnote.app"],
      },
    ],
  ],
};
```

#### Validation du jalon

- [ ] Navigation tabs + stack fonctionne
- [ ] Auth flow redirige correctement selon l'état de connexion
- [ ] Deep link `nomadnote://note/abc123` ouvre la bonne note
- [ ] Token persiste entre les sessions via MMKV

---

### Jalon 3 : CRUD des notes et state management (60 min)

**Modules appliques** : 01-03 (JSX, props, state), 10 (Zustand), 11 (formulaires/validation)

#### Objectif

Implementer la création, lecture, modification et suppression de notes avec un formulaire valide et un store Zustand.

#### Etapes

1. Créer le store Zustand pour les notes locales

```typescript
// stores/notesStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface NotesState {
  notes: Map<string, Note>;
  draftNote: Partial<Note> | null;

  // Actions
  createNote: (data: CreateNoteInput) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  archiveNote: (id: string) => void;
  pinNote: (id: string) => void;

  // Brouillons
  saveDraft: (draft: Partial<Note>) => void;
  clearDraft: () => void;

  // Queries
  getNoteById: (id: string) => Note | undefined;
  getActiveNotes: () => Note[];
  getArchivedNotes: () => Note[];
}

export const useNotesStore = create<NotesState>()(
  persist(
    immer((set, get) => ({
      notes: new Map(),
      draftNote: null,

      createNote: (data) => {
        const note: Note = {
          id: generateUUID(),
          ...data,
          authorId: useAuthStore.getState().user!.id,
          collaborators: [],
          attachments: [],
          isEncrypted: false,
          isArchived: false,
          isPinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          syncVersion: 0,
        };
        set((state) => {
          state.notes.set(note.id, note);
        });
        return note;
      },

      updateNote: (id, updates) => {
        set((state) => {
          const note = state.notes.get(id);
          if (note) {
            Object.assign(note, updates, {
              updatedAt: Date.now(),
              syncVersion: note.syncVersion + 1,
            });
          }
        });
      },

      deleteNote: (id) => {
        set((state) => {
          const note = state.notes.get(id);
          if (note) {
            note.deletedAt = Date.now();
            note.updatedAt = Date.now();
            note.syncVersion += 1;
          }
        });
      },

      archiveNote: (id) => {
        set((state) => {
          const note = state.notes.get(id);
          if (note) {
            note.isArchived = !note.isArchived;
            note.updatedAt = Date.now();
            note.syncVersion += 1;
          }
        });
      },

      pinNote: (id) => {
        set((state) => {
          const note = state.notes.get(id);
          if (note) {
            note.isPinned = !note.isPinned;
            note.updatedAt = Date.now();
          }
        });
      },

      saveDraft: (draft) => set({ draftNote: draft }),
      clearDraft: () => set({ draftNote: null }),

      getNoteById: (id) => get().notes.get(id),
      getActiveNotes: () =>
        Array.from(get().notes.values())
          .filter((n) => !n.isArchived && !n.deletedAt)
          .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return b.updatedAt - a.updatedAt;
          }),
      getArchivedNotes: () =>
        Array.from(get().notes.values())
          .filter((n) => n.isArchived && !n.deletedAt)
          .sort((a, b) => b.updatedAt - a.updatedAt),
    })),
    {
      name: "notes-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
```

2. Créer le formulaire d'edition avec React Hook Form + Zod

```typescript
// components/notes/NoteEditor.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const NoteFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  content: z.string().max(50000),
  tags: z.array(z.string().min(1).max(50)).max(20),
});

type NoteFormData = z.infer<typeof NoteFormSchema>;

export function NoteEditor({ noteId }: { noteId?: string }) {
  const note = useNotesStore((s) => s.getNoteById(noteId ?? ''));
  const createNote = useNotesStore((s) => s.createNote);
  const updateNote = useNotesStore((s) => s.updateNote);

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<NoteFormData>({
    resolver: zodResolver(NoteFormSchema),
    defaultValues: {
      title: note?.title ?? '',
      content: note?.content ?? '',
      tags: note?.tags ?? [],
    },
  });

  const onSubmit = (data: NoteFormData) => {
    if (noteId && note) {
      updateNote(noteId, data);
    } else {
      createNote(data);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="Titre de la note"
            value={value}
            onChangeText={onChange}
            error={errors.title?.message}
            accessibilityLabel="Titre de la note"
          />
        )}
      />

      <Controller
        control={control}
        name="content"
        render={({ field: { onChange, value } }) => (
          <RichTextEditor
            value={value}
            onChangeText={onChange}
            placeholder="Ecrivez votre note..."
          />
        )}
      />

      <TagInput
        control={control}
        name="tags"
        error={errors.tags?.message}
      />

      <Button
        title={noteId ? 'Enregistrer' : 'Creer la note'}
        onPress={handleSubmit(onSubmit)}
        disabled={!isDirty}
      />
    </KeyboardAvoidingView>
  );
}
```

#### Validation du jalon

- [ ] CRUD complet fonctionne localement
- [ ] La validation Zod bloque les saisies invalides
- [ ] Les donnees persistent entre les redemarrages via Zustand + MMKV
- [ ] Le brouillon est sauvegarde automatiquement

---

### Jalon 4 : Liste de notes et recherche (45 min)

**Modules appliques** : 04 (FlatList/FlashList), 05-06 (styles), 17-18 (animations)

#### Objectif

Afficher les notes dans une liste performante avec recherche en temps réel et animations.

#### Etapes

1. Implementer la liste avec FlashList

```typescript
// app/(tabs)/notes/index.tsx
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

export default function NotesListScreen() {
  const notes = useNotesStore((s) => s.getActiveNotes());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    return fullTextSearch(notes, searchQuery);
  }, [notes, searchQuery]);

  const renderItem = useCallback(({ item }: { item: Note }) => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
      <NoteCard
        note={item}
        onPress={() => router.push(`/note/${item.id}`)}
        onSwipeLeft={() => handleArchive(item.id)}
        onSwipeRight={() => handleDelete(item.id)}
      />
    </Animated.View>
  ), []);

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher dans les notes..."
      />

      <FlashList
        data={filteredNotes}
        renderItem={renderItem}
        estimatedItemSize={120}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Aucune note"
            message="Creez votre premiere note !"
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FAB
        icon="add"
        onPress={() => router.push('/note/new')}
        accessibilityLabel="Creer une note"
      />
    </View>
  );
}
```

2. Implementer le composant NoteCard avec gestes de swipe

```typescript
// components/notes/NoteCard.tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const SWIPE_THRESHOLD = 100;

export function NoteCard({ note, onPress, onSwipeLeft, onSwipeRight }: NoteCardProps) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(onSwipeLeft)();
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <Pressable onPress={onPress} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {note.title}
            </Text>
            {note.isPinned && <Ionicons name="pin" size={16} />}
            {note.isEncrypted && <Ionicons name="lock-closed" size={16} />}
          </View>
          <Text style={styles.preview} numberOfLines={2}>
            {note.content}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.date}>
              {formatRelativeDate(note.updatedAt)}
            </Text>
            <View style={styles.tags}>
              {note.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} label={tag} size="sm" />
              ))}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}
```

3. Implementer la recherche full-text

```typescript
// utils/search.ts
export function fullTextSearch(notes: Note[], query: string): Note[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return notes
    .map((note) => {
      const searchable = [
        note.title,
        note.content,
        ...note.tags,
        note.location?.label ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const score = terms.reduce((acc, term) => {
        if (note.title.toLowerCase().includes(term)) return acc + 3;
        if (note.tags.some((t) => t.toLowerCase().includes(term)))
          return acc + 2;
        if (searchable.includes(term)) return acc + 1;
        return acc;
      }, 0);

      return { note, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ note }) => note);
}
```

#### Validation du jalon

- [ ] FlashList affiche les notes avec performances fluides
- [ ] Recherche en temps réel avec debounce
- [ ] Animations de swipe pour archiver/supprimer
- [ ] Tri par epingles en premier, puis par date de modification

---

### Jalon 5 : API client et React Query (45 min)

**Modules appliques** : 12 (API client), 13 (React Query)

#### Objectif

Connecter l'application à une API REST avec authentification, cache et synchronisation via React Query.

#### Etapes

1. Créer le client API avec intercepteurs

```typescript
// services/apiClient.ts
import { useAuthStore } from "@/stores/authStore";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.nomadnote.app";

interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(config: RequestConfig): Promise<T> {
    const { token } = useAuthStore.getState();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...config.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${config.path}`, {
      method: config.method,
      headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    if (response.status === 401) {
      // Tenter un refresh
      await useAuthStore.getState().refreshAuth();
      // Rejouer la requete
      return this.request(config);
    }

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }

  get<T>(path: string) {
    return this.request<T>({ method: "GET", path });
  }
  post<T>(path: string, body: unknown) {
    return this.request<T>({ method: "POST", path, body });
  }
  put<T>(path: string, body: unknown) {
    return this.request<T>({ method: "PUT", path, body });
  }
  delete<T>(path: string) {
    return this.request<T>({ method: "DELETE", path });
  }
}

export const apiClient = new ApiClient(BASE_URL);
```

2. Configurer React Query pour les notes

```typescript
// hooks/useNotes.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const noteKeys = {
  all: ["notes"] as const,
  lists: () => [...noteKeys.all, "list"] as const,
  list: (filters: NoteFilters) => [...noteKeys.lists(), filters] as const,
  details: () => [...noteKeys.all, "detail"] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
};

export function useNotes(filters?: NoteFilters) {
  return useQuery({
    queryKey: noteKeys.list(filters ?? {}),
    queryFn: () => apiClient.get<Note[]>("/notes", { params: filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => apiClient.get<Note>(`/notes/${id}`),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNoteInput) => apiClient.post<Note>("/notes", data),

    // Optimistic update
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.lists() });
      const previous = queryClient.getQueryData(noteKeys.lists());

      queryClient.setQueryData(noteKeys.lists(), (old: Note[] = []) => [
        { ...newNote, id: "temp-" + Date.now(), createdAt: Date.now() },
        ...old,
      ]);

      return { previous };
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(noteKeys.lists(), context?.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}
```

#### Validation du jalon

- [ ] L'API client géré l'authentification (token, refresh)
- [ ] React Query met en cache les notes et revalide correctement
- [ ] Les mutations optimistes fonctionnent (create, update, delete)
- [ ] Le factory pattern de clés de query permet une invalidation précisé

---

### Jalon 6 : Offline-first et synchronisation (60 min)

**Modules appliques** : 14 (stockage local, offline-first)

#### Objectif

Permettre une utilisation complete hors ligne et synchroniser automatiquement les donnees.

#### Architecture du sync engine

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sync Engine — Flux detaille                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DETECTION CONNECTIVITE                                       │
│     NetInfo.addEventListener → online/offline                    │
│                                                                  │
│  2. MODE OFFLINE (pas de connexion)                              │
│     ┌──────────┐    ┌────────────────┐                          │
│     │  Action   │───>│  Offline Queue  │                         │
│     │  (CRUD)   │    │  (MMKV, FIFO)  │                          │
│     └──────────┘    └────────────────┘                           │
│     Les actions sont mises en file d'attente                     │
│     L'UI lit depuis le store local                               │
│                                                                  │
│  3. RETOUR EN LIGNE → SYNC                                       │
│     ┌────────────────┐    ┌───────────┐    ┌─────────────────┐  │
│     │  Offline Queue  │───>│  Push      │───>│  Serveur        │  │
│     │  (drain)        │    │  (batch)   │    │  (traitement)   │  │
│     └────────────────┘    └───────────┘    └────────┬────────┘  │
│                                                      │           │
│     ┌────────────────┐    ┌───────────┐              │           │
│     │  Local DB       │<───│  Pull      │<─────────────┘          │
│     │  (mise a jour)  │    │  (delta)   │                        │
│     └────────────────┘    └───────────┘                          │
│                                                                  │
│  4. RESOLUTION DE CONFLITS                                       │
│     - Comparer syncVersion local vs remote                       │
│     - Si remote.syncVersion > local.syncVersion → prendre remote │
│     - Si les deux ont change → merge champ par champ             │
│     - Conflit sur le meme champ → LWW (Last Write Wins)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

```typescript
// services/syncEngine.ts
import NetInfo from "@react-native-community/netinfo";

interface SyncOperation {
  id: string;
  type: "create" | "update" | "delete";
  entityType: "note";
  entityId: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  errors: SyncError[];
}

class SyncEngine {
  private queue: SyncOperation[] = [];
  private status: SyncStatus = {
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    errors: [],
  };
  private listeners = new Set<(status: SyncStatus) => void>();

  constructor() {
    // Ecouter les changements de connectivite
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.status.isOnline;
      this.status.isOnline = state.isConnected ?? false;

      if (wasOffline && this.status.isOnline) {
        // Retour en ligne → synchroniser
        this.sync();
      }
      this.notify();
    });
  }

  enqueue(operation: Omit<SyncOperation, "id" | "timestamp" | "retryCount">) {
    const op: SyncOperation = {
      ...operation,
      id: generateUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.queue.push(op);
    this.status.pendingCount = this.queue.length;
    this.persist();
    this.notify();

    // Si en ligne, synchroniser immediatement
    if (this.status.isOnline) {
      this.sync();
    }
  }

  async sync(): Promise<void> {
    if (this.status.isSyncing || !this.status.isOnline) return;

    this.status.isSyncing = true;
    this.notify();

    try {
      // Phase 1 : Push (envoyer les operations locales)
      await this.push();

      // Phase 2 : Pull (recuperer les modifications distantes)
      await this.pull();

      this.status.lastSyncAt = Date.now();
      this.status.errors = [];
    } catch (error) {
      this.status.errors.push({
        message: error instanceof Error ? error.message : "Erreur de sync",
        timestamp: Date.now(),
      });
    } finally {
      this.status.isSyncing = false;
      this.notify();
    }
  }

  private async push(): Promise<void> {
    const operations = [...this.queue];

    for (const op of operations) {
      try {
        await this.executeOperation(op);
        this.queue = this.queue.filter((o) => o.id !== op.id);
        this.status.pendingCount = this.queue.length;
      } catch (error) {
        op.retryCount++;
        if (op.retryCount >= 3) {
          this.queue = this.queue.filter((o) => o.id !== op.id);
          this.status.errors.push({
            message: `Operation ${op.id} echouee apres 3 tentatives`,
            timestamp: Date.now(),
          });
        }
      }
    }

    this.persist();
  }

  private async pull(): Promise<void> {
    const lastSync = this.status.lastSyncAt ?? 0;
    const remoteChanges = await apiClient.get<Note[]>(
      `/notes/changes?since=${lastSync}`,
    );

    for (const remoteNote of remoteChanges) {
      const localNote = useNotesStore.getState().getNoteById(remoteNote.id);

      if (!localNote) {
        // Nouvelle note distante → creer localement
        useNotesStore.getState().createNote(remoteNote);
      } else if (remoteNote.syncVersion > localNote.syncVersion) {
        // Version distante plus recente → ecraser
        useNotesStore.getState().updateNote(remoteNote.id, remoteNote);
      } else if (remoteNote.syncVersion === localNote.syncVersion) {
        // Meme version → pas de conflit
      } else {
        // Conflit → merge champ par champ
        const merged = this.resolveConflict(localNote, remoteNote);
        useNotesStore.getState().updateNote(merged.id, merged);
      }
    }
  }

  private resolveConflict(local: Note, remote: Note): Note {
    // Strategie Last-Write-Wins par champ
    return {
      ...local,
      title: remote.updatedAt > local.updatedAt ? remote.title : local.title,
      content:
        remote.updatedAt > local.updatedAt ? remote.content : local.content,
      tags: remote.updatedAt > local.updatedAt ? remote.tags : local.tags,
      syncVersion: Math.max(local.syncVersion, remote.syncVersion) + 1,
      updatedAt: Date.now(),
    };
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.status }));
  }

  private persist() {
    // Sauvegarder la queue dans MMKV
    storage.set("sync-queue", JSON.stringify(this.queue));
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }
}

export const syncEngine = new SyncEngine();
```

#### Validation du jalon

- [ ] L'application fonctionne sans connexion (CRUD complet)
- [ ] Les operations sont mises en file d'attente hors ligne
- [ ] La synchronisation reprend automatiquement au retour en ligne
- [ ] Les conflits sont resolus correctement (LWW par champ)

---

### Jalon 7 : Camera, geolocalisation et medias (30 min)

**Modules appliques** : 15 (APIs natives essentielles)

#### Objectif

Permettre l'ajout de photos et de positions geographiques aux notes.

#### Etapes

1. Intégrer expo-camera et expo-image-picker

```typescript
// hooks/usePhotoCapture.ts
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

export function usePhotoCapture() {
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permission camera refusee");
    }
  };

  const capturePhoto = async (): Promise<Attachment> => {
    await requestPermission();

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled) throw new Error("Capture annulee");

    const asset = result.assets[0];
    const localUri = `${FileSystem.documentDirectory}photos/${generateUUID()}.jpg`;

    await FileSystem.copyAsync({
      from: asset.uri,
      to: localUri,
    });

    const info = await FileSystem.getInfoAsync(localUri);

    return {
      id: generateUUID(),
      type: "image",
      uri: localUri,
      thumbnailUri: localUri, // Simplification
      size: info.exists ? info.size : 0,
      createdAt: Date.now(),
    };
  };

  const pickFromGallery = async (): Promise<Attachment> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled) throw new Error("Selection annulee");

    const asset = result.assets[0];
    return {
      id: generateUUID(),
      type: "image",
      uri: asset.uri,
      size: asset.fileSize ?? 0,
      createdAt: Date.now(),
    };
  };

  return { capturePhoto, pickFromGallery };
}
```

2. Intégrer expo-location

```typescript
// hooks/useLocation.ts
import * as Location from "expo-location";

export function useNoteLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(false);

  const tagCurrentLocation = async (): Promise<GeoLocation> => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permission localisation refusee");
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocoding pour obtenir un label
      const [address] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const geo: GeoLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: address
          ? `${address.street ?? ""}, ${address.city ?? ""}`
          : undefined,
      };

      setLocation(geo);
      return geo;
    } finally {
      setLoading(false);
    }
  };

  return { location, loading, tagCurrentLocation };
}
```

#### Validation du jalon

- [ ] Capture photo depuis la camera fonctionne
- [ ] Selection depuis la galerie fonctionne
- [ ] Les photos sont stockees localement
- [ ] La geolocalisation tagge la note avec latitude/longitude et label

---

### Jalon 8 : Notifications et collaboration (45 min)

**Modules appliques** : 16 (notifications push), collaboration

#### Objectif

Implementer le système de collaboration (partage de notes) et les notifications push.

#### Etapes

1. Système de collaboration

```typescript
// services/collaborationManager.ts
interface CollaborationInvite {
  noteId: string;
  invitedEmail: string;
  permission: "read" | "write" | "admin";
}

class CollaborationManager {
  async invite(
    noteId: string,
    email: string,
    permission: Permission,
  ): Promise<void> {
    // Verifier que l'utilisateur est proprietaire ou admin
    const note = useNotesStore.getState().getNoteById(noteId);
    if (!note) throw new Error("Note introuvable");

    const currentUser = useAuthStore.getState().user!;
    const isOwner = note.authorId === currentUser.id;
    const isAdmin = note.collaborators.some(
      (c) => c.userId === currentUser.id && c.permission === "admin",
    );

    if (!isOwner && !isAdmin) {
      throw new Error("Permission insuffisante");
    }

    // Envoyer l'invitation via l'API
    await apiClient.post(`/notes/${noteId}/collaborators`, {
      email,
      permission,
    });

    // Mettre a jour localement
    useNotesStore.getState().updateNote(noteId, {
      collaborators: [
        ...note.collaborators,
        {
          userId: "", // Sera rempli par le serveur
          email,
          permission,
          addedAt: Date.now(),
        },
      ],
    });
  }

  async acceptInvite(inviteId: string): Promise<void> {
    const response = await apiClient.post<Note>(`/invites/${inviteId}/accept`);
    // Ajouter la note partagee au store local
    useNotesStore.getState().createNote(response);
  }

  async revokeAccess(noteId: string, userId: string): Promise<void> {
    await apiClient.delete(`/notes/${noteId}/collaborators/${userId}`);

    const note = useNotesStore.getState().getNoteById(noteId);
    if (note) {
      useNotesStore.getState().updateNote(noteId, {
        collaborators: note.collaborators.filter((c) => c.userId !== userId),
      });
    }
  }

  getPermissions(noteId: string, userId: string): Permission | null {
    const note = useNotesStore.getState().getNoteById(noteId);
    if (!note) return null;
    if (note.authorId === userId) return "admin";
    const collab = note.collaborators.find((c) => c.userId === userId);
    return collab?.permission ?? null;
  }
}

export const collaborationManager = new CollaborationManager();
```

2. Notifications push avec expo-notifications

```typescript
// services/notificationDispatcher.ts
import * as Notifications from "expo-notifications";

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

class NotificationDispatcher {
  private unreadNotifications: AppNotification[] = [];

  async registerForPushNotifications(): Promise<string | null> {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return null;

    const token = await Notifications.getExpoPushTokenAsync();
    // Enregistrer le token sur le serveur
    await apiClient.post("/push-tokens", { token: token.data });
    return token.data;
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data: Record<string, unknown>,
    trigger?: Notifications.NotificationTriggerInput,
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: trigger ?? null,
    });
    return id;
  }

  handleReceivedNotification(notification: Notifications.Notification): void {
    const data = notification.request.content.data;
    const appNotification: AppNotification = {
      id: notification.request.identifier,
      type: data.type as string,
      title: notification.request.content.title ?? "",
      body: notification.request.content.body ?? "",
      data,
      receivedAt: Date.now(),
      isRead: false,
    };
    this.unreadNotifications.push(appNotification);
  }

  getUnread(): AppNotification[] {
    return this.unreadNotifications.filter((n) => !n.isRead);
  }

  markAsRead(notificationId: string): void {
    const notification = this.unreadNotifications.find(
      (n) => n.id === notificationId,
    );
    if (notification) {
      notification.isRead = true;
    }
  }

  markAllAsRead(): void {
    this.unreadNotifications.forEach((n) => {
      n.isRead = true;
    });
  }
}

export const notificationDispatcher = new NotificationDispatcher();
```

#### Validation du jalon

- [ ] Invitation de collaborateurs fonctionne
- [ ] Les permissions sont respectees (read/write/admin)
- [ ] Les notifications push sont recues et affichees
- [ ] Le badge de notification se met a jour

---

### Jalon 9 : Chiffrement et module natif (45 min)

**Modules appliques** : 23 (Turbo Modules), sécurité

#### Objectif

Implementer le chiffrement end-to-end des notes sensibles via un Turbo Module natif.

#### Turbo Module natif — Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               Turbo Module — NomadCrypto                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  JavaScript (JSI)                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  import { encrypt, decrypt } from 'NomadCrypto';       │ │
│  │  const cipher = encrypt(plaintext, key);               │ │
│  │  // Appel synchrone via JSI — pas de bridge             │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │ JSI (synchrone)                    │
│  ┌──────────────────────┴─────────────────────────────────┐ │
│  │  C++ (Turbo Module)                                     │ │
│  │  - AES-256-GCM encryption                               │ │
│  │  - PBKDF2 key derivation                                │ │
│  │  - SHA-256 hashing                                      │ │
│  │  - Secure random generation                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Avantage : pas de serialisation JSON, appels synchrones    │
│  Performance : ~10x plus rapide que le bridge classique     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Specification du Turbo Module

```typescript
// packages/turbo-encryption/src/NomadCrypto.ts
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  encrypt(plaintext: string, key: string): string;
  decrypt(ciphertext: string, key: string): string;
  generateKey(): string;
  hashPassword(password: string, salt: string): string;
  generateSalt(): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>("NomadCrypto");
```

#### Utilisation dans l'application

```typescript
// services/encryptionService.ts
import NomadCrypto from "turbo-encryption";

class EncryptionService {
  private userKey: string | null = null;

  async initialize(password: string): Promise<void> {
    const salt = await this.getSalt();
    this.userKey = NomadCrypto.hashPassword(password, salt);
  }

  encryptNote(note: Note): Note {
    if (!this.userKey) throw new Error("Encryption non initialisee");

    return {
      ...note,
      title: NomadCrypto.encrypt(note.title, this.userKey),
      content: NomadCrypto.encrypt(note.content, this.userKey),
      isEncrypted: true,
    };
  }

  decryptNote(note: Note): Note {
    if (!this.userKey) throw new Error("Encryption non initialisee");
    if (!note.isEncrypted) return note;

    return {
      ...note,
      title: NomadCrypto.decrypt(note.title, this.userKey),
      content: NomadCrypto.decrypt(note.content, this.userKey),
      isEncrypted: false,
    };
  }

  private async getSalt(): Promise<string> {
    let salt = await storage.getString("crypto-salt");
    if (!salt) {
      salt = NomadCrypto.generateSalt();
      storage.set("crypto-salt", salt);
    }
    return salt;
  }
}

export const encryptionService = new EncryptionService();
```

#### Validation du jalon

- [ ] Le Turbo Module compile et s'exécuté correctement
- [ ] Le chiffrement AES-256 fonctionne (encrypt/decrypt roundtrip)
- [ ] Les notes chiffrees sont illisibles sans la clé
- [ ] Performance : chiffrement synchrone via JSI, sans latence perceptible

---

### Jalon 10 : Editeur de texte riche — Fabric Component (45 min)

**Modules appliques** : 24 (Fabric Components)

#### Objectif

Créer un composant Fabric natif pour l'edition de texte riche (gras, italique, listes, titres).

#### Specification du composant

```typescript
// packages/rich-text-editor/src/RichTextEditorNativeComponent.ts
import type { ViewProps } from "react-native";
import type {
  DirectEventHandler,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

interface NativeProps extends ViewProps {
  value?: string;
  placeholder?: string;
  editable?: WithDefault<boolean, true>;
  onChangeText?: DirectEventHandler<{ text: string }>;
  onSelectionChange?: DirectEventHandler<{
    start: number;
    end: number;
  }>;
}

export default codegenNativeComponent<NativeProps>("RichTextEditor");
```

#### Wrapper React

```typescript
// components/notes/RichTextEditor.tsx
import RichTextEditorNative from 'rich-text-editor';
import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface RichTextEditorRef {
  toggleBold: () => void;
  toggleItalic: () => void;
  insertHeading: (level: 1 | 2 | 3) => void;
  insertList: (type: 'bullet' | 'ordered') => void;
  getHTML: () => string;
  getMarkdown: () => string;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChangeText, placeholder }, ref) => {
    const nativeRef = useRef(null);

    useImperativeHandle(ref, () => ({
      toggleBold: () => {
        // Commande native via UIManager
      },
      toggleItalic: () => {},
      insertHeading: (level) => {},
      insertList: (type) => {},
      getHTML: () => value ?? '',
      getMarkdown: () => value ?? '',
    }));

    return (
      <View style={styles.container}>
        <Toolbar ref={nativeRef} />
        <RichTextEditorNative
          ref={nativeRef}
          value={value}
          placeholder={placeholder}
          onChangeText={(e) => onChangeText?.(e.nativeEvent.text)}
          style={styles.editor}
        />
      </View>
    );
  }
);
```

#### Validation du jalon

- [ ] Le composant Fabric natif se compile et s'affiche
- [ ] La barre d'outils de formatage fonctionne (gras, italique, listes)
- [ ] Le contenu est rendu en HTML/Markdown
- [ ] La gestion du focus et du clavier est correcte

---

### Jalon 11 : Performance et optimisation (45 min)

**Modules appliques** : 19 (performance), 25 (Hermes, startup)

#### Objectif

Optimiser les performances de l'application : temps de démarrage, fluidite des listes, consommation mémoire.

#### Stratégie d'optimisation

```
┌──────────────────────────────────────────────────────────────────┐
│              Pyramide d'optimisation NomadNote                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│                    ┌──────────────┐                               │
│                    │   Startup    │  Cible : < 500ms TTI          │
│                    │  (Hermes)    │  Hermes bytecode precompile   │
│                    └──────┬───────┘  Lazy loading des ecrans      │
│                           │                                       │
│                ┌──────────┴──────────┐                            │
│                │    Rendering        │  Cible : 60 fps constant   │
│                │  (React, Fabric)    │  React.memo, useMemo       │
│                └──────────┬──────────┘  FlashList, estimatedSize  │
│                           │                                       │
│           ┌───────────────┴──────────────┐                        │
│           │        Memory                 │  Cible : < 200MB      │
│           │   (images, cache, GC)         │  Thumbnails, eviction │
│           └───────────────┬──────────────┘  Cache LRU borné       │
│                           │                                       │
│      ┌────────────────────┴───────────────────┐                   │
│      │           Network                       │  Batched sync    │
│      │    (API, sync, assets)                  │  Delta updates   │
│      └─────────────────────────────────────────┘  Image CDN       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Optimisations clés

1. **Startup** : Hermes bytecode precompile

```json
// app.json (extrait)
{
  "expo": {
    "jsEngine": "hermes",
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": { "enableHermes": true },
          "ios": { "enableHermes": true }
        }
      ]
    ]
  }
}
```

2. **Cache LRU pour les notes**

```typescript
// utils/noteCache.ts
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.hits++;
      // Deplacer en fin (plus recent)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    this.misses++;
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Supprimer le plus ancien (premier element)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  evict(key: K): boolean {
    return this.cache.delete(key);
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

export const noteCache = new LRUCache<string, Note>(100);
```

3. **Optimisation des listes**

```typescript
// Utiliser estimatedItemSize et recycling avec FlashList
<FlashList
  data={notes}
  renderItem={renderItem}
  estimatedItemSize={120}
  // Pre-calculer les tailles pour eviter les recalculs
  overrideItemLayout={(layout, item) => {
    layout.size = item.attachments.length > 0 ? 180 : 120;
  }}
  // Limiter le nombre d'elements rendus en dehors de la fenetre visible
  drawDistance={250}
/>
```

4. **Profiling startup avec Hermes**

```bash
# Generer un profil Hermes
npx react-native profile-hermes

# Analyser le bytecode
npx hermes -dump-bytecode bundle.hbc | head -50

# Mesurer le TTI (Time To Interactive)
# Via react-native-performance ou PerformanceObserver
```

#### Validation du jalon

- [ ] TTI (Time To Interactive) < 500ms sur un appareil milieu de gamme
- [ ] Les listes scrollent a 60 fps constant (mesure via Flashlight ou Flipper)
- [ ] La consommation mémoire reste < 200MB en utilisation normale
- [ ] Le cache LRU à un hit rate > 80% en utilisation typique

---

### Jalon 12 : Tests et CI/CD (60 min)

**Modules appliques** : 20 (tests unitaires/intégration), 21 (E2E Detox), 22 (CI/CD EAS)

#### Objectif

Mettre en place une suite de tests complete et une pipeline CI/CD.

#### Pyramide de tests

```
┌──────────────────────────────────────────────────────────────────┐
│                    Pyramide de tests NomadNote                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│                       ┌──────────┐                                │
│                       │   E2E    │  5-10 scenarios critiques      │
│                       │  (Detox) │  Login → Creer → Sync → Logout │
│                       └────┬─────┘                                │
│                            │                                      │
│                  ┌─────────┴─────────┐                            │
│                  │   Integration     │  20-30 tests                │
│                  │  (RNTL + MSW)     │  Ecrans complets avec mock  │
│                  └─────────┬─────────┘                            │
│                            │                                      │
│           ┌────────────────┴────────────────┐                     │
│           │         Unitaires               │  100+ tests         │
│           │   (Vitest / pure functions)      │  Logique metier     │
│           └─────────────────────────────────┘  Utils, stores, etc. │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Tests unitaires (Vitest)

```typescript
// __tests__/utils/search.test.ts
import { describe, it, expect } from "vitest";
import { fullTextSearch, searchByDate, searchByLocation } from "@/utils/search";

describe("fullTextSearch", () => {
  const notes: Note[] = [
    createNote({
      title: "React Native",
      content: "Guide complet",
      tags: ["dev"],
    }),
    createNote({
      title: "Recettes",
      content: "Poulet roti",
      tags: ["cuisine"],
    }),
    createNote({
      title: "Meeting",
      content: "React team sync",
      tags: ["work"],
    }),
  ];

  it("recherche dans le titre", () => {
    const results = fullTextSearch(notes, "react");
    expect(results).toHaveLength(2);
    // 'React Native' devrait etre premier (match titre = score plus eleve)
    expect(results[0].title).toBe("React Native");
  });

  it("recherche dans les tags", () => {
    const results = fullTextSearch(notes, "cuisine");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Recettes");
  });

  it("retourne vide pour une requete sans correspondance", () => {
    expect(fullTextSearch(notes, "xyz")).toHaveLength(0);
  });
});
```

#### Tests d'intégration (React Native Testing Library)

```typescript
// __tests__/screens/NotesList.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NotesListScreen } from '@/app/(tabs)/notes';

describe('NotesListScreen', () => {
  it('affiche la liste des notes', async () => {
    render(<NotesListScreen />);

    await waitFor(() => {
      expect(screen.getByText('React Native')).toBeTruthy();
      expect(screen.getByText('Recettes')).toBeTruthy();
    });
  });

  it('filtre les notes avec la recherche', async () => {
    render(<NotesListScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Rechercher dans les notes...'),
      'react'
    );

    await waitFor(() => {
      expect(screen.getByText('React Native')).toBeTruthy();
      expect(screen.queryByText('Recettes')).toBeNull();
    });
  });
});
```

#### Tests E2E (Detox)

```typescript
// e2e/noteFlow.test.ts
describe("Note Flow", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login
    await element(by.id("email-input")).typeText("test@example.com");
    await element(by.id("password-input")).typeText("Password123!");
    await element(by.id("login-button")).tap();
  });

  it("cree une nouvelle note", async () => {
    await element(by.id("fab-create-note")).tap();
    await element(by.id("note-title-input")).typeText("Ma note Detox");
    await element(by.id("note-content-input")).typeText("Contenu de test E2E");
    await element(by.id("save-button")).tap();

    await expect(element(by.text("Ma note Detox"))).toBeVisible();
  });

  it("recherche une note", async () => {
    await element(by.id("search-input")).typeText("Detox");
    await expect(element(by.text("Ma note Detox"))).toBeVisible();
  });

  it("supprime une note par swipe", async () => {
    await element(by.text("Ma note Detox")).swipe("left");
    await element(by.id("confirm-delete")).tap();
    await expect(element(by.text("Ma note Detox"))).not.toBeVisible();
  });
});
```

#### Pipeline CI/CD (EAS + GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD NomadNote

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test --coverage
      - uses: codecov/codecov-action@v4

  e2e-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm detox:build:ios
      - run: pnpm detox:test:ios

  build-and-deploy:
    needs: [lint-and-type-check, unit-tests]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: pnpm install --frozen-lockfile
      - run: eas build --platform all --non-interactive
      - run: eas submit --platform all --non-interactive
```

#### Validation du jalon

- [ ] Couverture de tests unitaires > 80%
- [ ] Tests d'intégration couvrent les scenarios principaux
- [ ] Tests E2E passent sur iOS et Android
- [ ] Pipeline CI/CD verte sur chaque PR

---

## 4. Extension monorepo (optionnel)

**Module applique** : 26 (monorepo et web)

Pour etendre NomadNote au web, on utilise une structure monorepo avec Turborepo :

```
nomad-note/
├── apps/
│   ├── mobile/          # Expo + React Native
│   └── web/             # Next.js
├── packages/
│   ├── shared/          # Types, validation, utils
│   ├── ui/              # Composants partages (React Native Web)
│   └── turbo-encryption/
├── turbo.json
└── package.json
```

Le code metier (modèles, validation, recherche, sync engine) reside dans `packages/shared` et est consomme par les deux applications. Les composants UI utilisent React Native Web pour le rendu cross-platform.

---

## 5. Checklist de déploiement

### Pre-déploiement

- [ ] Tous les tests passent (unit, intégration, E2E)
- [ ] Pas de warning TypeScript strict
- [ ] ESLint clean (0 erreurs)
- [ ] Les variables d'environnement de production sont configurees
- [ ] Les clés de signature (iOS, Android) sont securisees dans EAS Secrets
- [ ] Le Turbo Module compile sur iOS et Android
- [ ] Le profiling Hermes ne montre pas de regression de startup
- [ ] Les images sont optimisees (thumbnails, lazy loading)

### Configuration EAS

```json
// eas.json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "dev@nomadnote.app",
        "ascAppId": "123456789",
        "appleTeamId": "TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-services.json",
        "track": "production"
      }
    }
  }
}
```

### Post-déploiement

- [ ] Vérifier les crash reports (Sentry)
- [ ] Monitorer les metriques de performance (TTI, FPS)
- [ ] Tester les deep links en production
- [ ] Valider les notifications push en production
- [ ] Planifier les OTA updates pour les correctifs mineurs

```typescript
// Verification OTA
import * as Updates from "expo-updates";

async function checkForUpdates() {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (error) {
    console.error("Erreur lors de la verification des mises a jour:", error);
  }
}
```

---

## 6. Grille d'évaluation

### Criteres et ponderation

| Critere              | Points   | Description                                         |
| -------------------- | -------- | --------------------------------------------------- |
| **Architecture**     | /20      | Separation des responsabilites, patterns, structure |
| **Fonctionnalites**  | /25      | MVP complet, CRUD, recherche, tags                  |
| **Offline-first**    | /15      | Fonctionne hors ligne, sync, résolution de conflits |
| **Qualite du code**  | /10      | TypeScript strict, lisibilite, conventions          |
| **Tests**            | /10      | Couverture, pertinence, pyramide respectee          |
| **Performance**      | /10      | TTI, FPS, mémoire, cache                            |
| **UX/Accessibilité** | /5       | Animations fluides, a11y, responsive                |
| **CI/CD**            | /5       | Pipeline fonctionnelle, déploiement automatise      |
| **Total**            | **/100** |                                                     |

### Niveaux de reussite

| Note   | Niveau       | Description                                                                   |
| ------ | ------------ | ----------------------------------------------------------------------------- |
| 90-100 | Excellent    | Toutes les fonctionnalites implementees, tests complets, performance optimale |
| 75-89  | Bien         | MVP complet avec offline-first, bonne couverture de tests                     |
| 60-74  | Satisfaisant | CRUD et navigation fonctionnels, quelques tests                               |
| < 60   | Insuffisant  | Fonctionnalites incompletes, pas de tests                                     |

### Bonus (jusqu'a +10 points)

- Chiffrement E2E via Turbo Module natif : +3
- Composant Fabric pour l'editeur riche : +3
- Extension web via monorepo : +2
- Animation avancee (shared élément transitions) : +2

---

## 7. Récapitulatif des modules integres

```
┌────────────────────────────────────────────────────────────────┐
│           Carte d'integration — NomadNote x Modules            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  FONDAMENTAUX (Jalons 1-3)                                     │
│  ├── Module 01 : JSX ──────────────── Tous les composants      │
│  ├── Module 02 : Props ────────────── Communication composants │
│  ├── Module 03 : State ────────────── useState, useEffect      │
│  ├── Module 05 : StyleSheet ───────── Design system            │
│  ├── Module 06 : Flexbox ──────────── Layouts responsifs       │
│  └── Module 07 : Composants UI ────── Button, Card, Input...   │
│                                                                │
│  NAVIGATION & DONNEES (Jalons 2, 4-5)                          │
│  ├── Module 04 : FlatList ─────────── Liste de notes           │
│  ├── Module 08 : Navigation ───────── Tabs + Stack             │
│  ├── Module 09 : Deep links ───────── nomadnote://note/id      │
│  ├── Module 10 : Zustand ──────────── Stores persistants       │
│  ├── Module 11 : Formulaires ──────── RHF + Zod               │
│  ├── Module 12 : API client ───────── Fetch + intercepteurs    │
│  └── Module 13 : React Query ──────── Cache serveur            │
│                                                                │
│  FONCTIONNALITES AVANCEES (Jalons 6-8)                         │
│  ├── Module 14 : Offline-first ────── Sync engine              │
│  ├── Module 15 : Camera/Geo ───────── Photos + positions       │
│  └── Module 16 : Notifications ────── Push + local             │
│                                                                │
│  ANIMATIONS (Jalon 4)                                          │
│  ├── Module 17 : Animated ─────────── Transitions basiques     │
│  └── Module 18 : Reanimated ───────── Swipe, shared values     │
│                                                                │
│  PERFORMANCE & NATIF (Jalons 9-11)                             │
│  ├── Module 19 : Performance ──────── Memo, profiling          │
│  ├── Module 23 : Turbo Module ─────── Chiffrement natif        │
│  ├── Module 24 : Fabric ───────────── Editeur riche            │
│  └── Module 25 : Hermes ──────────── Startup, bytecode        │
│                                                                │
│  QUALITE & DEPLOIEMENT (Jalon 12)                              │
│  ├── Module 20 : Tests unit/integ ── Vitest + RNTL            │
│  ├── Module 21 : Tests E2E ────────── Detox                   │
│  ├── Module 22 : CI/CD ───────────── EAS + GitHub Actions     │
│  └── Module 26 : Monorepo ────────── Extension web            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Conseils pour le projet

### Organisation du travail

1. **Sessions de 2h** : Chaque session couvre 2-3 jalons. Faire des pauses entre les sessions
2. **Git** : Un commit par jalon minimum. Utiliser des branches par fonctionnalite
3. **Documentation** : Commenter le code complexe (sync engine, crypto, cache)
4. **Priorisation** : Si le temps manque, se concentrer sur les jalons 1-6 (MVP complet)

### Pieges courants

- **Over-engineering** : Commencer simple, ajouter la complexite incrementalement
- **Offline-first tardif** : Intégrer l'offline des le debut, pas à la fin
- **Tests oublies** : Écrire les tests en même temps que le code, pas après
- **Performance prematuree** : D'abord faire fonctionner, puis optimiser avec des mesures

### Ressources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [React Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [FlashList](https://shopify.github.io/flash-list/)
- [Detox](https://wix.github.io/Detox/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

---

## Conclusion

NomadNote est un projet ambitieux qui intégré l'ensemble des compétences acquises au long de cette formation. Il ne s'agit pas d'un exercice academique : c'est une application que vous pourriez publier sur les stores.

La clé du succes est l'approche incrementale : chaque jalon produit un increment fonctionnel. Ne cherchez pas la perfection au premier passage. Construisez le MVP (jalons 1-6), puis enrichissez avec les fonctionnalites avancees (jalons 7-12).

A la fin de ce projet, vous aurez :

- Une application complete dans votre portfolio
- Une experience concrete de la New Architecture (Turbo Modules, Fabric)
- Une maîtrise des patterns offline-first et de synchronisation
- Une pipeline CI/CD operationnelle

**Bon courage et bonne construction !**

---

<!-- parcours-recommande -->

::: tip Parcours recommandé

1. **Screencast** : [screencast 27 projet final](../screencasts/screencast-27-projet-final.md)
2. **Lab** : [lab-27-projet-final](../labs/lab-27-projet-final/README)
3. **Quiz** : [quiz 27 projet final](../quizzes/quiz-27-projet-final.html)
   :::

---

<!-- navigation-inter-cours -->

::: info Cours suivant
Bravo, tu as termine le cours **React Native** !

> Ce cours est optionnel (Palier 5 — bonus). Tu peux aussi passer directement au cours suivant.
> Le prochain cours du curriculum est **WebGPU & 3D**.

[Commencer WebGPU & 3D →](../../20-webgpu-3d/modules/00-prerequis-et-introduction.md)
:::
