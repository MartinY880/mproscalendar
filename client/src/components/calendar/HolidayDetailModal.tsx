/**
 * Holiday Detail Modal Component
 * Shows holiday details when clicking on an event
 */

import type { Holiday } from '../../types';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';

interface HolidayDetailModalProps {
  holiday: Holiday | null;
  isOpen: boolean;
  onClose: () => void;
}

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  federal: 'Federal Holiday',
  fun: 'Fun/National Day',
  company: 'Company Holiday'
};

// Source labels
const SOURCE_LABELS: Record<string, string> = {
  federal: 'Nager.Date API',
  fun: 'Calendarific API',
  custom: 'Custom'
};

export default function HolidayDetailModal({ holiday, isOpen, onClose }: HolidayDetailModalProps) {
  if (!holiday) return null;

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Holiday Details">
      <div className="space-y-4">
        {/* Title with color indicator */}
        <div className="flex items-start gap-3">
          <div
            className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
            style={{ backgroundColor: holiday.color }}
          />
          <h3 className="text-xl font-semibold text-gray-900">
            {holiday.title}
          </h3>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(holiday.date)}</span>
        </div>

        {/* Category & Source */}
        <div className="flex flex-wrap gap-2">
          <Badge color={holiday.color}>
            {CATEGORY_LABELS[holiday.category] || holiday.category}
          </Badge>
          
          {holiday.recurring && (
            <Badge color="#059669">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recurring
            </Badge>
          )}
        </div>


      </div>
    </Modal>
  );
}
