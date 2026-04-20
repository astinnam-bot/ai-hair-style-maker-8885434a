import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "aihairstyle",
  web: {
    port: 5173,
    commands: {
      dev: "npm run dev",
      build: "npm run build",
    },
  },
  brand: {
    displayName: "Ai 헤어 스타일",
    primaryColor: "#3182F6",
    icon: "https://static.toss.im/appsintoss/23993/c2d15154-f777-47dd-a91f-70033b2f6ebe.png",
  },
  permissions: [],
  webViewProps: {
    type: "partner",
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
});
