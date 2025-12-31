import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Top 10 most traded currencies by global market share
const TOP_CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD'];

async function fetchCurrencyData() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.exchangerate-api.com/v4/latest/USD';
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('Fetching currency data...');
    const data = await fetchCurrencyData();
    
    const currencies = TOP_CURRENCIES.map(code => {
      const rateFromUSD = code === 'USD' ? 1 : data.rates[code];
      return {
        code: code,
        name: getCurrencyName(code),
        symbol: getCurrencySymbol(code),
        rate: rateFromUSD,
        rate_to_usd: code === 'USD' ? 1 : (1 / rateFromUSD),
        lastUpdated: data.date
      };
    });
    
    const output = {
      base: 'USD',
      lastUpdated: data.date,
      currencies: currencies
    };
    
    fs.writeFileSync(
      __dirname + '/currencies.json',
      JSON.stringify(output, null, 2)
    );
    
    console.log('✓ Successfully saved 10 most used currencies to currencies.json');
    console.log(`  Base: ${output.base}`);
    console.log(`  Last Updated: ${output.lastUpdated}`);
    currencies.forEach(c => {
      console.log(`  ${c.code}: ${c.name} (${c.symbol}) - Rate: ${c.rate.toFixed(3)} | To USD: ${c.rate_to_usd.toFixed(4)}`);
    });
  } catch (error) {
    console.error('Error fetching currency data:', error.message);
    process.exit(1);
  }
}

function getCurrencyName(code) {
  const names = {
    'USD': 'United States Dollar',
    'EUR': 'Euro',
    'JPY': 'Japanese Yen',
    'GBP': 'British Pound Sterling',
    'AUD': 'Australian Dollar',
    'CAD': 'Canadian Dollar',
    'CHF': 'Swiss Franc',
    'CNY': 'Chinese Yuan',
    'HKD': 'Hong Kong Dollar',
    'NZD': 'New Zealand Dollar'
  };
  return names[code] || code;
}

function getCurrencySymbol(code) {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'JPY': '¥',
    'GBP': '£',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'CNY': '¥',
    'HKD': 'HK$',
    'NZD': 'NZ$'
  };
  return symbols[code] || code;
}

main();
