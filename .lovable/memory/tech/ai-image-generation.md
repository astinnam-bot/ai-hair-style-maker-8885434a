---
name: AI Image Generation
description: CometAPI Midjourney API (/mj/submit/imagine + polling) 사용
type: feature
---
이미지 생성은 **CometAPI**의 Midjourney 프록시 API를 사용해요.

## 흐름
1. `POST /mj/submit/imagine` — 프롬프트 제출, taskId 반환
2. `GET /mj/task/{id}/fetch` — 3초 간격 폴링, status가 SUCCESS가 될 때까지 (최대 120초)
3. 결과 이미지를 Supabase Storage에 업로드 후 publicUrl 반환

## 프롬프트 구성
- `buildMjPrompt()` 함수가 기본 프롬프트에 모델 특성(나이, 얼굴형, 피부, 체형, 분위기), 계절별 의상, 배경을 자동 추가
- MJ 파라미터: `--ar 1:1 --v 6.1 --style raw --q 2`
- 부정 프롬프트: "no hands near head or hair"

## API 엔드포인트
- Base: `https://api.cometapi.com`
- 인증: `Authorization: Bearer ${COMET_API_KEY}`

## 응답
Edge function은 `{ images: string[], taskId: string, buttons: any[] }` 반환
