// api/history.js — proxy Yahoo Finance : séries de cours historiques (pour les corrélations).
// Même endpoint /v8/finance/chart/ que api/prices.js (sans crumb), mais on demande ici un RANGE
// et un INTERVAL, et on renvoie toute la série (timestamp + adjclose).
// Appelé un symbole à la fois par le front (Yahoo chart = mono-symbole).
//
// Exemple d'appel : /api/history?symbol=ASML&range=3y&interval=1wk

export default async function handler(req, res) {
  const { symbol, range = '3y', interval = '1wk' } = req.query;
  if (!symbol) {
    res.status(400).json({ error: 'Paramètre "symbol" requis' });
    return;
  }
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}` +
    `&events=div,split`;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PortfolioTracker/1.0)' },
    });
    if (!r.ok) {
      res.status(r.status).json({ error: `Yahoo ${r.status}` });
      return;
    }
    const data = await r.json();
    // Cache CDN 1 h (les corrélations 3 ans hebdo ne bougent pas à la minute) — soulage Yahoo.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
