import type { CuttingPieceInput } from '@/shared/types/api'

/**
 * 텍스트 입력 파싱 결과
 */
export interface ParseResult {
  success: boolean
  pieces: CuttingPieceInput[]
  errors: string[]
}

/**
 * 일괄 입력 텍스트를 파싱하여 재단 조각 배열로 변환
 *
 * 지원 형식:
 * - "500x400" → 폭 500, 높이 400, 수량 1
 * - "500x400 x3" 또는 "500x400 *3" 또는 "500x400x3" → 폭 500, 높이 400, 수량 3
 * - "500x400 라벨명" → 폭 500, 높이 400, 수량 1, 라벨 "라벨명"
 * - "500x400 x2 라벨명" → 폭 500, 높이 400, 수량 2, 라벨 "라벨명"
 * - "500x400 라벨명 nr" 또는 "500x400 라벨명 norot" → 회전 불가
 *
 * 구분자: 줄바꿈, 쉼표
 *
 * @param input 사용자 입력 텍스트
 * @returns 파싱 결과
 */
export function parsePiecesInput(input: string): ParseResult {
  const pieces: CuttingPieceInput[] = []
  const errors: string[] = []

  // 줄바꿈과 쉼표로 분리
  const lines = input
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  lines.forEach((line, index) => {
    const lineNum = index + 1
    const parsed = parseSingleLine(line)

    if (parsed.success && parsed.piece) {
      pieces.push(parsed.piece)
    } else {
      errors.push(`${lineNum}번째 항목: ${parsed.error}`)
    }
  })

  return {
    success: errors.length === 0,
    pieces,
    errors,
  }
}

interface SingleLineResult {
  success: boolean
  piece?: CuttingPieceInput
  error?: string
}

/**
 * 단일 라인 파싱
 */
function parseSingleLine(line: string): SingleLineResult {
  // 기본 패턴: 숫자x숫자 (폭x높이)
  // 옵션 패턴: x숫자 또는 *숫자 (수량)
  // 나머지: 라벨

  // 정규식으로 파싱
  // 패턴: 폭 x 높이 [x수량 또는 *수량] [라벨]
  const dimensionPattern = /^(\d+)\s*[xX×]\s*(\d+)/
  const threePartPattern = /^(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)$/

  // 먼저 3파트 패턴 체크 (500x400x3)
  const threePartMatch = line.match(threePartPattern)
  if (threePartMatch) {
    const width = parseInt(threePartMatch[1], 10)
    const height = parseInt(threePartMatch[2], 10)
    const quantity = parseInt(threePartMatch[3], 10)

    if (width <= 0 || height <= 0 || quantity <= 0) {
      return { success: false, error: '폭, 높이, 수량은 0보다 커야 합니다.' }
    }

    return {
      success: true,
      piece: { width, height, quantity },
    }
  }

  // 기본 dimension 추출
  const dimMatch = line.match(dimensionPattern)
  if (!dimMatch) {
    return { success: false, error: '형식이 올바르지 않습니다. (예: 500x400)' }
  }

  const width = parseInt(dimMatch[1], 10)
  const height = parseInt(dimMatch[2], 10)

  if (width <= 0 || height <= 0) {
    return { success: false, error: '폭과 높이는 0보다 커야 합니다.' }
  }

  // dimension 부분 제거 후 나머지 처리
  let remaining = line.substring(dimMatch[0].length).trim()

  let quantity = 1
  let label: string | undefined
  let allowRotation = true

  // 수량 패턴 찾기 (x3, *3 등)
  const qtyMatch = remaining.match(/^[xX*×]\s*(\d+)/)
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10)
    if (quantity <= 0) {
      return { success: false, error: '수량은 0보다 커야 합니다.' }
    }
    remaining = remaining.substring(qtyMatch[0].length).trim()
  }

  // 회전 불가 플래그 파싱 (nr 또는 norot, 대소문자 무시)
  // 문자열 끝에 위치한 경우만 인식 (라벨과 구분)
  const noRotMatch = remaining.match(/\s+(nr|norot)\s*$/i)
  if (noRotMatch) {
    allowRotation = false
    remaining = remaining.substring(0, remaining.length - noRotMatch[0].length).trim()
  }

  // 나머지는 라벨로 처리
  if (remaining.length > 0) {
    label = remaining
  }

  return {
    success: true,
    piece: {
      width,
      height,
      quantity,
      label,
      allowRotation,
    },
  }
}

/**
 * 재단 조각 배열을 일괄 입력 형식의 텍스트로 변환
 * (역변환용)
 */
export function piecesToText(pieces: CuttingPieceInput[]): string {
  return pieces
    .map((piece) => {
      let text = `${piece.width}x${piece.height}`
      if (piece.quantity && piece.quantity > 1) {
        text += ` x${piece.quantity}`
      }
      if (piece.label) {
        text += ` ${piece.label}`
      }
      if (piece.allowRotation === false) {
        text += ` nr`
      }
      return text
    })
    .join('\n')
}
