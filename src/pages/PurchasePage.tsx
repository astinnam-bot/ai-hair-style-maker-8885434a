import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { allStyles } from '@/data/hairStyles';
import { Sparkles, Loader2, Download } from 'lucide-react';
import { downloadImage } from '@/lib/downloadImage';
import { useToast } from '@/hooks/use-toast';
import { useTicket } from '@/contexts/TicketContext';
import TicketBanner from '@/components/TicketBanner';

const PurchasePage = () => {
  const navigate = useNavigate();
  const { styleId } = useParams<{ styleId: string }>();
  const location = useLocation();
  const previewImage = (location.state as any)?.previewImage as string | undefined;
  const style = allStyles.find(s => s.id === styleId);

  const { hasTicket, consumeTicket } = useTicket();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const { toast } = useToast();

  const handleUnlock = () => {
    if (!hasTicket || !previewImage) return;
    consumeTicket();
    setIsUnlocked(true);
    toast({ title: '🎉 워터마크가 제거되었어요!', description: '이미지를 다운로드할 수 있어요.' });
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
      <header className="px-5 pt-8 pb-4 relative z-10">
        <h1 className="text-[24px] font-bold text-foreground">
          {isUnlocked ? '다운로드 준비 완료 🎉' : '워터마크 제거'}
        </h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          {style.name} · {style.gender === 'male' ? '남성' : '여성'}
        </p>
      </header>

      <main className="flex-1 px-5 pb-10">
        {isUnlocked ? (
          /* 워터마크 제거 완료 */
          <div className="animate-slide-up">
            {previewImage && (
              <div
                className="w-full aspect-[3/4] rounded-2xl overflow-hidden mb-5 cursor-pointer active:scale-[0.98] transition-transform relative"
                onClick={() => downloadImage(previewImage, `${style.name}.jpg`)}
              >
                <img src={previewImage} alt={style.name} className="w-full h-full object-cover rounded-2xl" />
                <div className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/30 to-transparent rounded-2xl opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-[12px] font-semibold flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> 탭하여 저장
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => previewImage && downloadImage(previewImage, `${style.name}.jpg`)}
              className="w-full mb-4 bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              이미지 다운로드
            </button>

            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-[13px] text-foreground font-semibold mb-1">✅ 워터마크가 제거되었어요</p>
              <p className="text-[12px] text-muted-foreground">
                {style.name} 스타일의 고화질 이미지를 다운로드하세요.
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-4 bg-secondary text-foreground rounded-2xl py-4 text-[15px] font-bold transition-all duration-200 active:scale-[0.98]"
            >
              다른 스타일 보기
            </button>
          </div>
        ) : (
          /* 구매 전 */
          <div className="animate-fade-in">
            <div className="bg-primary/10 rounded-2xl p-5 mb-5">
              <p className="text-[15px] font-bold text-foreground leading-relaxed">
                🎫 뽑기권 1장을 사용하면 지금 보이는 사진을<br />
                워터마크 제거하고 다운 받으실 수 있어요!
              </p>
            </div>

            {previewImage && (
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden mb-5 watermark">
                <img src={previewImage} alt="미리보기" className="w-full h-full object-cover rounded-2xl" />
              </div>
            )}

            <div className="mb-5">
              <TicketBanner />
            </div>

            <button
              onClick={handleUnlock}
              disabled={!hasTicket}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {hasTicket ? '워터마크제거 다운받기' : '🎫 뽑기권 구매 후 이용 가능'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PurchasePage;
