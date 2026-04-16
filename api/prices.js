export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'No symbols' });

  const tickers = symbols.split(',').map(s => s.trim()).filter(Boolean);

  const results = await Promise.all(tickers.map(async ticker => {
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com',
        }
      });
      const data = await r.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) return null;
      return {
        symbol: ticker,
        regularMarketPrice: meta.regularMarketPrice,
        currency: meta.currency,
        regularMarketTime: meta.regularMarketTime,
      };
    } catch { return null; }
  }));

  res.json({
    quoteResponse: { result: results.filter(Boolean) }
  });
}
