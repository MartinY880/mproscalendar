/**
 * Admin Holidays Page
 * CRUD operations for holidays
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Toggle from '../../components/ui/Toggle';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { holidaysApi, settingsApi } from '../../services/api';
import type { Holiday, HolidayFormData } from '../../types';

// Default form data
const defaultFormData: HolidayFormData = {
  title: '',
  date: '',
  category: 'company',
  color: '#06427F',
  visible: true,
  recurring: false
};

// Category colors lookup
const CATEGORY_COLORS: Record<string, string> = {
  federal: '#06427F',
  fun: '#7B7E77',
  company: '#059669'
};

// Helper to get static color by category
const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#06427F';
};

export default function AdminHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState<HolidayFormData>(defaultFormData);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Category labels (customizable)
  const [categoryLabels, setCategoryLabels] = useState({ federal: 'Federal', fun: 'Fun', company: 'Company' });

  // Fetch holidays
  useEffect(() => {
    fetchHolidays();
    fetchCategoryLabels();
  }, []);

  const fetchHolidays = async () => {
    try {
      setIsLoading(true);
      const data = await holidaysApi.getAll({ includeHidden: true });
      setHolidays(data);
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      toast.error('Failed to load holidays');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryLabels = async () => {
    try {
      const labels = await settingsApi.getCategoryLabels();
      setCategoryLabels(labels);
    } catch {
      // Use defaults if fetch fails
    }
  };

  // Filter holidays
  const filteredHolidays = holidays.filter(h => {
    const matchesCategory = filterCategory === 'all' || h.category === filterCategory;
    const matchesSearch = h.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Open create modal
  const openCreateModal = () => {
    setEditingHoliday(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      title: holiday.title,
      date: holiday.date,
      category: holiday.category,
      color: holiday.color,
      visible: holiday.visible,
      recurring: holiday.recurring
    });
    setIsModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingHoliday) {
        await holidaysApi.update(editingHoliday.id, formData);
        toast.success('Holiday updated successfully');
      } else {
        await holidaysApi.create(formData);
        toast.success('Holiday created successfully');
      }
      
      setIsModalOpen(false);
      fetchHolidays();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save holiday');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (holiday: Holiday) => {
    if (!confirm(`Delete "${holiday.title}"?`)) return;

    try {
      await holidaysApi.delete(holiday.id);
      toast.success('Holiday deleted');
      fetchHolidays();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete holiday');
    }
  };

  // Toggle visibility
  const handleToggleVisibility = async (holiday: Holiday) => {
    try {
      await holidaysApi.toggleVisibility(holiday.id, !holiday.visible);
      toast.success(holiday.visible ? 'Holiday hidden' : 'Holiday visible');
      fetchHolidays();
    } catch (error) {
      console.error('Toggle failed:', error);
      toast.error('Failed to update visibility');
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton height={40} width={200} className="mb-8" />
        <Skeleton height={60} className="mb-6 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} height={80} className="rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Holidays</h1>
          <p className="mt-1 text-gray-600">
            {holidays.length} holidays total
          </p>
        </div>
        <Button onClick={openCreateModal} className="mt-4 sm:mt-0">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Holiday
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow min-w-0 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search holidays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-200"
            />
          </div>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="sm:w-48 flex-shrink-0"
          >
            <option value="all">All Categories</option>
            <option value="federal">{categoryLabels.federal}</option>
            <option value="fun">{categoryLabels.fun}</option>
            <option value="company">{categoryLabels.company}</option>
          </Select>
        </div>
      </Card>

      {/* Holidays Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Holiday
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Visible
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No holidays found
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(holiday.category) }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{holiday.title}</p>
                          {holiday.recurring && (
                            <span className="text-xs text-gray-500">Recurring yearly</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(holiday.date)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={getCategoryColor(holiday.category)}>
                        {categoryLabels[holiday.category as keyof typeof categoryLabels] || holiday.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {holiday.source}
                    </td>
                    <td className="px-6 py-4">
                      <Toggle
                        checked={holiday.visible}
                        onChange={() => handleToggleVisibility(holiday)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(holiday)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(holiday)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Holiday Title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Company Picnic Day"
            required
          />

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              category: e.target.value as 'federal' | 'fun' | 'company'
            }))}
          >
            <option value="federal">{categoryLabels.federal}</option>
            <option value="fun">{categoryLabels.fun}</option>
            <option value="company">{categoryLabels.company}</option>
          </Select>

          <div className="flex items-center gap-6">
            <Toggle
              checked={formData.visible}
              onChange={(checked) => setFormData(prev => ({ ...prev, visible: checked }))}
              label="Visible to employees"
            />
            <Toggle
              checked={formData.recurring}
              onChange={(checked) => setFormData(prev => ({ ...prev, recurring: checked }))}
              label="Recurring yearly"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingHoliday ? 'Update' : 'Create'} Holiday
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
