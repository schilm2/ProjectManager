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
  onCreateOption?: (label: string) => void;
  createOptionLabel?: string;
  hideTriggerLabels?: boolean;
}

export function MultiSelect({ options, selected, onChange, placeholder = 'Auswählen...', onCreateOption, createOptionLabel = '+ Neu erstellen', hideTriggerLabels = false }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
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

  function handleCreateSubmit() {
    const trimmed = newLabel.trim();
    if (trimmed && onCreateOption) {
      onCreateOption(trimmed);
      setNewLabel('');
      setIsCreating(false);
    }
  }

  function handleCreateKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateSubmit();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewLabel('');
    }
  }

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  return (
    <div className="multi-select" ref={ref} style={isOpen ? { zIndex: 10 } : undefined}>
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {!hideTriggerLabels && selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
        </span>
        {selectedLabels.length > 0 && (
          <span className="count-badge">{selectedLabels.length}</span>
        )}
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
          {options.length === 0 && !onCreateOption && (
            <li className="multi-select-empty">Keine Optionen</li>
          )}
          {onCreateOption && (
            <li className="multi-select-create">
              {isCreating ? (
                <div className="multi-select-create-input">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={handleCreateKeyDown}
                    placeholder="Name eingeben..."
                    autoFocus
                  />
                  <button type="button" onClick={handleCreateSubmit} disabled={!newLabel.trim()}>
                    ✓
                  </button>
                  <button type="button" onClick={() => { setIsCreating(false); setNewLabel(''); }}>
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="multi-select-create-btn"
                  onClick={() => setIsCreating(true)}
                >
                  {createOptionLabel}
                </button>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
