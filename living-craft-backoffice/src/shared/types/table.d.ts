import '@tanstack/react-table'

/**
 * @tanstack/react-table의 TableMeta 타입 확장
 * 테이블 메타데이터에 커스텀 속성 추가
 */
declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    /**
     * 행 수정 핸들러
     */
    onEdit?: (row: TData) => void
  }
}
