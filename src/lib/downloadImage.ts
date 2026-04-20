function randomFileName(ext: string = 'png') {
  // ai-hair-style-{16자리 랜덤숫자}
  const rand = Math.floor(Math.random() * 9_000_000_000_000_000) + 1_000_000_000_000_000;
  return `ai-hair-style-${rand}.${ext}`;
}

function getExt(url: string, fallback: string = 'png') {
  const m = url.match(/\.(png|jpe?g|webp)(\?|$)/i);
  return m ? m[1].toLowerCase() : fallback;
}

/**
 * 이미지를 다운로드해요.
 * - 모바일/웹뷰에서 Web Share API가 가능하면 공유 시트(카톡/사진 저장 등)를 띄워요.
 * - 그 외에는 파일로 저장해요. 파일명은 항상 `ai-hair-style-{랜덤}.{ext}` 형식이에요.
 */
export async function downloadImage(url: string, _filename?: string) {
  const ext = getExt(url, 'png');
  const filename = randomFileName(ext);

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const mime = blob.type || (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`);

    // 1) Web Share API (Level 2) — 모바일에서 공유 시트 호출
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    if (nav && typeof nav.canShare === 'function') {
      try {
        const file = new File([blob], filename, { type: mime });
        if (nav.canShare({ files: [file] })) {
          await nav.share({
            files: [file],
            title: 'AI 헤어 스타일',
            text: 'AI 헤어 스타일러로 만든 이미지예요.',
          });
          return;
        }
      } catch (e: any) {
        // 사용자가 취소했거나 지원 안 됨 → 파일 저장으로 폴백
        if (e?.name === 'AbortError') return;
      }
    }

    // 2) 일반 다운로드 (a[download])
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // 3) 최종 폴백: 새창 열기 (웹뷰: 길게 눌러 저장)
    window.open(url, '_blank');
  }
}

export async function downloadImageWithWatermark(url: string, _filename?: string, watermarkText: string = 'HAIR MODEL AI') {
  const filename = randomFileName('jpg');
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.drawImage(img, 0, 0);

    const fontSize = Math.max(img.width * 0.06, 24);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

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

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92)
    );

    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    if (nav && typeof nav.canShare === 'function') {
      try {
        const file = new File([blob], filename, { type: 'image/jpeg' });
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title: 'AI 헤어 스타일' });
          return;
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank');
  }
}
