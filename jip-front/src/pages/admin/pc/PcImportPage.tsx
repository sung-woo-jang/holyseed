import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { pcProductsApi } from '@/queries/pc'
import type { PcImportResult } from '@/queries/pc'

const SAMPLE = JSON.stringify([
  {
    categoryPath: ['주방후드', '슬라이드후드'],
    modelCode: 'G60AL',
    displayName: 'G60 실버',
    spec: '기본형 실버 가로600',
    prices: [
      { vendor: 'A업체', price: 46000 },
      { vendor: 'B업체', price: 43000, note: '택배비포함' },
    ],
  },
], null, 2)

export default function PcImportPage() {
  const qc = useQueryClient()
  const [jsonText, setJsonText] = useState('')
  const [options, setOptions] = useState({ autoCreateCategory: false, autoCreateVendor: false, atomic: false })
  const [parsed, setParsed] = useState<any[] | null>(null)
  const [parseError, setParseError] = useState('')
  const [result, setResult] = useState<(PcImportResult & { total: number }) | null>(null)
  const [importing, setImporting] = useState(false)

  const handleParse = () => {
    setParseError('')
    setParsed(null)
    try {
      const data = JSON.parse(jsonText)
      const items = Array.isArray(data) ? data : data.items
      if (!Array.isArray(items)) throw new Error('최상위가 배열이거나 { items: [...] } 형태여야 합니다.')
      setParsed(items)
    } catch (e: any) {
      setParseError(e.message)
    }
  }

  const handleImport = async () => {
    if (!parsed) return
    setImporting(true)
    setResult(null)
    try {
      const res = await pcProductsApi.import({ options, items: parsed })
      setResult({ ...res, total: parsed.length })
      qc.invalidateQueries({ queryKey: ['pc-products'] })
    } catch (e: any) {
      setParseError(e.response?.data?.message || '임포트 실패')
    } finally {
      setImporting(false)
    }
  }

  const OPT_LIST = [
    { key: 'autoCreateCategory', label: '카테고리 자동생성' },
    { key: 'autoCreateVendor', label: '업체 자동생성' },
    { key: 'atomic', label: '1개 실패 시 전체 롤백' },
  ] as const

  return (
    <div>
      <h1 className="h2 mb-24">JSON 임포트</h1>

      <div className="card card-pad mb-16">
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>옵션</span>
          {OPT_LIST.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={(options as any)[key]}
                onChange={(e) => setOptions((o) => ({ ...o, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>JSON 데이터</div>
            <button className="btn ghost sm" onClick={() => setJsonText(SAMPLE)}>예시 불러오기</button>
          </div>
          <textarea
            className="input"
            rows={12}
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setParsed(null); setParseError('') }}
            placeholder='[{"categoryPath": [...], "modelCode": "...", "displayName": "...", "prices": [...]}]'
            style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
          />
        </div>

        {parseError && (
          <div style={{ color: 'var(--color-error, #e53e3e)', fontSize: 13, marginBottom: 12 }}>{parseError}</div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" onClick={handleParse} disabled={!jsonText}>파싱 미리보기</button>
          {parsed && (
            <button className="btn primary" onClick={handleImport} disabled={importing}>
              {importing ? '임포트 중...' : `${parsed.length}개 임포트 실행`}
            </button>
          )}
        </div>
      </div>

      {parsed && !result && (
        <div className="card card-pad mb-16">
          <h3 className="h3 mb-16">미리보기 ({parsed.length}개)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ink-6)', background: 'var(--bg-deep)' }}>
                  {['#', '모델코드', '제품명', '카테고리', '가격 수'].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 20).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--ink-6)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--ink-4)' }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{item.modelCode}</td>
                    <td style={{ padding: '8px 12px' }}>{item.displayName}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink-3)', fontSize: 12 }}>{item.categoryPath?.join(' > ')}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>{item.prices?.length || 0}</td>
                  </tr>
                ))}
                {parsed.length > 20 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
                      ...외 {parsed.length - 20}개
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="card card-pad">
          <h3 className="h3 mb-16">임포트 결과</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: '전체', value: result.total, color: 'var(--ink-1)' },
              { label: '신규 생성', value: result.created, color: 'var(--color-success, #38a169)' },
              { label: '업데이트', value: result.updated, color: 'var(--color-primary, #3182ce)' },
              { label: '오류', value: result.errors.length, color: result.errors.length > 0 ? 'var(--color-error, #e53e3e)' : 'var(--ink-4)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card card-pad" style={{ textAlign: 'center', background: 'var(--bg-deep)' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-error, #e53e3e)', marginBottom: 8 }}>
                오류 목록 ({result.errors.length}개)
              </div>
              <div style={{ background: 'var(--bg-deep)', borderRadius: 8, padding: 12, maxHeight: 200, overflowY: 'auto' }}>
                {result.errors.map((e) => (
                  <div key={e.index} style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, marginRight: 8 }}>#{e.index + 1}</span>
                    {e.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            className="btn ghost sm"
            style={{ marginTop: 16 }}
            onClick={() => { setResult(null); setParsed(null); setJsonText('') }}
          >
            새 임포트
          </button>
        </div>
      )}
    </div>
  )
}
