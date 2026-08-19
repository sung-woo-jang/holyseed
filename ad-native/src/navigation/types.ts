import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: { error?: 'oauth' } | undefined;
  Register: undefined;
};

export type AssetsStackParamList = {
  AssetsList: undefined;
  AssetDetail: { id: string };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Cashflow: undefined;
  Categories: undefined;
  Compare: undefined;
  Members: undefined;
  NetWorthAt: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Assets: NavigatorScreenParams<AssetsStackParamList>;
  Book: undefined;
  More: NavigatorScreenParams<MoreStackParamList>;
};
