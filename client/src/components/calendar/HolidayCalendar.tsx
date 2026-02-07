/**
 * Holiday Calendar Component
 * Main calendar view using FullCalendar
 */

import { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';

import { holidaysApi, settingsApi } from '../../services/api';
import type { Holiday, CalendarEvent, CategoryFilter } from '../../types';
import HolidayDetailModal from './HolidayDetailModal';
import CategoryFilterPanel from './CategoryFilterPanel';
import Skeleton from '../ui/Skeleton';

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  federal: '#06427F',  // Primary blue
  fun: '#7B7E77',      // Grey
  company: '#059669'   // Emerald green for company
};

export default function HolidayCalendar() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Category filters with custom labels
  const [filters, setFilters] = useState<CategoryFilter[]>([
    { value: 'federal', label: 'Federal Holidays', color: CATEGORY_COLORS.federal, checked: true },
    { value: 'fun', label: 'Fun/National Days', color: CATEGORY_COLORS.fun, checked: true },
    { value: 'company', label: 'Company Holidays', color: CATEGORY_COLORS.company, checked: true }
  ]);

  // Fetch holidays and category labels
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setIsLoading(true);
        const data = await holidaysApi.getAll();
        setHolidays(data);
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCategoryLabels = async () => {
      try {
        const labels = await settingsApi.getCategoryLabels();
        setFilters([
          { value: 'federal', label: labels.federal, color: CATEGORY_COLORS.federal, checked: true },
          { value: 'fun', label: labels.fun, color: CATEGORY_COLORS.fun, checked: true },
          { value: 'company', label: labels.company, color: CATEGORY_COLORS.company, checked: true }
        ]);
      } catch {
        // Use defaults if fetch fails
      }
    };

    fetchHolidays();
    fetchCategoryLabels();
  }, []);

  // Convert holidays to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    const activeCategories = filters
      .filter(f => f.checked)
      .map(f => f.value);

    return holidays
      .filter(h => activeCategories.includes(h.category))
      .map(holiday => {
        // Always use static category color, ignore custom colors
        const eventColor = CATEGORY_COLORS[holiday.category] || '#06427F';
        
        return {
          id: holiday.id.toString(),
          title: holiday.title,
          start: holiday.date,
          backgroundColor: eventColor,
          borderColor: eventColor,
          textColor: '#ffffff',
          extendedProps: {
            category: holiday.category,
            source: holiday.source,
            recurring: holiday.recurring,
            holidayId: holiday.id
          }
        };
      });
  }, [holidays, filters]);

  // Handle event click
  const handleEventClick = (info: EventClickArg) => {
    const holidayId = info.event.extendedProps.holidayId;
    const holiday = holidays.find(h => h.id === holidayId);
    
    if (holiday) {
      setSelectedHoliday(holiday);
      setIsModalOpen(true);
    }
  };

  // Toggle filter
  const handleFilterChange = (value: string) => {
    setFilters(prev => 
      prev.map(f => 
        f.value === value ? { ...f, checked: !f.checked } : f
      )
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 mb-4">
          <Skeleton width={120} height={32} />
          <Skeleton width={140} height={32} />
          <Skeleton width={130} height={32} />
        </div>
        <Skeleton height={600} className="rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Filters */}
      <CategoryFilterPanel 
        filters={filters} 
        onChange={handleFilterChange} 
      />

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            list: 'List'
          }}
        />
      </div>

      {/* Holiday Detail Modal */}
      <HolidayDetailModal
        holiday={selectedHoliday}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedHoliday(null);
        }}
      />
    </div>
  );
}
