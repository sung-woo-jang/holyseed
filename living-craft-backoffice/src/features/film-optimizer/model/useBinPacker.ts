import { useMemo } from 'react'
import type { CuttingPiece, PackingResult } from '@/shared/types/api'
import { calculatePackingResult, type PackerOptions } from '../lib/bin-packer'

interface UseBinPackerOptions {
  /** 필름 폭 (기본값: 1220mm) */
  filmWidth?: number
  /** 필름 최대 길이 (기본값: 60000mm) */
  filmMaxLength?: number
  /** 회전 허용 여부 (기본값: true) */
  allowRotation?: boolean
  /** 패딩 (조각 간 간격, 기본값: 0) */
  padding?: number
}

interface UseBinPackerResult {
  /** 패킹 결과 */
  packingResult: PackingResult | null
  /** 손실율 (%) */
  wastePercentage: number
  /** 사용 길이 (mm) */
  usedLength: number
  /** 총 조각 면적 (mm²) */
  totalPieceArea: number
  /** 조각이 없는 경우 */
  isEmpty: boolean
}

/**
 * 재단 조각 목록을 받아 실시간으로 패킹 결과를 계산하는 훅
 *
 * @param pieces 재단 조각 목록
 * @param options 패킹 옵션
 * @returns 패킹 결과
 */
export function useBinPacker(
  pieces: CuttingPiece[],
  options: UseBinPackerOptions = {}
): UseBinPackerResult {
  const {
    filmWidth = 1220,
    filmMaxLength = 60000,
    allowRotation = true,
    padding = 0,
  } = options

  const packingResult = useMemo(() => {
    // 조각이 없으면 계산하지 않음
    if (!pieces || pieces.length === 0) {
      return null
    }

    const packerOptions: PackerOptions = {
      filmWidth,
      filmMaxLength,
      allowRotation,
      padding,
    }

    try {
      return calculatePackingResult(pieces, packerOptions)
    } catch {
      return null
    }
  }, [pieces, filmWidth, filmMaxLength, allowRotation, padding])

  return {
    packingResult,
    wastePercentage: packingResult?.wastePercentage ?? 0,
    usedLength: packingResult?.usedLength ?? 0,
    totalPieceArea: packingResult?.totalPieceArea ?? 0,
    isEmpty: !pieces || pieces.length === 0,
  }
}
