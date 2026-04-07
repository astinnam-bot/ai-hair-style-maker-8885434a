/**
 * 모바일 웹뷰(토스 등)에서도 동작하는 이미지 다운로드
 * 1) fetch → blob → a.download 시도
 * 2) 실패 시 window.open 으로 폴백
 * 3) 웹뷰에서 a.download가 무시되는 경우를 위해 blob URL을 새 탭에서 열기
 */
export async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // 모바일 웹뷰에서는 a.download가 동작하지 않는 경우가 많으므로
    // 새 탭에서 blob URL을 열어 사용자가 길게 눌러 저장할 수 있게 함
    const isWebView = /TOSS|tossapp|wv|WebView/i.test(navigator.userAgent);

    if (isWebView) {
      // 웹뷰: 새 창에서 이미지를 열어 사용자가 직접 저장
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${filename}</title>
            <style>
              body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #000; }
              img { max-width: 100%; max-height: 80vh; object-fit: contain; }
              p { color: #fff; font-size: 14px; margin-top: 16px; text-align: center; font-family: sans-serif; }
            </style>
          </head>
          <body>
            <img src="${blobUrl}" alt="${filename}" />
            <p>이미지를 길게 눌러 저장하세요 📥</p>
          </body>
          </html>
        `);
        w.document.close();
      } else {
        // 팝업 차단 시 직접 이동
        window.location.href = blobUrl;
      }
    } else {
      // 일반 브라우저: a.download 사용
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    }
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
      const blobUrl = URL.createObjectURL(blob);

      const isWebView = /TOSS|tossapp|wv|WebView/i.test(navigator.userAgent);
      if (isWebView) {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(`
            <!DOCTYPE html><html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#000}img{max-width:100%;max-height:80vh;object-fit:contain}p{color:#fff;font-size:14px;margin-top:16px;text-align:center;font-family:sans-serif}</style>
            </head><body>
            <img src="${blobUrl}" alt="${filename}" />
            <p>이미지를 길게 눌러 저장하세요 📥</p>
            </body></html>
          `);
          w.document.close();
        } else {
          window.location.href = blobUrl;
        }
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      }
    }, "image/jpeg", 0.92);
  } catch {
    window.open(url, "_blank");
  }
}
