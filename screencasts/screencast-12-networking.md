# Screencast 12 — Networking et API

## Objectifs
- Construire un client API type avec fetch et TypeScript
- Implementer AbortController dans useEffect avec cleanup
- Mettre en place un systeme de Bearer token avec refresh automatique

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : fetch natif en React Native, pas besoin d'Axios | Slides |
| 0:30-2:00 | GET basique : fetch, response.ok, typage de la reponse | VS Code + emulateur |
| 2:00-3:30 | POST/PUT/DELETE : body JSON, headers, codes de retour | VS Code + emulateur |
| 3:30-5:00 | AbortController : annulation dans useEffect, pattern cleanup | VS Code + emulateur |
| 5:00-6:30 | Timeout avec AbortController : fetchWithTimeout wrapper | VS Code + emulateur |
| 6:30-8:30 | Client API : classe avec baseUrl, intercepteurs, construction des requetes | VS Code |
| 8:30-10:00 | Authentification Bearer : TokenManager avec refresh et deduplication | VS Code |
| 10:00-11:30 | Retry avec backoff exponentiel : retryWithBackoff et jitter | VS Code |
| 11:30-13:00 | Gestion d'erreurs : NetworkError, ApiError, categorisation | VS Code + emulateur |
| 13:00-14:00 | Demo complete : feed de posts avec pagination et annulation | VS Code + emulateur |
| 14:00-15:00 | Recapitulatif et transition vers React Query | Slides |

## Points cles a montrer
- La difference entre fetch et Axios : fetch ne rejette pas sur 4xx/5xx
- Le pattern AbortController + useEffect cleanup : montrer le warning React sans cleanup
- La deduplication du refresh token : simuler 3 requetes 401 simultanees
- Le backoff exponentiel visuellement : montrer les delais croissants dans la console
- La categorisation des erreurs : afficher differents messages selon le type

## Ressources
- Documentation fetch : https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- AbortController : https://developer.mozilla.org/en-US/docs/Web/API/AbortController
- React Native Networking : https://reactnative.dev/docs/network
