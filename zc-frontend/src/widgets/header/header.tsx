export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* 로고 */}
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-bold">
              ZC
            </div>
            <span className="text-xl font-bold">Zippt Crawler</span>
          </a>
        </div>

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">관리자</span>
        </div>
      </div>
    </header>
  );
}
