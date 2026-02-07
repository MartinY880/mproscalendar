/**
 * Holiday API Configuration Routes
 * Manage custom holiday API configurations
 */

import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// API configuration interface
export interface HolidayApiConfig {
  id: string;
  name: string;
  enabled: boolean;
  type: 'nager' | 'calendarific' | 'abstract' | 'custom';
  baseUrl: string;
  apiKey?: string;
  country: string;
  category: 'federal' | 'fun' | 'company';
  // For custom APIs, define field mappings
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
    baseUrl: 'https://date.nager.at/api/v3/PublicHolidays',
    country: 'US',
    category: 'federal'
  },
  {
    id: 'calendarific-us',
    name: 'Calendarific (Fun)',
    enabled: false,
    type: 'calendarific',
    baseUrl: 'https://calendarific.com/api/v2/holidays',
    apiKey: '',
    country: 'US',
    category: 'fun'
  }
];

/**
 * GET /api/holiday-apis
 * Get all configured holiday APIs
 */
router.get('/', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const configSetting = await prisma.settings.findUnique({
      where: { key: 'holiday_api_configs' }
    });

    if (configSetting) {
      const configs = JSON.parse(configSetting.value) as HolidayApiConfig[];
      res.json(configs);
    } else {
      // Return default configs
      res.json(DEFAULT_CONFIGS);
    }
  } catch (error) {
    console.error('Get API configs error:', error);
    res.status(500).json({ error: 'Failed to fetch API configurations' });
  }
});

/**
 * POST /api/holiday-apis
 * Save all API configurations
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const configs: HolidayApiConfig[] = req.body.configs;

    if (!Array.isArray(configs)) {
      res.status(400).json({ error: 'configs must be an array' });
      return;
    }

    await prisma.settings.upsert({
      where: { key: 'holiday_api_configs' },
      update: { value: JSON.stringify(configs) },
      create: { key: 'holiday_api_configs', value: JSON.stringify(configs) }
    });

    res.json({ message: 'API configurations saved', configs });
  } catch (error) {
    console.error('Save API configs error:', error);
    res.status(500).json({ error: 'Failed to save API configurations' });
  }
});

/**
 * POST /api/holiday-apis/add
 * Add a new API configuration
 */
router.post('/add', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const newConfig: HolidayApiConfig = req.body;

    // Validate required fields
    if (!newConfig.id || !newConfig.name || !newConfig.type || !newConfig.baseUrl) {
      res.status(400).json({ error: 'Missing required fields: id, name, type, baseUrl' });
      return;
    }

    // Get existing configs
    const configSetting = await prisma.settings.findUnique({
      where: { key: 'holiday_api_configs' }
    });

    let configs: HolidayApiConfig[] = configSetting 
      ? JSON.parse(configSetting.value) 
      : [...DEFAULT_CONFIGS];

    // Check for duplicate ID
    if (configs.some(c => c.id === newConfig.id)) {
      res.status(400).json({ error: 'API configuration with this ID already exists' });
      return;
    }

    configs.push(newConfig);

    await prisma.settings.upsert({
      where: { key: 'holiday_api_configs' },
      update: { value: JSON.stringify(configs) },
      create: { key: 'holiday_api_configs', value: JSON.stringify(configs) }
    });

    res.json({ message: 'API configuration added', config: newConfig });
  } catch (error) {
    console.error('Add API config error:', error);
    res.status(500).json({ error: 'Failed to add API configuration' });
  }
});

/**
 * PUT /api/holiday-apis/:id
 * Update an API configuration
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: Partial<HolidayApiConfig> = req.body;

    // Get existing configs
    const configSetting = await prisma.settings.findUnique({
      where: { key: 'holiday_api_configs' }
    });

    let configs: HolidayApiConfig[] = configSetting 
      ? JSON.parse(configSetting.value) 
      : [...DEFAULT_CONFIGS];

    const index = configs.findIndex(c => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'API configuration not found' });
      return;
    }

    configs[index] = { ...configs[index], ...updates };

    await prisma.settings.upsert({
      where: { key: 'holiday_api_configs' },
      update: { value: JSON.stringify(configs) },
      create: { key: 'holiday_api_configs', value: JSON.stringify(configs) }
    });

    res.json({ message: 'API configuration updated', config: configs[index] });
  } catch (error) {
    console.error('Update API config error:', error);
    res.status(500).json({ error: 'Failed to update API configuration' });
  }
});

/**
 * DELETE /api/holiday-apis/:id
 * Delete an API configuration
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get existing configs
    const configSetting = await prisma.settings.findUnique({
      where: { key: 'holiday_api_configs' }
    });

    let configs: HolidayApiConfig[] = configSetting 
      ? JSON.parse(configSetting.value) 
      : [...DEFAULT_CONFIGS];

    const index = configs.findIndex(c => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'API configuration not found' });
      return;
    }

    configs.splice(index, 1);

    await prisma.settings.upsert({
      where: { key: 'holiday_api_configs' },
      update: { value: JSON.stringify(configs) },
      create: { key: 'holiday_api_configs', value: JSON.stringify(configs) }
    });

    res.json({ message: 'API configuration deleted' });
  } catch (error) {
    console.error('Delete API config error:', error);
    res.status(500).json({ error: 'Failed to delete API configuration' });
  }
});

export { router as apiConfigRoutes };
