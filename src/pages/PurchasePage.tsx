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
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedImage, setUnlockedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const isCompleted = !!unlockedImage;

  // 워터마크 제거 후 다운로드 (뽑기권 1장 소모)
  const handleUnlock = async () => {
    if (!hasTicket || !previewImage) return;
    setIsUnlocking(true);
    try {
      // 미리보기 이미지의 워터마크를 제거한 고화질 버전을 그대로 사용
      setUnlockedImage(previewImage);
      consumeTicket();
      await downloadImage(previewImage, `${style!.name}.jpg`);
      toast({ title: '🎉 다운로드 시작', description: '워터마크 없는 이미지가 저장되었어요.' });
    } catch (err: any) {
      toast({
        title: '다운로드 실패',
        description: err.message || '잠시 후 다시 시도해 주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsUnlocking(false);
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
        <h1 className="text-[24px] font-bold text-foreground">
          {isCompleted ? '다운로드 완료 🎉' : isUnlocking ? '워터마크 제거 중...' : '워터마크 제거 다운로드'}
        </h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          {style.name} · {style.gender === 'male' ? '남성' : '여성'}
        </p>
      </header>

      <main className="flex-1 px-5 pb-10">
        {isCompleted && unlockedImage ? (
          <div className="animate-slide-up">
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden mb-5">
              <img src={unlockedImage} alt={style.name} className="w-full h-full object-cover rounded-2xl" />
            </div>
            <button
              onClick={() => downloadImage(unlockedImage, `${style.name}.jpg`)}
              className="w-full mb-4 bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              다시 다운로드
            </button>
            <div className="bg-secondary rounded-2xl p-4 mb-4">
              <p className="text-[13px] text-foreground font-semibold mb-1">✅ 이미지가 저장되었어요</p>
              <p className="text-[12px] text-muted-foreground">
                저장이 안 된다면 이미지를 길게 눌러 저장해 주세요.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-secondary text-foreground rounded-2xl py-4 text-[15px] font-bold transition-all duration-200 active:scale-[0.98]"
            >
              다른 스타일 보기
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="bg-primary/10 rounded-2xl p-5 mb-5">
              <p className="text-[15px] font-bold text-foreground leading-relaxed">
                🎫 뽑기권 1장으로 워터마크를 제거하고<br />
                고화질 이미지 1장을 바로 다운로드할 수 있어요!
              </p>
            </div>

            {previewImage && (
              <div className="mb-5">
                <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden watermark">
                  <img src={previewImage} alt="미리보기" className="w-full h-full object-cover rounded-2xl" />
                </div>
                <p className="text-[12px] text-muted-foreground mt-2 text-center">
                  현재 미리보기 이미지의 워터마크가 제거돼요
                </p>
              </div>
            )}

            <div className="mb-5">
              <TicketBanner />
            </div>

            <button
              onClick={handleUnlock}
              disabled={!hasTicket || isUnlocking || !previewImage}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUnlocking ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 처리 중...</>
              ) : hasTicket ? (
                <><Sparkles className="w-5 h-5" /> 워터마크제거 다운받기</>
              ) : (
                '🎫 뽑기권 구매 후 다운로드 가능'
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PurchasePage;
