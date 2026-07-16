import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Image, FileText } from 'lucide-react'
import { toast } from 'sonner'
import {
  exportToPng,
  exportToPdf,
  generateFilename,
} from '../../lib/export-utils'
import type { CuttingCanvasRef } from '../cutting-canvas'
import styles from './styles.module.scss'

interface ExportButtonsProps {
  /** CuttingCanvas ref */
  canvasRef: React.RefObject<CuttingCanvasRef | null>
  /** 프로젝트 이름 (파일명용) */
  projectName?: string
  /** 필름 이름 */
  filmName?: string
  /** 손실율 */
  wastePercentage?: number
  /** 사용 길이 */
  usedLength?: number
  /** 비활성화 상태 */
  disabled?: boolean
}

/**
 * PNG/PDF 내보내기 버튼 컴포넌트
 */
export function ExportButtons({
  canvasRef,
  projectName,
  filmName,
  wastePercentage,
  usedLength,
  disabled = false,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<'png' | 'pdf' | null>(null)

  const handleExportPng = async () => {
    const container = canvasRef.current?.getContainerElement()
    if (!container) {
      toast.error('캔버스를 찾을 수 없습니다.')
      return
    }

    setIsExporting('png')
    try {
      const filename = generateFilename(projectName || 'cutting')
      await exportToPng(container, filename)
      toast.success('PNG 파일이 저장되었습니다.')
    } catch {
      toast.error('PNG 내보내기에 실패했습니다.')
    } finally {
      setIsExporting(null)
    }
  }

  const handleExportPdf = async () => {
    const svgElement = canvasRef.current?.getSvgElement()
    if (!svgElement) {
      toast.error('SVG 요소를 찾을 수 없습니다.')
      return
    }

    setIsExporting('pdf')
    try {
      const filename = generateFilename(projectName || 'cutting')
      await exportToPdf(svgElement, filename, {
        title: projectName || '재단 배치도',
        filmName,
        wastePercentage,
        usedLength,
      })
      toast.success('PDF 파일이 저장되었습니다.')
    } catch {
      toast.error('PDF 내보내기에 실패했습니다.')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className={styles.container}>
      <Button
        variant='outline'
        size='sm'
        onClick={handleExportPng}
        disabled={disabled || isExporting !== null}
      >
        <Image className='h-4 w-4' />
        {isExporting === 'png' ? '저장 중...' : 'PNG'}
      </Button>
      <Button
        variant='outline'
        size='sm'
        onClick={handleExportPdf}
        disabled={disabled || isExporting !== null}
      >
        <FileText className='h-4 w-4' />
        {isExporting === 'pdf' ? '저장 중...' : 'PDF'}
      </Button>
    </div>
  )
}
