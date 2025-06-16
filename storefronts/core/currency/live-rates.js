export async function fetchExchangeRates(base = 'GBP', symbols = ['USD', 'EUR', 'GBP']) {
  if (typeof fetch === 'undefined') return null;

  const CACHE_KEY = 'smoothrRatesCache';
  if (typeof window !== 'undefined') {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.base === base && Date.now() - cached.timestamp < 86400000) {
        if (symbols.every(code => cached.rates[code])) {
          return cached.rates;
        }
      }
    } catch {}
  }

  try {
    const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${symbols.join(',')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch rates');
    const data = await res.json();
    const rates = {};
    symbols.forEach(code => {
      if (typeof data.rates[code] === 'number') {
        rates[code] = data.rates[code];
      }
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), base, rates })
        );
      } catch {}
    }
    return rates;
  } catch {
    return null;
  }
}
