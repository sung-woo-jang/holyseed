import { useState, useEffect } from 'react';
import { Input } from '@/shared/ui';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';

interface SelectedModel {
  id: string;
  modelName: string;
  displayName: string;
  materialPrice: number;
  laborCost: number;
  derivedUnitPrice: number;
}

interface ProductModelSelectProps {
  onSelect: (model: SelectedModel) => void;
}

interface SearchResult {
  id: string;
  modelName: string;
  displayName: string;
  materialPrice: number | null;
  laborCost: number | null;
  derivedUnitPrice: number | null;
  brand?: { name: string } | null;
}

export function ProductModelSelect({ onSelect }: ProductModelSelectProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
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
        const response = await axiosInstance.post(ZC_API.PRODUCT_MODELS.SEARCH, {
          search,
          limit: 10,
        });
        setResults(response.data?.data || []);
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

  const handleSelect = (model: SearchResult) => {
    onSelect({
      id: model.id,
      modelName: model.modelName,
      displayName: model.displayName,
      materialPrice: model.materialPrice ?? 0,
      laborCost: model.laborCost ?? 0,
      derivedUnitPrice: model.derivedUnitPrice ?? 0,
    });
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
        <div className="absolute mt-1 w-full p-2 bg-white border rounded-md shadow-lg text-sm text-muted-foreground z-10">
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
              <div className="font-medium">{model.displayName || model.modelName}</div>
              <div className="text-xs text-muted-foreground">
                {model.brand?.name && <span className="mr-2">{model.brand.name}</span>}
                견적단가 {(model.derivedUnitPrice ?? 0).toLocaleString()}원
                {(model.laborCost ?? 0) > 0 && (
                  <span className="ml-1">(시공비 {(model.laborCost ?? 0).toLocaleString()}원 포함)</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && search.length >= 2 && !isLoading && (
        <div className="absolute mt-1 w-full p-2 bg-white border rounded-md shadow-lg text-sm text-muted-foreground z-10">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
