// Currency utility functions for displaying prices with correct symbols

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  position: 'before' | 'after'; // Where to place the symbol relative to the price
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    position: 'after'
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    position: 'after'
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    position: 'after'
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danish Krone',
    position: 'after'
  }
};

export const formatPrice = (price: number, currencyCode: string = 'EUR'): string => {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.EUR;
  const formattedPrice = price.toFixed(2);
  
  if (currency.position === 'before') {
    return `${currency.symbol}${formattedPrice}`;
  } else {
    return `${formattedPrice} ${currency.symbol}`;
  }
};

export const getCurrencySymbol = (currencyCode: string = 'EUR'): string => {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || SUPPORTED_CURRENCIES.EUR.symbol;
};

export const getCurrencyOptions = () => {
  return Object.values(SUPPORTED_CURRENCIES).map(currency => ({
    value: currency.code,
    label: `${currency.name} (${currency.symbol})`,
    symbol: currency.symbol
  }));
};