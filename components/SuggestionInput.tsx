
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { AppFontSize } from '../types';

interface SuggestionInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  fontSize?: AppFontSize;
}

export const SuggestionInput: React.FC<SuggestionInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  required = false,
  className,
  fontSize = 'medium'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (val.trim()) {
      const matches = suggestions.filter(s => 
        s.toLowerCase().includes(val.toLowerCase()) && s.toLowerCase() !== val.toLowerCase()
      );
      setFiltered(matches);
      setIsOpen(matches.length > 0);
    } else {
      setFiltered(suggestions);
      setIsOpen(suggestions.length > 0);
    }
  };

  const handleFocus = () => {
    const matches = value.trim() 
      ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
      : suggestions;
    setFiltered(matches);
    if (matches.length > 0) setIsOpen(true);
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return 'text-xs';
      case 'large': return 'text-base';
      case 'medium': default: return 'text-sm';
    }
  };

  // Add explicit cast to AppFontSize to avoid "string is not assignable to AppFontSize" error
  const fsClass = getFontSizeClasses(fontSize as AppFontSize);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className={className}
        />
        {suggestions.length > 0 && (
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors"
          >
            <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-[120] mt-1 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="max-h-60 overflow-y-auto no-scrollbar">
            {filtered.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-[var(--theme-bg-soft)] dark:hover:bg-rose-900/20 transition-colors border-b border-stone-50 dark:border-stone-700 last:border-0 ${fsClass} text-stone-700 dark:text-stone-300`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};