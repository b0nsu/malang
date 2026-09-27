import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useContext } from 'react';
import { color, layout, radius, space } from '../tokens';
import { AppText } from './AppText';
import { IconButton } from './Button';

export function Screen({ children, scroll = true, style }: PropsWithChildren<{ scroll?: boolean; style?: StyleProp<ViewStyle> }>) {
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const content = <View style={[styles.screenContent, !scroll && styles.fixedContent, style]}>{children}</View>;
  return <SafeAreaView edges={tabBarHeight === undefined ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']} style={styles.safe}>{scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}</SafeAreaView>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenHeader({ title, back, right }: { title?: string; back?: () => void; right?: ReactNode }) {
  return <View style={styles.header}>{back ? <IconButton label="뒤로 가기" icon="‹" onPress={back} /> : <View style={styles.headerSide} />}<AppText variant="heading" style={styles.headerTitle}>{title}</AppText>{right ?? <View style={styles.headerSide} />}</View>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: color.bg.canvas }, scroll: { flexGrow: 1 }, fixedContent: { flex: 1 }, screenContent: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: layout.screenHorizontal, paddingTop: layout.screenTop, paddingBottom: space[8], gap: space[4] }, card: { backgroundColor: color.bg.surface, borderRadius: radius.card, padding: space[5], gap: space[2], borderWidth: 1, borderColor: color.border.default, shadowColor: '#495463', shadowOpacity: .05, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 1 }, header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerTitle: { flex: 1, textAlign: 'center' }, headerSide: { width: layout.hitTarget } });
