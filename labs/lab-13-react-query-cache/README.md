# Lab 13 — React Query et cache

## Objectif

Implementer les mecanismes fondamentaux de cache et de gestion de requetes que TanStack Query fournit en interne : cache avec staleTime, factory de cles, mises a jour optimistes avec rollback, pagination par curseur et deduplication de requetes.

## Concepts cles

### Cache de queries

Le cache associe une cle (string) a des donnees et un `staleTime`. Tant que `Date.now() - timestamp < staleTime`, les donnees sont "fraiches" et servies directement. L'invalidation met le staleTime a 0, et le garbage collector supprime les entrees stale.

### Query Key Factory

Les cles de cache sont structurees de facon hierarchique : `['posts']` pour tout, `['posts', 'list']` pour les listes, `['posts', 'detail', 42]` pour un detail. Une factory centralise la creation de ces cles pour eviter les erreurs et faciliter l'invalidation par prefixe.

### Mise a jour optimiste

On met a jour le cache **avant** la confirmation serveur pour donner une sensation de reactivite instantanee. Si la mutation echoue, le rollback restaure l'etat precedent. Le pattern : sauvegarder, mettre a jour, retourner un rollback.

### Paginator cursor-based

La pagination par curseur est plus performante que l'offset pour les grands ensembles de donnees. Le serveur retourne un `nextCursor` que le client passe au prochain appel. Le paginateur accumule les resultats et gere l'etat `hasMore`.

### Deduplication de requetes

Si plusieurs composants demandent la meme donnee simultanement, une seule requete doit partir. Les appels concurrents recoivent la meme Promise. Une fois resolue, la cle est liberee pour permettre de futurs appels.

## Exercices

```bash
npx tsx exercise.ts
```
