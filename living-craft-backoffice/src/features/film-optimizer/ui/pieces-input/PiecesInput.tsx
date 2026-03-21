import { useState } from 'react'
import type { CuttingPieceInput } from '@/shared/types/api'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Plus } from 'lucide-react'
import styles from './styles.module.scss'

interface PiecesInputProps {
  /** 조각 추가 콜백 */
  onAdd: (piece: CuttingPieceInput) => void
  /** 필름 폭 (유효성 검사용) */
  filmWidth?: number
  /** 비활성화 상태 */
  disabled?: boolean
}

/**
 * 재단 조각 입력 폼 컴포넌트
 *
 * - 폭, 높이, 수량, 라벨 입력
 * - 필름 폭을 초과하는 크기 검증
 */
export function PiecesInput({
  onAdd,
  filmWidth = 1220,
  disabled = false,
}: PiecesInputProps) {
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [label, setLabel] = useState('')
  const [allowRotation, setAllowRotation] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 케이스 판별
  const w = parseInt(width, 10) || 0
  const h = parseInt(height, 10) || 0
  const rotationRequired = w > filmWidth && h <= filmWidth   // 케이스 B: 회전 필수
  const rotationImpossible = w <= filmWidth && h > filmWidth // 케이스 C: 회전 불가
  const checkboxDisabled = disabled || rotationRequired || rotationImpossible

  // 렌더 시점에 유효 allowRotation 파생 (useEffect 없이)
  const effectiveAllowRotation = rotationRequired
    ? true
    : rotationImpossible
      ? false
      : allowRotation

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const pw = parseInt(width, 10)
    const ph = parseInt(height, 10)
    const q = parseInt(quantity, 10) || 1

    // 유효성 검사
    if (isNaN(pw) || pw <= 0) {
      setError('폭은 0보다 큰 숫자여야 합니다.')
      return
    }
    if (isNaN(ph) || ph <= 0) {
      setError('높이는 0보다 큰 숫자여야 합니다.')
      return
    }
    if (q <= 0) {
      setError('수량은 0보다 커야 합니다.')
      return
    }

    // 회전 허용 여부에 따라 다른 유효성 검사
    if (!effectiveAllowRotation) {
      // 회전 없이 배치: width가 filmWidth 이하여야 함
      if (pw > filmWidth) {
        setError(
          `폭(${pw}mm)이 필름 폭(${filmWidth}mm)을 초과합니다. 회전 허용을 켜거나 크기를 조정해 주세요.`
        )
        return
      }
    } else {
      // 회전 허용: 최소 치수가 filmWidth 이하여야 함
      const minDim = Math.min(pw, ph)
      if (minDim > filmWidth) {
        setError(
          `조각의 최소 치수(${minDim}mm)가 필름 폭(${filmWidth}mm)을 초과합니다.`
        )
        return
      }
    }

    const finalW = pw
    const finalH = ph

    onAdd({
      width: finalW,
      height: finalH,
      quantity: q,
      label: label.trim() || undefined,
      allowRotation: effectiveAllowRotation,
    })

    // 폼 초기화 (수량, allowRotation은 유지)
    setWidth('')
    setHeight('')
    setLabel('')
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <div className={styles.inputRow}>
          <div className={styles.inputField}>
            <Label htmlFor='piece-width' className={styles.label}>
              폭 (mm)
            </Label>
            <Input
              id='piece-width'
              type='number'
              placeholder='500'
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              disabled={disabled}
              min={1}
              required
            />
          </div>
          <span className={styles.separator}>×</span>
          <div className={styles.inputField}>
            <Label htmlFor='piece-height' className={styles.label}>
              높이 (mm)
            </Label>
            <Input
              id='piece-height'
              type='number'
              placeholder='400'
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              disabled={disabled}
              min={1}
              required
            />
          </div>
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputFieldSmall}>
            <Label htmlFor='piece-quantity' className={styles.label}>
              수량
            </Label>
            <Input
              id='piece-quantity'
              type='number'
              placeholder='1'
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={disabled}
              min={1}
            />
          </div>
          <div className={styles.inputFieldWide}>
            <Label htmlFor='piece-label' className={styles.label}>
              라벨 (선택)
            </Label>
            <Input
              id='piece-label'
              type='text'
              placeholder='예: 문짝 상단'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={disabled}
              maxLength={100}
            />
          </div>
        </div>

        <div className={styles.checkboxRow}>
          <Checkbox
            id='piece-allow-rotation'
            checked={effectiveAllowRotation}
            onCheckedChange={(checked) => setAllowRotation(checked === true)}
            disabled={checkboxDisabled}
          />
          <Label htmlFor='piece-allow-rotation' className={styles.checkboxLabel}>
            회전 허용
          </Label>
        </div>
        {rotationRequired && (
          <p className={styles.rotationHint}>
            이 조각은 회전해야 필름에 들어갑니다.
          </p>
        )}
        {rotationImpossible && (
          <p className={styles.rotationHint}>
            회전 시 필름 폭을 초과하므로 회전이 비활성화됩니다.
          </p>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <Button type='submit' disabled={disabled} className={styles.addButton}>
        <Plus className='h-4 w-4' />
        조각 추가
      </Button>
    </form>
  )
}
