import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useColors, useT } from '../context/SettingsContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { DebtsScreen } from '../screens/debts/DebtsScreen';
import { FriendsScreen } from '../screens/friends/FriendsScreen';
import { ActivityScreen } from '../screens/groups/ActivityScreen';
import { CreateGroupScreen } from '../screens/groups/CreateGroupScreen';
import { GroupDetailScreen } from '../screens/groups/GroupDetailScreen';
import { GroupInfoScreen } from '../screens/groups/GroupInfoScreen';
import { GroupsScreen } from '../screens/groups/GroupsScreen';
import { JoinGroupScreen } from '../screens/groups/JoinGroupScreen';
import { RecordFormScreen } from '../screens/groups/RecordFormScreen';
import { SettleUpScreen } from '../screens/groups/SettleUpScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AuthStackParamList, RootStackParamList, TabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Tabs: {
        screens: {
          Groups: 'groups',
          Debts: 'debts',
          Friends: 'friends',
          Profile: 'profile',
        },
      },
      CreateGroup: 'create-group',
      JoinGroup: 'join-group',
      GroupDetail: 'group/:groupId',
      GroupInfo: 'group/:groupId/info',
      RecordForm: 'group/:groupId/record',
      Activity: 'group/:groupId/activity',
      SettleUp: 'group/:groupId/settle',
      ChangePassword: 'change-password',
    },
  },
};

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}

function WebBackButton({ onPress, color }: { onPress: () => void; color: string }) {
  if (Platform.OS !== 'web') return null;
  return (
    <TouchableOpacity onPress={onPress} style={styles.webBack}>
      <Text style={[styles.webBackText, { color }]}>‹ Back</Text>
    </TouchableOpacity>
  );
}


function Tabs() {
  const colors = useColors();
  const t = useT();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder },
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        headerStyle: { backgroundColor: colors.card },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ title: 'Bill Mate', tabBarLabel: t.tabGroups, tabBarIcon: (p) => <TabIcon emoji="👥" focused={p.focused} /> }} />
      <Tab.Screen name="Debts" component={DebtsScreen} options={{ tabBarLabel: t.tabDebts, tabBarIcon: (p) => <TabIcon emoji="💸" focused={p.focused} /> }} />
      <Tab.Screen name="Friends" component={FriendsScreen} options={{ tabBarLabel: t.tabFriends, tabBarIcon: (p) => <TabIcon emoji="🤝" focused={p.focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t.tabProfile, tabBarIcon: (p) => <TabIcon emoji="👤" focused={p.focused} /> }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, profile, initializing } = useAuth();
  const colors = useColors();

  const navTheme = colors.background === '#0F172A'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.card, text: colors.text, border: colors.border, primary: colors.primary, notification: colors.primary } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.card, text: colors.text, border: colors.border, primary: colors.primary, notification: colors.primary } };

  if (initializing || (user && !profile)) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <Text style={styles.splashLogo}>💸</Text>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const primaryColor = colors.primary;
  const stackScreenOptions = ({ navigation }: { navigation: any }) => ({
    headerBackButtonDisplayMode: 'minimal' as const,
    headerTitleStyle: { fontWeight: '700' as const, color: colors.text },
    headerStyle: { backgroundColor: colors.card },
    headerShadowVisible: false,
    headerTintColor: primaryColor,
    ...(Platform.OS === 'web' && navigation.canGoBack() ? {
      headerLeft: () => <WebBackButton onPress={() => navigation.goBack()} color={primaryColor} />,
    } : {}),
  });

  return (
    <NavigationContainer linking={linking} theme={navTheme}>
      {!user || !profile ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="SignUp" component={SignUpScreen} />
        </AuthStack.Navigator>
      ) : (
        <RootStack.Navigator screenOptions={stackScreenOptions}>
          <RootStack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <RootStack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: '' }} />
          <RootStack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ title: '' }} />
          <RootStack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: '' }} />
          <RootStack.Screen name="GroupInfo" component={GroupInfoScreen} options={{ title: '' }} />
          <RootStack.Screen name="RecordForm" component={RecordFormScreen} options={{ title: '' }} />
          <RootStack.Screen name="Activity" component={ActivityScreen} options={{ title: '' }} />
          <RootStack.Screen name="SettleUp" component={SettleUpScreen} options={{ title: '' }} />
          <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: '' }} />
        </RootStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  splashLogo: { fontSize: 56 },
  webBack: { paddingRight: 8, paddingVertical: 4 },
  webBackText: { fontSize: 17, fontWeight: '600' },
});
