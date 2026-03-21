import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string // apply to both th and td
    tdClassName?: string
    thClassName?: string
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEdit?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDelete?: any
  }
}
