import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import type { PackingResult, PackedRect } from '@/shared/types/api'
import styles from './styles.module.scss'

/**
 * 조각별 고유 색상 팔레트
 */
const PIECE_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
]

/**
 * 조각 ID에 따른 색상 반환
 */
function getPieceColor(pieceId: number, index: number): string {
  return PIECE_COLORS[(pieceId + index) % PIECE_COLORS.length]
}

export interface PieceClickInfo {
  pieceId: number
  x: number
  y: number
  width: number
  height: number
  rotated: boolean
}

interface CuttingCanvasProps {
  /** 패킹 결과 */
  packingResult: PackingResult | null
  /** 필름 폭 (mm) */
  filmWidth: number
  /** 표시 배율 (기본값: 0.5 = 50%) */
  scale?: number
  /** 조각 클릭 콜백 */
  onPieceClick?: (info: PieceClickInfo) => void
  /** 완료된 조각 ID 목록 */
  completedPieceIds?: number[]
  /** 클래스명 */
  className?: string
}

export interface CuttingCanvasRef {
  getSvgElement: () => SVGSVGElement | null
  getContainerElement: () => HTMLDivElement | null
}

/**
 * 재단 배치도 SVG 시각화 컴포넌트
 *
 * - 세로 방향 (필름 폭이 가로, 길이가 세로)
 * - 조각별 색상 구분
 * - 조각 번호 및 라벨 표시
 * - 회전된 조각 표시
 * - 완료된 조각 구분
 */
export const CuttingCanvas = forwardRef<CuttingCanvasRef, CuttingCanvasProps>(
  function CuttingCanvas(
    {
      packingResult,
      filmWidth,
      scale = 0.5,
      onPieceClick,
      completedPieceIds = [],
      className,
    },
    ref
  ) {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      getSvgElement: () => svgRef.current,
      getContainerElement: () => containerRef.current,
    }))

    // SVG 뷰박스 및 크기 계산
    const { viewBoxWidth, viewBoxHeight, displayWidth, displayHeight } =
      useMemo(() => {
        // 치수 표시를 위한 여백: 상단 40px, 우측 70px
        const TOP_PADDING = 40
        const RIGHT_PADDING = 70

        if (!packingResult || packingResult.bins.length === 0) {
          return {
            viewBoxWidth: filmWidth + RIGHT_PADDING,
            viewBoxHeight: 500 + TOP_PADDING,
            displayWidth: (filmWidth + RIGHT_PADDING) * scale,
            displayHeight: (500 + TOP_PADDING) * scale,
          }
        }

        const totalHeight = packingResult.usedLength
        // 여백 추가
        const paddedHeight = Math.max(totalHeight + 100, 500)

        return {
          viewBoxWidth: filmWidth + RIGHT_PADDING,
          viewBoxHeight: paddedHeight + TOP_PADDING,
          displayWidth: (filmWidth + RIGHT_PADDING) * scale,
          displayHeight: (paddedHeight + TOP_PADDING) * scale,
        }
      }, [packingResult, filmWidth, scale])

    // 조각 렌더링 (아래→위 방향으로 채움)
    const renderedPieces = useMemo(() => {
      if (!packingResult) return null

      const usedLength = packingResult.usedLength
      let yOffset = 0
      const pieces: React.ReactElement[] = []

      packingResult.bins.forEach((bin, binIndex) => {
        bin.rects.forEach((rect, rectIndex) => {
          const isCompleted = completedPieceIds.includes(rect.pieceId)
          // listIndex 기반으로 색상 결정 (같은 조각은 항상 같은 색)
          const color = getPieceColor(rect.pieceId, rect.listIndex)

          pieces.push(
            <PieceRect
              key={`${binIndex}-${rectIndex}`}
              rect={rect}
              yOffset={yOffset}
              usedLength={usedLength}
              index={rect.listIndex} // listIndex 사용 (조각 목록 번호와 일치)
              color={color}
              isCompleted={isCompleted}
              onClick={() =>
                onPieceClick?.({
                  pieceId: rect.pieceId,
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                  rotated: rect.rotated,
                })
              }
            />
          )
        })

        yOffset += bin.usedHeight
      })

      return pieces
    }, [packingResult, completedPieceIds, onPieceClick])

    // 빈 상태
    if (!packingResult || packingResult.bins.length === 0) {
      return (
        <div className={`${styles.container} ${className || ''}`}>
          <div className={styles.emptyState}>
            <p>재단 조각을 추가하면 배치도가 표시됩니다.</p>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={containerRef}
        className={`${styles.container} ${className || ''}`}
      >
        <svg
          ref={svgRef}
          width={displayWidth}
          height={displayHeight}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className={styles.canvas}
        >
          {/* 배경 (필름 영역) */}
          <rect
            x={0}
            y={40}
            width={filmWidth}
            height={packingResult.usedLength}
            fill='#f3f4f6'
            stroke='#d1d5db'
            strokeWidth={2}
          />

          {/* 사용 길이 표시선 (위쪽 - 여기까지 소비됨) */}
          <line
            x1={0}
            y1={40}
            x2={filmWidth}
            y2={40}
            stroke='#ef4444'
            strokeWidth={2}
            strokeDasharray='10,5'
          />

          {/* 조각들 */}
          {renderedPieces}

          {/* 치수 표시 */}
          <text
            x={filmWidth + 40}
            y={packingResult.usedLength / 2 + 40}
            className={styles.dimensionText}
            textAnchor='middle'
            transform={`rotate(90, ${filmWidth + 40}, ${packingResult.usedLength / 2 + 40})`}
          >
            {packingResult.usedLength}mm
          </text>

          <text
            x={filmWidth / 2}
            y={20}
            className={styles.dimensionText}
            textAnchor='middle'
          >
            {filmWidth}mm
          </text>
        </svg>
      </div>
    )
  }
)

/**
 * 개별 조각 렌더링 컴포넌트
 */
interface PieceRectProps {
  rect: PackedRect
  yOffset: number
  usedLength: number
  index: number
  color: string
  isCompleted: boolean
  onClick?: () => void
}

function PieceRect({
  rect,
  yOffset,
  usedLength,
  index,
  color,
  isCompleted,
  onClick,
}: PieceRectProps) {
  const x = rect.x
  const { width, height, rotated, label } = rect
  // y좌표 반전: 아래(바닥)부터 위로 채움
  // 상단 여백(40px)을 고려하여 오프셋 추가
  const originalY = rect.y + yOffset
  const y = usedLength - originalY - height + 40

  // 라벨 텍스트
  const displayLabel = label || `#${index}`
  // 크기 표시
  const sizeText = rotated
    ? `${rect.originalHeight}×${rect.originalWidth}↻`
    : `${rect.originalWidth}×${rect.originalHeight}`

  // 텍스트가 조각 안에 들어갈 수 있는지 확인
  const canFitText = width > 60 && height > 40
  const canFitSize = width > 80 && height > 50
  const isNarrow = width <= 60 // 좁은 조각

  return (
    <g
      className={`${styles.piece} ${isCompleted ? styles.pieceCompleted : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* 조각 사각형 */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isCompleted ? '#9ca3af' : color}
        stroke={isCompleted ? '#6b7280' : '#1f2937'}
        strokeWidth={1}
        opacity={isCompleted ? 0.6 : 0.85}
      />

      {/* 조각 내부 텍스트 (충분히 넓은 경우) */}
      {canFitText && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (canFitSize ? 30 : 0)}
            className={styles.pieceLabel}
            textAnchor='middle'
            dominantBaseline='middle'
          >
            {displayLabel}
          </text>

          {/* 크기 표시 */}
          {canFitSize && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 40}
              className={styles.pieceSize}
              textAnchor='middle'
              dominantBaseline='middle'
            >
              {sizeText}
            </text>
          )}

          {/* 완료 체크 표시 */}
          {isCompleted && (
            <text
              x={x + width - 15}
              y={y + 15}
              className={styles.checkMark}
              textAnchor='middle'
              dominantBaseline='middle'
            >
              ✓
            </text>
          )}
        </>
      )}

      {/* 조각 외부 텍스트 (좁은 경우) */}
      {isNarrow && (
        <>
          {/* 연결선 */}
          <line
            x1={x + width}
            y1={y + height / 2}
            x2={x + width + 10}
            y2={y + height / 2}
            stroke='#6b7280'
            strokeWidth={1}
            strokeDasharray='2,2'
          />

          {/* 텍스트 배경 */}
          <rect
            x={x + width + 12}
            y={y + height / 2 - 15}
            width={100}
            height={30}
            fill='white'
            stroke='#d1d5db'
            strokeWidth={1}
            rx={4}
            opacity={0.95}
          />

          {/* 라벨 */}
          <text
            x={x + width + 62}
            y={y + height / 2}
            className={styles.externalLabel}
            textAnchor='middle'
            dominantBaseline='middle'
          >
            {displayLabel} ({sizeText})
          </text>
        </>
      )}
    </g>
  )
}
