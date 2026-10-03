-- VR 사이클 V 산출 입력 역산 채우기 (멱등: calc_source IS NULL 인 행만 대상)
-- 최초 사이클은 직접 입력(MANUAL), 이후 사이클은 직전 사이클 값과 현재 설정(G·밴드%)으로 역산(BACKFILL).
-- 직전 사이클 pool_end 가 비어 있으면 (이번 사이클 pool_start - 적립금)으로 대체.
BEGIN;

UPDATE ad.vr_cycles
SET calc_source = 'MANUAL'
WHERE calc_source IS NULL
  AND cycle_no = (SELECT MIN(cycle_no) FROM ad.vr_cycles);

UPDATE ad.vr_cycles c
SET prev_v_value = p.v_value,
    pool_input   = COALESCE(p.pool_end, c.pool_start - c.deposit_amount),
    g_factor     = s.g_factor,
    band_pct     = s.band_pct,
    calc_source  = 'BACKFILL'
FROM ad.vr_cycles p,
     (SELECT g_factor, band_pct FROM ad.vr_settings ORDER BY id LIMIT 1) s
WHERE c.calc_source IS NULL
  AND p.cycle_no = c.cycle_no - 1;

SELECT cycle_no, calc_source, prev_v_value, pool_input, g_factor, v_value FROM ad.vr_cycles ORDER BY cycle_no;
COMMIT;
