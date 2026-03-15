# Screencast 03 — State et cycle de vie

| Duree | Difficulte | Prérequis |
|-------|------------|-----------|
| ~14 min | 2/5 | Module 02 (Props), Module 03 (théorie) |

## Objectif

Construire un chronometre (StopWatch) pour maîtriser useState et useRef, ajouter une recherche debounced pour comprendre useEffect et le cleanup, puis extraire des custom hooks réutilisables.

---

## Plan de tournage

### Partie 1 — StopWatch avec useState et useRef (0:00 - 5:00)

**Setup** : projet Expo, ecran vierge.

1. **[0:00]** Introduction : "On va construire un chronometre pour comprendre useState, useRef et useEffect"
2. **[0:30]** Créer `components/StopWatch.tsx` :
   - `useState(0)` pour le temps ecoule (ms)
   - `useState(false)` pour l'état running
   - Afficher MM:SS.cc
3. **[1:30]** Premiere tentative NAIVE avec setInterval dans un handler :
   ```tsx
   const start = () => {
     setInterval(() => setElapsed(elapsed + 10), 10);
   };
   ```
   Montrer le bug : elapsed reste a 0 (stale closure)
4. **[2:00]** Expliquer la stale closure avec un schema
5. **[2:30]** Corriger avec le setter fonctionnel : `setElapsed(prev => prev + 10)`
6. **[3:00]** Ajouter `useRef` pour stocker l'interval ID :
   - Expliquer pourquoi : "On a besoin de clearInterval mais on ne veut pas re-render"
7. **[3:30]** Implementer start/stop/reset proprement
8. **[4:00]** Ajouter le cleanup dans useEffect pour le demontage
9. **[4:30]** Tester : montrer que tout fonctionne, le chrono demarre, s'arrete, se remet a zero

**Point clé** : "useRef pour ce qui ne s'affiche pas, useState pour ce qui s'affiche."

### Partie 2 — Recherche debounced avec useEffect (5:00 - 9:30)

1. **[5:00]** Créer `components/DebouncedSearch.tsx` :
   - `TextInput` avec `useState` pour la query
   - `useState` pour les résultats
   - Simuler une API avec un setTimeout
2. **[5:30]** Premiere tentative : chercher à chaque frappe
   - Montrer le problème : trop de requêtes, résultats qui se chevauchent
3. **[6:00]** Expliquer le concept du debounce avec un schema temporel
4. **[6:30]** Implementer avec useEffect + setTimeout + cleanup :
   ```tsx
   useEffect(() => {
     const timer = setTimeout(() => {
       search(query);
     }, 300);
     return () => clearTimeout(timer);
   }, [query]);
   ```
5. **[7:00]** Montrer le fonctionnement : taper rapidement, la recherche ne se lance qu'après 300ms d'inactivite
6. **[7:30]** Ajouter un AbortController pour annuler les requêtes en vol :
   - Montrer le cleanup qui abort la requête précédente
7. **[8:00]** Ajouter un état loading et une gestion d'erreur
8. **[8:30]** Expliquer le dependency array :
   - `[]` = au montage
   - `[query]` = quand query change
   - Sans array = à chaque render (a éviter)
9. **[9:00]** Montrer le bug de la boucle infinie si on met un objet dans les deps

**Point clé** : "Le cleanup de useEffect est votre meilleur ami pour éviter les fuites."

### Partie 3 — Custom hooks (9:30 - 14:00)

1. **[9:30]** "On a de la logique réutilisable — extraisons-la dans des hooks"
2. **[10:00]** Extraire `useDebounce(value, delay)` :
   - Montrer le refactoring pas a pas
   - Le hook retourne la valeur debounced
3. **[10:30]** Extraire `useStopWatch()` :
   - Retourne `{ elapsed, running, start, stop, reset }`
   - Le composant StopWatch devient très simple
4. **[11:00]** Créer `useToggle(initialValue)` :
   - Retourne `{ value, toggle, setTrue, setFalse }`
   - Montrer l'utilisation pour un switch dark mode
5. **[11:30]** Créer `usePrevious(value)` :
   - Utilise useRef + useEffect
   - Montrer l'utilisation pour afficher "prix précédent" a cote du prix actuel
6. **[12:00]** Montrer la convention : "Toujours commencer par `use`, c'est la regle de React"
7. **[12:30]** Tester que les hooks se composent : utiliser `useDebounce` dans `useDebouncedSearch`
8. **[13:00]** Recap : "Les custom hooks sont LE mécanisme de reutilisation en React"
9. **[13:30]** Résumé des 5 regles :
   - Setter fonctionnel quand le new state depend de l'ancien
   - Immutabilite : spread, map, filter — jamais muter
   - Cleanup dans useEffect pour les timers et subscriptions
   - useRef pour les valeurs qui ne s'affichent pas
   - Custom hooks pour la logique réutilisable

**Point clé** : "Un composant bien écrit = un assemblage de hooks bien decoupes."

---

## Fichiers crees pendant le screencast

```
components/
  StopWatch.tsx
  DebouncedSearch.tsx
hooks/
  useDebounce.ts
  useStopWatch.ts
  useToggle.ts
  usePrevious.ts
App.tsx (modifie)
```

## Points a souligner a l'ecran

- Le console.log pour montrer les re-renders
- Le React DevTools pour visualiser l'état des hooks
- La stale closure en action (le bug visible)
- Le cleanup de useEffect qui log "cleanup!" pour montrer quand il s'exécuté
- Le nombre de lignes du composant avant/après extraction des hooks

## Erreurs a montrer volontairement

1. Stale closure dans setInterval -> montrer le bug, expliquer, corriger
2. Boucle infinie avec un objet dans le dependency array
3. Oublier le cleanup d'un setInterval -> fuite mémoire visible au demontage
4. Muter un tableau avec push() -> montrer que ça ne re-render pas
