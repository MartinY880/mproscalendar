/**
 * TypeScript type definitions for the application
 */

// Holiday type from the API
export interface Holiday {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD format
  category: 'federal' | 'fun' | 'company';
  color: string;
  source: 'federal' | 'fun' | 'custom';
  visible: boolean;
  recurring: boolean;
  createdAt: string;
  updatedAt: string;
}

// Holiday form data for create/edit
export interface HolidayFormData {
  title: string;
  date: string;
  category: 'federal' | 'fun' | 'company';
  color: string;
  visible: boolean;
  recurring: boolean;
}

// Admin user
export interface Admin {
  id: number;
  username: string;
  createdAt?: string;
}

// Auth context type
export interface AuthContextType {
  user: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Login response
export interface LoginResponse {
  message: string;
  token: string;
  user: Admin;
}

// Sync result
export interface SyncResult {
  federal: number;
  fun: number;
  recurring: number;
}

// Sync log
export interface SyncLog {
  id: number;
  source: string;
  status: 'success' | 'error';
  message: string | null;
  syncedAt: string;
}

// Dashboard stats
export interface DashboardStats {
  total: number;
  federal: number;
  fun: number;
  company: number;
  hidden: number;
  year: string;
}

// Settings object
export interface Settings {
  logoUrl?: string;
  companyName?: string;
  [key: string]: string | undefined;
}

// Calendar event (for FullCalendar)
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    category: string;
    source: string;
    recurring: boolean;
    holidayId: number;
  };
}

// Category filter option
export interface CategoryFilter {
  value: string;
  label: string;
  color: string;
  checked: boolean;
}

// API Error response
export interface ApiError {
  error: string;
}
