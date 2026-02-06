/**
 * Category Filter Panel Component
 */

import type { CategoryFilter } from '../../types';

interface CategoryFilterPanelProps {
  filters: CategoryFilter[];
  onChange: (value: string) => void;
}

export default function CategoryFilterPanel({ filters, onChange }: CategoryFilterPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-600">Filter by:</span>
        
        {filters.map((filter) => (
          <label
            key={filter.value}
            className="inline-flex items-center cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={filter.checked}
              onChange={() => onChange(filter.value)}
              className="sr-only"
            />
            <span
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-200 border-2
                ${filter.checked 
                  ? 'text-white' 
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }
              `}
              style={{
                backgroundColor: filter.checked ? filter.color : undefined,
                borderColor: filter.checked ? filter.color : undefined
              }}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${filter.checked ? 'bg-white' : ''}`}
                style={{ backgroundColor: filter.checked ? undefined : filter.color }}
              />
              {filter.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
