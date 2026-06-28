export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'No symbols' });
  const tickers = symbols.split(',').map(s => s.trim()).filter(Boolean);

  // Moyenne mobile simple des n dernières clôtures valides.
  // minReq = nombre minimal de séances exigé, sinon null (on n'affiche pas une « MM200 »
  // calculée sur 2 mois d'historique pour un titre récent).
  const sma = (arr, n, minReq) => {
    const v = (arr || []).filter(x => x != null && !isNaN(x));
    if (v.length < minReq) return null;
    const slice = v.slice(-n);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  };

  const results = await Promise.all(tickers.map(async ticker => {
    try {
      // range=1y / interval=1d : assez de séances pour la MM200, endpoint chart SANS crumb.
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com',
        }
      });
      const data = await r.json();
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;
      if (!meta?.regularMarketPrice) return null;
      const closes = result?.indicators?.quote?.[0]?.close || [];
      return {
        symbol: ticker,
        regularMarketPrice: meta.regularMarketPrice,
        currency: meta.currency,
        regularMarketTime: meta.regularMarketTime,
        // Range annuel — déjà présent dans le bloc meta du chart, sans crumb
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
        // Moyennes mobiles calculées depuis la série quotidienne (le bloc meta ne les fournit pas).
        // MM200 : ≥150 séances requises (~7 mois) ; MM50 : ≥40 séances.
        twoHundredDayAverage: sma(closes, 200, 150),
        fiftyDayAverage: sma(closes, 50, 40),
      };
    } catch { return null; }
  }));

  res.json({
    quoteResponse: { result: results.filter(Boolean) }
  });
}
