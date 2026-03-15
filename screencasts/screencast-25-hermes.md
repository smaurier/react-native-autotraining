# Screencast 25 — Profiler et optimiser le startup d'une app React Native

| Metadata | Valeur |
|----------|--------|
| **Duree** | ~14 min |
| **Module** | [25 — Hermes Engine et mode Bridgeless](/modules/25-hermes-internals-bridgeless) |
| **Outils** | VS Code, Terminal, Chrome DevTools, Emulateur Android, Expo |

---

## Plan de tournage

### Intro (0:00 - 0:40)
- "Dans ce screencast, on va profiler une app React Native avec un startup lent et l'optimiser en utilisant les outils Hermes. On va passer de 2.5 secondes a moins de 800ms de TTI."
- Montrer l'app avant optimisation : ecran blanc pendant 2+ secondes
- "On va utiliser le sampling profiler Hermes, les heap snapshots, et appliquer les techniques d'optimisation vues dans le module."

### Partie 1 — Vérifier la config Hermes et Bridgeless (0:40 - 1:40)
- Ouvrir le projet Expo
- Vérifier `app.json` :
  ```json
  {
    "expo": {
      "jsEngine": "hermes",
      "newArchEnabled": true
    }
  }
  ```
- Ajouter un check runtime :
  ```typescript
  console.log('Hermes:', !!(global as any).HermesInternal);
  console.log('Bridgeless:', !!(global as any).__turboModuleProxy);
  ```
- "On confirme que Hermes et le mode Bridgeless sont actifs. C'est la base — sans ça, on ne peut pas profiler correctement."

### Partie 2 — Mesurer la baseline avec performance.mark (1:40 - 3:30)
- Ajouter des marks dans index.ts :
  ```typescript
  performance.mark('js_start');
  // ... imports ...
  performance.mark('imports_done');
  // ... register ...
  performance.mark('register_done');
  ```
- Ajouter un `useEffect` dans App.tsx pour marquer le TTI :
  ```typescript
  useEffect(() => {
    performance.mark('tti');
    performance.measure('Total', 'js_start', 'tti');
    const entries = performance.getEntriesByName('Total');
    console.log('TTI:', entries[0]?.duration, 'ms');
  }, []);
  ```
- Lancer l'app, montrer les logs : "TTI: 2480ms — c'est beaucoup trop."
- "performance.mark et performance.measure sont disponibles nativement dans Hermes depuis RN 0.72."

### Partie 3 — Identifier les coupables avec le sampling profiler (3:30 - 6:00)
- Activer le profiler Hermes :
  ```typescript
  if ((global as any).HermesInternal) {
    (global as any).HermesInternal.enableSamplingProfiler();
  }
  ```
- Recuperer le profil : `adb pull /data/data/<package>/files/sampling-profiler-trace.cpuprofile`
- Ouvrir dans Chrome DevTools → Performance → Load Profile
- Montrer le flame chart :
  - "Voila notre flame chart. La largeur de chaque barre represente le temps CPU."
  - Zoomer sur les zones larges :
    - moment : "287ms pour charger moment + ses locales"
    - lodash : "180ms pour 300+ fonctions qu'on n'utilise pas toutes"
    - barrel import : "220ms pour charger tous les composants via index.ts"
    - analytics init synchrone : "190ms bloque le startup"
- "Au total, les imports prennent 890ms — c'est notre goulot principal."

### Partie 4 — Analyser la mémoire avec un heap snapshot (6:00 - 7:30)
- Capturer un heap snapshot :
  ```typescript
  (global as any).HermesInternal.createHeapSnapshot('snapshot.heapsnapshot');
  ```
- Ouvrir dans Chrome DevTools → Memory → Load
- "On cherche les objets Detached (éléments DOM detaches) et les gros objets avec beaucoup de retainers."
- Montrer un exemple : "Cet EventListener n'est jamais nettoye — c'est une fuite."
- Montrer le pattern corriger :
  ```typescript
  useEffect(() => {
    const sub = eventEmitter.addListener('data', handler);
    return () => sub.remove(); // CLEANUP
  }, []);
  ```

### Partie 5 — Optimiser les imports (7:30 - 10:00)
- Remplacer moment par dayjs :
  ```bash
  pnpm remove moment
  pnpm add dayjs
  ```
  - "287 Ko → 2 Ko. dayjs à la même API que moment."
- Remplacer lodash barrel par imports directs :
  ```typescript
  // Avant : import _ from 'lodash';
  // Apres :
  import debounce from 'lodash/debounce';
  ```
  - "531 Ko → ~5 Ko pour les 2 fonctions qu'on utilise."
- Supprimer le barrel import :
  ```typescript
  // Avant : import { Button, Card } from './components';
  // Apres :
  import { Button } from './components/Button';
  const AdminPanel = lazy(() => import('./components/AdminPanel'));
  ```
  - "On importe directement et on lazy-load les composants secondaires."
- Differer l'analytics :
  ```typescript
  // Avant : initAnalytics(); // synchrone au startup
  // Apres :
  InteractionManager.runAfterInteractions(() => {
    initAnalytics();
  });
  ```
  - "runAfterInteractions attend que les animations de démarrage soient terminees."

### Partie 6 — Activer les inline requires (10:00 - 11:00)
- Configurer Metro :
  ```javascript
  // metro.config.js
  module.exports = {
    transformer: {
      getTransformOptions: async () => ({
        transform: { inlineRequires: true },
      }),
    },
  };
  ```
- "Inline requires deplace les require() au point d'utilisation. Un module n'est charge que quand il est réellement appele, pas au démarrage."

### Partie 7 — Mesurer les résultats (11:00 - 12:30)
- Relancer l'app avec les optimisations
- Montrer les nouveaux logs :
  ```
  Imports: 95ms (avant: 890ms, -89%)
  First Render: 280ms (avant: 420ms, -33%)
  TTI: 720ms (avant: 2480ms, -71%)
  ```
- Montrer le nouveau flame chart : "Les barres larges ont disparu."
- Comparer le bundle size :
  ```
  Avant: 4.2 Mo → Apres: 2.1 Mo (-50%)
  ```
- "L'app demarre maintenant en moins d'une seconde, même sur un appareil milieu de gamme."

### Partie 8 — Récapitulatif et checklist (12:30 - 14:00)
- Afficher la checklist sur l'ecran :
  - Hermes + Bridgeless actifs
  - Inline requires actives
  - Imports directs (pas de barrels)
  - Librairies legeres (dayjs, lodash-es)
  - Lazy loading des ecrans secondaires
  - Analytics/tracking differes
  - Cleanup dans tous les useEffect
  - Profiling regulier
- "Le profiling devrait faire partie de votre workflow regulier — pas seulement quand ça rame. Un check toutes les 2 semaines, et vous gardez un startup sous la seconde."
- Mentionner le lab 25 pour pratiquer les mécanismes sous-jacents
