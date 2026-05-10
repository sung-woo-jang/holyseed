// app.jsx — main shell: device frame, tab bar, navigation

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "role": "OWNER",
  "dark": false,
  "persona": "couple30"
}/*EDITMODE-END*/;

function makeTheme(dark) {
  if (dark) return {
    dark: true,
    bg: '#0F1115', card: '#191F28', border: 'rgba(255,255,255,0.08)',
    text: '#F2F4F6', textMuted: '#8B95A1',
    brand: '#3182F6', brandSoft: 'rgba(49,130,246,0.18)',
    danger: '#F56565',
  };
  return {
    dark: false,
    bg: '#F2F4F6', card: '#FFFFFF', border: 'rgba(0,0,0,0.06)',
    text: '#191F28', textMuted: '#8B95A1',
    brand: '#3182F6', brandSoft: 'rgba(49,130,246,0.10)',
    danger: '#F04452',
  };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const data = DUMMY_PERSONAS[t.persona] || DUMMY_PERSONAS.couple30;
  const theme = makeTheme(t.dark);
  const role = t.role;

  // Apply body background based on dark mode
  React.useEffect(() => {
    document.body.classList.toggle('dark', t.dark);
  }, [t.dark]);

  const [tab, setTab] = React.useState('home');
  const [stack, setStack] = React.useState([]); // pushed screens: 'detail', 'cashflow', etc.
  const [sheet, setSheet] = React.useState(null); // 'snapshot' | 'addtx' | null
  const [activeAsset, setActiveAsset] = React.useState(null);

  const push = (s, payload) => {
    if (s === 'asset') setActiveAsset(payload);
    setStack(st => [...st, s]);
  };
  const pop = () => setStack(st => st.slice(0, -1));
  const top = stack[stack.length - 1];

  return (
    <>
      <DeviceFrame theme={theme}>
        <TossHeader theme={theme} household={data.households[0]} role={role} />
        <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: theme.bg }}>
          {/* Tab content */}
          {!top && tab === 'home' && (
            <HomeScreen data={data} theme={theme} role={role}
              onNav={(t) => { if (t === 'compare') push('compare'); if (t === 'book') setTab('book'); }}
              onSnapshot={() => setSheet('snapshot')} />
          )}
          {!top && tab === 'assets' && (
            <AssetsScreen data={data} theme={theme} role={role}
              onAsset={(a) => push('asset', a)}
              onSnapshot={() => setSheet('snapshot')} />
          )}
          {!top && tab === 'book' && (
            <BookScreen data={data} theme={theme} role={role}
              onAddTx={() => setSheet('addtx')}
              onAddRecurring={() => setSheet('addrec')} />
          )}
          {!top && tab === 'more' && (
            <MoreScreen data={data} theme={theme} role={role}
              onMembers={() => push('members')}
              onCashflow={() => push('cashflow')}
              onCompare={() => push('compare')}
              onCategories={() => push('categories')} />
          )}

          {/* Pushed screens overlay tab */}
          {top === 'asset' && activeAsset && (
            <PushedScreen theme={theme}>
              <AssetDetailScreen asset={activeAsset} data={data} theme={theme} onBack={pop}
                onSnapshot={role !== 'VIEWER' ? () => setSheet('snapshot') : undefined} />
            </PushedScreen>
          )}
          {top === 'cashflow' && (
            <PushedScreen theme={theme}><CashflowScreen data={data} theme={theme} onBack={pop} /></PushedScreen>
          )}
          {top === 'compare' && (
            <PushedScreen theme={theme}><CompareScreen data={data} theme={theme} onBack={pop} /></PushedScreen>
          )}
          {top === 'members' && (
            <PushedScreen theme={theme}><MembersScreen data={data} theme={theme} role={role} onBack={pop} /></PushedScreen>
          )}
          {top === 'categories' && (
            <PushedScreen theme={theme}><CategoriesScreen theme={theme} role={role} onBack={pop} /></PushedScreen>
          )}

          {/* Sheets */}
          {sheet === 'snapshot' && (
            <SnapshotSheet data={data} theme={theme} onClose={() => setSheet(null)} />
          )}
          {sheet === 'addtx' && (
            <AddTxSheet data={data} theme={theme} onClose={() => setSheet(null)} />
          )}
          {sheet === 'addrec' && (
            <AddRecurringSheet data={data} theme={theme} onClose={() => setSheet(null)} />
          )}
        </div>
        <TossTabBar tab={tab} setTab={(t) => { setTab(t); setStack([]); }} theme={theme} />
      </DeviceFrame>

      <TweaksPanel title="자산일기 Tweaks">
        <TweakSection label="권한 (역할)" />
        <TweakRadio label="Role" value={role} options={['OWNER', 'EDITOR', 'VIEWER']}
          onChange={(v) => setTweak('role', v)} />
        <TweakSection label="테마" />
        <TweakToggle label="다크모드" value={t.dark} onChange={(v) => setTweak('dark', v)} />
        <TweakSection label="데이터" />
        <TweakSelect label="페르소나" value={t.persona}
          options={[{ value: 'couple30', label: '30대 부부 (4억)' }]}
          onChange={(v) => setTweak('persona', v)} />
      </TweaksPanel>
    </>
  );
}

function DeviceFrame({ theme, children }) {
  return (
    <div style={{
      width: 375, height: 812, borderRadius: 44, overflow: 'hidden',
      position: 'relative', background: theme.bg,
      boxShadow: theme.dark
        ? '0 0 0 10px #1a1d22, 0 0 0 11px #2a2d32, 0 40px 80px rgba(0,0,0,0.5)'
        : '0 0 0 10px #1a1d22, 0 0 0 11px #2a2d32, 0 40px 80px rgba(0,0,0,0.18)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{
        height: 44, padding: '12px 24px 0', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>9:41</span>
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          width: 110, height: 28, borderRadius: 14, background: '#000',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="17" height="11" viewBox="0 0 17 11">
            <rect x="0" y="7" width="3" height="4" rx="0.5" fill={theme.text}/>
            <rect x="4.5" y="5" width="3" height="6" rx="0.5" fill={theme.text}/>
            <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill={theme.text}/>
            <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill={theme.text}/>
          </svg>
          <svg width="15" height="11" viewBox="0 0 15 11">
            <path d="M7.5 2.8C9.6 2.8 11.5 3.6 12.9 4.9L13.9 4C12.2 2.4 9.9 1.4 7.5 1.4C5.1 1.4 2.8 2.4 1.1 4L2.1 4.9C3.5 3.6 5.4 2.8 7.5 2.8Z" fill={theme.text}/>
            <circle cx="7.5" cy="9" r="1.3" fill={theme.text}/>
          </svg>
          <svg width="24" height="11" viewBox="0 0 24 11">
            <rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke={theme.text} strokeOpacity="0.4" fill="none"/>
            <rect x="2" y="2" width="17" height="7" rx="1.5" fill={theme.text}/>
            <path d="M22 4v3c0.6-0.2 1-0.7 1-1.5C23 4.7 22.6 4.2 22 4Z" fill={theme.text} fillOpacity="0.4"/>
          </svg>
        </div>
      </div>
      {children}
      {/* Home indicator */}
      <div style={{
        height: 30, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        paddingBottom: 8, flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <div style={{ width: 134, height: 5, borderRadius: 3,
          background: theme.dark ? 'rgba(255,255,255,0.6)' : '#000' }} />
      </div>
    </div>
  );
}

function TossHeader({ theme, household, role }) {
  return (
    <div style={{
      padding: '6px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, background: theme.bg, borderBottom: `1px solid ${theme.border}`,
    }}>
      <button style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 6px 8px',
        borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit',
      }}>
        <span style={{ fontSize: 18 }}>{household.icon}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: theme.text, whiteSpace: 'nowrap' }}>{household.name}</span>
        {Icon.chevronDown(theme.textMuted)}
      </button>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {role === 'VIEWER' && (
          <span style={{
            fontSize: 10, padding: '3px 7px', borderRadius: 6,
            background: theme.bg, border: `1px solid ${theme.border}`,
            color: theme.textMuted, fontWeight: 700,
          }}>👁 뷰어</span>
        )}
        <button style={{ padding: 6, borderRadius: 8, background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex' }}>
          {Icon.search(theme.text)}
        </button>
        <button style={{ padding: 6, borderRadius: 8, background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', position: 'relative' }}>
          {Icon.bell(theme.text)}
          <span style={{
            position: 'absolute', top: 5, right: 6, width: 6, height: 6,
            borderRadius: 3, background: '#FF4757',
          }} />
        </button>
      </div>
    </div>
  );
}

function TossTabBar({ tab, setTab, theme }) {
  const tabs = [
    { k: 'home', l: '홈', icon: Icon.home },
    { k: 'assets', l: '자산', icon: Icon.wallet },
    { k: 'book', l: '가계부', icon: Icon.book },
    { k: 'more', l: '더보기', icon: Icon.more },
  ];
  return (
    <div style={{
      display: 'flex', borderTop: `1px solid ${theme.border}`,
      background: theme.card, flexShrink: 0,
    }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => setTab(t.k)}
          style={{
            flex: 1, padding: '10px 0 6px', border: 'none', background: 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          {t.icon(tab === t.k ? theme.brand : theme.textMuted)}
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: tab === t.k ? theme.brand : theme.textMuted,
          }}>{t.l}</span>
        </button>
      ))}
    </div>
  );
}

function PushedScreen({ theme, children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.bg, zIndex: 50,
      animation: 'sheetUp 0.25s ease-out', overflow: 'auto',
    }}>{children}</div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
