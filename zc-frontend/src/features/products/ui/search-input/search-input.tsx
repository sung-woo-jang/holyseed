import { Input } from '@/shared/ui';
import { type InputHTMLAttributes } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch: (value: string) => void;
}

export function SearchInput({ onSearch, ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <Input
        type="search"
        placeholder="제품명 검색..."
        onChange={(e) => onSearch(e.target.value)}
        {...props}
      />
    </div>
  );
}
