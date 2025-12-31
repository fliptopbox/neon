import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common currencies list
const TARGET_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
    'NZD', 'INR', 'BRL', 'RUB', 'ZAR', 'MXN', 'SGD', 'HKD',
    'SEK', 'NOK', 'KRW', 'TRY'
];

export async function fetchExchangeRates(currencyCodes = TARGET_CURRENCIES) {
    const outputPath = path.resolve(__dirname, './static-exchange-rates.json');
    let previousData = null;

    // Load previous data if exists
    if (fs.existsSync(outputPath)) {
        try {
            const raw = fs.readFileSync(outputPath, 'utf-8');
            previousData = JSON.parse(raw);
        } catch (e) {
            console.warn('⚠️ Could not read previous exchange rates file.');
        }
    }

    // Check if update is needed
    if (previousData && previousData.timestamp && !Array.isArray(previousData)) {
        const lastUpdate = new Date(previousData.timestamp).getTime();
        const now = Date.now();
        const diffHours = (now - lastUpdate) / (1000 * 60 * 60);

        if (diffHours < 3) {
            console.log(`ℹ️ Exchange rates are fresh (${diffHours.toFixed(2)} hours old). Skipping update.`);
            return previousData;
        }
    }

    // Fetch new rates
    try {
        console.log('Fetching exchange rates...');
        // Fetch rates with USD as base: 1 USD = x CUR
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);

        const data = await res.json();
        const rates = data.rates;
        const now = new Date().toISOString();

        const records = currencyCodes.map(code => {
            const result = {
                currency_code: code,
                rate_to_usd: 1.0, // Default for USD
                updated_at: now
            };

            const rate = rates[code];
            if (rate) {
                // If 1 USD = rate CUR, then 1 CUR = 1/rate USD
                // We want rate_to_usd, i.e. value in USD.
                result.rate_to_usd = parseFloat((1 / rate).toFixed(6));
            } else {
                console.warn(`⚠️ Rate not found for ${code}, defaulting to 1.0`);
            }
            return result;
        });

        const outputData = {
            timestamp: now,
            records: records
        };

        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
        console.log(`✅ Saved ${records.length} exchange rates to ${outputPath}`);

        return outputData;
    } catch (error) {
        console.error('❌ Failed to fetch exchange rates:', error.message);
        process.exit(1);
    }
}

// fetchExchangeRates();
