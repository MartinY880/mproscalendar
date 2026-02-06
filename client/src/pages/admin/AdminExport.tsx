/**
 * Admin Export Page
 * PDF export and email sending for monthly calendar
 */

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Toggle from '../../components/ui/Toggle';
import { holidaysApi, emailApi, settingsApi } from '../../services/api';
import type { Holiday, EmailTemplate } from '../../types';

// Month names
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  federal: '#06427F',
  fun: '#7B7E77',
  company: '#059669'
};

// Generate year options (current year -1 to +2)
const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

export default function AdminExport() {
  // Selection state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Holidays for selected month
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [_isLoading, setIsLoading] = useState(false);
  
  // PDF export state
  const [isExporting, setIsExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Email state
  const [recipients, setRecipients] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<Omit<EmailTemplate, 'id' | 'name'>>({
    subject: '',
    headerText: '',
    footerText: 'Please mark your calendars accordingly.',
    includeCompanyLogo: true
  });
  
  // Logo URL
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Load holidays when month/year changes
  useEffect(() => {
    loadHolidays();
    loadLogo();
  }, [selectedMonth, selectedYear]);

  // Update template placeholders
  useEffect(() => {
    const monthName = MONTHS[selectedMonth];
    setEmailTemplate(prev => ({
      ...prev,
      subject: `${monthName} ${selectedYear} Holiday Calendar`,
      headerText: `${monthName} ${selectedYear} Holidays`
    }));
  }, [selectedMonth, selectedYear]);

  const loadHolidays = async () => {
    setIsLoading(true);
    try {
      const allHolidays = await holidaysApi.getAll({ 
        year: selectedYear.toString(),
        includeHidden: false 
      });
      
      // Filter to selected month
      const monthHolidays = allHolidays.filter(h => {
        const date = new Date(h.date + 'T00:00:00');
        return date.getMonth() === selectedMonth;
      });
      
      setHolidays(monthHolidays.sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error('Failed to load holidays:', error);
      toast.error('Failed to load holidays');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogo = async () => {
    try {
      const { logoUrl } = await settingsApi.getLogo();
      setLogoUrl(logoUrl);
    } catch {
      // Ignore logo loading errors
    }
  };

  // Generate calendar grid for the month
  const generateCalendarDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // Get holidays for a specific day
  const getHolidaysForDay = (day: number): Holiday[] => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.filter(h => h.date === dateStr);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!calendarRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${MONTHS[selectedMonth]}-${selectedYear}-Calendar.pdf`);
      
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Send email
  const handleSendEmail = async () => {
    const emailList = recipients
      .split(/[,;\n]/)
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes('@'));
    
    if (emailList.length === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }
    
    setIsSending(true);
    try {
      await emailApi.sendCalendar({
        recipients: emailList,
        month: selectedMonth,
        year: selectedYear,
        template: emailTemplate,
        holidays: holidays.map(h => ({
          title: h.title,
          date: h.date,
          category: h.category,
          color: h.color
        }))
      });
      
      toast.success(`Email sent to ${emailList.length} recipient(s)!`);
      setRecipients('');
    } catch (error) {
      console.error('Email failed:', error);
      toast.error('Failed to send email. Check SMTP settings.');
    } finally {
      setIsSending(false);
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Export & Share</h1>
        <p className="mt-1 text-gray-600">
          Export calendar to PDF or send via email
        </p>
      </div>

      {/* Month/Year Selector */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <Select
              label="Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </Select>
          </div>
          <div className="flex-1 min-w-[100px]">
            <Select
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            >
              {YEARS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </div>
          <Button
            onClick={handleExportPDF}
            isLoading={isExporting}
            className="whitespace-nowrap"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Preview */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-primary text-white">
            <h2 className="font-semibold">Calendar Preview</h2>
          </div>
          <div className="p-4">
            <div ref={calendarRef} className="bg-white p-4">
              {/* Header */}
              <div className="text-center mb-4">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="h-10 mx-auto mb-2" />
                )}
                <h3 className="text-xl font-bold text-primary">
                  {MONTHS[selectedMonth]} {selectedYear}
                </h3>
                <p className="text-sm text-gray-500">Holiday Calendar</p>
              </div>
              
              {/* Calendar Grid */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-gray-50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600 border-b border-gray-200">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const dayHolidays = day ? getHolidaysForDay(day) : [];
                    const isToday = day === new Date().getDate() && 
                      selectedMonth === new Date().getMonth() && 
                      selectedYear === new Date().getFullYear();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[60px] p-1 border-b border-r border-gray-100 ${
                          day ? 'bg-white' : 'bg-gray-50'
                        } ${isToday ? 'bg-primary/5' : ''}`}
                      >
                        {day && (
                          <>
                            <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-gray-600'}`}>
                              {day}
                            </span>
                            <div className="mt-1 space-y-0.5">
                              {dayHolidays.slice(0, 2).map(h => (
                                <div
                                  key={h.id}
                                  className="text-[8px] px-1 py-0.5 rounded truncate text-white"
                                  style={{ backgroundColor: h.color || CATEGORY_COLORS[h.category] }}
                                  title={h.title}
                                >
                                  {h.title}
                                </div>
                              ))}
                              {dayHolidays.length > 2 && (
                                <div className="text-[8px] text-gray-500">
                                  +{dayHolidays.length - 2} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                <div className="flex items-center text-xs">
                  <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: CATEGORY_COLORS.federal }}></span>
                  Federal
                </div>
                <div className="flex items-center text-xs">
                  <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: CATEGORY_COLORS.fun }}></span>
                  Fun/National
                </div>
                <div className="flex items-center text-xs">
                  <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: CATEGORY_COLORS.company }}></span>
                  Company
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Email Section */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send via Email</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipients
              </label>
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="Enter email addresses (comma or newline separated)"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                rows={3}
              />
            </div>

            <Input
              label="Email Subject"
              value={emailTemplate.subject}
              onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
            />

            <Input
              label="Header Text"
              value={emailTemplate.headerText}
              onChange={(e) => setEmailTemplate(prev => ({ ...prev, headerText: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Footer Message
              </label>
              <textarea
                value={emailTemplate.footerText}
                onChange={(e) => setEmailTemplate(prev => ({ ...prev, footerText: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                rows={2}
              />
            </div>

            <Toggle
              checked={emailTemplate.includeCompanyLogo}
              onChange={(checked) => setEmailTemplate(prev => ({ ...prev, includeCompanyLogo: checked }))}
              label="Include company logo in email"
            />

            {/* Holiday Summary */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>{holidays.length}</strong> holidays will be included in this email
              </p>
              {holidays.length > 0 && (
                <ul className="mt-2 text-xs text-gray-500 max-h-24 overflow-y-auto">
                  {holidays.map(h => (
                    <li key={h.id} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }}></span>
                      {h.title} - {new Date(h.date + 'T00:00:00').toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              onClick={handleSendEmail}
              isLoading={isSending}
              className="w-full"
              disabled={!recipients.trim()}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Email
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Make sure SMTP settings are configured in Settings
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
