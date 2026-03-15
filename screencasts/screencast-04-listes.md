# Screencast 04 — Listes et donnees

## Objectifs
- Construire une liste de contacts avec FlatList et SectionList
- Implementer la recherche, le pull-to-refresh et le scroll infini
- Optimiser les performances avec getItemLayout et windowSize

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : pourquoi FlatList et pas ScrollView | Slides |
| 0:30-2:00 | FlatList basique : renderItem, keyExtractor, data | VS Code + emulateur |
| 2:00-3:30 | ListEmptyComponent, ListHeaderComponent, separateurs | VS Code + emulateur |
| 3:30-5:00 | SectionList : regrouper des contacts par lettre | VS Code + emulateur |
| 5:00-6:30 | Pull-to-refresh : onRefresh, refreshing state | VS Code + emulateur |
| 6:30-8:00 | Scroll infini : onEndReached, pagination | VS Code + emulateur |
| 8:00-10:00 | Recherche filtree en temps réel | VS Code + emulateur |
| 10:00-11:00 | Optimisation : getItemLayout, windowSize, maxToRenderPerBatch | VS Code + Flipper |
| 11:00-12:00 | Récapitulatif et mention de FlashList | Slides |

## Points clés a montrer
- La différence de performance entre ScrollView (tout en mémoire) et FlatList (virtualise)
- Le pattern de pagination avec un state `page` et `hasMore`
- Comment filtrer sans recalculer la liste complete à chaque frappe (debounce)
- L'impact visible de getItemLayout sur le scroll rapide

## Ressources
- Documentation FlatList : https://reactnative.dev/docs/flatlist
- FlashList par Shopify : https://shopify.github.io/flash-list/
