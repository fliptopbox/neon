import { object } from 'zod';
import { toSlug } from '../export/constants.js';
export function makeCalendar(records, allusers, index) {
    // allusers;
    console.log('⭐️ find Homerton Library:', index); //?
    console.log('⭐️ Make Calendar users:', records.length);

    return records
        .filter(row => /(open)/i.test(row.pk) === false)
        .map((row, n) => {
            const date = new Date(row?.date + ' ' + `${row.start}:00:00`);
            const [status] = [
                /TBC/.test(row.pk) ? 'pending' : null,
                /OPEN CALL/.test(row.pk) ? 'opencall' : null,
                /Closed/.test(row.pk) ? 'closed' : null,
                'confirmed'
            ].filter(Boolean);

            const username = toSlug(row.fullname);
            const { fullname, email } = allusers[username] || {};

            console.log('>> Map to user:', email, fullname )
            return {
                REL: { email, n },

                event_id: index + 1,
                status: status,
                attendance_inperson: Number(row?.inperson ?? 0),
                attendance_online: Number(row?.attendance_online ?? 0),
                date_time: date.toISOString(),
                duration: Number(row?.duration || 2),
                pose_format: `${row.date.trim()} with ${fullname}, mixed poses from 90 seconds to 25 minutes.`.trim(),
            };
        });
}