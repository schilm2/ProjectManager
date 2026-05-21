import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = 'Auswählen...' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  }

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  return (
    <div className="multi-select" ref={ref}>
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
      </button>
      {isOpen && (
        <ul className="multi-select-dropdown">
          {options.map((opt) => (
            <li key={opt.value}>
              <label className="multi-select-option">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            </li>
          ))}
          {options.length === 0 && (
            <li className="multi-select-empty">Keine Optionen</li>
          )}
        </ul>
      )}
    </div>
  );
}
