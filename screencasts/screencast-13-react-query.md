# Screencast 13 — React Query et cache

## Objectifs
- Configurer TanStack Query avec les adaptateurs React Native
- Construire un feed infini avec useInfiniteQuery et FlatList
- Implementer un like optimiste avec rollback

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : pourquoi React Query remplace useEffect + useState | Slides |
| 0:30-2:00 | Installation et QueryClientProvider avec options par defaut | VS Code |
| 2:00-3:30 | Focus Manager (AppState) et Online Manager (NetInfo) pour React Native | VS Code |
| 3:30-5:30 | useQuery basique : queryKey, queryFn, staleTime, affichage loading/error | VS Code + emulateur |
| 5:30-7:00 | Query Key Factory : centraliser les clés, invalidation par prefixe | VS Code |
| 7:00-9:00 | useMutation : créer un post, onSuccess avec invalidation du cache | VS Code + emulateur |
| 9:00-11:30 | Mise a jour optimiste : like/unlike avec onMutate, rollback onError, onSettled | VS Code + emulateur |
| 11:30-14:00 | useInfiniteQuery : feed avec scroll infini, flatMap, FlatList intégration | VS Code + emulateur |
| 14:00-15:30 | Prefetching : onPressIn pour navigation instantanee, montrer le DevTools | VS Code + emulateur |
| 15:30-17:00 | Offline support : persistence AsyncStorage, networkMode offlineFirst | VS Code + emulateur |
| 17:00-18:00 | Récapitulatif : quand utiliser chaque feature | Slides |

## Points clés a montrer
- Avant/après React Query : comparer le code avec useEffect vs useQuery (nombre de lignes)
- Le stale-while-revalidate en action : montrer que les donnees s'affichent instantanement + refetch
- L'update optimiste : le like est immediat, simuler une erreur serveur pour montrer le rollback
- Le scroll infini fluide : onEndReachedThreshold a 0.5 prefetch avant d'atteindre le bas
- DevTools : montrer le cache en temps réel avec React Query DevTools

## Ressources
- TanStack Query : https://tanstack.com/query/latest
- TanStack Query React Native : https://tanstack.com/query/latest/docs/framework/react/react-native
- Blog TkDodo : https://tkdodo.eu/blog/practical-react-query
