import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import 'svg2pdf.js'

/**
 * SVG 요소의 모든 자식에 computed styles를 inline으로 적용
 */
function inlineStyles(element: Element, clone: Element): void {
  const computedStyle = window.getComputedStyle(element)

  if (clone instanceof SVGElement || clone instanceof HTMLElement) {
    // 주요 스타일 속성만 복사 (text 관련)
    const stylesToCopy = [
      'fill',
      'stroke',
      'stroke-width',
      'font-size',
      'font-weight',
      'font-family',
      'text-anchor',
      'dominant-baseline',
      'opacity',
    ]

    stylesToCopy.forEach((prop) => {
      const value = computedStyle.getPropertyValue(prop)
      if (value) {
        ;(clone as SVGElement | HTMLElement).style.setProperty(prop, value)
      }
    })
  }

  // 자식 요소들에 재귀적으로 적용
  const children = element.children
  const cloneChildren = clone.children
  for (let i = 0; i < children.length; i++) {
    if (cloneChildren[i]) {
      inlineStyles(children[i], cloneChildren[i])
    }
  }
}

/**
 * SVG 요소를 PNG로 내보내기
 * @param element SVG가 포함된 DOM 요소
 * @param filename 저장할 파일명 (확장자 제외)
 */
export async function exportToPng(
  element: HTMLElement,
  filename: string = 'cutting-layout'
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      pixelRatio: 2, // 고해상도
      quality: 1,
    })

    // 다운로드 링크 생성
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    throw new Error(`${error} PNG 내보내기에 실패했습니다.`)
  }
}

/**
 * SVG 요소를 PDF로 내보내기
 * @param svgElement SVG 요소
 * @param filename 저장할 파일명 (확장자 제외)
 * @param options PDF 옵션
 */
export async function exportToPdf(
  svgElement: SVGElement,
  filename: string = 'cutting-layout',
  options?: {
    title?: string
    filmName?: string
    wastePercentage?: number
    usedLength?: number
  }
): Promise<void> {
  try {
    // SVG 크기 가져오기
    const svgRect = svgElement.getBoundingClientRect()
    const svgWidth = svgRect.width
    const svgHeight = svgRect.height

    // A4 크기 기준으로 PDF 생성 (세로 방향)
    // A4: 210mm x 297mm
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20 // 여백

    // SVG가 페이지에 맞도록 스케일 계산
    const availableWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - margin * 2 - 30 // 헤더 공간 확보

    const scaleX = availableWidth / (svgWidth || 1)
    const scaleY = availableHeight / (svgHeight || 1)
    const scale = Math.min(scaleX, scaleY, 1) // 최대 100% 크기

    const scaledWidth = svgWidth * scale
    const scaledHeight = svgHeight * scale

    // PDF 생성
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // 헤더 추가
    let yOffset = margin

    if (options?.title) {
      pdf.setFontSize(16)
      pdf.text(options.title, margin, yOffset)
      yOffset += 8
    }

    if (options?.filmName) {
      pdf.setFontSize(12)
      pdf.text(`필름: ${options.filmName}`, margin, yOffset)
      yOffset += 6
    }

    if (typeof options?.wastePercentage === 'number') {
      pdf.setFontSize(10)
      pdf.text(
        `손실율: ${options.wastePercentage.toFixed(2)}%`,
        margin,
        yOffset
      )
      yOffset += 5
    }

    if (typeof options?.usedLength === 'number') {
      pdf.setFontSize(10)
      pdf.text(`사용 길이: ${options.usedLength}mm`, margin, yOffset)
      yOffset += 5
    }

    yOffset += 5 // 여백

    // SVG를 PDF에 추가
    const svgClone = svgElement.cloneNode(true) as SVGElement

    // computed styles를 inline으로 적용
    inlineStyles(svgElement, svgClone)

    // SVG를 PDF에 렌더링
    await (
      pdf as unknown as {
        svg: (svg: SVGElement, options: object) => Promise<unknown>
      }
    ).svg(svgClone, {
      x: margin,
      y: yOffset,
      width: scaledWidth,
      height: scaledHeight,
    })

    // PDF 다운로드
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    throw new Error(`PDF 내보내기에 실패했습니다. ${error}`)
  }
}

/**
 * 현재 날짜/시간을 포함한 파일명 생성
 */
export function generateFilename(prefix: string = 'cutting'): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '')
  return `${prefix}_${dateStr}_${timeStr}`
}
