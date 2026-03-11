import { useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { allStyles } from '@/data/hairStyles';
import { ChevronLeft, Check, Sparkles, Loader2, Download, Home, Ticket } from 'lucide-react';

import { generateHairImage } from '@/lib/generateImage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// 앱인토스 인앱결제 SKU (소모성 뽑기권)
const IAP_PRODUCT_SKU = import.meta.env.VITE_IAP_PRODUCT_SKU || 'hair_style_detail_5';

const shotLabels = [
  { label: '정면 기본 컷', description: '얼굴 정면에서 본 스타일' },
  { label: '45도 측면 컷', description: '비스듬한 각도에서 본 스타일' },
  { label: '완전 측면', description: '옆모습에서 본 헤어라인' },
  { label: '후면 롱샷', description: '뒷모습에서 본 전체 스타일' },
];

const allShotLabels = [
  ...shotLabels,
  { label: '4컷 병합 이미지', description: '4가지 각도를 한 장에 담은 이미지' },
];

async function createMergedImage(images: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const imgElements: HTMLImageElement[] = [];
    let loaded = 0;
    images.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loaded++;
        if (loaded === images.length) {
          const cellW = imgElements[0].naturalWidth;
          const cellH = imgElements[0].naturalHeight;
          const canvas = document.createElement('canvas');
          canvas.width = cellW * 2;
          canvas.height = cellH * 2;
          const ctx = canvas.getContext('2d')!;
          imgElements.forEach((el, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            ctx.drawImage(el, col * cellW, row * cellH, cellW, cellH);
          });
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        }
      };
      img.onerror = reject;
      imgElements[i] = img;
      img.src = src;
    });
  });
}

const PurchasePage = () => {
  const navigate = useNavigate();
  const { styleId } = useParams<{ styleId: string }>();
  const location = useLocation();
  const previewImage = (location.state as any)?.previewImage as string | undefined;
  const backgroundPrompt = (location.state as any)?.backgroundPrompt as string | undefined;
  const style = allStyles.find(s => s.id === styleId);

  const [hasTicket, setHasTicket] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [affiliation, setAffiliation] = useState('');
  const [initials, setInitials] = useState('');
  const { toast } = useToast();
  const cleanupRef = useRef<(() => void) | null>(null);

  const currentYear = new Date().getFullYear();
  const copyrightText = affiliation || initials
    ? `© ${currentYear}${affiliation ? ` ${affiliation}` : ''}${initials ? ` ${initials}` : ''}. All Rights Reserved.`
    : '';

  const isCompleted = generatedImages.length > 0;

  // 뽑기권 구매 (앱인토스 IAP)
  const handleBuyTicket = async () => {
    setIsPurchasing(true);
    try {
      const { IAP } = await import('@apps-in-toss/web-framework');
      if (!IAP) throw new Error('IAP를 사용할 수 없는 환경이에요.');

      cleanupRef.current = IAP.createOneTimePurchaseOrder({
        options: {
          sku: IAP_PRODUCT_SKU,
          processProductGrant: async ({ orderId }) => {
            console.log('뽑기권 지급 완료:', orderId);
            setHasTicket(true);
            // 아직 소모하지 않음 — 이미지 생성 성공 후 소모됨
            return false;
          },
        },
        onEvent: (event: any) => {
          if (event.type === 'success') {
            toast({ title: '🎫 뽑기권 구매 완료!', description: '이제 상세 이미지를 생성할 수 있어요.' });
            cleanupRef.current?.();
            cleanupRef.current = null;
          }
          setIsPurchasing(false);
        },
        onError: (error: any) => {
          console.error('IAP error:', error);
          cleanupRef.current?.();
          cleanupRef.current = null;
          if (error?.code !== 'USER_CANCEL') {
            toast({ title: '구매 실패', description: error?.message || '결제에 실패했어요.', variant: 'destructive' });
          }
          setIsPurchasing(false);
        },
      });
    } catch (err: any) {
      toast({ title: '구매 불가', description: err.message || '토스 앱 내에서만 구매할 수 있어요.', variant: 'destructive' });
      setIsPurchasing(false);
    }
  };

  // 상세 이미지 생성 (뽑기권 소모)
  const handleGenerate = async () => {
    if (!hasTicket) return;
    setIsGenerating(true);
    try {
      const images = await generateHairImage(
        style!.prompt,
        4,
        previewImage,
        copyrightText || undefined,
        backgroundPrompt,
      );

      let mergedUrl = '';
      try {
        mergedUrl = await createMergedImage(images);
      } catch (e) {
        console.error('Merge failed', e);
      }
      setGeneratedImages(mergedUrl ? [...images, mergedUrl] : images);

      // 이미지 생성 성공 → IAP 소모 처리
      try {
        const { IAP } = await import('@apps-in-toss/web-framework');
        if (IAP?.acknowledgeProductGrant) {
          await IAP.acknowledgeProductGrant({ sku: IAP_PRODUCT_SKU });
          console.log('뽑기권 소모 완료');
        }
      } catch (e) {
        console.warn('IAP acknowledge skipped:', e);
      }

      setHasTicket(false);
      toast({ title: '🎉 이미지 생성 완료!', description: '상세 5장이 준비되었어요.' });
    } catch (err: any) {
      toast({
        title: '이미지 생성 실패',
        description: err.message || '잠시 후 다시 시도해 주세요. 뽑기권은 차감되지 않았어요.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!style) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">스타일을 찾을 수 없어요.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 bg-primary text-primary-foreground text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            뒤로
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 bg-primary text-primary-foreground text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            첫화면으로
          </button>
        </div>
        <h1 className="text-[24px] font-bold text-foreground">
          {isCompleted ? '생성 완료 🎉' : isGenerating ? '이미지 생성 중...' : '상세 컷 뽑기'}
        </h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          {style.name} · {style.gender === 'male' ? '남성' : '여성'}
        </p>
      </header>

      <main className="flex-1 px-5 pb-10">
        {/* 생성 중 */}
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-[16px] font-bold text-foreground mb-2">이미지 생성 중...</p>
            <p className="text-[14px] text-muted-foreground text-center">
              고화질 상세 5장을 생성하고 있어요.<br />잠시만 기다려 주세요.
            </p>
          </div>
        ) : isCompleted ? (
          /* 생성 완료 */
          <div className="animate-slide-up">
            {generatedImages[4] && (
              <div className="mb-5 animate-fade-in">
                <div className="w-full aspect-square rounded-2xl overflow-hidden mb-2">
                  <img src={generatedImages[4]} alt="병합 이미지" className="w-full h-full object-cover rounded-2xl" />
                </div>
                <p className="text-[13px] font-semibold text-foreground">4컷 병합 이미지</p>
                <p className="text-[11px] text-muted-foreground">정면 · 45도 · 측면 · 후면 한눈에 보기</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              {shotLabels.map((shot, i) => (
                <div key={i} className="animate-fade-in" style={{ animationDelay: `${(i + 1) * 150}ms`, animationFillMode: 'backwards' }}>
                  <div className="w-full aspect-[3/4] rounded-2xl relative overflow-hidden mb-2">
                    {generatedImages[i] ? (
                      <img src={generatedImages[i]} alt={shot.label} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <div className="w-full h-full bg-secondary rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-muted-foreground opacity-40" />
                      </div>
                    )}
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">{shot.label}</p>
                  <p className="text-[11px] text-muted-foreground">{shot.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={async () => {
                try {
                  toast({ title: "ZIP 생성 중...", description: "서버에서 이미지를 압축하고 있어요." });
                  const labels = [...shotLabels.map(s => s.label), '4컷_병합'];
                  const { data, error } = await supabase.functions.invoke('create-zip', {
                    body: {
                      imageUrls: generatedImages,
                      styleName: style.name,
                      labels: generatedImages.map((_, i) => labels[i] || `image_${i}`),
                    },
                  });
                  if (error || data?.error) throw new Error(data?.error || error?.message || 'ZIP 생성 실패');
                  window.open(data.zipUrl, '_blank');
                } catch (e: any) {
                  toast({ title: "다운로드 실패", description: e?.message || "잠시 후 다시 시도해 주세요.", variant: "destructive" });
                }
              }}
              className="w-full mb-4 bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              전체 이미지 다운로드 *.zip
            </button>

            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-[13px] text-foreground font-semibold mb-1">✅ 이미지가 생성되었어요</p>
              <p className="text-[12px] text-muted-foreground">
                {style.name} 스타일의 상세 5장이 생성되었어요.
                고화질 워터마크 없는 이미지를 확인해 보세요.
              </p>
            </div>

            {copyrightText && (
              <div className="mt-4 text-center">
                <p className="text-[12px] text-muted-foreground">{copyrightText}</p>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full mt-4 bg-secondary text-foreground rounded-2xl py-4 text-[15px] font-bold transition-all duration-200 active:scale-[0.98]"
            >
              다른 스타일 보기
            </button>
          </div>
        ) : (
          /* 구매 전 / 뽑기권 보유 */
          <div className="animate-fade-in">
            {/* 안내 */}
            <div className="bg-primary/10 rounded-2xl p-5 mb-5">
              <p className="text-[15px] font-bold text-foreground leading-relaxed">
                🎫 뽑기권 1장을 사용하면 마음에 쏙 드는<br />
                상세 5장의 사진을 생성할 수 있어요!
              </p>
            </div>

            {/* 미리보기 이미지 */}
            {previewImage && (
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden mb-5 watermark">
                <img src={previewImage} alt="미리보기" className="w-full h-full object-cover rounded-2xl" />
                <p className="text-[12px] text-muted-foreground mt-2 text-center">이 모델의 상세 4컷이 생성돼요</p>
              </div>
            )}

            {/* 포함 이미지 목록 */}
            <div className="bg-card rounded-2xl border border-border p-5 mb-5">
              <p className="text-[15px] font-bold text-foreground mb-4">포함된 이미지 5장</p>
              <div className="flex flex-col gap-3">
                {allShotLabels.map((shot, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{shot.label}</p>
                      <p className="text-[12px] text-muted-foreground">{shot.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 저작권 정보 */}
            <div className="bg-card rounded-2xl border border-border p-5 mb-5">
              <p className="text-[15px] font-bold text-foreground mb-1">저작권 정보 <span className="text-muted-foreground font-normal text-[12px]">(선택사항)</span></p>
              <p className="text-[12px] text-muted-foreground mb-4">입력하시면 이미지 하단에 저작권 문구가 표시돼요.</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[13px] text-muted-foreground mb-1 block">소속</label>
                  <input
                    type="text"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value.slice(0, 50))}
                    placeholder="예: Juno Hair"
                    className="w-full bg-secondary text-foreground rounded-xl px-4 py-3 text-[14px] placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-muted-foreground mb-1 block">이니셜 (지점명 등)</label>
                  <input
                    type="text"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.slice(0, 30))}
                    placeholder="예: Sujin"
                    className="w-full bg-secondary text-foreground rounded-xl px-4 py-3 text-[14px] placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                {copyrightText && (
                  <div className="bg-secondary rounded-xl px-4 py-3">
                    <p className="text-[12px] text-muted-foreground">미리보기:</p>
                    <p className="text-[13px] text-foreground font-medium mt-1">{copyrightText}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 뽑기권 상태 & 버튼 */}
            <div className="bg-secondary rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasTicket ? 'bg-primary' : 'bg-muted'}`}>
                  <Ticket className={`w-5 h-5 ${hasTicket ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-foreground">
                    {hasTicket ? '🎫 뽑기권 1장 보유 중' : '뽑기권이 없어요'}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {hasTicket ? '상세 이미지 생성 버튼을 눌러주세요!' : '뽑기권을 구매하면 상세 이미지를 생성할 수 있어요.'}
                  </p>
                </div>
              </div>
            </div>

            {hasTicket ? (
              <button
                onClick={handleGenerate}
                className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                상세 이미지 생성하기
              </button>
            ) : (
              <button
                onClick={handleBuyTicket}
                disabled={isPurchasing}
                className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    구매 진행 중...
                  </>
                ) : (
                  <>
                    <Ticket className="w-5 h-5" />
                    🎫 1회 뽑기권 구매하기
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PurchasePage;
