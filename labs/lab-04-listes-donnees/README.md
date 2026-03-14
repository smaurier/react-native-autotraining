# Lab 04 — Listes et donnees

## Objectif

Implementer les utilitaires de manipulation de donnees utilises avec les composants de liste React Native : pagination, groupement en sections, virtualisation, recherche et tri.

## Concepts cles

### Pagination

La pagination decoupe un grand tableau en pages de taille fixe. La page 1 correspond aux premiers elements. La fonction retourne egalement si d'autres pages existent et le nombre total de pages.

### Groupement en sections (format SectionList)

`SectionList` attend un tableau de sections `{ title: string, data: T[] }`. A partir d'une liste plate de contacts, on groupe par premiere lettre du nom, on trie alphabetiquement au sein de chaque groupe, et on trie les groupes entre eux.

### Fenetre virtuelle

Les listes virtualisees ne rendent que les elements visibles. A partir d'un offset de scroll, de la hauteur du viewport et de la hauteur de chaque element, on calcule les indices de debut et de fin des elements visibles.

### Filtre de recherche

Recherche textuelle insensible a la casse sur un ou plusieurs champs d'un objet. Supporte les champs `string` et `number`.

### Tri multi-criteres

Trie un tableau selon une liste de criteres ordonnes (cle + direction). Le premier critere est le tri principal ; les suivants departtagent les egalites.

## Exercices

```bash
npx tsx exercise.ts
```
