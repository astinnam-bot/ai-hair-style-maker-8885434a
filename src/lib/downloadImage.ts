/**
 * 모바일 웹뷰(토스 등)에서도 동작하는 이미지 다운로드
 * 1) fetch → blob → a.download 시도
 * 2) 실패 시 window.open 으로 폴백
 * 3) 웹뷰에서 a.download가 무시되는 경우를 위해 blob URL을 새 탭에서 열기
 */

function generateRandomFilename(extension: string = 'jpg'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ai-hair-style-${timestamp}${random}.${extension}`;
}

export async function downloadImage(url: string, filename?: string) {
  const finalFilename = filename || generateRandomFilename();
  const isWebView = /TOSS|tossapp|wv|WebView/i.test(navigator.userAgent);

  if (isWebView) {
    window.open(url, '_blank');
    return;
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
  } catch {
    window.open(url, '_blank');
  }
}

/**
 * Web Share API를 사용한 이미지 공유
 * 모바일에서 카카오톡, 인스타그램 등으로 공유 가능
 */
export async function shareImage(url: string, title: string = 'AI 헤어 스타일') {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], generateRandomFilename('png'), { type: blob.type });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title,
        text: `${title} - AI 헤어 스타일로 만든 이미지에요!`,
        files: [file],
      });
      return true;
    }

    // Web Share API 미지원 시 다운로드로 폴백
    await downloadImage(url);
    return false;
  } catch (e: any) {
    if (e?.name === 'AbortError') return false; // 사용자가 공유 취소
    await downloadImage(url);
    return false;
  }
}

export async function downloadImageWithWatermark(url: string, filename?: string, watermarkText: string = "HAIR MODEL AI") {
  const finalFilename = filename || generateRandomFilename();
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.drawImage(img, 0, 0);

    const fontSize = Math.max(img.width * 0.06, 24);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
    const step = fontSize * 5;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);

    for (let y = -diagonal; y < diagonal; y += step) {
      for (let x = -diagonal; x < diagonal; x += step) {
        ctx.fillText(watermarkText, x, y);
        ctx.strokeText(watermarkText, x, y);
      }
    }
    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) return;

      const isWebView = /TOSS|tossapp|wv|WebView/i.test(navigator.userAgent);
      if (isWebView) {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    }, "image/jpeg", 0.92);
  } catch {
    window.open(url, "_blank");
  }
}
