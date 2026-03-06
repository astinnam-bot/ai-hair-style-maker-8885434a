import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { allStyles } from '@/data/hairStyles';
import { ChevronLeft, Check, CreditCard, Sparkles, Loader2 } from 'lucide-react';

const shotLabels = [
  { label: '정면 기본 컷', description: '얼굴 정면에서 본 스타일' },
  { label: '45도 측면 컷', description: '비스듬한 각도에서 본 스타일' },
  { label: '완전 측면', description: '옆모습에서 본 헤어라인' },
  { label: '후면 롱샷', description: '뒷모습에서 본 전체 스타일' },
];

const PurchasePage = () => {
  const navigate = useNavigate();
  const { styleId } = useParams<{ styleId: string }>();
  const style = allStyles.find(s => s.id === styleId);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!style) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">스타일을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const handlePurchase = async () => {
    setIsProcessing(true);
    // Simulate payment - will connect to Stripe with Cloud
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPurchased(true);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-14 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          뒤로
        </button>
        <h1 className="text-[24px] font-bold text-foreground">
          {isPurchased ? '구매 완료 🎉' : '상세 컷 구매'}
        </h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          {style.name} · {style.gender === 'male' ? '남성' : '여성'}
        </p>
      </header>

      <main className="flex-1 px-5 pb-10">
        {!isPurchased ? (
          <div className="animate-fade-in">
            {/* What you get */}
            <div className="bg-card rounded-2xl border border-border p-5 mb-5">
              <p className="text-[15px] font-bold text-foreground mb-4">포함된 이미지 4장</p>
              <div className="flex flex-col gap-3">
                {shotLabels.map((shot, i) => (
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

            {/* Price */}
            <div className="bg-secondary rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-muted-foreground">결제 금액</span>
                <span className="text-[24px] font-bold text-foreground">₩5,500</span>
              </div>
              <p className="text-[12px] text-muted-foreground mt-2">
                워터마크 없는 고화질 이미지 4장이 제공됩니다
              </p>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  결제 처리 중...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  ₩5,500 결제하기
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="animate-slide-up">
            {/* Generated 4 shots */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {shotLabels.map((shot, i) => (
                <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'backwards' }}>
                  <div className="w-full aspect-[3/4] rounded-2xl bg-gradient-to-br from-toss-gray-700 to-toss-gray-900 relative overflow-hidden mb-2">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary opacity-40" />
                    </div>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">{shot.label}</p>
                  <p className="text-[11px] text-muted-foreground">{shot.description}</p>
                </div>
              ))}
            </div>

            {/* Success info */}
            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-[13px] text-foreground font-semibold mb-1">✅ 결제가 완료되었습니다</p>
              <p className="text-[12px] text-muted-foreground">
                {style.name} 스타일의 상세 4컷이 생성되었습니다.
                고화질 워터마크 없는 이미지를 확인하세요.
              </p>
            </div>

            {/* Back to home */}
            <button
              onClick={() => navigate('/')}
              className="w-full mt-4 bg-secondary text-foreground rounded-2xl py-4 text-[15px] font-bold transition-all duration-200 active:scale-[0.98]"
            >
              다른 스타일 보기
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PurchasePage;
