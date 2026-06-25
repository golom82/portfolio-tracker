// api/search.js — proxy serverless Vercel pour la recherche de ticker Yahoo Finance.
// Contourne le CORS de Yahoo, comme api/prices.js.
// Appelé côté client via : /api/search?q=hermes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'No query' });

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0&listsCount=0`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com',
      }
    });
    const data = await r.json();

    const quotes = (data?.quotes || [])
      .filter(x => x.symbol && (x.quoteType === 'EQUITY' || x.quoteType === 'ETF' || x.quoteType === 'INDEX' || !x.quoteType))
      .map(x => ({
        symbol: x.symbol,
        name: x.shortname || x.longname || x.symbol,
        exchange: x.exchDisp || x.exchange || '',
        type: x.quoteType || '',
      }));

    res.json({ quotes });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
