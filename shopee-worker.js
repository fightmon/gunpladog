/**
 * 鋼彈價格雷達 — Cloudflare Worker（蝦皮比價中介）
 * 部署後將 Worker 網址填入 gundam-price-tracker.html 的 _SHOPEE_WORKER_URL 變數
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

export default {
  async fetch(request, env, ctx) {
    // 處理 OPTIONS 預檢請求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url     = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    const limit   = Math.min(parseInt(url.searchParams.get('limit') || '6'), 10);

    if (!keyword.trim()) {
      return json({ error: 'keyword 參數必填' }, 400);
    }

    const shopeeUrl =
      'https://shopee.tw/api/v4/search/search_items' +
      '?by=relevancy' +
      '&keyword=' + encodeURIComponent(keyword) +
      '&limit=' + limit +
      '&newest=0' +
      '&order=asc' +
      '&page_type=search' +
      '&scenario=PAGE_GLOBAL_SEARCH' +
      '&version=2';

    // 產生隨機 SPC_F（模擬匿名訪客 fingerprint）
    const spcF = crypto.randomUUID().replace(/-/g, '');

    try {
      const resp = await fetch(shopeeUrl, {
        headers: {
          'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept'         : 'application/json, text/plain, */*',
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer'        : 'https://shopee.tw/search?keyword=' + encodeURIComponent(keyword),
          'Origin'         : 'https://shopee.tw',
          'Cookie'         : 'SPC_F=' + spcF + '; SPC_U=-1; SPC_IA=-1; REC_T_ID=' + spcF,
          'sec-ch-ua'      : '"Chromium";v="124","Google Chrome";v="124","Not-A.Brand";v="99"',
          'sec-ch-ua-mobile'  : '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Sec-Fetch-Dest' : 'empty',
          'Sec-Fetch-Mode' : 'cors',
          'Sec-Fetch-Site' : 'same-origin',
          'X-API-SOURCE'   : 'pc',
          'X-Shopee-Language': 'zh-Hant',
        },
      });

      if (!resp.ok) {
        return json({ error: '蝦皮回應錯誤 HTTP ' + resp.status }, 502);
      }

      const data = await resp.json();
      const raw  = data.items || [];

      if (!raw.length) {
        return json({ items: [], keyword, message: '查無結果' });
      }

      const items = raw.map(item => {
        const b        = item.item_basic || item;
        const priceMin = Math.round((b.price_min || b.price || 0) / 100000);
        const priceMax = Math.round((b.price_max || b.price || 0) / 100000);
        const shopid   = b.shopid  || 0;
        const itemid   = b.itemid  || b.id || 0;
        return {
          name    : b.name      || '',
          shopName: b.shop_name || '',
          priceMin,
          priceMax,
          sold    : b.sold  || 0,
          stock   : b.stock || 0,
          url     : 'https://shopee.tw/product/' + shopid + '/' + itemid,
        };
      }).filter(x => x.priceMin > 0);

      return json({ items, keyword });

    } catch (e) {
      return json({ error: '伺服器錯誤：' + e.message }, 500);
    }
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}
