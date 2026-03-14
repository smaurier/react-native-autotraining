# Lab 11 — Formulaires et validation

## Objectif

Implementer en pur TypeScript les mecanismes de validation de formulaires : validateur par schema, formulaire multi-etapes, assainissement des saisies, masques de champs et reducer d'etat de formulaire.

## Prerequis

- Module 11 : Formulaires et validation
- TypeScript : Record, RegExp, union types, switch

## Lancement

```bash
# Exercice (tests en echec)
npx tsx labs/lab-11-formulaires-validation/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-11-formulaires-validation/solution.ts
```

## Exercices

### Exercice 1 : createFormValidator (5 tests)

Creez un validateur de formulaire a partir d'un schema de champs. Chaque champ definit son type (`string`, `number`, `email`, `boolean`), ses contraintes (`required`, `minLength`, `maxLength`, `min`, `max`), un `pattern` regex optionnel et un validateur `custom`. Les methodes :
- `validate(data)` : valide tout le formulaire, retourne `{ valid, errors }`
- `validateField(field, value)` : valide un seul champ

### Exercice 2 : createMultiStepForm (3 tests)

Creez un gestionnaire de formulaire multi-etapes. Chaque etape definit ses champs et son schema de validation. Le wizard permet de naviguer entre les etapes, de valider l'etape courante avant d'avancer, et de detecter quand le formulaire est termine.

### Exercice 3 : sanitizeInput (4 tests)

Nettoyez les saisies utilisateur selon le type :
- `text` : trim + collapse des espaces multiples
- `email` : trim + lowercase + suppression des espaces
- `html` : suppression des balises HTML
- `numeric` : ne garder que chiffres, points et tiret initial

### Exercice 4 : createFieldMask (3 tests)

Creez un masque de saisie a partir d'un pattern (`#` = chiffre, `A` = lettre, reste = separateur). Le masque formate les caracteres bruts au fur et a mesure de la saisie.

### Exercice 5 : formStateReducer (3 tests)

Implementez un reducer pour gerer l'etat complet d'un formulaire : valeurs, erreurs, champs touches, soumission en cours, validite globale. C'est le pattern utilise avec `useReducer` dans React.

## Concepts cles

- **Validation par schema** : definir les regles de facon declarative, pas dans les composants
- **Multi-etapes** : valider uniquement les champs de l'etape courante avant d'avancer
- **Sanitization** : nettoyer les saisies AVANT la validation
- **Masques** : formater la saisie en temps reel tout en gardant la valeur brute
- **Reducer** : gerer un etat complexe de formulaire avec des actions previsibles
