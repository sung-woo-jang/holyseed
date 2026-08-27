import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: { error?: 'oauth' } | undefined;
  Register: undefined;
};

export type AssetsStackParamList = {
  AssetsList: undefined;
  AssetDetail: { id: string };
};

export type BookStackParamList = {
  BookHome: undefined;
  TransactionDetail: { id: string };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Cashflow: undefined;
  Categories: undefined;
  CategoryEdit: { mode: 'add'; type: 'INCOME' | 'EXPENSE' } | { mode: 'edit'; categoryId: number };
  CategoryTransactions: { categoryId: number | null; categoryName: string; from?: string; to?: string };
  TransactionDetail: { id: string };
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
  Apps: undefined;
};
