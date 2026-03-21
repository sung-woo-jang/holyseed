import { QueryClientProvider } from '@tanstack/react-query'
import { AxiosInterceptor } from '@/shared/api'
import { DirectionProvider } from './direction-provider'
import { FontProvider } from './font-provider'
import { queryClient } from './query-provider'
import { ThemeProvider } from './theme-provider'

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AxiosInterceptor>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>{children}</DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </AxiosInterceptor>
    </QueryClientProvider>
  )
}

// Re-export hooks for convenience
export { useTheme } from './theme-provider'
export { useFont } from './font-provider'
export { useDirection } from './direction-provider'
export type { Direction } from './direction-provider'
