/**
 * 모바일 웹뷰(토스 등)에서도 동작하는 이미지 다운로드
 * 1) fetch → blob → a.download 시도
 * 2) 실패 시 window.open 으로 폴백
 * 3) 웹뷰에서 a.download가 무시되는 경우를 위해 blob URL을 새 탭에서 열기
 */
export async function downloadImage(url: string, filename: string) {
  const isWebView = /TOSS|tossapp|wv|WebView/i.test(navigator.userAgent);

  if (isWebView) {
    // 웹뷰: 원본 URL을 직접 새 탭으로 열어 길게 눌러 저장하도록 유도
    window.open(url, '_blank');
    return;
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
  } catch {
    window.open(url, '_blank');
  }
}

export async function downloadImageWithWatermark(url: string, filename: string, watermarkText: string = "HAIR MODEL AI") {
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
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    }, "image/jpeg", 0.92);
  } catch {
    window.open(url, "_blank");
  }
}
