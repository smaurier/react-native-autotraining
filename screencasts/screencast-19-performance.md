# Screencast 19 — Performance et optimisation

## Objectifs
- Identifier et corriger les re-renders inutiles avec React DevTools Profiler
- Migrer une FlatList vers FlashList et mesurer l'amelioration
- Optimiser les images avec expo-image et blurhash
- Analyser et reduire la taille du bundle

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : pourquoi la performance mobile est critique (60fps) | Slides |
| 0:30-2:00 | React DevTools Profiler : identifier les composants qui re-rendent trop | VS Code + emulateur + DevTools |
| 2:00-3:30 | React.memo sur les items de liste : avant/après dans le Profiler | VS Code + DevTools |
| 3:30-5:00 | useMemo et useCallback : stabiliser les références, éviter les pieges | VS Code |
| 5:00-6:30 | Quand NE PAS optimiser : exemples de memo inutile | VS Code |
| 6:30-8:00 | FlashList : migration depuis FlatList, estimatedItemSize, getItemType | VS Code + emulateur |
| 8:00-9:30 | expo-image : blurhash, priorite, cache, comparaison avec Image | VS Code + emulateur |
| 9:30-11:00 | Bundle analysis : source-map-explorer, imports nommes vs defaut | Terminal + navigateur |
| 11:00-12:00 | Hermes : vérifier qu'il est actif, profiler avec HermesProfiling | VS Code + terminal |
| 12:00-13:00 | Fuites mémoire : pattern de cleanup dans useEffect | VS Code |
| 13:00-14:00 | Récapitulatif : checklist d'optimisation en 10 étapes | Slides |

## Points clés a montrer
- Le flame chart du Profiler avec les composants en rouge/orange
- La différence de blank frames entre FlatList et FlashList en scroll rapide
- Le blurhash qui s'affiche pendant le chargement de l'image
- La différence de taille du bundle avant/après tree-shaking (lodash vs lodash-es)
- Un useEffect sans cleanup qui cause un warning "setState on unmounted component"

## Ressources
- FlashList : https://shopify.github.io/flash-list/
- expo-image : https://docs.expo.dev/versions/latest/sdk/image/
- React DevTools : https://react.dev/learn/react-developer-tools
- Hermes : https://hermesengine.dev/
