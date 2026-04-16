export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'No symbols' });

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  try {
    // Étape 1 : récupérer le cookie de session
    const cookieRes = await fetch('https://fc.yahoo.com', { headers: HEADERS });
    const rawCookies = cookieRes.headers.get('set-cookie') || '';
    const cookie = rawCookies.split(',').map(c => c.split(';')[0].trim()).join('; ');

    // Étape 2 : récupérer le crumb
    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...HEADERS, 'Cookie': cookie }
    });
    const crumb = await crumbRes.text();
    if (!crumb || crumb.includes('<')) throw new Error('Crumb invalide');

    // Étape 3 : récupérer les cotations
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&crumb=${encodeURIComponent(crumb)}`;
    const quoteRes = await fetch(url, {
      headers: { ...HEADERS, 'Cookie': cookie }
    });
    const data = await quoteRes.json();
    res.json(data);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
