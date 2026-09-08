import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: { error?: 'oauth' } | undefined;
  Register: undefined;
};

export type AssetsStackParamList = {
  AssetsList: undefined;
  AssetDetail: { id: string };
};

/** 거래 상세/거래장부/카테고리별 거래내역 등 여러 스택에서 공통으로 여는 화면이라 returnTo로 저장 완료 후 돌아갈 화면을 지정 */
export type TransactionEditParams = { mode: 'add'; date?: string; returnTo: string } | { mode: 'edit'; txId: string; returnTo: string };

export type BookStackParamList = {
  BookHome: { savedMode?: 'create' | 'edit' | 'delete'; savedAt?: number } | undefined;
  TransactionDetail: { id: string; savedMode?: 'create' | 'edit' | 'delete'; savedAt?: number };
  TransactionEdit: TransactionEditParams;
  Categories: undefined;
  CategoryEdit: { mode: 'add'; type: 'INCOME' | 'EXPENSE' } | { mode: 'edit'; categoryId: number };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Cashflow: undefined;
  CategoryTransactions: { categoryId: number | null; categoryName: string; from?: string; to?: string; savedMode?: 'create' | 'edit' | 'delete'; savedAt?: number };
  TransactionDetail: { id: string; savedMode?: 'create' | 'edit' | 'delete'; savedAt?: number };
  TransactionEdit: TransactionEditParams;
  Compare: undefined;
  Members: undefined;
  NetWorthAt: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Assets: NavigatorScreenParams<AssetsStackParamList>;
  Book: NavigatorScreenParams<BookStackParamList>;
  More: NavigatorScreenParams<MoreStackParamList>;
};
