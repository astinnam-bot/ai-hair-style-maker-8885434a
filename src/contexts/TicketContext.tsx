import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { recoverPendingOrders } from '@/lib/iap';

interface TicketContextType {
  ticketCount: number;
  hasTicket: boolean;
  addTickets: (count: number) => void;
  consumeTicket: () => void;
  isRecovering: boolean;
  /** @deprecated use addTickets instead */
  setHasTicket: (v: boolean) => void;
}

const TicketContext = createContext<TicketContextType>({
  ticketCount: 0,
  hasTicket: false,
  addTickets: () => {},
  consumeTicket: () => {},
  isRecovering: false,
  setHasTicket: () => {},
});

export const useTicket = () => useContext(TicketContext);

export const TicketProvider = ({ children }: { children: ReactNode }) => {
  const [ticketCount, setTicketCount] = useState(1);
  const [isRecovering, setIsRecovering] = useState(false);

  const hasTicket = ticketCount > 0;

  const addTickets = useCallback((count: number) => {
    setTicketCount((prev) => prev + count);
  }, []);

  const consumeTicket = useCallback(() => {
    setTicketCount((prev) => Math.max(0, prev - 1));
  }, []);

  // 하위 호환
  const setHasTicket = useCallback((v: boolean) => {
    if (v) addTickets(1);
    else setTicketCount(0);
  }, [addTickets]);

  // 앱 진입 시 대기 중인 주문 복원
  useEffect(() => {
    let cancelled = false;

    const recover = async () => {
      setIsRecovering(true);
      try {
        const recoveredCount = await recoverPendingOrders();
        if (!cancelled && recoveredCount > 0) {
          console.log(`[TicketContext] ${recoveredCount}장 복원 완료`);
          addTickets(recoveredCount);
        }
      } catch (e) {
        console.error('[TicketContext] 복원 실패:', e);
      } finally {
        if (!cancelled) setIsRecovering(false);
      }
    };

    recover();
    return () => { cancelled = true; };
  }, [addTickets]);

  return (
    <TicketContext.Provider value={{ ticketCount, hasTicket, addTickets, consumeTicket, isRecovering, setHasTicket }}>
      {children}
    </TicketContext.Provider>
  );
};
