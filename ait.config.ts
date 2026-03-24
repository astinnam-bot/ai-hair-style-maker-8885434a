import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'ai-hair-style',
  web: {
    port: 5173,
    commands: {
      dev: 'npm run dev',
      build: 'npm run build',
    },
  },
  brand: {},
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
});
