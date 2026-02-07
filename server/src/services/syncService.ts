/**
 * Holiday Sync Service
 * Fetches holidays from configured APIs
 * Supports: Nager.Date, Calendarific, Abstract, and custom APIs
 */

import axios from 'axios';
import prisma from '../lib/prisma';

// API configuration interface (matches apiConfig.ts)
interface HolidayApiConfig {
  id: string;
  name: string;
  enabled: boolean;
  type: 'nager' | 'calendarific' | 'abstract' | 'custom';
  endpoint: string;
  apiKey?: string;
  country: string;
  color: string;
  category: 'federal' | 'fun' | 'company';
  dateField?: string;
  titleField?: string;
  responsePathToHolidays?: string;
}

// Default API configurations
const DEFAULT_CONFIGS: HolidayApiConfig[] = [
  {
    id: 'nager-us',
    name: 'Nager.Date (Federal)',
    enabled: false,
    type: 'nager',
    endpoint: 'https://date.nager.at/api/v3',
    country: 'US',
    color: '#3B82F6',
    category: 'federal'
  },
  {
    id: 'calendarific-us',
    name: 'Calendarific (Fun)',
    enabled: false,
    type: 'calendarific',
    endpoint: 'https://calendarific.com/api/v2',
    apiKey: '',
    country: 'US',
    color: '#10B981',
    category: 'fun'
  }
];

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  federal: '#06427F',
  fun: '#7B7E77',
  company: '#059669'
};

/**
 * Get API configurations from database
 */
async function getApiConfigs(): Promise<HolidayApiConfig[]> {
  try {
    const configSetting = await prisma.settings.findUnique({
      where: { key: 'holiday_api_configs' }
    });

    if (configSetting) {
      return JSON.parse(configSetting.value) as HolidayApiConfig[];
    }
  } catch (error) {
    console.error('[SYNC] Error reading API configs:', error);
  }
  return DEFAULT_CONFIGS;
}

/**
 * Sync holidays from a Nager.Date API
 */
async function syncNagerApi(config: HolidayApiConfig, year: number): Promise<number> {
  try {
    console.log(`[SYNC] Fetching from ${config.name} for ${year}...`);
    
    const response = await axios.get(`${config.endpoint}/PublicHolidays/${year}/${config.country}`);
    const holidays = response.data;
    let count = 0;

    for (const holiday of holidays) {
      const existing = await prisma.holiday.findFirst({
        where: {
          title: holiday.name,
          date: holiday.date,
          source: config.id
        }
      });

      if (!existing) {
        await prisma.holiday.create({
          data: {
            title: holiday.name,
            date: holiday.date,
            category: config.category,
            color: config.color || CATEGORY_COLORS[config.category],
            source: config.id,
            visible: true,
            recurring: false
          }
        });
        count++;
      }
    }

    await prisma.syncLog.create({
      data: {
        source: config.id,
        status: 'success',
        message: `Synced ${count} holidays for ${year}`
      }
    });

    console.log(`[SYNC] ${config.name}: Added ${count} holidays for ${year}`);
    return count;
  } catch (error) {
    console.error(`[SYNC] ${config.name} error:`, error);
    
    await prisma.syncLog.create({
      data: {
        source: config.id,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return 0;
  }
}

/**
 * Sync holidays from Calendarific API
 */
async function syncCalendarificApi(config: HolidayApiConfig, year: number): Promise<number> {
  if (!config.apiKey) {
    console.log(`[SYNC] ${config.name}: No API key configured, skipping`);
    return 0;
  }

  try {
    console.log(`[SYNC] Fetching from ${config.name} for ${year}...`);

    const response = await axios.get(`${config.endpoint}/holidays`, {
      params: {
        api_key: config.apiKey,
        country: config.country,
        year: year,
        type: 'observance,national'
      }
    });

    const holidays = response.data?.response?.holidays || [];
    let count = 0;

    // Fun holiday keywords filter
    const funKeywords = [
      'day', 'national', 'world', 'international',
      'pizza', 'donut', 'ice cream', 'chocolate', 'coffee',
      'dog', 'cat', 'pet', 'friendship', 'love'
    ];

    for (const holiday of holidays) {
      // Skip federal/public holidays if category is fun
      if (config.category === 'fun') {
        if (holiday.type?.includes('Federal') || holiday.type?.includes('Public')) {
          continue;
        }
        const isFunHoliday = funKeywords.some(keyword =>
          holiday.name.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!isFunHoliday) continue;
      }

      const dateStr = holiday.date?.iso?.split('T')[0];
      if (!dateStr) continue;

      const existing = await prisma.holiday.findFirst({
        where: {
          title: holiday.name,
          date: dateStr,
          source: config.id
        }
      });

      if (!existing) {
        await prisma.holiday.create({
          data: {
            title: holiday.name,
            date: dateStr,
            category: config.category,
            color: config.color || CATEGORY_COLORS[config.category],
            source: config.id,
            visible: true,
            recurring: false
          }
        });
        count++;
      }
    }

    await prisma.syncLog.create({
      data: {
        source: config.id,
        status: 'success',
        message: `Synced ${count} holidays for ${year}`
      }
    });

    console.log(`[SYNC] ${config.name}: Added ${count} holidays for ${year}`);
    return count;
  } catch (error) {
    console.error(`[SYNC] ${config.name} error:`, error);
    
    await prisma.syncLog.create({
      data: {
        source: config.id,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return 0;
  }
}

/**
 * Sync holidays from Abstract API
 */
async function syncAbstractApi(config: HolidayApiConfig, year: number): Promise<number> {
  if (!config.apiKey) {
    console.log(`[SYNC] ${config.name}: No API key configured, skipping`);
    return 0;
  }

  try {
    console.log(`[SYNC] Fetching from ${config.name} for ${year}...`);

    const response = await axios.get(config.endpoint, {
      params: {
        api_key: config.apiKey,
        country: config.country,
        year: year
      }
    });

    console.log(`[SYNC] ${config.name} response status:`, response.status);
    
    const holidays = response.data || [];
    
    if (!Array.isArray(holidays)) {
      console.error(`[SYNC] ${config.name}: Expected array, got:`, typeof holidays);
      throw new Error('Invalid response format from API');
    }
    
    let count = 0;

    for (const holiday of holidays) {
      // Abstract API uses date format like "1/1/2020" or provides date_year, date_month, date_day
      let dateStr: string;
      
      if (holiday.date_year && holiday.date_month && holiday.date_day) {
        // Build YYYY-MM-DD from components
        const month = String(holiday.date_month).padStart(2, '0');
        const day = String(holiday.date_day).padStart(2, '0');
        dateStr = `${holiday.date_year}-${month}-${day}`;
      } else if (holiday.date) {
        // Parse M/D/YYYY format
        const parts = holiday.date.split('/');
        if (parts.length === 3) {
          const month = parts[0].padStart(2, '0');
          const day = parts[1].padStart(2, '0');
          const yr = parts[2];
          dateStr = `${yr}-${month}-${day}`;
        } else {
          // Maybe it's already YYYY-MM-DD
          dateStr = holiday.date;
        }
      } else {
        continue;
      }

      const existing = await prisma.holiday.findFirst({
        where: {
          title: holiday.name,
          date: dateStr,
          source: config.id
        }
      });

      if (!existing) {
        await prisma.holiday.create({
          data: {
            title: holiday.name,
            date: dateStr,
            category: config.category,
            color: config.color || CATEGORY_COLORS[config.category],
            source: config.id,
            visible: true,
            recurring: false
          }
        });
        count++;
      }
    }

    await prisma.syncLog.create({
      data: {
        source: config.id,
        status: 'success',
        message: `Synced ${count} holidays for ${year}`
      }
    });

    console.log(`[SYNC] ${config.name}: Added ${count} holidays for ${year}`);
    return count;
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number; data?: unknown } };
    console.error(`[SYNC] ${config.name} error:`, error);
    if (axiosError.response) {
      console.error(`[SYNC] Response status:`, axiosError.response.status);
      console.error(`[SYNC] Response data:`, axiosError.response.data);
    }
    
    await prisma.syncLog.create({
      data: {
        source: config.id,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return 0;
  }
}

/**
 * Sync holidays from a custom API
 */
async function syncCustomApi(config: HolidayApiConfig, year: number): Promise<number> {
  try {
    console.log(`[SYNC] Fetching from custom API ${config.name} for ${year}...`);

    // Build URL - replace placeholders
    let url = config.endpoint
      .replace('{year}', year.toString())
      .replace('{country}', config.country);

    const params: Record<string, string> = {};
    if (config.apiKey) {
      params.api_key = config.apiKey;
    }

    const response = await axios.get(url, { params });
    
    // Navigate to holidays array using responsePathToHolidays
    let holidays = response.data;
    if (config.responsePathToHolidays) {
      const paths = config.responsePathToHolidays.split('.');
      for (const p of paths) {
        holidays = holidays?.[p];
      }
    }

    if (!Array.isArray(holidays)) {
      console.log(`[SYNC] ${config.name}: Response is not an array of holidays`);
      return 0;
    }

    let count = 0;
    const dateField = config.dateField || 'date';
    const titleField = config.titleField || 'name';

    for (const holiday of holidays) {
      const dateStr = holiday[dateField];
      const title = holiday[titleField];
      
      if (!dateStr || !title) continue;

      const existing = await prisma.holiday.findFirst({
        where: {
          title: title,
          date: dateStr,
          source: config.id
        }
      });

      if (!existing) {
        await prisma.holiday.create({
          data: {
            title: title,
            date: dateStr,
            category: config.category,
            color: config.color || CATEGORY_COLORS[config.category],
            source: config.id,
            visible: true,
            recurring: false
          }
        });
        count++;
      }
    }

    await prisma.syncLog.create({
      data: {
        source: config.id,
        status: 'success',
        message: `Synced ${count} holidays for ${year}`
      }
    });

    console.log(`[SYNC] ${config.name}: Added ${count} holidays for ${year}`);
    return count;
  } catch (error) {
    console.error(`[SYNC] ${config.name} error:`, error);
    
    await prisma.syncLog.create({
      data: {
        source: config.id,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return 0;
  }
}

/**
 * Sync holidays from a single API config
 */
async function syncFromApi(config: HolidayApiConfig, year: number): Promise<number> {
  switch (config.type) {
    case 'nager':
      return syncNagerApi(config, year);
    case 'calendarific':
      return syncCalendarificApi(config, year);
    case 'abstract':
      return syncAbstractApi(config, year);
    case 'custom':
      return syncCustomApi(config, year);
    default:
      console.log(`[SYNC] Unknown API type: ${config.type}`);
      return 0;
  }
}

/**
 * Sync recurring holidays to new year
 */
async function syncRecurringHolidays(year: number): Promise<number> {
  try {
    console.log(`[SYNC] Syncing recurring holidays for ${year}...`);

    const recurringHolidays = await prisma.holiday.findMany({
      where: { recurring: true }
    });

    let count = 0;

    for (const holiday of recurringHolidays) {
      const [, month, day] = holiday.date.split('-');
      const newDate = `${year}-${month}-${day}`;

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
 * Main sync function - syncs all enabled holiday APIs
 */
export async function syncHolidays(year?: number): Promise<{
  total: number;
  recurring: number;
  details: Record<string, number>;
}> {
  const targetYear = year || new Date().getFullYear();
  
  console.log(`[SYNC] Starting holiday sync for ${targetYear}...`);

  // Get API configurations from database
  const configs = await getApiConfigs();
  const enabledConfigs = configs.filter(c => c.enabled);

  if (enabledConfigs.length === 0) {
    console.log('[SYNC] No APIs enabled, skipping sync');
    return { total: 0, recurring: 0, details: {} };
  }

  const details: Record<string, number> = {};
  let total = 0;

  // Sync from each enabled API for the target year only
  for (const config of enabledConfigs) {
    const count = await syncFromApi(config, targetYear);
    details[config.id] = count;
    total += count;
  }

  // Sync recurring holidays
  const recurring = await syncRecurringHolidays(targetYear);

  console.log(`[SYNC] Sync complete! Total: ${total}, Recurring: ${recurring}`);

  return {
    total,
    recurring,
    details
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
