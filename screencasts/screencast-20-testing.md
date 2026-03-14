# Screencast 20 — Testing React Native

## Objectifs
- Configurer Jest et RNTL dans un projet Expo
- Ecrire des tests de composants avec les bonnes queries
- Tester un flux complet (login) avec mocks, async et store
- Configurer la couverture de code avec des seuils pertinents

## Plan de tournage
| Timing | Contenu | Ecran |
|--------|---------|-------|
| 0:00-0:30 | Introduction : pourquoi tester, pyramide de tests | Slides |
| 0:30-2:00 | Setup Jest + RNTL dans un projet Expo SDK 52 | VS Code + terminal |
| 2:00-3:30 | Premier test : render, screen, getByText, getByRole | VS Code + terminal |
| 3:30-5:00 | fireEvent : press, changeText, scroll | VS Code |
| 5:00-6:30 | Tests async : waitFor, findBy, mock fetch | VS Code + terminal |
| 6:30-8:00 | Tester un hook : renderHook, act, wrapper avec providers | VS Code |
| 8:00-9:30 | Mocker les modules natifs : expo-camera, AsyncStorage, Reanimated | VS Code |
| 9:30-10:30 | Tester un store Zustand : setState, getState, beforeEach reset | VS Code + terminal |
| 10:30-11:30 | Snapshot testing : quand utiliser, quand eviter, inline snapshots | VS Code |
| 11:30-13:00 | Flux complet : test du LoginScreen (composant + hook + store + API) | VS Code + terminal |
| 13:00-14:00 | Couverture : configuration des seuils, rapport HTML, CI | VS Code + navigateur |

## Points cles a montrer
- La hierarchie des queries (getByRole > getByText > getByTestId)
- Un test qui echoue quand on utilise getByTestId alors que getByRole suffit
- La difference entre un bon et un mauvais snapshot (petit composant vs page entiere)
- Le beforeEach avec useStore.setState pour isoler les tests Zustand
- Le rapport de couverture HTML avec les lignes vertes/rouges
- Le flow complet de test du LoginScreen avec toutes les branches testees

## Ressources
- React Native Testing Library : https://callstack.github.io/react-native-testing-library/
- Jest : https://jestjs.io/
- Testing Library : https://testing-library.com/
- Expo Testing : https://docs.expo.dev/develop/unit-testing/
