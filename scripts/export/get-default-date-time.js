/**
 * Converts venue time, duration, and dayno into a structured datetime object
 * @param {string} time - Time string like "7-9.00 PM" or "7.00 PM"
 * @param {string} duration - Duration in hours like "2"
 * @param {string} dayno - Day number (1=Monday, 2=Tuesday, etc.)
 * @returns {Object} { default_date_time, default_duration }
 */

// getDefaultDateTime('7-9.00 PM', '2', '2'); //?
// getDefaultDateTime('7 PM', '2.5', '4'); //?
// getDefaultDateTime('7.30 PM', '2.5', '4'); //?
// getDefaultDateTime('15:30', '2', '8'); //?

export function getDefaultDateTime(time, duration, dayno) {
  const ampm = /am|pm/i.test(time);
  const adjustBy = /pm/i.test(time) ? 12 : 0;

  let [hh, mm] = time
    .replace(/(am|pm)/i,'')
    .replace(/\s+/g,'')
    .trim()
    .match(/(\d+)[:\.]*((\d+))*/)
    .slice(1,3)
    .map(s => Number(s ?? 0) );

  const hour = ampm ? Number(hh) + adjustBy : Number(hh);
  const minute = Number(mm / 60) * 60;

  // Create timestamp based on Date(0) with time of day
  const sunday = 1000 * 60 * 60 * 24 * (3 + ((parseInt(dayno)) % 8)); // Jan 4, 1970 is a Sunday
  const utcDate = new Date(0 + sunday);
  utcDate.setUTCHours(hour, minute, 0, 0); 

  return {
    args: { time, duration, dayno },
    string: utcDate.toString(),
    default_date_time: utcDate.toISOString(),
    default_duration: duration ? parseFloat(duration) : null,

  };
}