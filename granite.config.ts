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
    displayName: "Ai 헤어 스타일", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#3182F6",
    icon: "https://static.toss.im/appsintoss/23993/c2d15154-f777-47dd-a91f-70033b2f6ebe.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
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
