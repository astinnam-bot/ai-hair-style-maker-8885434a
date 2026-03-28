import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'aihairstyle',
  web: {
    port: 5173,
    commands: {
      dev: 'npm run dev',
      build: 'npm run build',
    },
  },
  brand: {
    displayName: 'AI Hair Style',
    primaryColor: '#3182F6',
    icon: './favicon.ico',
  },
  permissions: [],
  webViewProps: {
    type: 'partner',
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
});
