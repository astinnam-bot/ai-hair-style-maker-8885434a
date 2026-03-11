import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface TicketContextType {
  hasTicket: boolean;
  setHasTicket: (v: boolean) => void;
  consumeTicket: () => void;
}

const TicketContext = createContext<TicketContextType>({
  hasTicket: false,
  setHasTicket: () => {},
  consumeTicket: () => {},
});

export const useTicket = () => useContext(TicketContext);

export const TicketProvider = ({ children }: { children: ReactNode }) => {
  const [hasTicket, setHasTicket] = useState(true); // 테스트모드: 뽑기권 보유 상태

  const consumeTicket = useCallback(() => {
    setHasTicket(false);
  }, []);

  return (
    <TicketContext.Provider value={{ hasTicket, setHasTicket, consumeTicket }}>
      {children}
    </TicketContext.Provider>
  );
};
