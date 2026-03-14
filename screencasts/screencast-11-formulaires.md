# Screencast 11 — Formulaires et validation

## Objectifs
- Construire un formulaire d'inscription multi-etapes avec React Hook Form et Zod
- Gerer le clavier et les erreurs de maniere accessible
- Montrer les patterns de masque de saisie

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : pourquoi RHF + Zod (type-safety, performance) | Slides |
| 0:30-2:00 | Login form basique : Controller, TextInput, secureTextEntry | VS Code + emulateur |
| 2:00-3:30 | Schema Zod : email, password avec regex, refine pour confirmation | VS Code |
| 3:30-5:00 | Modes de validation : demo onSubmit vs onBlur vs onTouched | VS Code + emulateur |
| 5:00-7:00 | Wizard multi-etapes : 3 etapes (identite, adresse, paiement) | VS Code + emulateur |
| 7:00-8:00 | Validation par etape avec trigger(fieldsOfStep) | VS Code + emulateur |
| 8:00-9:30 | Masque de saisie : carte bancaire, date d'expiration | VS Code + emulateur |
| 9:30-10:30 | KeyboardAvoidingView + keyboardShouldPersistTaps + navigation entre champs | VS Code + emulateur |
| 10:30-11:30 | Affichage des erreurs : inline, summary, toast | VS Code + emulateur |
| 11:30-12:00 | Recapitulatif : checklist du formulaire bien construit | Slides |

## Points cles a montrer
- Controller obligatoire en RN (pas de register)
- Le mode `onTouched` comme meilleur compromis UX
- `trigger(['field1', 'field2'])` pour la validation partielle du wizard
- Le masque de carte bancaire qui formate en temps reel
- `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` sur KeyboardAvoidingView
- `keyboardShouldPersistTaps="handled"` pour pouvoir cliquer sur les boutons
- `accessibilityRole="alert"` sur les messages d'erreur

## Ressources
- React Hook Form : https://react-hook-form.com/
- Zod : https://zod.dev/
- @hookform/resolvers : https://github.com/react-hook-form/resolvers
