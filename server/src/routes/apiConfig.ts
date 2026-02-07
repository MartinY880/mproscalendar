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
  endpoint: string;
  apiKey?: string;
  country: string;
  color: string;
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
 * Add a new API configuration
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const newConfig = req.body as Omit<HolidayApiConfig, 'id'> & { id?: string };

    // Validate required fields
    if (!newConfig.name || !newConfig.type || !newConfig.endpoint) {
      res.status(400).json({ error: 'Missing required fields: name, type, endpoint' });
      return;
    }

    // Generate ID if not provided
    const configId = newConfig.id || `${newConfig.type}-${Date.now()}`;

    const fullConfig: HolidayApiConfig = {
      id: configId,
      name: newConfig.name,
      type: newConfig.type,
      endpoint: newConfig.endpoint,
      apiKey: newConfig.apiKey || '',
      country: newConfig.country || 'US',
      color: newConfig.color || '#3B82F6',
      category: newConfig.category || 'federal',
      enabled: newConfig.enabled !== false
    };

    // Get existing configs
    const configSetting = await prisma.settings.findUnique({
      where: { key: 'holiday_api_configs' }
    });

    let configs: HolidayApiConfig[] = configSetting 
      ? JSON.parse(configSetting.value) 
      : [...DEFAULT_CONFIGS];

    // Check for duplicate ID
    if (configs.some(c => c.id === configId)) {
      res.status(400).json({ error: 'API configuration with this ID already exists' });
      return;
    }

    configs.push(fullConfig);

    await prisma.settings.upsert({
      where: { key: 'holiday_api_configs' },
      update: { value: JSON.stringify(configs) },
      create: { key: 'holiday_api_configs', value: JSON.stringify(configs) }
    });

    res.json(fullConfig);
  } catch (error) {
    console.error('Add API config error:', error);
    res.status(500).json({ error: 'Failed to add API configuration' });
  }
});

// Removed duplicate /add endpoint - now handled by POST /

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

    res.json(configs[index]);
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
