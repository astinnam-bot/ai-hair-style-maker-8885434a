import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { recoverPendingOrders } from '@/lib/iap';

interface TicketContextType {
  hasTicket: boolean;
  setHasTicket: (v: boolean) => void;
  consumeTicket: () => void;
  isRecovering: boolean;
}

const TicketContext = createContext<TicketContextType>({
  hasTicket: false,
  setHasTicket: () => {},
  consumeTicket: () => {},
  isRecovering: false,
});

export const useTicket = () => useContext(TicketContext);

export const TicketProvider = ({ children }: { children: ReactNode }) => {
  const [hasTicket, setHasTicket] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const consumeTicket = useCallback(() => {
    setHasTicket(false);
  }, []);

  // 앱 진입 시 대기 중인 주문 복원 (다이어그램 3단계)
  useEffect(() => {
    let cancelled = false;

    const recover = async () => {
      setIsRecovering(true);
      try {
        const recoveredCount = await recoverPendingOrders();
        if (!cancelled && recoveredCount > 0) {
          console.log(`[TicketContext] ${recoveredCount}건 복원 완료 → 뽑기권 지급`);
          setHasTicket(true);
        }
      } catch (e) {
        console.error('[TicketContext] 복원 실패:', e);
      } finally {
        if (!cancelled) setIsRecovering(false);
      }
    };

    recover();
    return () => { cancelled = true; };
  }, []);

  return (
    <TicketContext.Provider value={{ hasTicket, setHasTicket, consumeTicket, isRecovering }}>
      {children}
    </TicketContext.Provider>
  );
};
