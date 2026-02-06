/**
 * Toggle Switch Component
 */

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className={`inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            w-11 h-6 rounded-full transition-colors duration-200
            ${checked ? 'bg-primary' : 'bg-gray-300'}
          `}
        />
        <div
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
            transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
      {label && (
        <span className="ml-3 text-sm text-gray-700">{label}</span>
      )}
    </label>
  );
}
