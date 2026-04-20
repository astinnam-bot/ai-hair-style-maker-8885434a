import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTicket } from '@/contexts/TicketContext';
import {
  TICKET_PRODUCTS,
  fetchProductList,
  purchaseTicket,
  findProductBySku,
  type IapProduct,
} from '@/lib/iap';

const TicketBanner = () => {
  const [purchasingSku, setPurchasingSku] = useState<string | null>(null);
  const [iapProducts, setIapProducts] = useState<IapProduct[]>([]);
  const { ticketCount, hasTicket, addTickets, isRecovering } = useTicket();
  const { toast } = useToast();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchProductList().then((products) => {
      setIapProducts(products);
      console.log('[TicketBanner] 상품 목록 로드:', products);
    });
  }, []);

  const handleBuy = async (sku: string) => {
    setPurchasingSku(sku);
    const product = findProductBySku(sku);
    try {
      const cleanup = await purchaseTicket(sku, {
        onGranted: (orderId) => {
          console.log('[TicketBanner] 상품 지급 완료:', orderId);
          addTickets(product?.ticketCount ?? 1);
        },
        onSuccess: () => {
          toast({
            title: '🎫 뽑기권 구매 완료!',
            description: `${product?.ticketCount ?? 1}장이 추가되었어요.`,
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
          setPurchasingSku(null);
        },
      });
      cleanupRef.current = cleanup;
    } catch (err: any) {
      toast({
        title: '구매 불가',
        description: err.message || '토스 앱 내에서만 구매할 수 있어요.',
        variant: 'destructive',
      });
      setPurchasingSku(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 보유 티켓 표시 */}
      {hasTicket && (
        <div className="bg-primary/10 rounded-2xl px-4 py-3 text-center animate-fade-in">
          <span className="text-primary text-[15px] font-bold">🎫 보유 중: {ticketCount}장</span>
        </div>
      )}

      {/* 상품 목록 */}
      {TICKET_PRODUCTS.map((tp) => {
        const iap = iapProducts.find((p) => p.sku === tp.sku);
        const displayName = iap?.displayName || tp.fallbackName;
        const displayAmount = iap?.displayAmount;
        const iconUrl = iap?.iconUrl || tp.fallbackImage;
        const isBuying = purchasingSku === tp.sku;

        return (
          <div
            key={tp.sku}
            className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 animate-fade-in"
          >
            <img
              src={iconUrl}
              alt={displayName}
              className="w-28 h-20 object-cover rounded-xl flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-bold text-foreground leading-tight">{displayName}</p>
              <p className="text-[14px] text-muted-foreground mt-1">
                {isRecovering
                  ? '⏳ 이전 결제 확인 중...'
                  : displayAmount
                    ? `${displayAmount} · 워터마크 제거 ${tp.ticketCount}장`
                    : `워터마크 제거 ${tp.ticketCount}장`}
              </p>
            </div>
            <button
              onClick={() => handleBuy(tp.sku)}
              disabled={isBuying || isRecovering || !!purchasingSku}
              className="flex-shrink-0 bg-primary text-primary-foreground text-[15px] font-bold px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isBuying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '🎫 구매'
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default TicketBanner;
