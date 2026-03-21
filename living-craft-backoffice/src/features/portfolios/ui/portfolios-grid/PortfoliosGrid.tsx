import { useState } from 'react'
import type { PortfolioAdmin } from '@/shared/types/api'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Search } from 'lucide-react'
import { PortfolioCard } from '../portfolio-card'

interface PortfoliosGridProps {
  data: PortfolioAdmin[]
}

export function PortfoliosGrid({ data }: PortfoliosGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 필터링 로직
  const filteredData = data.filter((portfolio) => {
    // 검색어 필터
    const matchesSearch =
      portfolio.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (portfolio.client?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      ) ||
      portfolio.description.toLowerCase().includes(searchQuery.toLowerCase())

    // 카테고리 필터
    const matchesCategory =
      categoryFilter === 'all' || portfolio.category === categoryFilter

    // 상태 필터
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && portfolio.isActive) ||
      (statusFilter === 'inactive' && !portfolio.isActive)

    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className='space-y-4'>
      {/* 필터 영역 */}
      <div className='flex flex-col gap-4 md:flex-row'>
        {/* 검색 */}
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            placeholder='프로젝트명, 고객명, 설명으로 검색...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* 카테고리 필터 */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className='w-full md:w-48'>
            <SelectValue placeholder='카테고리' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>전체 카테고리</SelectItem>
            <SelectItem value='인테리어 필름'>인테리어 필름</SelectItem>
            <SelectItem value='유리 청소'>유리 청소</SelectItem>
            <SelectItem value='외부 유리'>외부 유리</SelectItem>
            <SelectItem value='내부 유리'>내부 유리</SelectItem>
            <SelectItem value='기타'>기타</SelectItem>
          </SelectContent>
        </Select>

        {/* 상태 필터 */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-full md:w-32'>
            <SelectValue placeholder='상태' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>전체</SelectItem>
            <SelectItem value='active'>활성</SelectItem>
            <SelectItem value='inactive'>비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 결과 카운트 */}
      <div className='text-muted-foreground text-sm'>
        총 {filteredData.length}개의 포트폴리오
      </div>

      {/* 그리드 */}
      {filteredData.length === 0 ? (
        <div className='flex h-96 items-center justify-center rounded-md border border-dashed'>
          <p className='text-muted-foreground text-sm'>결과가 없습니다.</p>
        </div>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {filteredData.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </div>
      )}
    </div>
  )
}
