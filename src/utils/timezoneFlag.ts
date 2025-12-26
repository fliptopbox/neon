
import cityTimezones from 'city-timezones';

/**
 * Returns the country flag emoji corresponding to the user's current timezone.
 * Uses Intl.DateTimeFormat().resolvedOptions().timeZone to detect timezone.
 * Falls back to '🌍' if no matching country is found.
 */
export function getClientTimezoneFlag(timezone?: string): string {
  try {
    const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (!userTimezone) return '🌍';

    // city-timezones lookup returns an array of matches for a timezone string
    const locationData = cityTimezones.findFromCityStateProvince(userTimezone);
    
    // If not found by direct string, try looking up via the timezone field directly 
    // (the library lookup might be strictly city based, so we filter the raw list if needed)
    // Actually city-timezones is optimized for city lookup. 
    // Let's iterate the raw data or use a library that maps TZ -> Country Code directly.
    // However, since we are doing this strictly client-side/lightweight, let's look for a match manually
    // if the library enables it, or use a simpler mapping if city-timezones doesn't support direct tz lookup.
    
    // Better approach with this strictly minimal requirement (Timezone -> Flag):
    // Construct a map or find a matching city that shares this timezone.
    // NOTE: 'city-timezones' finds data based on 'City'. 
    // We need TZ -> Country. 
    // Let's use the 'cityMapping' if accessible or traverse.
    
    // Let's try to just find *any* city with this timezone in the library to get the ISO code.
    const cityMatch = cityTimezones.cityMapping.find((city) => city.timezone === userTimezone);
    
    if (cityMatch && cityMatch.iso2) {
      return getFlagEmoji(cityMatch.iso2);
    }
    
    return '🌍';
  } catch (error) {
    console.warn('Error detecting timezone flag:', error);
    return '🌍';
  }
}

/**
 * Converts an ISO 3166-1 alpha-2 country code to a flag emoji.
 */
function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
