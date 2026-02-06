/**
 * Calendar Page
 * Employee view of the holiday calendar
 */

import HolidayCalendar from '../components/calendar/HolidayCalendar';

export default function CalendarPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Holiday Calendar
        </h1>
        <p className="mt-2 text-gray-600">
          View all upcoming holidays, fun national days, and company events.
        </p>
      </div>

      {/* Calendar Component */}
      <HolidayCalendar />
    </div>
  );
}
