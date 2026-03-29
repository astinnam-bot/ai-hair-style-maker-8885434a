/**
 * 앱인토스 IAP 헬퍼 – 전체 인앱결제 프로세스 지원
 *
 * 1. getProductItemList  – 상품 목록 가져오기
 * 2. createOneTimePurchaseOrder – 인앱 결제 요청
 * 3. getPendingOrders + completeProductGrant – 대기 주문 복원
 * 4. getCompletedOrRefundedOrders – 주문 이력 조회
 */

import ticketImage1 from '@/assets/ticket-voucher-1.png';
import ticketImage5 from '@/assets/ticket-voucher-5.png';
import ticketImage10 from '@/assets/ticket-voucher-10.png';

/** 상품 정의 */
export interface TicketProduct {
  sku: string;
  ticketCount: number;
  fallbackName: string;
  fallbackImage: string;
}

export const TICKET_PRODUCTS: TicketProduct[] = [
  {
    sku: 'ait.0000022278.677d5762.43bae89ca4.4765461137',
    ticketCount: 1,
    fallbackName: '모델 1회 뽑기권',
    fallbackImage: ticketImage1,
  },
  {
    sku: 'ait.0000022278.994aeaa3.8d04f700ac.4765816972',
    ticketCount: 5,
    fallbackName: '모델 5회 뽑기권',
    fallbackImage: ticketImage5,
  },
  {
    sku: 'ait.0000022278.27d22d2b.65d8ed9010.4765886508',
    ticketCount: 10,
    fallbackName: '모델 10회 뽑기권',
    fallbackImage: ticketImage10,
  },
];

/** SKU로 상품 정보 찾기 */
export function findProductBySku(sku: string): TicketProduct | undefined {
  return TICKET_PRODUCTS.find((p) => p.sku === sku);
}

/** SDK를 동적 import하고 IAP 객체를 반환 */
async function getIAP() {
  const { IAP } = await import('@apps-in-toss/web-framework');
  if (!IAP) throw new Error('IAP를 사용할 수 없는 환경이에요.');
  return IAP;
}

/* ------------------------------------------------------------------ */
/* 1. 상품 목록 가져오기                                               */
/* ------------------------------------------------------------------ */
export interface IapProduct {
  sku: string;
  displayAmount: string;
  displayName: string;
  iconUrl: string;
}

export async function fetchProductList(): Promise<IapProduct[]> {
  try {
    const IAP = await getIAP();
    const result = await IAP.getProductItemList();
    return result?.products ?? [];
  } catch (e) {
    console.error('[IAP] fetchProductList 실패:', e);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* 2. 인앱 결제 요청                                                   */
/* ------------------------------------------------------------------ */
export interface PurchaseCallbacks {
  onGranted: (orderId: string) => void;
  onSuccess: () => void;
  onError: (error: any) => void;
  onFinally: () => void;
}

/**
 * 특정 SKU의 1회 소모성 상품 구매를 시작합니다.
 * @returns cleanup 함수 (구독 해제)
 */
export async function purchaseTicket(
  sku: string,
  callbacks: PurchaseCallbacks,
): Promise<(() => void) | null> {
  const IAP = await getIAP();

  const cleanup = IAP.createOneTimePurchaseOrder({
    options: {
      sku,
      processProductGrant: async ({ orderId }: { orderId: string }) => {
        console.log('[IAP] processProductGrant 호출, orderId:', orderId);
        callbacks.onGranted(orderId);
        return true;
      },
    },
    onEvent: (event: any) => {
      if (event.type === 'success') {
        callbacks.onSuccess();
      }
      callbacks.onFinally();
    },
    onError: (error: any) => {
      console.error('[IAP] onError:', error);
      callbacks.onError(error);
      callbacks.onFinally();
    },
  });

  return cleanup ?? null;
}

/* ------------------------------------------------------------------ */
/* 3. 대기 중인 주문 복원 (getPendingOrders + completeProductGrant)      */
/* ------------------------------------------------------------------ */
export interface PendingOrder {
  orderId: string;
  sku: string;
}

/**
 * 결제 완료 후 상품이 아직 지급되지 않은 주문을 조회하고,
 * 해당 SKU에 대해 상품 지급 + completeProductGrant를 수행합니다.
 * @returns 복원된 티켓 수 (각 상품의 ticketCount 합산)
 */
export async function recoverPendingOrders(): Promise<number> {
  try {
    const IAP = await getIAP();
    const result = await IAP.getPendingOrders();
    const orders: PendingOrder[] = result?.orders ?? [];

    if (orders.length === 0) {
      console.log('[IAP] 대기 중인 주문 없음');
      return 0;
    }

    console.log('[IAP] 대기 중인 주문 발견:', orders);

    const knownSkus = new Set(TICKET_PRODUCTS.map((p) => p.sku));
    let recoveredTickets = 0;

    for (const order of orders) {
      if (order.sku && !knownSkus.has(order.sku)) continue;

      try {
        const success = await IAP.completeProductGrant({
          params: { orderId: order.orderId },
        });
        console.log(`[IAP] completeProductGrant(${order.orderId}):`, success);
        const product = findProductBySku(order.sku);
        recoveredTickets += product?.ticketCount ?? 1;
      } catch (e) {
        console.error(`[IAP] completeProductGrant 실패(${order.orderId}):`, e);
      }
    }

    return recoveredTickets;
  } catch (e) {
    console.error('[IAP] recoverPendingOrders 실패:', e);
    return 0;
  }
}

/* ------------------------------------------------------------------ */
/* 4. 주문 이력 조회                                                   */
/* ------------------------------------------------------------------ */
export interface CompletedOrder {
  orderId: string;
  sku: string;
  status: string;
}

export interface OrderHistoryResult {
  orders: CompletedOrder[];
  hasNext: boolean;
  nextKey?: string | null;
}

export async function fetchOrderHistory(
  key?: string | null,
): Promise<OrderHistoryResult> {
  try {
    const IAP = await getIAP();
    const params = key ? { key } : undefined;
    const result = await (IAP as any).getCompletedOrRefundedOrders(params);
    return {
      orders: result?.orders ?? [],
      hasNext: result?.hasNext ?? false,
      nextKey: result?.nextKey ?? null,
    };
  } catch (e) {
    console.error('[IAP] fetchOrderHistory 실패:', e);
    return { orders: [], hasNext: false };
  }
}
