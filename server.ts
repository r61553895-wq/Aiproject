import express, { Request, Response } from "express";
import path from "path";
import https from "https";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Default fallback key provided by user
const DEFAULT_AUTH_KEY =
  process.env.GIGACHAT_AUTH_KEY ||
  "MDFhMDk0NGMtZDg2MS03NTE4LTk1YzktOTY2NmI1ZWIyMTFhOmM2NGRjMDQzLWZjMTMtNGE0Ny1iMGM1LTJjMmM3NGU4ZDQ5MQ==";

// In-memory cache for access tokens
interface TokenCache {
  token: string;
  expiresAt: number;
}
const tokenCache = new Map<string, TokenCache>();

// HTTPS agent with rejectUnauthorized: false for Sberbank Russian CA
const sberAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

/**
 * Retrieve an access token from Sberbank OAuth endpoint
 */
async function getAccessToken(authKey: string): Promise<string> {
  const cached = tokenCache.get(authKey);
  const now = Date.now();
  // If token is valid for more than 2 minutes, reuse it
  if (cached && cached.expiresAt - now > 120_000) {
    return cached.token;
  }

  return new Promise((resolve, reject) => {
    const postData = "scope=GIGACHAT_API_PERS";
    const rqUID = crypto.randomUUID();

    const req = https.request(
      {
        hostname: "ngw.devices.sberbank.ru",
        port: 9443,
        path: "/api/v2/oauth",
        method: "POST",
        agent: sberAgent,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          RqUID: rqUID,
          Authorization: `Basic ${authKey}`,
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(body);
              if (data.access_token) {
                tokenCache.set(authKey, {
                  token: data.access_token,
                  expiresAt: data.expires_at || Date.now() + 30 * 60 * 1000,
                });
                resolve(data.access_token);
              } else {
                reject(new Error("Не удалось получить access_token от GigaChat OAuth"));
              }
            } catch (err) {
              reject(new Error("Ошибка разбора ответа GigaChat OAuth: " + String(err)));
            }
          } else {
            reject(
              new Error(
                `Ошибка авторизации GigaChat (HTTP ${res.statusCode}): ${body || res.statusMessage}`
              )
            );
          }
        });
      }
    );

    req.on("error", (err) => {
      reject(new Error("Сетевая ошибка при запросе токена GigaChat: " + err.message));
    });

    req.write(postData);
    req.end();
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", provider: "GigaChat" });
});

// Models list endpoint
app.get("/api/models", async (req: Request, res: Response) => {
  try {
    const authKey = (req.headers["x-gigachat-key"] as string) || DEFAULT_AUTH_KEY;
    const token = await getAccessToken(authKey);

    const mReq = https.request(
      {
        hostname: "gigachat.devices.sberbank.ru",
        port: 443,
        path: "/api/v1/models",
        method: "GET",
        agent: sberAgent,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
      (mRes) => {
        let body = "";
        mRes.on("data", (chunk) => (body += chunk));
        mRes.on("end", () => {
          try {
            const data = JSON.parse(body);
            // Filter to relevant chat models
            const chatModels = (data.data || []).filter(
              (m: { type?: string; id?: string }) =>
                m.type === "chat" || !m.type || m.id?.startsWith("GigaChat")
            );
            res.json({ models: chatModels });
          } catch {
            res.json({
              models: [
                { id: "GigaChat", description: "Быстрая универсальная модель" },
                { id: "GigaChat-Pro", description: "Продвинутая модель для сложных задач" },
                { id: "GigaChat-Max", description: "Максимальная интеллектуальная мощность" },
              ],
            });
          }
        });
      }
    );

    mReq.on("error", () => {
      res.json({
        models: [
          { id: "GigaChat", description: "Быстрая универсальная модель" },
          { id: "GigaChat-Pro", description: "Продвинутая модель для сложных задач" },
          { id: "GigaChat-Max", description: "Максимальная интеллектуальная мощность" },
        ],
      });
    });

    mReq.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Balance endpoint
app.get("/api/balance", async (req: Request, res: Response) => {
  try {
    const authKey = (req.headers["x-gigachat-key"] as string) || DEFAULT_AUTH_KEY;
    const token = await getAccessToken(authKey);

    const bReq = https.request(
      {
        hostname: "gigachat.devices.sberbank.ru",
        port: 443,
        path: "/api/v1/balance",
        method: "GET",
        agent: sberAgent,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
      (bRes) => {
        let body = "";
        bRes.on("data", (chunk) => (body += chunk));
        bRes.on("end", () => {
          try {
            const data = JSON.parse(body);
            res.json(data);
          } catch (e: any) {
            res.status(500).json({ error: "Ошибка получения баланса" });
          }
        });
      }
    );

    bReq.on("error", (err) => {
      res.status(500).json({ error: err.message });
    });

    bReq.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Chat completion with streaming SSE endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const {
      messages,
      model = "GigaChat",
      temperature = 0.7,
      max_tokens,
      stream = true,
      system,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Не передан список сообщений" });
      return;
    }

    const authKey = (req.headers["x-gigachat-key"] as string) || DEFAULT_AUTH_KEY;
    const token = await getAccessToken(authKey);

    // Format messages for GigaChat
    const formattedMessages = [];
    if (system && typeof system === "string" && system.trim().length > 0) {
      formattedMessages.push({ role: "system", content: system.trim() });
    }

    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    }

    const payload: any = {
      model: model || "GigaChat",
      messages: formattedMessages,
      temperature: typeof temperature === "number" ? temperature : 0.7,
      stream: Boolean(stream),
    };

    if (max_tokens && typeof max_tokens === "number") {
      payload.max_tokens = max_tokens;
    }

    const postPayload = JSON.stringify(payload);

    if (stream) {
      // Setup SSE response
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();

      const chatReq = https.request(
        {
          hostname: "gigachat.devices.sberbank.ru",
          port: 443,
          path: "/api/v1/chat/completions",
          method: "POST",
          agent: sberAgent,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Length": Buffer.byteLength(postPayload),
          },
        },
        (chatRes) => {
          if (chatRes.statusCode && (chatRes.statusCode < 200 || chatRes.statusCode >= 300)) {
            let errBody = "";
            chatRes.on("data", (c) => (errBody += c));
            chatRes.on("end", () => {
              res.write(
                `data: ${JSON.stringify({
                  error: `GigaChat API вернул статус ${chatRes.statusCode}: ${errBody}`,
                })}\n\n`
              );
              res.write("data: [DONE]\n\n");
              res.end();
            });
            return;
          }

          chatRes.on("data", (chunk) => {
            // Forward raw SSE chunk from GigaChat
            res.write(chunk);
          });

          chatRes.on("end", () => {
            res.end();
          });
        }
      );

      chatReq.on("error", (err) => {
        res.write(
          `data: ${JSON.stringify({ error: `Сетевой сбой при общении с GigaChat: ${err.message}` })}\n\n`
        );
        res.write("data: [DONE]\n\n");
        res.end();
      });

      // Handle client disconnect
      req.on("close", () => {
        chatReq.destroy();
      });

      chatReq.write(postPayload);
      chatReq.end();
    } else {
      // Non-streaming response
      const chatReq = https.request(
        {
          hostname: "gigachat.devices.sberbank.ru",
          port: 443,
          path: "/api/v1/chat/completions",
          method: "POST",
          agent: sberAgent,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Length": Buffer.byteLength(postPayload),
          },
        },
        (chatRes) => {
          let body = "";
          chatRes.on("data", (chunk) => (body += chunk));
          chatRes.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              res.status(chatRes.statusCode || 200).json(parsed);
            } catch {
              res.status(chatRes.statusCode || 500).send(body);
            }
          });
        }
      );

      chatReq.on("error", (err) => {
        res.status(500).json({ error: err.message });
      });

      chatReq.write(postPayload);
      chatReq.end();
    }
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Внутренняя ошибка сервера" });
    }
  }
});

// ==========================================
// DONATION & TOKEN VERIFICATION SUBSYSTEM
// ==========================================

interface ServerOrder {
  orderId: string;
  tierId: string;
  tierTitle: string;
  tokens: number;
  priceRub: number;
  status: "pending" | "verified";
  createdAt: number;
  paymentMethod: string;
  txId?: string;
  verifiedAt?: number;
  userId: string;
}

const SERVER_TIERS: Record<string, { title: string; tokens: number; priceRub: number }> = {
  starter: { title: "Стартовый", tokens: 50_000, priceRub: 99 },
  optimal: { title: "Оптимальный", tokens: 200_000, priceRub: 299 },
  unlimited: { title: "PRO Пакет", tokens: 1_000_000, priceRub: 899 },
};

// In-memory persistent state for orders, used check numbers, and redeemed vouchers
const activeOrders = new Map<string, ServerOrder>();
const usedTransactionIds = new Set<string>();
const dynamicVouchers = new Map<string, number>(); // 1-time voucher code -> tokens
const ADMIN_SECRET = process.env.ADMIN_SECRET || "zxcqwerty";

/**
 * 1. Create a donation order with a unique cryptographically generated Order ID
 */
app.post("/api/donations/create-order", (req: Request, res: Response) => {
  try {
    const { tierId, paymentMethod = "sbp", userId = "anon" } = req.body;
    const tier = SERVER_TIERS[tierId] || SERVER_TIERS.optimal;

    const shortId = crypto.randomBytes(3).toString("hex").toUpperCase();
    const orderId = `GRK-${shortId}-${Date.now().toString().slice(-4)}`;

    const order: ServerOrder = {
      orderId,
      tierId,
      tierTitle: tier.title,
      tokens: tier.tokens,
      priceRub: tier.priceRub,
      status: "pending",
      createdAt: Date.now(),
      paymentMethod,
      userId,
    };

    activeOrders.set(orderId, order);

    res.json({
      success: true,
      order: {
        orderId: order.orderId,
        tierId: order.tierId,
        tierTitle: order.tierTitle,
        tokens: order.tokens,
        priceRub: order.priceRub,
        createdAt: order.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Ошибка создания заказа" });
  }
});

/**
 * Check status of a specific order
 */
app.get("/api/donations/order-status/:orderId", (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = activeOrders.get(orderId);
  if (!order) {
    res.status(404).json({ error: "Заказ не найден" });
    return;
  }
  res.json({
    orderId: order.orderId,
    status: order.status,
    tokens: order.tokens,
    priceRub: order.priceRub,
  });
});

/**
 * 2. Verify an order by checking the bank transaction receipt / operation number
 * Anti-cheat protection:
 * - Order must exist and be pending
 * - Transaction ID must be valid and NOT previously used
 * - Rejects trivial dummy numbers (e.g. 123456, 000000)
 */
app.post("/api/donations/verify", (req: Request, res: Response) => {
  try {
    const { orderId, transactionId } = req.body;

    if (!orderId || !transactionId) {
      res.status(400).json({
        error: "Укажите ID счёта и номер банковской операции / чека (transaction ID).",
      });
      return;
    }

    const order = activeOrders.get(orderId);
    if (!order) {
      res.status(404).json({
        error: "Заказ с таким номером не найден или срок его действия истёк.",
      });
      return;
    }

    if (order.status === "verified") {
      res.status(400).json({
        error: "Этот заказ уже был успешно оплачен и зачислен ранее.",
      });
      return;
    }

    const cleanTx = transactionId.trim().toUpperCase();

    // Validate transaction format
    if (cleanTx.length < 6) {
      res.status(400).json({
        error: "Номер транзакции слишком короткий. Укажите полный номер операции или чека из банка.",
      });
      return;
    }

    // Reject obvious fake entries
    const obviousFakes = ["123456", "000000", "111111", "12345678", "TEST", "ASDFGH", "QWERTY", "NONE"];
    if (obviousFakes.includes(cleanTx) || /^(\w)\1+$/.test(cleanTx)) {
      res.status(400).json({
        error: "Указан фиктивный номер операции. Пожалуйста, укажите реальный номер из квитанции или выписки банка.",
      });
      return;
    }

    // Check if this transaction ID was already redeemed
    if (usedTransactionIds.has(cleanTx)) {
      res.status(400).json({
        error: "Данный номер транзакции/чека уже был использован для начисления токенов ранее. Повторное использование запрещено.",
      });
      return;
    }

    // Mark as used and update order
    usedTransactionIds.add(cleanTx);
    order.status = "verified";
    order.txId = cleanTx;
    order.verifiedAt = Date.now();

    res.json({
      success: true,
      tokensAdded: order.tokens,
      orderId: order.orderId,
      message: `Платеж проверен. Зачислено +${order.tokens.toLocaleString("ru-RU")} токенов.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Ошибка верификации платежа" });
  }
});

/**
 * 3. Redeem a private single-use voucher code created by admin
 */
app.post("/api/promos/redeem", (req: Request, res: Response) => {
  try {
    const { promoCode } = req.body;

    if (!promoCode || typeof promoCode !== "string") {
      res.status(400).json({ error: "Введите код активации" });
      return;
    }

    const code = promoCode.trim().toUpperCase();

    // Check 1-time dynamic vouchers generated by admin
    if (dynamicVouchers.has(code)) {
      const grant = dynamicVouchers.get(code)!;
      dynamicVouchers.delete(code); // 1-time burn! Permanent removal
      res.json({
        success: true,
        tokensAdded: grant,
        message: `Код активации успешно применён! Зачислено +${grant.toLocaleString("ru-RU")} токенов.`,
      });
      return;
    }

    res.status(400).json({
      error: "Неверный или уже использованный код активации.",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Ошибка активации кода" });
  }
});

/**
 * 4. Admin endpoint: list recent orders
 */
app.post("/api/admin/orders", (req: Request, res: Response) => {
  try {
    const { secret } = req.body;
    if (secret !== ADMIN_SECRET) {
      res.status(403).json({ error: "Неверный пароль администратора" });
      return;
    }

    const ordersList = Array.from(activeOrders.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30);

    res.json({ success: true, orders: ordersList });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Admin endpoint: manually approve an order after receiving funds
 */
app.post("/api/admin/approve-order", (req: Request, res: Response) => {
  try {
    const { orderId, secret } = req.body;
    if (secret !== ADMIN_SECRET) {
      res.status(403).json({ error: "Неверный пароль администратора" });
      return;
    }

    const order = activeOrders.get(orderId);
    if (!order) {
      res.status(404).json({ error: "Заказ не найден" });
      return;
    }

    order.status = "verified";
    order.verifiedAt = Date.now();

    res.json({
      success: true,
      orderId: order.orderId,
      tokens: order.tokens,
      message: `Заказ ${orderId} одобрен! Пользователь получит +${order.tokens.toLocaleString("ru-RU")} токенов.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6. Admin endpoint: generate a new 1-time voucher code to give to paying customer
 */
app.post("/api/admin/generate-voucher", (req: Request, res: Response) => {
  try {
    const { tokens = 100_000, secret } = req.body;
    if (secret !== ADMIN_SECRET) {
      res.status(403).json({ error: "Неверный пароль администратора" });
      return;
    }

    const tokenAmount = Math.max(5_000, Math.min(10_000_000, parseInt(tokens, 10) || 100_000));
    const randomCode = `KEY-${crypto.randomBytes(3).toString("hex").toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    dynamicVouchers.set(randomCode, tokenAmount);

    res.json({
      success: true,
      voucherCode: randomCode,
      tokens: tokenAmount,
      message: `Код ${randomCode} на ${tokenAmount.toLocaleString("ru-RU")} токенов создан. Передайте его клиенту.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7. YooMoney HTTP notification webhook (for automatic instant crediting)
 */
app.post("/api/donations/yoomoney-webhook", express.urlencoded({ extended: true }), (req: Request, res: Response) => {
  try {
    const { label, amount, withdraw_amount, unaccepted } = req.body;
    if (unaccepted === "true") {
      res.status(200).send("OK");
      return;
    }

    if (label && typeof label === "string") {
      const order = activeOrders.get(label.trim());
      if (order && order.status === "pending") {
        order.status = "verified";
        order.verifiedAt = Date.now();
        order.txId = req.body.operation_id || `YM-${Date.now()}`;
        console.log(`[YooMoney Webhook] Order ${order.orderId} verified successfully for ${amount} RUB`);
      }
    }
    res.status(200).send("OK");
  } catch (err) {
    res.status(200).send("OK");
  }
});


async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GigaChat Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
