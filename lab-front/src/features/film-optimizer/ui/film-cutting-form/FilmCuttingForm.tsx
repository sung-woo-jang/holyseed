import type { ReactNode } from 'react'
import { FilmCuttingFormContent } from './FilmCuttingFormContent'
import { FilmCuttingFormLoading } from './FilmCuttingFormLoading'

interface FilmCuttingFormProps {
  children: ReactNode
}

/**
 * 필름 재단 폼 루트 컴포넌트
 */
function FilmCuttingFormRoot({ children }: FilmCuttingFormProps) {
  return <>{children}</>
}

/**
 * 필름 재단 폼 Compound Component
 *
 * @example
 * <FilmCuttingFormProvider>
 *   <FilmCuttingForm>
 *     <FilmCuttingForm.Content />
 *   </FilmCuttingForm>
 *   <FilmCuttingFormDialogs />
 * </FilmCuttingFormProvider>
 */
export const FilmCuttingForm = Object.assign(FilmCuttingFormRoot, {
  Loading: FilmCuttingFormLoading,
  Content: FilmCuttingFormContent,
})
