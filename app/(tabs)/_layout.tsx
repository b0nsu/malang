import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { BottomTabs } from '@/design-system/components';
import { color } from '@/design-system/tokens';

function TabBar({ state, navigation }: BottomTabBarProps) {
  const current = state.routes[state.index].name;
  const select = (name: string) => {
    const route = state.routes.find(item => item.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (current !== name && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };
  const longPress = (name: string) => {
    const route = state.routes.find(item => item.name === name);
    if (route) navigation.emit({ type: 'tabLongPress', target: route.key });
  };
  return <BottomTabs active={current === 'records/index' ? 'records' : current === 'face-studio' ? 'studio' : 'today'} onToday={() => select('today')} onRecords={() => select('records/index')} onStudio={() => select('face-studio')} onLongPress={tab => longPress(tab === 'records' ? 'records/index' : tab === 'studio' ? 'face-studio' : 'today')} />;
}

export default function TabsLayout() {
  return <Tabs initialRouteName="today" backBehavior="history" tabBar={TabBar} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.bg.canvas } }}>
    <Tabs.Screen name="today" options={{ title: '오늘' }} />
    <Tabs.Screen name="records/index" options={{ title: '기록' }} />
    <Tabs.Screen name="face-studio" options={{ title: '말랑이' }} />
  </Tabs>;
}
