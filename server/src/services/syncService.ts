/**
 * Holiday Sync Service
 * Fetches holidays from Nager.Date API (federal) and Calendarific (fun holidays)
 */

import axios from 'axios';
import prisma from '../lib/prisma';

// Nager.Date API response type
interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  launchYear: number | null;
  types: string[];
}

// Calendarific API response type
interface CalendarificHoliday {
  name: string;
  description: string;
  date: {
    iso: string;
  };
  type: string[];
  primary_type: string;
}

interface CalendarificResponse {
  response: {
    holidays: CalendarificHoliday[];
  };
}

/**
 * Sync federal holidays from Nager.Date API
 */
async function syncFederalHolidays(year: number): Promise<number> {
  try {
    console.log(`[SYNC] Fetching federal holidays for ${year} from Nager.Date...`);
    
    const response = await axios.get<NagerHoliday[]>(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/US`
    );

    const holidays = response.data;
    let count = 0;

    for (const holiday of holidays) {
      // Check if holiday already exists
      const existing = await prisma.holiday.findFirst({
        where: {
          title: holiday.name,
          date: holiday.date,
          source: 'federal'
        }
      });

      if (!existing) {
        await prisma.holiday.create({
          data: {
            title: holiday.name,
            date: holiday.date,
            category: 'federal',
            color: '#06427F', // Primary blue for federal
            source: 'federal',
            visible: true,
            recurring: false
          }
        });
        count++;
      }
    }

    // Log sync
    await prisma.syncLog.create({
      data: {
        source: 'nager',
        status: 'success',
        message: `Synced ${count} new federal holidays for ${year}`
      }
    });

    console.log(`[SYNC] Added ${count} new federal holidays for ${year}`);
    return count;
  } catch (error) {
    console.error('[SYNC] Federal holidays sync error:', error);
    
    await prisma.syncLog.create({
      data: {
        source: 'nager',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    throw error;
  }
}

/**
 * Sync fun/national holidays from Calendarific API
 */
async function syncFunHolidays(year: number): Promise<number> {
  const apiKey = process.env.CALENDARIFIC_API_KEY;

  if (!apiKey) {
    console.log('[SYNC] No Calendarific API key found, skipping fun holidays sync');
    return 0;
  }

  try {
    console.log(`[SYNC] Fetching fun holidays for ${year} from Calendarific...`);

    const response = await axios.get<CalendarificResponse>(
      `https://calendarific.com/api/v2/holidays`,
      {
        params: {
          api_key: apiKey,
          country: 'US',
          year: year,
          type: 'observance,national'
        }
      }
    );

    const holidays = response.data.response.holidays;
    let count = 0;

    // Fun holiday categories to include
    const funKeywords = [
      'day', 'national', 'world', 'international',
      'pizza', 'donut', 'ice cream', 'chocolate', 'coffee',
      'dog', 'cat', 'pet', 'friendship', 'love'
    ];

    for (const holiday of holidays) {
      // Skip federal/public holidays (handled by Nager)
      if (holiday.type.includes('Federal') || holiday.type.includes('Public')) {
        continue;
      }

      // Check if it's a "fun" type holiday
      const isFunHoliday = funKeywords.some(keyword =>
        holiday.name.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!isFunHoliday) continue;

      // Check if holiday already exists
      const existing = await prisma.holiday.findFirst({
        where: {
          title: holiday.name,
          date: holiday.date.iso.split('T')[0],
          source: 'fun'
        }
      });

      if (!existing) {
        await prisma.holiday.create({
          data: {
            title: holiday.name,
            date: holiday.date.iso.split('T')[0],
            category: 'fun',
            color: '#7B7E77', // Grey for fun holidays
            source: 'fun',
            visible: true,
            recurring: false
          }
        });
        count++;
      }
    }

    // Log sync
    await prisma.syncLog.create({
      data: {
        source: 'calendarific',
        status: 'success',
        message: `Synced ${count} new fun holidays for ${year}`
      }
    });

    console.log(`[SYNC] Added ${count} new fun holidays for ${year}`);
    return count;
  } catch (error) {
    console.error('[SYNC] Fun holidays sync error:', error);
    
    await prisma.syncLog.create({
      data: {
        source: 'calendarific',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    throw error;
  }
}

/**
 * Sync recurring holidays to new year
 */
async function syncRecurringHolidays(year: number): Promise<number> {
  try {
    console.log(`[SYNC] Syncing recurring holidays for ${year}...`);

    // Get all recurring holidays
    const recurringHolidays = await prisma.holiday.findMany({
      where: { recurring: true }
    });

    let count = 0;

    for (const holiday of recurringHolidays) {
      // Extract month-day from original date
      const [, month, day] = holiday.date.split('-');
      const newDate = `${year}-${month}-${day}`;

      // Check if this recurring holiday already exists for the new year
      const existing = await prisma.holiday.findFirst({
        where: {
          title: holiday.title,
          date: newDate
        }
      });

      if (!existing) {
        await prisma.holiday.create({
          data: {
            title: holiday.title,
            date: newDate,
            category: holiday.category,
            color: holiday.color,
            source: holiday.source,
            visible: holiday.visible,
            recurring: true
          }
        });
        count++;
      }
    }

    console.log(`[SYNC] Added ${count} recurring holidays for ${year}`);
    return count;
  } catch (error) {
    console.error('[SYNC] Recurring holidays sync error:', error);
    throw error;
  }
}

/**
 * Main sync function - syncs all holiday sources
 */
export async function syncHolidays(year?: number): Promise<{
  federal: number;
  fun: number;
  recurring: number;
}> {
  const targetYear = year || new Date().getFullYear();
  
  console.log(`[SYNC] Starting holiday sync for ${targetYear}...`);

  const federal = await syncFederalHolidays(targetYear);
  const fun = await syncFunHolidays(targetYear);
  const recurring = await syncRecurringHolidays(targetYear);

  // Also sync next year for planning
  const nextYear = targetYear + 1;
  const federalNext = await syncFederalHolidays(nextYear);
  const funNext = await syncFunHolidays(nextYear);
  const recurringNext = await syncRecurringHolidays(nextYear);

  console.log(`[SYNC] Sync complete!`);

  return {
    federal: federal + federalNext,
    fun: fun + funNext,
    recurring: recurring + recurringNext
  };
}

/**
 * Get sync logs
 */
export async function getSyncLogs(limit: number = 20) {
  return prisma.syncLog.findMany({
    orderBy: { syncedAt: 'desc' },
    take: limit
  });
}
