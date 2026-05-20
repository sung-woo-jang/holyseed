import { useState } from 'react'
import { productsApi } from '@/lib/pc-api'
import { useQueryClient } from '@tanstack/react-query'

type ImportResult = {
  created: number
  updated: number
  skipped: number
  total: number
  errors: Array<{ index: number; reason: string }>
}

export function ImportPage() {
  const qc = useQueryClient()
  const [jsonText, setJsonText] = useState('')
  const [options, setOptions] = useState({ autoCreateCategory: false, autoCreateVendor: false, atomic: false })
  const [parsed, setParsed] = useState<any[] | null>(null)
  const [parseError, setParseError] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
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
      const res = await productsApi.import({ options, items: parsed })
      setResult({ ...res, total: parsed.length })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['compare'] })
    } catch (e: any) {
      setParseError(e.response?.data?.message || '임포트 실패')
    } finally {
      setImporting(false)
    }
  }

  const sampleJson = JSON.stringify([
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

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">JSON 임포트</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm font-medium text-gray-700">옵션:</span>
          {[
            { key: 'autoCreateCategory', label: '카테고리 자동생성' },
            { key: 'autoCreateVendor', label: '업체 자동생성' },
            { key: 'atomic', label: '1개 실패 시 전체 롤백' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={(options as any)[key]}
                onChange={(e) => setOptions((o) => ({ ...o, [key]: e.target.checked }))}
                className="rounded"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">JSON 데이터</label>
            <button onClick={() => setJsonText(sampleJson)} className="text-xs text-blue-600 hover:text-blue-800">예시 불러오기</button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setParsed(null); setParseError('') }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono h-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder='[{"categoryPath": [...], "modelCode": "...", "displayName": "...", "prices": [...]}]'
          />
        </div>

        {parseError && <p className="text-sm text-red-600 mb-3">{parseError}</p>}

        <div className="flex gap-3">
          <button onClick={handleParse} disabled={!jsonText}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            파싱 미리보기
          </button>
          {parsed && (
            <button onClick={handleImport} disabled={importing}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {importing ? '임포트 중...' : `${parsed.length}개 임포트 실행`}
            </button>
          )}
        </div>
      </div>

      {parsed && !result && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">미리보기 ({parsed.length}개)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">#</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">모델코드</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">제품명</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">카테고리</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">가격 수</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 20).map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs">{item.modelCode}</td>
                    <td className="px-3 py-2">{item.displayName}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{item.categoryPath?.join(' > ')}</td>
                    <td className="px-3 py-2 text-gray-500">{item.prices?.length || 0}</td>
                  </tr>
                ))}
                {parsed.length > 20 && (
                  <tr><td colSpan={5} className="px-3 py-2 text-center text-gray-400">...외 {parsed.length - 20}개</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">임포트 결과</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[
              { label: '전체', value: result.total, color: 'text-gray-700' },
              { label: '신규 생성', value: result.created, color: 'text-green-600' },
              { label: '업데이트', value: result.updated, color: 'text-blue-600' },
              { label: '오류', value: result.errors.length, color: result.errors.length > 0 ? 'text-red-600' : 'text-gray-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-600 mb-2">오류 목록 ({result.errors.length}개)</h3>
              <div className="bg-red-50 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
                {result.errors.map((e) => (
                  <p key={e.index} className="text-sm text-red-700">
                    <span className="font-mono text-xs mr-2">#{e.index + 1}</span>{e.reason}
                  </p>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => { setResult(null); setParsed(null); setJsonText('') }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800">
            새 임포트
          </button>
        </div>
      )}
    </div>
  )
}
