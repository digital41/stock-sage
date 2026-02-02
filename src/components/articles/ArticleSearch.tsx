'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { debounce } from '@/lib/utils';

interface ArticleSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ArticleSearch({ value, onChange, placeholder = 'Rechercher un article...' }: ArticleSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce the onChange callback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChange = useCallback(
    debounce((val: string) => onChange(val), 300),
    [onChange]
  );

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative">
      <Input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        leftIcon={<Search className="w-5 h-5" />}
        rightIcon={
          localValue && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )
        }
        className="pr-10"
      />
    </div>
  );
}
