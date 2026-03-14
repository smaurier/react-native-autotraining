# Lab 12 — Networking et API

## Objectif

Implementer les utilitaires fondamentaux pour les appels reseau dans une application React Native : client API type, retry avec backoff, gestion de tokens et annulation de requetes.

## Concepts cles

### Client API

Un client API centralise la construction des requetes HTTP : base URL, headers par defaut, serialisation du body, query params et intercepteurs. Les intercepteurs permettent d'ajouter des comportements transversaux (authentification, logging) sans modifier chaque appel.

### Retry avec backoff exponentiel

Quand une requete echoue pour une raison transitoire (timeout, erreur serveur), on reessaye avec un delai croissant : 1s, 2s, 4s, 8s... Cela evite de surcharger un serveur deja en difficulte.

### Token Manager

Le gestionnaire de tokens stocke l'access token courant et sa date d'expiration. La methode refresh() appelle une fonction de rafraichissement et deduplication les appels concurrents : si 3 requetes echouent en 401 simultanement, une seule execution du refresh a lieu.

### Requete annulable

AbortController permet d'annuler une requete en cours. Le pattern combine un timeout automatique et un abort manuel, utile quand l'utilisateur quitte un ecran ou relance une recherche.

### Categorisation d'erreurs

Les erreurs reseau (TypeError), les annulations (AbortError), les erreurs HTTP (4xx, 5xx) et les erreurs inconnues sont traitees differemment. Certaines sont retryable (timeout, 429, 5xx), d'autres non (404, 422).

## Exercices

```bash
npx tsx exercise.ts
```
