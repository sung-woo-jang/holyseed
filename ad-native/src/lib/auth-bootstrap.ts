import { api } from './api';
import { useAuthStore } from '../stores/auth.store';

export async function loadHouseholds() {
  try {
    const { data: res } = await api.get('/households');
    useAuthStore.getState().setHouseholds(res.data ?? res);
  } catch {
    // 가구 없음 → 온보딩에서 생성
  }
}
