import { ExpenseRecord } from '../types/models';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupDetail: { groupId: string };
  GroupInfo: { groupId: string };
  RecordForm: { groupId: string; record?: ExpenseRecord };
  Activity: { groupId: string };
  SettleUp: { groupId: string };
  ChangePassword: undefined;
};

export type TabParamList = {
  Groups: undefined;
  Debts: undefined;
  Friends: undefined;
  Profile: undefined;
};
