import { NotebookPen } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'

export default function NotionOverviewPage() {
  return (
    <div className="p-6">
      <PageHeader title="노션 기록" description="노션에 기록하던 콘텐츠를 옮겨올 대시보드 영역입니다." />
      <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-24 text-muted-foreground">
        <NotebookPen className="size-10" />
        <p className="text-sm">준비 중 — 노션 데이터 구조가 정해지면 여기에 채워집니다.</p>
      </div>
    </div>
  )
}
