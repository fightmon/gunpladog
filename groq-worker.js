/**
 * 模物獵人 — Groq API Proxy Worker
 *
 * 部署步驟：
 *   1. 在 Cloudflare Dashboard → Workers & Pages → Create Worker
 *   2. 貼入此程式碼 → Deploy
 *   3. Settings → Variables → Add variable（加密）
 *      名稱：GROQ_API_KEY
 *      值：你的 Groq API Key（gsk_...）
 *   4. 把 Worker 的網址填入 gundam-price-tracker.html 的 _GROQ_WORKER_URL
 */

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: { message: 'GROQ_API_KEY 環境變數未設定' } }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    let body;
    try {
      body = await request.text();
    } catch {
      return new Response('Invalid body', { status: 400, headers: CORS });
    }

    const groqResp = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const text = await groqResp.text();
    return new Response(text, {
      status: groqResp.status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS,
      },
    });
  },
};
