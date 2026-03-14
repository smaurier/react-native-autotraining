# Screencast 02 — Props et communication

| Duree | Difficulte | Prerequis |
|-------|------------|-----------|
| ~12 min | 2/5 | Module 01 (JSX), TypeScript bases |

## Objectif

Construire un composant `Button` avec variantes, ajouter des callback props pour la communication enfant-parent, et demontrer le probleme du props drilling.

---

## Plan de tournage

### Partie 1 — Button avec variantes (0:00 - 4:00)

**Setup** : projet Expo cree, ecran vierge.

1. **[0:00]** Introduction : "Aujourd'hui on va construire un systeme de boutons reutilisable avec TypeScript"
2. **[0:30]** Creer `components/Button.tsx` avec une interface `ButtonProps` basique :
   - `title: string` (requis)
   - `onPress: () => void` (requis)
   - `variant?: 'primary' | 'secondary' | 'outline' | 'danger'` (optionnel, defaut `'primary'`)
   - `size?: 'sm' | 'md' | 'lg'` (optionnel, defaut `'md'`)
   - `disabled?: boolean`
3. **[1:30]** Implementer le composant avec destructuration et valeurs par defaut
4. **[2:30]** Creer un objet `variantStyles` et `sizeStyles` pour mapper les variantes aux styles
5. **[3:00]** Montrer l'utilisation dans `App.tsx` avec differentes combinaisons
6. **[3:30]** Montrer l'autocompletion TypeScript dans l'editeur — le typage guide l'utilisation

**Point cle** : "Les props sont le contrat entre le parent et l'enfant. TypeScript le rend explicite."

### Partie 2 — Callback props : data up (4:00 - 8:00)

1. **[4:00]** Creer `components/RatingStars.tsx` :
   - Props : `maxStars`, `initialRating`, `onRate: (rating: number) => void`
   - Afficher des etoiles touchables
2. **[5:00]** Implementer le state local pour l'affichage des etoiles
3. **[5:30]** Appeler `onRate(stars)` quand l'utilisateur touche une etoile
4. **[6:00]** Dans le parent, creer un handler `handleRate` qui affiche le rating
5. **[6:30]** Ajouter un composant `ReviewForm` :
   - Un `RatingStars` pour la note
   - Un `TextInput` pour le commentaire
   - Un `Button` pour soumettre
   - Le parent collecte toutes les donnees via callbacks
6. **[7:30]** Montrer le flux : "Les donnees descendent via props, les evenements remontent via callbacks"

**Point cle** : "Le parent est la source de verite. L'enfant ne fait que notifier."

### Partie 3 — Props drilling et solution par composition (8:00 - 12:00)

1. **[8:00]** Creer une hierarchie : `App > MainScreen > Header > ThemeToggle`
2. **[8:30]** Passer `theme` et `onToggleTheme` a travers chaque niveau
3. **[9:00]** Montrer le probleme : MainScreen et Header recoivent des props qu'ils n'utilisent pas
4. **[9:30]** Compter : "4 fichiers a modifier pour changer la signature d'un seul prop"
5. **[10:00]** Refactorer avec la composition : passer `ThemeToggle` comme `children` ou slot
6. **[10:30]** Montrer le resultat : MainScreen et Header n'ont plus besoin de connaitre theme
7. **[11:00]** Mentionner : "Pour les cas plus complexes, on utilisera Context au module 10"
8. **[11:30]** Recap des 3 regles :
   - Toujours typer les props
   - Unidirectionnel : data down, events up
   - Composition avant drilling

**Point cle** : "Avant de sauter au Context, essayez de restructurer par composition."

---

## Fichiers crees pendant le screencast

```
components/
  Button.tsx
  RatingStars.tsx
  ReviewForm.tsx
  Header.tsx
  ThemeToggle.tsx
  MainScreen.tsx
App.tsx (modifie)
```

## Points a souligner a l'ecran

- Autocompletion des props dans VSCode
- Erreurs TypeScript en temps reel quand on oublie un prop requis
- Le flux unidirectionnel visible dans le React DevTools
- Le nombre de fichiers a modifier avec vs sans props drilling

## Erreurs a montrer volontairement

1. Oublier un prop requis -> erreur TypeScript rouge
2. Passer un mauvais type -> erreur TypeScript
3. Muter un prop directement -> montrer pourquoi ca ne marche pas
