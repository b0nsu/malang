import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card, IconButton, Screen } from '@/design-system/components';
import { color, radius, space } from '@/design-system/tokens';
import { MalangScene } from '@/features/malang-3d/MalangScene';
import { clamp } from '@/domain/face';
import { useAppearance } from '@/features/appearance/store';

export default function TodayScreen() {
  const baseFace = useAppearance((state) => state.face);
  const appearance = useAppearance((state) => state.appearance);
  const [playFace, setPlayFace] = useState(baseFace);
  const [reduceMotion, setReduceMotion] = useState(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const today = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());

  useEffect(() => {
    setPlayFace(baseFace);
  }, [baseFace]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const resetPlay = () => {
    origin.current = null;
    setPlayFace(baseFace);
  };

  const beginPlay = (event: { nativeEvent: { pageX: number; pageY: number } }) => {
    if (reduceMotion) return;
    origin.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
    setPlayFace({ ...baseFace, face: { ...baseFace.face, volume: clamp(baseFace.face.volume - 0.12) } });
  };

  const movePlay = (event: { nativeEvent: { pageX: number; pageY: number } }) => {
    if (!origin.current || reduceMotion) return;
    const dx = event.nativeEvent.pageX - origin.current.x;
    const dy = event.nativeEvent.pageY - origin.current.y;
    setPlayFace({
      ...baseFace,
      face: {
        ...baseFace.face,
        width: clamp(baseFace.face.width + dx / 140),
        length: clamp(baseFace.face.length - dy / 140),
        volume: clamp(baseFace.face.volume - 0.12),
      },
    });
  };

  return <Screen style={styles.content}>
    <View style={styles.top}>
      <IconButton label="메뉴" icon="☰" onPress={() => router.push('/settings/data' as never)} />
      <AppText variant="heading" style={styles.brand}>MALANG</AppText>
      <View style={styles.placeholder} />
    </View>
    <View style={styles.hero}>
      <AppText variant="bodySmall" tone="secondary" style={styles.center}>{today}</AppText>
      <AppText variant="title" style={styles.center}>오늘의 마음을{`\n`}가볍게 남겨 보세요.</AppText>
      <View
        accessibilityLabel="말랑이 놀이 영역"
        accessibilityHint={reduceMotion ? '동작 줄이기 설정으로 움직임을 줄였어요.' : '누르거나 끌어도 기록에는 저장되지 않아요.'}
        onStartShouldSetResponder={() => !reduceMotion}
        onMoveShouldSetResponder={() => !reduceMotion}
        onResponderGrant={beginPlay}
        onResponderMove={movePlay}
        onResponderRelease={resetPlay}
        onResponderTerminate={resetPlay}
        style={styles.malang}
      >
        <MalangScene face={playFace} appearance={appearance} />
      </View>
    </View>
    <Card style={styles.message}>
      <AppText variant="bodySmall" tone="secondary" style={styles.center}>
        {reduceMotion ? '동작 줄이기 설정이 적용되어 말랑이 움직임을 줄였어요.' : '누르거나 끌어 보셔도 돼요. 이 움직임은 기록에 저장되지 않아요.'}
      </AppText>
    </Card>
    <Button label="오늘 남기기" onPress={() => router.push('/entry/new' as never)} />
  </Screen>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeholder: { width: 48 },
  brand: { letterSpacing: 1.5 },
  hero: { alignItems: 'center', gap: space[3] },
  center: { textAlign: 'center' },
  malang: { height: 250, width: '100%', overflow: 'hidden', borderRadius: radius.large, backgroundColor: color.bg.muted, alignItems: 'center', justifyContent: 'center' },
  message: { paddingVertical: space[4], backgroundColor: 'transparent', borderWidth: 0, shadowOpacity: 0 },
});
