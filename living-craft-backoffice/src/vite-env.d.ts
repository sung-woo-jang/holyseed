/// <reference types="vite/client" />

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_VERSION?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_DESCRIPTION?: string
  readonly VITE_ENV?: 'development' | 'production'
  readonly VITE_SOURCEMAP?: string
  readonly VITE_DEBUG?: string
  readonly VITE_SHOW_DEV_TOOLS?: string
  readonly VITE_TIMEZONE?: string
  readonly VITE_GA_ID?: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
