import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'React Native — De debutant a expert',
  description: 'Formation complete React Native : composants, navigation, state, APIs natives, animations, testing, deploiement, New Architecture',
  lang: 'fr-FR',
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: 'Accueil', link: '/' },
      { text: 'Modules', link: '/modules/00-prerequis-et-introduction' },
      { text: 'Labs', link: '/labs/lab-00-prerequis-setup/' },
      { text: 'Quizzes', link: '/quizzes/' },
      { text: 'Visualizations', link: '/visualizations/' },
      { text: 'Glossaire', link: '/glossaire' },
    ],

    sidebar: [
      {
        text: 'Phase 0 — Prerequis',
        collapsed: false,
        items: [
          { text: '00. Prerequis et introduction', link: '/modules/00-prerequis-et-introduction' },
        ],
      },
      {
        text: 'Phase 1 — Fondamentaux',
        collapsed: false,
        items: [
          { text: '01. JSX et premiers composants', link: '/modules/01-jsx-et-premiers-composants' },
          { text: '02. Props et communication', link: '/modules/02-props-et-communication' },
          { text: '03. State et cycle de vie', link: '/modules/03-state-et-cycle-de-vie' },
          { text: '04. Listes et donnees', link: '/modules/04-listes-et-donnees' },
        ],
      },
      {
        text: 'Phase 2 — Interface et Styling',
        collapsed: false,
        items: [
          { text: '05. StyleSheet et Flexbox', link: '/modules/05-stylesheet-et-flexbox' },
          { text: '06. Responsive et plateformes', link: '/modules/06-responsive-et-plateformes' },
          { text: '07. Composants UI avances', link: '/modules/07-composants-ui-avances' },
        ],
      },
      {
        text: 'Phase 3 — Navigation et Architecture',
        collapsed: false,
        items: [
          { text: '08. React Navigation fondamentaux', link: '/modules/08-react-navigation-fondamentaux' },
          { text: '09. Navigation avancee', link: '/modules/09-navigation-avancee' },
          { text: '10. Gestion d\'etat : Context et Zustand', link: '/modules/10-gestion-detat-context-zustand' },
          { text: '11. Formulaires et validation', link: '/modules/11-formulaires-et-validation' },
        ],
      },
      {
        text: 'Phase 4 — Donnees et Reseau',
        collapsed: false,
        items: [
          { text: '12. Networking et API', link: '/modules/12-networking-et-api' },
          { text: '13. React Query et cache', link: '/modules/13-react-query-et-cache' },
          { text: '14. Stockage local et offline-first', link: '/modules/14-stockage-local-offline-first' },
        ],
      },
      {
        text: 'Phase 5 — APIs Natives et Animations',
        collapsed: false,
        items: [
          { text: '15. APIs natives essentielles', link: '/modules/15-apis-natives-essentielles' },
          { text: '16. Capteurs et notifications', link: '/modules/16-capteurs-et-notifications' },
          { text: '17. Animated API et LayoutAnimation', link: '/modules/17-animated-api-layout-animation' },
          { text: '18. Reanimated et Gesture Handler', link: '/modules/18-reanimated-et-gesture-handler' },
        ],
      },
      {
        text: 'Phase 6 — Qualite et Production',
        collapsed: false,
        items: [
          { text: '19. Performance et optimisation', link: '/modules/19-performance-et-optimisation' },
          { text: '20. Testing React Native', link: '/modules/20-testing-react-native' },
          { text: '21. Tests E2E avec Detox', link: '/modules/21-tests-e2e-detox' },
          { text: '22. Deploiement et CI/CD', link: '/modules/22-deploiement-et-ci-cd' },
        ],
      },
      {
        text: 'Phase 7 — Expert',
        collapsed: false,
        items: [
          { text: '23. Modules natifs et Turbo Modules', link: '/modules/23-modules-natifs-turbo-modules' },
          { text: '24. New Architecture : Fabric et JSI', link: '/modules/24-new-architecture-fabric-jsi' },
          { text: '25. Hermes internals et bridgeless', link: '/modules/25-hermes-internals-bridgeless' },
          { text: '26. Patterns avances et monorepo', link: '/modules/26-patterns-avances-monorepo' },
          { text: '27. Projet final', link: '/modules/27-projet-final' },
        ],
      },
      {
        text: 'Labs',
        collapsed: true,
        items: [
          { text: 'Lab 00 — Prerequis et setup', link: '/labs/lab-00-prerequis-setup/' },
          { text: 'Lab 01 — JSX et composants', link: '/labs/lab-01-jsx-composants/' },
          { text: 'Lab 02 — Props et communication', link: '/labs/lab-02-props-communication/' },
          { text: 'Lab 03 — State et cycle de vie', link: '/labs/lab-03-state-cycle-de-vie/' },
          { text: 'Lab 04 — Listes et donnees', link: '/labs/lab-04-listes-donnees/' },
          { text: 'Lab 05 — StyleSheet et Flexbox', link: '/labs/lab-05-stylesheet-flexbox/' },
          { text: 'Lab 06 — Responsive et plateformes', link: '/labs/lab-06-responsive-plateformes/' },
          { text: 'Lab 07 — Composants UI avances', link: '/labs/lab-07-composants-ui-avances/' },
          { text: 'Lab 08 — Navigation fondamentaux', link: '/labs/lab-08-navigation-fondamentaux/' },
          { text: 'Lab 09 — Navigation avancee', link: '/labs/lab-09-navigation-avancee/' },
          { text: 'Lab 10 — Gestion d\'etat', link: '/labs/lab-10-gestion-detat/' },
          { text: 'Lab 11 — Formulaires et validation', link: '/labs/lab-11-formulaires-validation/' },
          { text: 'Lab 12 — Networking et API', link: '/labs/lab-12-networking-api/' },
          { text: 'Lab 13 — React Query et cache', link: '/labs/lab-13-react-query-cache/' },
          { text: 'Lab 14 — Stockage et offline', link: '/labs/lab-14-stockage-offline/' },
          { text: 'Lab 15 — APIs natives', link: '/labs/lab-15-apis-natives/' },
          { text: 'Lab 16 — Capteurs et notifications', link: '/labs/lab-16-capteurs-notifications/' },
          { text: 'Lab 17 — Animated API', link: '/labs/lab-17-animated-api/' },
          { text: 'Lab 18 — Reanimated et gestures', link: '/labs/lab-18-reanimated-gestures/' },
          { text: 'Lab 19 — Performance', link: '/labs/lab-19-performance/' },
          { text: 'Lab 20 — Testing', link: '/labs/lab-20-testing/' },
          { text: 'Lab 21 — Detox E2E', link: '/labs/lab-21-detox-e2e/' },
          { text: 'Lab 22 — Deploiement et CI/CD', link: '/labs/lab-22-deploiement-ci-cd/' },
          { text: 'Lab 23 — Modules natifs', link: '/labs/lab-23-modules-natifs/' },
          { text: 'Lab 24 — Fabric et JSI', link: '/labs/lab-24-fabric-jsi/' },
          { text: 'Lab 25 — Hermes et bridgeless', link: '/labs/lab-25-hermes-bridgeless/' },
          { text: 'Lab 26 — Patterns et monorepo', link: '/labs/lab-26-patterns-monorepo/' },
          { text: 'Lab 27 — Projet final', link: '/labs/lab-27-projet-final/' },
        ],
      },
      {
        text: 'Quizzes',
        collapsed: true,
        items: [
          { text: 'Tous les quizzes', link: '/quizzes/' },
        ],
      },
      {
        text: 'Visualizations',
        collapsed: true,
        items: [
          { text: 'Toutes les visualizations', link: '/visualizations/' },
        ],
      },
      {
        text: 'Ressources',
        collapsed: true,
        items: [
          { text: 'Glossaire', link: '/glossaire' },
        ],
      },
    ],

    outline: { level: [2, 3] },
    search: { provider: 'local' },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/smaurier/react-native-course' },
    ],
  },
})
