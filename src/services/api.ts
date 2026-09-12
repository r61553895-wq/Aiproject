import { ChatMessage, GigaChatModel, BalanceItem } from '../types';

export async function fetchModels(customAuthKey?: string): Promise<GigaChatModel[]> {
  try {
    const headers: Record<string, string> = {};
    if (customAuthKey?.trim()) {
      headers['x-gigachat-key'] = customAuthKey.trim();
    }
    const res = await fetch('/api/models', { headers });
    if (!res.ok) throw new Error('Ошибка получения списка моделей');
    const data = await res.json();
    return data.models || [];
  } catch (err) {
    console.warn('Fallback to standard models list:', err);
    return [
      { id: 'GigaChat', description: 'Базовая универсальная модель' },
      { id: 'GigaChat-Pro', description: 'Продвинутая модель для сложных рассуждений' },
      { id: 'GigaChat-Max', description: 'Флагманская модель максимальной мощности' },
    ];
  }
}

export async function fetchBalance(customAuthKey?: string): Promise<BalanceItem[]> {
  try {
    const headers: Record<string, string> = {};
    if (customAuthKey?.trim()) {
      headers['x-gigachat-key'] = customAuthKey.trim();
    }
    const res = await fetch('/api/balance', { headers });
    if (!res.ok) throw new Error('Ошибка получения баланса');
    const data = await res.json();
    return data.balance || [];
  } catch (err) {
    console.error('Failed to fetch balance:', err);
    throw err;
  }
}

export interface StreamChatOptions {
  messages: Array<{ role: string; content: string }>;
  model: string;
  temperature: number;
  system?: string;
  customAuthKey?: string;
  signal?: AbortSignal;
  onChunk: (delta: string) => void;
  onError: (error: string) => void;
  onFinish: (fullText: string, tokensUsed: number) => void;
}

export async function streamChatCompletion({
  messages,
  model,
  temperature,
  system,
  customAuthKey,
  signal,
  onChunk,
  onError,
  onFinish,
}: StreamChatOptions): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (customAuthKey?.trim()) {
      headers['x-gigachat-key'] = customAuthKey.trim();
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        model,
        temperature,
        system,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      let errText = 'Сбой запроса к серверу';
      try {
        const errJson = await response.json();
        errText = errJson.error || errText;
      } catch {
        errText = (await response.text()) || errText;
      }
      onError(errText);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('Поток данных недоступен');
      return;
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    let tokensReported = 0;

    const computeFallbackTokens = () => {
      const inputChars = messages.reduce((acc, m) => acc + m.content.length, 0);
      return Math.max(1, Math.ceil((inputChars + accumulatedText.length) / 3.4));
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data: ')) {
          const rawData = trimmed.slice(6).trim();
          if (rawData === '[DONE]') {
            onFinish(accumulatedText, tokensReported || computeFallbackTokens());
            return;
          }

          try {
            const parsed = JSON.parse(rawData);
            if (parsed.error) {
              onError(typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error));
              return;
            }

            if (parsed.usage?.total_tokens) {
              tokensReported = parsed.usage.total_tokens;
            }

            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulatedText += delta;
              onChunk(delta);
            }
          } catch {
            // Ignore partial lines that aren't complete JSON yet
          }
        }
      }
    }

    onFinish(accumulatedText, tokensReported || computeFallbackTokens());
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // Stream was intentionally stopped by user
      return;
    }
    onError(err.message || 'Произошла непредвиденная ошибка');
  }
}

/**
 * Create a new donation order on server
 */
export async function createDonationOrder(tierId: string, paymentMethod: string, userId?: string) {
  const res = await fetch('/api/donations/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tierId, paymentMethod, userId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Не удалось создать заказ' }));
    throw new Error(err.error || 'Ошибка при создании счёта на оплату');
  }

  return res.json();
}

/**
 * Verify a completed donation payment using bank transaction ID
 */
export async function verifyDonationPayment(orderId: string, transactionId: string, userId?: string) {
  const res = await fetch('/api/donations/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, transactionId, userId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка при подтверждении платежа');
  }

  return data;
}

/**
 * Check order status by ID
 */
export async function fetchOrderStatus(orderId: string) {
  const res = await fetch(`/api/donations/order-status/${encodeURIComponent(orderId)}`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Redeem voucher / activation code with server-side validation
 */
export async function redeemPromoCode(promoCode: string) {
  const res = await fetch('/api/promos/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ promoCode }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка активации кода');
  }

  return data;
}

/**
 * Admin: List recent orders
 */
export async function fetchAdminOrders(secret: string) {
  const res = await fetch('/api/admin/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка доступа к панели управления');
  return data.orders || [];
}

/**
 * Admin: Manually approve order
 */
export async function adminApproveOrder(orderId: string, secret: string) {
  const res = await fetch('/api/admin/approve-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, secret }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка подтверждения заказа');
  return data;
}

/**
 * Admin: Generate 1-time voucher code
 */
export async function adminGenerateVoucher(tokens: number, secret: string) {
  const res = await fetch('/api/admin/generate-voucher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokens, secret }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка генерации ваучера');
  return data;
}


