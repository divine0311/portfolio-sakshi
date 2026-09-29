import {useEffect, useRef, useState, type ReactNode} from 'react';
import {Plus, X} from 'lucide-react';
import type {SaveResult} from '../lib/content';

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({label, hint, children}: FieldProps) {
  return (
    <label className="studio-field-row">
      <span className="studio-field-row__label">
        {label}
        {hint ? <span className="studio-field-row__hint">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

export function StudioInput({value, onChange, placeholder, type = 'text'}: InputProps) {
  return (
    <input
      className="studio-input"
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function StudioTextarea({value, onChange, rows = 5, placeholder}: TextareaProps) {
  return (
    <textarea
      className="studio-textarea"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface RepeatListProps {
  label: string;
  hint?: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}

export function RepeatList({
  label,
  hint,
  items,
  onChange,
  placeholder,
  addLabel = 'Add row',
}: RepeatListProps) {
  const update = (index: number, value: string) => {
    onChange(items.map((item, i) => (i === index ? value : item)));
  };
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };
  const add = () => {
    onChange([...items, '']);
  };

  return (
    <div className="studio-repeat">
      <div className="studio-repeat__head">
        <span className="studio-field-row__label">
          {label}
          {hint ? <span className="studio-field-row__hint">{hint}</span> : null}
        </span>
      </div>
      <div className="studio-repeat__rows">
        {items.map((item, index) => (
          <div className="studio-repeat__row" key={index}>
            <input
              className="studio-input"
              value={item}
              placeholder={placeholder}
              onChange={(event) => update(index, event.target.value)}
            />
            <button
              type="button"
              className="studio-icon-btn"
              aria-label={`Remove row ${index + 1}`}
              onClick={() => remove(index)}
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="studio-ghost-btn" onClick={add}>
        <Plus size={16} strokeWidth={2} aria-hidden="true" />
        <span>{addLabel}</span>
      </button>
    </div>
  );
}

interface SaveBarProps {
  onSave: () => Promise<SaveResult>;
  label?: string;
  busyLabel?: string;
  disabled?: boolean;
}

export function SaveBar({onSave, label = 'Save changes', busyLabel = 'Saving…', disabled}: SaveBarProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = async () => {
    setStatus('saving');
    setMessage('');
    const result = await onSave();
    if (result.ok) {
      setStatus('saved');
      setMessage('Saved!');
      timer.current = window.setTimeout(() => setStatus('idle'), 2400);
    } else {
      setStatus('error');
      setMessage(result.error);
    }
  };

  return (
    <div className="studio-savebar">
      <button type="button" className="studio-btn" onClick={handleClick} disabled={disabled || status === 'saving'}>
        <span>{status === 'saving' ? busyLabel : label}</span>
      </button>
      {status === 'saved' ? (
        <span className="studio-saved" role="status">
          {message}
        </span>
      ) : null}
      {status === 'error' ? (
        <span className="studio-error" role="alert">
          {message}
        </span>
      ) : null}
    </div>
  );
}
