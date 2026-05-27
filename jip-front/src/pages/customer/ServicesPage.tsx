import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ItemIllust } from '@/components/common/Illustration'
import { useCategories, useServiceItems } from '@/queries/catalog'

function fmtKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function ServicesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [cat, setCat] = useState(searchParams.get('cat') || 'all')

  const { data: categories } = useCategories()
  const { data: items } = useServiceItems(cat === 'all' ? undefined : cat)

  useEffect(() => {
    const p = searchParams.get('cat')
    setCat(p || 'all')
  }, [searchParams])

  const selectedCat = categories?.find((c) => c.code === cat)

  const handleCat = (code: string) => {
    setCat(code)
    if (code === 'all') setSearchParams({})
    else setSearchParams({ cat: code })
  }

  const cats = [{ code: 'all', name: '전체' }, ...(categories?.map((c) => ({ code: c.code, name: c.name })) ?? [])]

  return (
    <section className="section">
      <div className="container">
        <h1 className="h2">{selectedCat ? selectedCat.name : '전체 서비스'}</h1>
        <p className="lead mt-16">{selectedCat ? selectedCat.intro : '필요한 시공을 골라 견적함에 담으세요.'}</p>

        <div className="filter-row mt-40">
          {cats.map((c) => (
            <button key={c.code} className={`pill${cat === c.code ? ' on' : ''}`} onClick={() => handleCat(c.code)}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="svc-grid mt-40">
          {items?.map((item) => (
            <div key={item.id} className="svc-card" onClick={() => navigate(`/service/${item.code}`)}>
              <div style={{ overflow: 'hidden' }}>
                <ItemIllust code={item.code} imageUrl={item.imageUrl} />
              </div>
              <div className="svc-card-body">
                <div className="svc-card-title">{item.name}</div>
                <div className="svc-card-desc">{item.description}</div>
                <div className="svc-card-price">
                  <b>{fmtKRW(item.price)}</b>
                  {item.unit ? ` · ${item.unit}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
