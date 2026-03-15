# Lab 13 — React Query et cache

## Objectif

Implementer les mécanismes fondamentaux de cache et de gestion de requêtes que TanStack Query fournit en interne : cache avec staleTime, factory de clés, mises a jour optimistes avec rollback, pagination par curseur et deduplication de requêtes.

## Concepts clés

### Cache de queries

Le cache associe une clé (string) a des donnees et un `staleTime`. Tant que `Date.now() - timestamp < staleTime`, les donnees sont "fraiches" et servies directement. L'invalidation met le staleTime a 0, et le garbage collector supprime les entrees stale.

### Query Key Factory

Les clés de cache sont structurees de façon hiérarchique : `['posts']` pour tout, `['posts', 'list']` pour les listes, `['posts', 'detail', 42]` pour un detail. Une factory centralise la création de ces clés pour éviter les erreurs et faciliter l'invalidation par prefixe.

### Mise a jour optimiste

On met a jour le cache **avant** la confirmation serveur pour donner une sensation de réactivité instantanee. Si la mutation echoue, le rollback restaure l'état précédent. Le pattern : sauvegarder, mettre a jour, retourner un rollback.

### Paginator cursor-based

La pagination par curseur est plus performante que l'offset pour les grands ensembles de donnees. Le serveur retourne un `nextCursor` que le client passe au prochain appel. Le paginateur accumule les résultats et géré l'état `hasMore`.

### Deduplication de requêtes

Si plusieurs composants demandent la même donnee simultanement, une seule requête doit partir. Les appels concurrents recoivent la même Promise. Une fois resolue, la clé est liberee pour permettre de futurs appels.

## Exercices

```bash
npx tsx exercise.ts
```
