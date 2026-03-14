# Screencast 26 — Monter un monorepo React Native avec Turborepo et pnpm

| Metadata | Valeur |
|----------|--------|
| **Duree** | ~16 min |
| **Module** | [26 — Patterns avances et Monorepo](/modules/26-patterns-avances-monorepo) |
| **Outils** | VS Code, Terminal, pnpm, Turborepo, Expo |

---

## Plan de tournage

### Intro (0:00 - 0:50)
- "Dans ce screencast, on va creer un monorepo React Native complet avec Turborepo et pnpm : un package de design tokens, une UI library partagee, et deux apps (mobile + admin) qui utilisent les memes composants."
- Montrer le resultat final : les deux apps avec les memes boutons, cartes et couleurs
- "A la fin, on aura une CI qui ne teste que les packages affectes par un changement."

### Partie 1 — Initialiser le monorepo (0:50 - 2:30)
- Creer la structure :
  ```bash
  npx create-turbo@latest my-rn-monorepo --package-manager pnpm
  cd my-rn-monorepo
  ```
- Montrer la structure generee
- Creer les dossiers manquants :
  ```bash
  mkdir -p packages/tokens packages/ui packages/utils packages/config
  mkdir -p apps/mobile apps/admin
  ```
- Configurer `pnpm-workspace.yaml` :
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```
- "pnpm-workspace.yaml est la source de verite — il dit a pnpm quels dossiers sont des packages."

### Partie 2 — Creer le package tokens (2:30 - 4:30)
- Creer `packages/tokens/package.json` :
  ```json
  {
    "name": "@monorepo/tokens",
    "version": "0.1.0",
    "main": "./src/index.ts"
  }
  ```
- Ecrire les tokens :
  ```typescript
  // packages/tokens/src/index.ts
  export const tokens = {
    colors: {
      primary: '#0066FF',
      secondary: '#6C63FF',
      success: '#00C48C',
      error: '#FF4D4D',
      text: '#1A1A2E',
      background: '#FFFFFF',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    fontSizes: { sm: 13, md: 15, lg: 17, xl: 20 },
    radii: { sm: 4, md: 8, lg: 12, full: 9999 },
  } as const;
  ```
- "Les tokens sont `as const` — TypeScript infere les types litteraux, pas juste `string` ou `number`."
- Montrer l'autocompletion : `tokens.colors.` → liste toutes les couleurs

### Partie 3 — Creer la UI library (4:30 - 7:30)
- Creer `packages/ui/package.json` avec la dep vers tokens :
  ```json
  {
    "name": "@monorepo/ui",
    "dependencies": { "@monorepo/tokens": "workspace:*" },
    "peerDependencies": { "react": ">=18", "react-native": ">=0.74" }
  }
  ```
- "workspace:* pointe vers la version locale du package — pnpm cree un symlink."
- Creer le composant Button :
  ```typescript
  import { tokens } from '@monorepo/tokens';
  // ... implementation avec StyleSheet.create ...
  ```
- Creer le composant Card
- Creer `packages/ui/src/index.ts` avec les exports
- "Chaque composant utilise les tokens — si on change une couleur, ca se propage partout."

### Partie 4 — Creer les deux apps (7:30 - 10:00)
- Creer l'app mobile avec Expo :
  ```bash
  cd apps/mobile
  npx create-expo-app . --template blank-typescript
  ```
- Ajouter les deps internes :
  ```bash
  pnpm --filter @monorepo/mobile add @monorepo/ui @monorepo/tokens
  ```
- Configurer Metro pour le monorepo :
  ```javascript
  const monorepoRoot = path.resolve(__dirname, '../..');
  config.watchFolders = [monorepoRoot];
  ```
- Creer un HomeScreen utilisant Button et Card
- Repeter pour l'app admin avec un DashboardScreen
- Lancer les deux apps cote a cote : "Les memes composants, les memes couleurs, deux apps differentes."

### Partie 5 — Configurer Turborepo (10:00 - 12:00)
- Ecrire `turbo.json` :
  ```json
  {
    "tasks": {
      "build": {
        "dependsOn": ["^build"],
        "outputs": ["dist/**"]
      },
      "dev": { "persistent": true },
      "lint": { "dependsOn": ["^build"] },
      "test": { "dependsOn": ["^build"] }
    }
  }
  ```
- Montrer le graphe de dependances :
  ```bash
  turbo build --graph
  ```
- "Turbo visualise le graphe : tokens n'a pas de deps, ui depend de tokens, les apps dependent de ui."
- Lancer un build :
  ```bash
  turbo build
  ```
- Relancer : "FULL TURBO sur tokens et ui — le cache a retenu le resultat."

### Partie 6 — CI avec affected-only (12:00 - 14:00)
- Creer `.github/workflows/ci.yml` :
  ```yaml
  - name: Test affected
    run: pnpm turbo test --filter="...[origin/main]"
  ```
- Simuler un changement dans tokens :
  ```bash
  echo "// change" >> packages/tokens/src/index.ts
  turbo test --filter="...[HEAD~1]"
  ```
- "Turbo teste tokens, ui (depend de tokens), et les deux apps. Mais PAS packages/config qui n'est pas affecte."
- Montrer le gain : "Sur un vrai monorepo avec 20+ packages, ca divise le temps CI par 3-5x."

### Partie 7 — Bonus : Remote Cache (14:00 - 15:00)
- Connecter au remote cache :
  ```bash
  npx turbo login
  npx turbo link
  ```
- Lancer un build : "Les resultats sont envoyes au cache distant."
- Simuler un collegue : "Meme hash d'inputs → le build est telecharge au lieu d'etre recalcule."
- "En equipe de 10 devs, le remote cache economise des heures de CI par semaine."

### Conclusion (15:00 - 16:00)
- Recapituler la structure :
  - `packages/tokens` → source de verite du design
  - `packages/ui` → composants partages
  - `apps/mobile` + `apps/admin` → utilisent les memes briques
  - `turbo.json` → orchestration intelligente
  - `.github/workflows/ci.yml` → CI affected-only
- "Le monorepo n'est pas une silver bullet — il demande de la discipline. Mais pour un projet avec 2+ apps et une equipe > 5 devs, c'est le meilleur choix."
- Mentionner le lab 26 pour pratiquer les mecanismes sous-jacents
