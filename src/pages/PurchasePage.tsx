import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { allStyles } from '@/data/hairStyles';
import { Sparkles, Download, Share2, RefreshCw, Camera } from 'lucide-react';
import { downloadImage, shareImage } from '@/lib/downloadImage';
import { useToast } from '@/hooks/use-toast';
import { useTicket } from '@/contexts/TicketContext';
import TicketBanner from '@/components/TicketBanner';

const PurchasePage = () => {
  const navigate = useNavigate();
  const { styleId } = useParams<{ styleId: string }>();
  const location = useLocation();
  const previewImage = (location.state as any)?.previewImage as string | undefined;
  const backgroundPrompt = (location.state as any)?.backgroundPrompt as string | undefined;
  const style = allStyles.find(s => s.id === styleId);

  const { hasTicket, consumeTicket } = useTicket();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleUnlock = () => {
    if (!hasTicket || !previewImage) return;
    consumeTicket();
    setIsUnlocked(true);
    toast({ title: '🎉 워터마크가 제거되었어요!', description: '이미지를 저장하거나 공유할 수 있어요.' });
  };

  const handleShare = async () => {
    if (!previewImage) return;
    setIsSharing(true);
    try {
      const shared = await shareImage(previewImage, style?.name || 'AI 헤어 스타일');
      if (shared) {
        toast({ title: '공유 완료! 📤' });
      }
    } catch {
      toast({ title: '공유에 실패했어요', variant: 'destructive' });
    } finally {
      setIsSharing(false);
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
      <header className="px-5 pt-8 pb-4 relative z-10">
        <p className="text-muted-foreground text-[13px]">요청한 스타일</p>
        <h1 className="text-[20px] font-bold text-foreground mt-0.5">
          {style.name} · {style.gender === 'male' ? '남성' : '여성'}
        </h1>
      </header>

      <main className="flex-1 px-5 pb-10">
        {isUnlocked ? (
          <div className="animate-slide-up">
            {previewImage && (
              <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden mb-5 relative">
                <img src={previewImage} alt={style.name} className="w-full h-full object-cover rounded-2xl" />
              </div>
            )}

            {/* 저장하기 버튼 */}
            <button
              onClick={() => previewImage && downloadImage(previewImage)}
              className="w-full mb-3 bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              💾 저장하기
            </button>

            {/* 공유하기 버튼 */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full mb-3 bg-secondary text-foreground border-2 border-primary/20 rounded-2xl py-4 text-[16px] font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              {isSharing ? '공유 준비 중...' : '📤 공유하기'}
            </button>

            {/* 다른 스타일 시도 */}
            <button
              onClick={() => navigate(`/generate/${styleId}`, { state: { backgroundPrompt } })}
              className="w-full mb-3 bg-secondary text-foreground border-2 border-primary/20 rounded-2xl py-4 text-[15px] font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              🔄 다른 스타일 시도
            </button>

            {/* 새 사진으로 시작 */}
            <button
              onClick={() => navigate('/')}
              className="w-full bg-background text-muted-foreground rounded-2xl py-4 text-[15px] font-medium transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              🖼️ 새 사진으로 시작
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="bg-primary/10 rounded-2xl p-5 mb-5">
              <p className="text-[15px] font-bold text-foreground leading-relaxed">
                🎫 뽑기권 1장을 사용하면 지금 보이는 사진을<br />
                워터마크 제거하고 다운 받으실 수 있어요!
              </p>
            </div>

            {previewImage && (
              <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden mb-5 watermark">
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
