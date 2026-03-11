/**
 * 앱인토스 IAP 헬퍼 – 전체 인앱결제 프로세스 지원
 *
 * 1. getProductItemList  – 상품 목록 가져오기
 * 2. createOneTimePurchaseOrder – 인앱 결제 요청
 * 3. getPendingOrders + completeProductGrant – 대기 주문 복원
 * 4. getCompletedOrRefundedOrders – 주문 이력 조회
 */

export const IAP_PRODUCT_SKU =
  import.meta.env.VITE_IAP_PRODUCT_SKU ||
  'ait.0000022278.5a3a62a1.67f4825513.3234914875';

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
 * 1회 소모성 상품 구매를 시작합니다.
 * processProductGrant에서 true를 반환하여 상품 지급 완료를 SDK에 알립니다.
 * @returns cleanup 함수 (구독 해제)
 */
export async function purchaseTicket(
  callbacks: PurchaseCallbacks,
): Promise<(() => void) | null> {
  const IAP = await getIAP();

  const cleanup = IAP.createOneTimePurchaseOrder({
    options: {
      sku: IAP_PRODUCT_SKU,
      processProductGrant: async ({ orderId }: { orderId: string }) => {
        console.log('[IAP] processProductGrant 호출, orderId:', orderId);
        callbacks.onGranted(orderId);
        // ✅ 반드시 true를 반환하여 상품 지급 완료를 SDK에 알림
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
 * @returns 복원된 주문 수
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

    let recovered = 0;
    for (const order of orders) {
      // 우리 상품 SKU와 일치하는 주문만 처리
      if (order.sku && order.sku !== IAP_PRODUCT_SKU) continue;

      try {
        // 상품 지급 완료 처리
        const success = await IAP.completeProductGrant({
          params: { orderId: order.orderId },
        });
        console.log(`[IAP] completeProductGrant(${order.orderId}):`, success);
        recovered++;
      } catch (e) {
        console.error(`[IAP] completeProductGrant 실패(${order.orderId}):`, e);
      }
    }

    return recovered;
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
