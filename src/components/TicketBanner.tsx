import { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTicket } from '@/contexts/TicketContext';
import ticketImage from '@/assets/ticket-voucher.png';

const IAP_PRODUCT_SKU = import.meta.env.VITE_IAP_PRODUCT_SKU || 'ait.0000022278.5a3a62a1.67f4825513.3234914875';

const TicketBanner = () => {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { hasTicket, setHasTicket } = useTicket();
  const { toast } = useToast();
  const cleanupRef = useRef<(() => void) | null>(null);

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
            return false;
          },
        },
        onEvent: (event: any) => {
          if (event.type === 'success') {
            setHasTicket(true);
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

  return (
    <div className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3 animate-fade-in">
      <img
        src={ticketImage}
        alt="모델 1회 뽑기권"
        className="w-20 h-14 object-cover rounded-xl flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-foreground leading-tight">모델 1회 뽑기권</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {hasTicket ? '🎫 보유 중! 상세 이미지를 생성하세요' : '상세 5장 고화질 이미지 생성'}
        </p>
      </div>
      {hasTicket ? (
        <span className="flex-shrink-0 bg-primary/10 text-primary text-[12px] font-bold px-3 py-2 rounded-xl">
          보유 중 ✅
        </span>
      ) : (
        <button
          onClick={handleBuyTicket}
          disabled={isPurchasing}
          className="flex-shrink-0 bg-primary text-primary-foreground text-[12px] font-bold px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {isPurchasing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            '🎫 구매'
          )}
        </button>
      )}
    </div>
  );
};

export default TicketBanner;
