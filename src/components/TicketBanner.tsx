import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTicket } from '@/contexts/TicketContext';
import ticketImage from '@/assets/ticket-voucher.png';
import { purchaseTicket, fetchProductList, type IapProduct } from '@/lib/iap';

const IAP_PRODUCT_SKU =
  import.meta.env.VITE_IAP_PRODUCT_SKU ||
  'ait.0000022278.5a3a62a1.67f4825513.3234914875';

const TicketBanner = () => {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [product, setProduct] = useState<IapProduct | null>(null);
  const { hasTicket, setHasTicket, isRecovering } = useTicket();
  const { toast } = useToast();
  const cleanupRef = useRef<(() => void) | null>(null);

  // 다이어그램 1단계: 상품 목록 가져오기
  useEffect(() => {
    fetchProductList().then((products) => {
      const matched = products.find((p) => p.sku === IAP_PRODUCT_SKU);
      if (matched) {
        setProduct(matched);
        console.log('[TicketBanner] 상품 정보 로드:', matched);
      }
    });
  }, []);

  // 다이어그램 2단계: 인앱 결제 요청
  const handleBuyTicket = async () => {
    setIsPurchasing(true);
    try {
      const cleanup = await purchaseTicket({
        onGranted: (orderId) => {
          console.log('[TicketBanner] 상품 지급 완료:', orderId);
          setHasTicket(true);
        },
        onSuccess: () => {
          toast({
            title: '🎫 뽑기권 구매 완료!',
            description: '이제 상세 이미지를 생성할 수 있어요.',
          });
          cleanupRef.current?.();
          cleanupRef.current = null;
        },
        onError: (error) => {
          cleanupRef.current?.();
          cleanupRef.current = null;
          if (error?.code !== 'USER_CANCEL') {
            toast({
              title: '구매 실패',
              description: error?.message || '결제에 실패했어요.',
              variant: 'destructive',
            });
          }
        },
        onFinally: () => {
          setIsPurchasing(false);
        },
      });
      cleanupRef.current = cleanup;
    } catch (err: any) {
      toast({
        title: '구매 불가',
        description: err.message || '토스 앱 내에서만 구매할 수 있어요.',
        variant: 'destructive',
      });
      setIsPurchasing(false);
    }
  };

  const displayName = product?.displayName || '모델 1회 뽑기권';
  const displayAmount = product?.displayAmount;
  const iconUrl = product?.iconUrl;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 animate-fade-in">
      <img
        src={iconUrl || ticketImage}
        alt={displayName}
        className="w-28 h-20 object-cover rounded-xl flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[17px] font-bold text-foreground leading-tight">{displayName}</p>
        <p className="text-[14px] text-muted-foreground mt-1">
          {isRecovering
            ? '⏳ 이전 결제 확인 중...'
            : hasTicket
              ? '🎫 보유 중! 상세 이미지를 생성하세요'
              : displayAmount
                ? `${displayAmount} · 상세 5장 고화질 이미지 생성`
                : '상세 5장 고화질 이미지 생성'}
        </p>
      </div>
      {hasTicket ? (
        <span className="flex-shrink-0 bg-primary/10 text-primary text-[15px] font-bold px-5 py-3 rounded-xl">
          보유 중 ✅
        </span>
      ) : (
        <button
          onClick={handleBuyTicket}
          disabled={isPurchasing || isRecovering}
          className="flex-shrink-0 bg-primary text-primary-foreground text-[15px] font-bold px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {isPurchasing || isRecovering ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            '🎫 구매'
          )}
        </button>
      )}
    </div>
  );
};

export default TicketBanner;
