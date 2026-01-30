export interface CareRate {
    time: number; // minutes
    price: number; // won
}

export interface CareGradeLimit {
    grade: number | string;
    limit: number;
    visits: CareRate[];
}

import ratesData from '@/config/care_rates_2024.json';

const RATES: CareGradeLimit[] = ratesData;

/**
 * Calculates the expected fee for a standard home visit.
 * @param grade Recipient's Long-term care grade (1-5 or 'Cognitive')
 * @param minutes Duration of visit in minutes
 * @param isNight Is it a night shift (18:00~22:00)? (+20%)
 * @param isLateNight Is it a late night shift (22:00~06:00)? (+30%)
 * @param isHoliday Is it a holiday/Sunday? (+30%)
 * @param copayRate User's copay percentage (15, 9, 6, 0)
 */
export function calculateVisitFee(
    grade: number | string,
    minutes: number,
    options: {
        isNight?: boolean;
        isLateNight?: boolean;
        isHoliday?: boolean;
        copayRate?: number;
    } = {}
) {
    const gradeData = RATES.find(r => r.grade == grade);
    if (!gradeData) return null;

    // Find closest rate (exact match or round down to nearest standard slot)
    // Standard slots: 30, 60, 90, 120, 150, 180, 210, 240
    const availableTimes = gradeData.visits.map(v => v.time).sort((a, b) => b - a);
    const applicableTime = availableTimes.find(t => minutes >= t);

    if (!applicableTime) return null;

    const basePrice = gradeData.visits.find(v => v.time === applicableTime)?.price || 0;

    // Add-on Logic (Max 1 add-on usually applies to the overlapping time, but for simplicity here we apply to base)
    // *Real-world note: Korean logic applies add-ons only to specific minutes. This is a simplified estimation.*
    let multiplier = 1.0;
    if (options.isHoliday) multiplier += 0.3;
    else if (options.isLateNight) multiplier += 0.3;
    else if (options.isNight) multiplier += 0.2;

    const totalPrice = Math.floor(basePrice * multiplier);
    const copay = Math.floor(totalPrice * ((options.copayRate || 15) / 100)); // Default 15%
    const governmentPay = totalPrice - copay;

    return {
        basePrice,
        totalPrice,
        copay,
        governmentPay,
        limit: gradeData.limit,
        appliedTime: applicableTime
    };
}
