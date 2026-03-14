# 13 — React Query et cache

| Difficulte | Duree estimee | Lab | Quiz |
|:----------:|:-------------:|:---:|:----:|
| 4/5        | 90 min        | [Lab 13](../labs/lab-13-react-query-cache/) | [Quiz 13](../quizzes/quiz-13-react-query.html) |

## Objectifs pedagogiques

A la fin de ce module, vous serez capable de :

- Configurer TanStack Query dans une application React Native
- Utiliser `useQuery` avec un typage strict (queryKey, queryFn, staleTime, gcTime)
- Gerer les mutations avec `useMutation` (onSuccess, onError, onSettled)
- Invalider et refetch les queries de maniere granulaire
- Implementer des mises a jour optimistes avec rollback
- Paginer avec `useInfiniteQuery` (cursor-based et offset-based)
- Prefetcher les donnees pour une navigation instantanee
- Adapter le support offline et le focus manager a React Native

---

<details>
<summary>Rappel du module precedent</summary>

- **fetch API** : GET, POST, PUT, DELETE avec verification `response.ok`
- **AbortController** : annulation des requetes, cleanup dans useEffect
- **Bearer token** : refresh automatique avec deduplication
- **Client API** : intercepteurs, retry avec backoff exponentiel
- **Gestion d'erreurs** : NetworkError, ApiError, TimeoutError

</details>

---

## Pourquoi TanStack Query ?

Le module precedent a montre comment faire des appels API avec `fetch`. Mais gerer manuellement le cache, le loading, les erreurs, le refetch, la pagination et les mises a jour optimistes dans chaque composant produit du code repetitif et fragile.

```tsx
// ❌ Sans React Query : chaque composant gere tout manuellement
function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await postsApi.list();
      setPosts(response.data.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts();
    return () => controller.abort();
  }, [fetchPosts]);

  // ... + pull-to-refresh, pagination, cache, dedup, retry... 😵
}
```

```tsx
// ✅ Avec React Query : tout est gere
function PostsList() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['posts'],
    queryFn: () => postsApi.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // C'est tout. Cache, retry, dedup, refetch — tout est inclus.
}
```

TanStack Query (anciennement React Query) offre :
- **Cache automatique** : les donnees sont mises en cache et partagees entre composants
- **Deduplication** : plusieurs composants qui fetch la meme donnee = 1 seule requete
- **Retry automatique** : 3 tentatives par defaut avec backoff exponentiel
- **Refetch intelligent** : au focus de l'app, a la reconnexion reseau
- **Mutations** : creation, mise a jour, suppression avec invalidation du cache
- **Mises a jour optimistes** : UI instantanee avec rollback en cas d'erreur

---

## Installation et configuration

```bash
npx expo install @tanstack/react-query
```

### Provider

```tsx
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 minute : les donnees restent "fraiches"
      gcTime: 5 * 60 * 1000,      // 5 minutes : duree de vie en cache inactif
      retry: 3,                    // 3 tentatives
      retryDelay: (attempt) =>     // Backoff exponentiel
        Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: true,  // Refetch quand l'app revient au premier plan
      refetchOnReconnect: true,    // Refetch quand le reseau revient
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
    </QueryClientProvider>
  );
}
```

### Adaptateurs React Native

React Native n'a pas les evenements `window.focus` et `navigator.onLine` du web. Il faut configurer les adaptateurs :

```tsx
// config/reactQuery.ts
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// ─── Focus Manager : refetch quand l'app revient au premier plan ────────────

export function useAppStateFocus() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
    });

    return () => subscription.remove();
  }, []);
}

// ─── Online Manager : detecter la connectivite ────────────────────────────

export function setupOnlineManager() {
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected);
    });
  });
}
```

```tsx
// App.tsx — integrer les adaptateurs
import { setupOnlineManager, useAppStateFocus } from './config/reactQuery';

setupOnlineManager(); // Appel unique au demarrage

function AppContent() {
  useAppStateFocus(); // Hook dans le composant racine

  return <Navigation />;
}
```

---

## useQuery : lire des donnees

`useQuery` est le hook principal pour lire des donnees. Il prend un objet de configuration et retourne l'etat de la requete.

### Anatomie

```tsx
const result = useQuery({
  queryKey: ['posts', postId],   // Cle unique de cache
  queryFn: () => getPost(postId), // Fonction qui fetch les donnees
  staleTime: 5 * 60 * 1000,      // Duree pendant laquelle les donnees sont "fraiches"
  gcTime: 10 * 60 * 1000,        // Duree de conservation en cache apres desubscription
  enabled: !!postId,              // Desactiver la query conditionnellement
  select: (data) => data.title,   // Transformer les donnees cote client
  placeholderData: previousData,  // Donnees temporaires pendant le chargement
});
```

### queryKey : la cle de cache

La cle de cache est un tableau serialisable. React Query l'utilise pour :
- Identifier les donnees dans le cache
- Dedupliquer les requetes identiques
- Invalider les donnees de maniere granulaire

```tsx
// Cle simple
useQuery({ queryKey: ['posts'] });

// Cle avec parametre
useQuery({ queryKey: ['posts', postId] });

// Cle avec filtres
useQuery({ queryKey: ['posts', { status: 'published', page: 2 }] });

// Cle hierarchique
useQuery({ queryKey: ['posts', postId, 'comments'] });
useQuery({ queryKey: ['posts', postId, 'comments', { sort: 'recent' }] });
```

:::warning L'ordre des elements dans la cle compte
`['posts', { page: 1 }]` et `['posts', { page: 2 }]` sont des cles differentes. L'ordre des proprietes dans un objet n'a pas d'importance (`{ a: 1, b: 2 }` === `{ b: 2, a: 1 }`), mais l'ordre des elements du tableau compte.
:::

### Query Key Factory

Un pattern recommande pour structurer les cles :

```tsx
// queryKeys.ts
export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: PostFilters) => [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.posts.details(), id] as const,
    comments: (postId: number) => [...queryKeys.posts.detail(postId), 'comments'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: number) => [...queryKeys.users.all, id] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
  },
};

// Utilisation
useQuery({
  queryKey: queryKeys.posts.detail(42),
  queryFn: () => postsApi.getById(42),
});

// Invalider tous les posts
queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });

// Invalider uniquement les listes (pas les details)
queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
```

### staleTime vs gcTime

Ces deux temps sont souvent confondus. Voici la difference :

```
                                staleTime (5 min)
                    |─────────── fresh ──────────|─── stale ────────────────
Fetch               ↑                            ↑
                    t=0                          t=5min

Dernier subscriber
se desabonne        ─────────────────────────────────↑
                                                     |── gcTime (10min) ──|→ supprime
```

- **staleTime** : duree pendant laquelle les donnees sont considerees "fraiches". Tant qu'elles sont fresh, React Query les sert depuis le cache sans refetch.
- **gcTime** (anciennement `cacheTime`) : duree de conservation en cache **apres** que le dernier composant s'est desabonne. Passe ce delai, les donnees sont supprimees du cache.

```tsx
// Donnees qui changent rarement (profil utilisateur)
useQuery({
  queryKey: ['profile'],
  queryFn: fetchProfile,
  staleTime: 30 * 60 * 1000, // 30 minutes : on refetch rarement
  gcTime: 60 * 60 * 1000,    // 1 heure : on garde longtemps en cache
});

// Donnees qui changent souvent (feed social)
useQuery({
  queryKey: ['feed'],
  queryFn: fetchFeed,
  staleTime: 30 * 1000,       // 30 secondes
  gcTime: 5 * 60 * 1000,      // 5 minutes
});

// Donnees en temps reel (cours de bourse)
useQuery({
  queryKey: ['stock', ticker],
  queryFn: () => fetchStock(ticker),
  staleTime: 0,                // Toujours stale : refetch a chaque mount
  refetchInterval: 5000,       // Refetch toutes les 5 secondes
});
```

### Exemple complet avec TypeScript

```tsx
import { useQuery } from '@tanstack/react-query';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

function usePostsList(page: number = 1) {
  return useQuery({
    queryKey: queryKeys.posts.list({ page }),
    queryFn: async ({ signal }) => {
      // signal est fourni automatiquement par React Query pour l'annulation
      const response = await fetch(
        `${config.apiUrl}/posts?page=${page}`,
        { signal }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<PaginatedResponse<Post>>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

function PostsScreen() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isRefetching, refetch } = usePostsList(page);

  if (isLoading) {
    return <ActivityIndicator size="large" />;
  }

  if (error) {
    return (
      <View>
        <Text>Erreur : {error.message}</Text>
        <Pressable onPress={() => refetch()}>
          <Text>Reessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={data?.data}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={{ padding: 16 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
          <Text numberOfLines={2}>{item.body}</Text>
        </View>
      )}
      refreshing={isRefetching}
      onRefresh={refetch}
    />
  );
}
```

---

## useMutation : creer, modifier, supprimer

`useMutation` gere les operations d'ecriture. Contrairement a `useQuery`, il ne s'execute pas automatiquement — on l'appelle explicitement via `mutate()` ou `mutateAsync()`.

### Anatomie

```tsx
const mutation = useMutation({
  mutationFn: (newPost: CreatePostPayload) => postsApi.create(newPost),
  onMutate: async (variables) => { /* Avant la mutation */ },
  onSuccess: (data, variables, context) => { /* Mutation reussie */ },
  onError: (error, variables, context) => { /* Mutation echouee */ },
  onSettled: (data, error, variables, context) => { /* Dans tous les cas */ },
});

// Appel
mutation.mutate({ title: 'Mon post', body: 'Contenu...' });

// Ou avec async/await
const result = await mutation.mutateAsync({ title: 'Mon post', body: 'Contenu...' });
```

### Creer un post avec invalidation du cache

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePostPayload) =>
      postsApi.create(payload).then(r => r.data),

    onSuccess: () => {
      // Invalider la liste des posts pour qu'elle soit re-fetchee
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    },

    onError: (error) => {
      console.error('Erreur creation post:', error);
    },
  });
}

function CreatePostForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const createPost = useCreatePost();

  const handleSubmit = () => {
    createPost.mutate(
      { title, body },
      {
        onSuccess: () => {
          // Reset du formulaire apres succes
          setTitle('');
          setBody('');
          navigation.goBack();
        },
      }
    );
  };

  return (
    <View>
      <TextInput value={title} onChangeText={setTitle} placeholder="Titre" />
      <TextInput value={body} onChangeText={setBody} placeholder="Contenu" multiline />
      <Pressable onPress={handleSubmit} disabled={createPost.isPending}>
        <Text>{createPost.isPending ? 'Creation...' : 'Publier'}</Text>
      </Pressable>
      {createPost.isError && (
        <Text style={{ color: 'red' }}>
          Erreur : {createPost.error.message}
        </Text>
      )}
    </View>
  );
}
```

### Supprimer avec confirmation

```tsx
function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => postsApi.delete(postId),

    onSuccess: (_data, postId) => {
      // Retirer le post du cache immediatement
      queryClient.removeQueries({ queryKey: queryKeys.posts.detail(postId) });
      // Invalider la liste
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    },
  });
}

function PostActions({ postId }: { postId: number }) {
  const deletePost = useDeletePost();

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le post ?',
      'Cette action est irreversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deletePost.mutate(postId),
        },
      ]
    );
  };

  return (
    <Pressable onPress={handleDelete} disabled={deletePost.isPending}>
      <Text>Supprimer</Text>
    </Pressable>
  );
}
```

---

## Query invalidation

L'invalidation est le mecanisme pour dire a React Query que les donnees en cache sont obsoletes et doivent etre re-fetchees.

### Strategies d'invalidation

```tsx
const queryClient = useQueryClient();

// 1. Invalider tout (rarement necessaire)
queryClient.invalidateQueries();

// 2. Invalider par prefixe — tous les posts
queryClient.invalidateQueries({ queryKey: ['posts'] });

// 3. Invalider les listes de posts uniquement
queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });

// 4. Invalider un post specifique
queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(42) });

// 5. Invalider avec un predicat personnalise
queryClient.invalidateQueries({
  predicate: (query) => {
    const key = query.queryKey as string[];
    return key[0] === 'posts' && key.includes('published');
  },
});
```

### refetchQueries vs invalidateQueries

```tsx
// invalidateQueries : marque les queries comme stale.
// Elles seront refetchees au prochain "observer" (composant qui les utilise).
// Si aucun composant n'observe la query, pas de refetch.
queryClient.invalidateQueries({ queryKey: ['posts'] });

// refetchQueries : force un refetch immediat, meme sans observer.
queryClient.refetchQueries({ queryKey: ['posts'] });
```

:::tip Quand utiliser chacun ?
- **invalidateQueries** : 99% des cas. Marque comme stale, refetch au besoin.
- **refetchQueries** : Quand vous avez besoin de donnees fraiches immediatement (ex: apres un pull-to-refresh force).
:::

### setQueryData : mise a jour manuelle du cache

Parfois, la reponse d'une mutation contient deja les donnees mises a jour. Pas besoin de refetch :

```tsx
function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePostPayload }) =>
      postsApi.update(id, data).then(r => r.data),

    onSuccess: (updatedPost) => {
      // Mettre a jour le cache du detail directement
      queryClient.setQueryData(
        queryKeys.posts.detail(updatedPost.id),
        updatedPost
      );

      // Mettre a jour le post dans les listes aussi
      queryClient.setQueriesData(
        { queryKey: queryKeys.posts.lists() },
        (old: PaginatedResponse<Post> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map(post =>
              post.id === updatedPost.id ? updatedPost : post
            ),
          };
        }
      );
    },
  });
}
```

---

## Mises a jour optimistes

Une mise a jour optimiste modifie le cache **avant** que la mutation ne soit confirmee par le serveur. Si la mutation echoue, on rollback a l'etat precedent. Cela donne une impression de reactivite instantanee.

### Like / Unlike optimiste

```tsx
interface Post {
  id: number;
  title: string;
  body: string;
  likesCount: number;
  isLikedByMe: boolean;
}

function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => postsApi.toggleLike(postId),

    onMutate: async (postId) => {
      // 1. Annuler les queries en cours pour eviter les conflits
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });

      // 2. Sauvegarder l'etat precedent pour le rollback
      const previousPost = queryClient.getQueryData<Post>(
        queryKeys.posts.detail(postId)
      );

      // 3. Mise a jour optimiste du cache
      queryClient.setQueryData<Post>(
        queryKeys.posts.detail(postId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            isLikedByMe: !old.isLikedByMe,
            likesCount: old.isLikedByMe
              ? old.likesCount - 1
              : old.likesCount + 1,
          };
        }
      );

      // 4. Retourner le context pour le rollback
      return { previousPost };
    },

    onError: (_error, postId, context) => {
      // 5. Rollback en cas d'erreur
      if (context?.previousPost) {
        queryClient.setQueryData(
          queryKeys.posts.detail(postId),
          context.previousPost
        );
      }
    },

    onSettled: (_data, _error, postId) => {
      // 6. Re-synchroniser avec le serveur dans tous les cas
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detail(postId),
      });
    },
  });
}
```

### Utilisation dans un composant

```tsx
function LikeButton({ post }: { post: Post }) {
  const toggleLike = useToggleLike();

  return (
    <Pressable
      onPress={() => toggleLike.mutate(post.id)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 20 }}>
          {post.isLikedByMe ? '❤️' : '🤍'}
        </Text>
        <Text>{post.likesCount}</Text>
      </View>
    </Pressable>
  );
}
```

### Pattern complet : ajout optimiste a une liste

```tsx
function useAddComment(postId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      postsApi.addComment(postId, { body }).then(r => r.data),

    onMutate: async (body) => {
      const queryKey = queryKeys.posts.comments(postId);

      await queryClient.cancelQueries({ queryKey });

      const previousComments = queryClient.getQueryData<Comment[]>(queryKey);

      // Optimistic comment avec un ID temporaire
      const optimisticComment: Comment = {
        id: -Date.now(), // ID negatif temporaire
        postId,
        userId: currentUser.id,
        body,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Comment[]>(queryKey, (old = []) => [
        optimisticComment,
        ...old,
      ]);

      return { previousComments };
    },

    onError: (_error, _body, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.posts.comments(postId),
          context.previousComments
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.comments(postId),
      });
    },
  });
}
```

---

## useInfiniteQuery : pagination infinie

`useInfiniteQuery` est concu pour le pattern de scroll infini, tres courant en mobile (feeds, listes de produits, recherches).

### Pagination par offset

```tsx
interface PostsPage {
  data: Post[];
  page: number;
  totalPages: number;
  total: number;
}

function useInfinitePostsFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.lists(),
    queryFn: async ({ pageParam, signal }) => {
      const response = await fetch(
        `${config.apiUrl}/posts?page=${pageParam}&pageSize=20`,
        { signal }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<PostsPage>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) return undefined;
      return lastPage.page + 1;
    },
    staleTime: 2 * 60 * 1000,
  });
}
```

### Pagination par curseur

```tsx
interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

function useInfiniteFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam, signal }) => {
      const url = pageParam
        ? `${config.apiUrl}/feed?cursor=${pageParam}`
        : `${config.apiUrl}/feed`;
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<CursorPage<Post>>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
```

### Integration avec FlatList

```tsx
function FeedScreen() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfinitePostsFeed();

  // Aplatir les pages en un seul tableau
  const posts = data?.pages.flatMap(page => page.data) ?? [];

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Erreur : {error.message}</Text>
        <Pressable onPress={() => refetch()}>
          <Text style={{ color: '#0d6efd', marginTop: 8 }}>Reessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <PostCard post={item} />}
      // Pull-to-refresh
      refreshing={isRefetching && !isFetchingNextPage}
      onRefresh={refetch}
      // Scroll infini
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      // Footer : indicateur de chargement en bas
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator style={{ padding: 16 }} />
        ) : null
      }
      // Quand la liste est vide
      ListEmptyComponent={
        <View style={{ padding: 32, alignItems: 'center' }}>
          <Text>Aucun post pour le moment</Text>
        </View>
      }
    />
  );
}
```

:::tip onEndReachedThreshold
La valeur `0.5` signifie que `onEndReached` est declenche quand l'utilisateur atteint 50% de la fin de la liste visible. Cela lance le prefetch de la page suivante **avant** que l'utilisateur n'atteigne le bas, pour un scroll fluide et sans interruption.
:::

### Ajouter un element au debut (nouveau post)

```tsx
function useAddPostToFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePostPayload) =>
      postsApi.create(payload).then(r => r.data),

    onSuccess: (newPost) => {
      // Ajouter le post au debut de la premiere page
      queryClient.setQueryData(
        queryKeys.posts.lists(),
        (old: InfiniteData<PostsPage> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page, index) =>
              index === 0
                ? { ...page, data: [newPost, ...page.data] }
                : page
            ),
          };
        }
      );
    },
  });
}
```

---

## Prefetching

Le prefetching charge les donnees en arriere-plan **avant** que l'utilisateur n'en ait besoin. Quand il navigue vers l'ecran, les donnees sont deja en cache.

### Prefetch au hover / press

```tsx
import { useQueryClient } from '@tanstack/react-query';

function PostListItem({ post }: { post: Post }) {
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const prefetchPost = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.posts.detail(post.id),
      queryFn: () => postsApi.getById(post.id).then(r => r.data),
      staleTime: 5 * 60 * 1000, // Ne pas prefetch si deja en cache et fresh
    });
  };

  return (
    <Pressable
      onPressIn={prefetchPost} // Prefetch des que l'utilisateur touche
      onPress={() => navigation.navigate('PostDetail', { id: post.id })}
    >
      <Text style={{ fontWeight: 'bold' }}>{post.title}</Text>
      <Text numberOfLines={2}>{post.body}</Text>
    </Pressable>
  );
}
```

### Prefetch au scroll (prochaine page visible)

```tsx
function usePrefetchNextPage(currentPage: number, totalPages: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      queryClient.prefetchQuery({
        queryKey: queryKeys.posts.list({ page: nextPage }),
        queryFn: () => postsApi.list(nextPage).then(r => r.data),
      });
    }
  }, [currentPage, totalPages, queryClient]);
}
```

### Prefetch au login (donnees initiales)

```tsx
async function onLoginSuccess(queryClient: QueryClient) {
  // Prefetch les donnees essentielles en parallele
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.profile(),
      queryFn: () => usersApi.getProfile().then(r => r.data),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.posts.lists(),
      queryFn: () => postsApi.list(1).then(r => r.data),
    }),
  ]);
}
```

---

## Support offline

React Native fonctionne souvent en mode degrade (metro, avion, zone blanche). TanStack Query offre un support offline natif.

### Pause des mutations offline

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      // Les mutations en mode offline sont mises en pause
      // et reprennent automatiquement quand le reseau revient
      networkMode: 'offlineFirst',
    },
  },
});
```

### Persistence du cache

Pour que le cache survive a un redemarrage de l'app :

```tsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'react-query-cache',
});

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 24 * 60 * 60 * 1000, // 24 heures
        // Ne persister que certaines queries
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Persister uniquement les queries marquees comme persistables
            return query.meta?.persist === true;
          },
        },
      }}
    >
      <AppContent />
    </PersistQueryClientProvider>
  );
}

// Marquer une query comme persistable
useQuery({
  queryKey: ['profile'],
  queryFn: fetchProfile,
  meta: { persist: true },
});
```

### Pattern offline-first complet

```tsx
function useOfflineAwareQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: { staleTime?: number }
) {
  const netInfo = useNetInfo();

  return useQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    // En mode offline, ne pas tenter de refetch
    enabled: netInfo.isConnected !== false,
    // Garder les donnees en cache meme si stale quand offline
    networkMode: 'offlineFirst',
    meta: { persist: true },
  });
}
```

---

## Patterns avances

### Dependent queries (queries dependantes)

```tsx
function usePostWithComments(postId: number) {
  // 1. Fetch le post
  const postQuery = useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: () => postsApi.getById(postId).then(r => r.data),
  });

  // 2. Fetch les commentaires seulement quand le post est charge
  const commentsQuery = useQuery({
    queryKey: queryKeys.posts.comments(postId),
    queryFn: () => postsApi.getComments(postId).then(r => r.data),
    enabled: !!postQuery.data, // Depend du succes de la premiere query
  });

  return { post: postQuery, comments: commentsQuery };
}
```

### Parallel queries (requetes en parallele)

```tsx
import { useQueries } from '@tanstack/react-query';

function useDashboardData() {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.users.profile(),
        queryFn: () => usersApi.getProfile().then(r => r.data),
      },
      {
        queryKey: ['stats', 'posts'],
        queryFn: () => statsApi.getPostsCount(),
      },
      {
        queryKey: ['notifications', 'unread'],
        queryFn: () => notificationsApi.getUnreadCount(),
      },
    ],
  });

  return {
    profile: results[0],
    postsCount: results[1],
    unreadNotifications: results[2],
    isLoading: results.some(r => r.isLoading),
  };
}
```

### Polling (refetch periodique)

```tsx
function useNotificationsBadge() {
  return useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30 * 1000, // Toutes les 30 secondes
    refetchIntervalInBackground: false, // Pas de poll quand l'app est en arriere-plan
  });
}
```

### select : transformer les donnees

```tsx
// Ne re-render que si le nombre de posts change
function usePostsCount() {
  return useQuery({
    queryKey: queryKeys.posts.lists(),
    queryFn: () => postsApi.list().then(r => r.data),
    select: (data) => data.total, // Ne retourne que le total
  });
}

// Filtrer cote client
function usePublishedPosts() {
  return useQuery({
    queryKey: queryKeys.posts.lists(),
    queryFn: () => postsApi.list().then(r => r.data),
    select: (data) => ({
      ...data,
      data: data.data.filter(post => post.status === 'published'),
    }),
  });
}
```

---

## Bonnes pratiques

### Checklist TanStack Query en React Native

| Pratique | Description |
|----------|-------------|
| Query Key Factory | Centraliser les cles dans un fichier dedie |
| staleTime adapte | Profil (30 min), feed (1 min), temps reel (0) |
| Focus Manager RN | Configurer `AppState` pour le refetch au retour |
| Online Manager | Configurer `NetInfo` pour detecter la connectivite |
| Optimistic updates | Like, commentaire, toggle — rollback on error |
| Prefetch onPressIn | Charger avant le press pour navigation instantanee |
| select pour perf | Eviter les re-renders inutiles |
| Persistance cache | AsyncStorage pour le mode offline |

### Erreurs courantes

```tsx
// ❌ Cle de cache non structuree
useQuery({ queryKey: ['data'] }); // Trop generique, collisions possibles

// ✅ Cle structuree avec factory
useQuery({ queryKey: queryKeys.posts.detail(42) });
```

```tsx
// ❌ Pas de staleTime — refetch a chaque mount
useQuery({
  queryKey: ['profile'],
  queryFn: fetchProfile,
  // staleTime par defaut = 0 → stale immediatement
});

// ✅ staleTime adapte au type de donnees
useQuery({
  queryKey: ['profile'],
  queryFn: fetchProfile,
  staleTime: 30 * 60 * 1000, // Profil change rarement
});
```

```tsx
// ❌ Invalider tout le cache apres une mutation
onSuccess: () => {
  queryClient.invalidateQueries(); // Tout refetch !
};

// ✅ Invalider uniquement les queries concernees
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
};
```

```tsx
// ❌ Pas de rollback sur les mises a jour optimistes
onMutate: async (postId) => {
  queryClient.setQueryData(key, newData); // Pas de sauvegarde !
};

// ✅ Sauvegarder et rollback
onMutate: async (postId) => {
  const previous = queryClient.getQueryData(key);
  queryClient.setQueryData(key, newData);
  return { previous }; // Context pour rollback
},
onError: (_err, _vars, context) => {
  queryClient.setQueryData(key, context?.previous);
},
```

---

## Recapitulatif

| Concept | Hook / API | Points cles |
|---------|------------|-------------|
| Lecture | `useQuery` | queryKey, queryFn, staleTime, gcTime, enabled |
| Ecriture | `useMutation` | mutationFn, onSuccess invalidation |
| Pagination | `useInfiniteQuery` | getNextPageParam, fetchNextPage, flatMap pages |
| Invalidation | `invalidateQueries` | Par prefixe, par predicat, setQueryData |
| Optimistic | `onMutate` | Cancel, save previous, update, rollback onError |
| Prefetch | `prefetchQuery` | onPressIn, au scroll, au login |
| Offline | `onlineManager` + persist | NetInfo, AsyncStorage, networkMode |
| Parallele | `useQueries` | Plusieurs queries independantes |

---

## Exercice pratique

Rendez-vous au [Lab 13](../labs/lab-13-react-query-cache/) pour implementer un systeme de cache avec invalidation, mises a jour optimistes et pagination.

---

<details>
<summary>Pour aller plus loin</summary>

- [TanStack Query — Documentation officielle](https://tanstack.com/query/latest)
- [TanStack Query — React Native guide](https://tanstack.com/query/latest/docs/framework/react/react-native)
- [Practical React Query — Blog TkDodo](https://tkdodo.eu/blog/practical-react-query)
- [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Offline support](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)

</details>
