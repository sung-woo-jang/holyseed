import { useState, useEffect } from 'react';
import { Input } from '@/shared/ui';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';

interface ProductModel {
  id: string;
  modelName: string;
  price: number;
}

interface ProductModelSelectProps {
  onSelect: (model: ProductModel) => void;
}

export function ProductModelSelect({ onSelect }: ProductModelSelectProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ProductModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(ZC_API.PRODUCT_MODELS.SEARCH, {
          params: { query: search, limit: 10 },
        });
        setResults(response.data.items || []);
        setShowResults(true);
      } catch (error) {
        console.error('제품 모델 검색 실패:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = (model: ProductModel) => {
    onSelect(model);
    setSearch('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="제품 모델명으로 검색 (최소 2글자)"
        onFocus={() => results.length > 0 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />

      {isLoading && (
        <div className="absolute mt-1 w-full p-2 bg-white border rounded-md shadow-lg text-sm text-muted-foreground">
          검색중...
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto z-10">
          {results.map((model) => (
            <button
              key={model.id}
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
              onClick={() => handleSelect(model)}
            >
              <div className="font-medium">{model.modelName}</div>
              <div className="text-xs text-muted-foreground">
                {model.price.toLocaleString()}원
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && search.length >= 2 && !isLoading && (
        <div className="absolute mt-1 w-full p-2 bg-white border rounded-md shadow-lg text-sm text-muted-foreground">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
