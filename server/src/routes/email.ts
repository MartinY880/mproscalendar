/**
 * Email Routes
 * Send calendar emails via SMTP (SendGrid)
 */

import { Router, Response } from 'express';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to get logo as base64 data URL (stored directly in DB)
async function getLogoDataUrl(): Promise<string | null> {
  try {
    const logoSetting = await prisma.settings.findUnique({
      where: { key: 'logoDataUrl' }
    });
    
    return logoSetting?.value || null;
  } catch {
    return null;
  }
}

// Helper to get category labels
async function getCategoryLabels(): Promise<{ federal: string; fun: string; company: string }> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'category_labels' }
    });
    
    const defaultLabels = { federal: 'Federal', fun: 'Fun', company: 'Company' };
    if (setting) {
      return { ...defaultLabels, ...JSON.parse(setting.value) };
    }
    return defaultLabels;
  } catch {
    return { federal: 'Federal', fun: 'Fun', company: 'Company' };
  }
}

// Email template interface
interface EmailTemplate {
  subject: string;
  headerText: string;
  footerText: string;
  includeCompanyLogo: boolean;
}

/**
 * POST /api/email/send
 * Send monthly calendar email
 */
router.post('/send', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      recipients, 
      month, 
      year, 
      template,
      holidays 
    }: { 
      recipients: string[]; 
      month: number; 
      year: number; 
      template: EmailTemplate;
      holidays: Array<{ title: string; date: string; category: string; color: string }>;
    } = req.body;

    if (!recipients || recipients.length === 0) {
      res.status(400).json({ error: 'At least one recipient is required' });
      return;
    }

    // Get SMTP settings
    const smtpSettings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_from_name']
        }
      }
    });

    const settings: Record<string, string> = {};
    smtpSettings.forEach(s => {
      settings[s.key] = s.value;
    });

    if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
      res.status(400).json({ error: 'SMTP settings not configured. Please configure in Settings.' });
      return;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: parseInt(settings.smtp_port || '587', 10),
      secure: settings.smtp_port === '465',
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass
      }
    });

    // Get logo as base64 data URL
    const logoDataUrl = template.includeCompanyLogo ? await getLogoDataUrl() : null;
    
    // Get category labels
    const categoryLabels = await getCategoryLabels();

    // Build email HTML
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[month];

    const holidayRows = holidays.map(h => {
      const date = new Date(h.date + 'T00:00:00');
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dayNum = date.getDate();
      const categoryLabel = categoryLabels[h.category as keyof typeof categoryLabels] || h.category;
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${h.color}; border-radius: 50%; margin-right: 8px;"></span>
            ${h.title}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #666;">
            ${dayName}, ${monthName} ${dayNum}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
            <span style="background-color: ${h.color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
              ${categoryLabel}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f4;">
  <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background-color: #06427F; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      ${logoDataUrl && logoDataUrl.length > 100 && logoDataUrl.startsWith('data:image') ? 
        `<img src="${logoDataUrl}" alt="Company Logo" style="max-height: 60px; margin-bottom: 12px;">` : 
        '<h1 style="color: white; margin: 0; font-size: 24px;">MortgagePros</h1>'
      }
      <h2 style="color: white; margin: 12px 0 0 0; font-size: 18px; font-weight: normal;">
        ${template.headerText || `${monthName} ${year} Holiday Calendar`}
      </h2>
    </div>

    <!-- Content -->
    <div style="background-color: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      ${holidays.length > 0 ? `
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; width: 50%;">Holiday</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; width: 30%;">Date</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; width: 20%;">Type</th>
            </tr>
          </thead>
          <tbody>
            ${holidayRows}
          </tbody>
        </table>
      ` : `
        <p style="text-align: center; color: #666; padding: 40px 0;">
          No holidays scheduled for ${monthName} ${year}
        </p>
      `}

      <!-- Footer -->
      ${template.footerText ? `
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px;">
          ${template.footerText}
        </div>
      ` : ''}
    </div>

    <!-- Email Footer -->
    <div style="text-align: center; padding: 16px; color: #999; font-size: 12px;">
      Sent from MortgagePros Holiday Calendar
    </div>
  </div>
</body>
</html>
    `;

    // Send emails
    const fromName = settings.smtp_from_name || 'MortgagePros Calendar';
    const fromEmail = settings.smtp_from || settings.smtp_user;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipients.join(', '),
      subject: template.subject || `${monthName} ${year} Holiday Calendar`,
      html: emailHtml
    });

    res.json({ 
      message: `Email sent successfully to ${recipients.length} recipient(s)`,
      recipients 
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * POST /api/email/test
 * Send test email to verify SMTP settings
 */
router.post('/test', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email address is required' });
      return;
    }

    // Get SMTP settings
    const smtpSettings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_from_name']
        }
      }
    });

    const settings: Record<string, string> = {};
    smtpSettings.forEach(s => {
      settings[s.key] = s.value;
    });

    if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
      res.status(400).json({ error: 'SMTP settings not configured' });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: parseInt(settings.smtp_port || '587', 10),
      secure: settings.smtp_port === '465',
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass
      }
    });

    const fromName = settings.smtp_from_name || 'MortgagePros Calendar';
    const fromEmail = settings.smtp_from || settings.smtp_user;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'MortgagePros Calendar - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #06427F; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="color: white; margin: 0;">Test Email</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
            <p>This is a test email from MortgagePros Holiday Calendar.</p>
            <p>If you received this, your SMTP settings are configured correctly!</p>
          </div>
        </div>
      `
    });

    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Failed to send test email: ${errorMessage}` });
  }
});

/**
 * GET /api/email/templates
 * Get saved email templates
 */
router.get('/templates', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templateSetting = await prisma.settings.findUnique({
      where: { key: 'email_templates' }
    });

    if (templateSetting) {
      res.json(JSON.parse(templateSetting.value));
    } else {
      // Return default templates
      res.json([
        {
          id: 'default',
          name: 'Default Template',
          subject: '{month} {year} Holiday Calendar',
          headerText: '{month} {year} Holiday Calendar',
          footerText: 'Please mark your calendars accordingly.',
          includeCompanyLogo: true
        }
      ]);
    }
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * POST /api/email/templates
 * Save email templates
 */
router.post('/templates', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { templates } = req.body;

    await prisma.settings.upsert({
      where: { key: 'email_templates' },
      update: { value: JSON.stringify(templates) },
      create: { key: 'email_templates', value: JSON.stringify(templates) }
    });

    res.json({ message: 'Templates saved successfully' });
  } catch (error) {
    console.error('Save templates error:', error);
    res.status(500).json({ error: 'Failed to save templates' });
  }
});

export { router as emailRoutes };
