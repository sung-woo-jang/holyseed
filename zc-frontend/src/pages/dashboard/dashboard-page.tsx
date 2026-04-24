import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { useFetchStats } from '@/features/stats/api/useFetchStats';

export function DashboardPage() {
  const { data: stats, isLoading, error } = useFetchStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-muted-foreground mt-2">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-red-500 mt-2">통계 데이터 로드 실패</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground mt-2">
          ZC 크롤러 통계 및 최근 변동 사항
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">총 제품 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalProducts ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              크롤링된 전체 제품
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">매칭 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {stats?.matchedProducts ?? 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              모델에 연결됨
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">미매칭</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {stats?.unmatchedProducts ?? 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              연결 필요
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">총 모델 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalModels ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              등록된 마스터 모델
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">총 브랜드 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalBrands ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              등록된 브랜드
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 가격 업데이트</CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.recentPriceUpdates || stats.recentPriceUpdates.length === 0 ? (
            <p className="text-muted-foreground">최근 가격 업데이트 내역이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">제품명</th>
                    <th className="text-left py-3 px-4">사이트</th>
                    <th className="text-right py-3 px-4">정상가</th>
                    <th className="text-right py-3 px-4">할인가</th>
                    <th className="text-right py-3 px-4">기록 일시</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPriceUpdates.map((update) => (
                    <tr key={update.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{update.productName}</td>
                      <td className="py-3 px-4">{update.siteName}</td>
                      <td className="text-right py-3 px-4">
                        {update.price.toLocaleString()}원
                      </td>
                      <td className="text-right py-3 px-4">
                        {update.discountPrice ? (
                          <span className="text-red-600 font-medium">
                            {update.discountPrice.toLocaleString()}원
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        {new Date(update.recordedAt).toLocaleString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
