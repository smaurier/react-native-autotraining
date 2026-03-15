# Lab 04 — Listes et donnees

## Objectif

Implementer les utilitaires de manipulation de donnees utilises avec les composants de liste React Native : pagination, groupement en sections, virtualisation, recherche et tri.

## Concepts clés

### Pagination

La pagination découpé un grand tableau en pages de taille fixe. La page 1 correspond aux premiers éléments. La fonction retourne egalement si d'autres pages existent et le nombre total de pages.

### Groupement en sections (format SectionList)

`SectionList` attend un tableau de sections `{ title: string, data: T[] }`. A partir d'une liste plate de contacts, on groupe par première lettre du nom, on trie alphabetiquement au sein de chaque groupe, et on trie les groupes entre eux.

### Fenetre virtuelle

Les listes virtualisees ne rendent que les éléments visibles. A partir d'un offset de scroll, de la hauteur du viewport et de la hauteur de chaque élément, on calcule les indices de debut et de fin des éléments visibles.

### Filtre de recherche

Recherche textuelle insensible à la casse sur un ou plusieurs champs d'un objet. Supporte les champs `string` et `number`.

### Tri multi-criteres

Trie un tableau selon une liste de criteres ordonnes (clé + direction). Le premier critere est le tri principal ; les suivants departtagent les egalites.

## Exercices

```bash
npx tsx exercise.ts
```
