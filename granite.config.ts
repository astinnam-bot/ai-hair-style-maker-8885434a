import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "aihairstyle",
  brand: {
    displayName: "Ai 헤어 스타일", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#3182F6", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/23993/c2d15154-f777-47dd-a91f-70033b2f6ebe.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite",
      build: "vite build",
    },
  },
  permissions: [],
  webViewProps: {
    type: "partner",
  },
});
