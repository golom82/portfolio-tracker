export default async function handler(req, res) {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'No symbols' });
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com',
      }
    });
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
