import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card, IconButton, Screen } from '@/design-system/components';
import { color, radius, space } from '@/design-system/tokens';
import { MalangScene } from '@/features/malang-3d/MalangScene';
import { clampFace, type FaceParametersV1 } from '@/domain/face';
import { useAppearance } from '@/features/appearance/store';
import { useEntryDraft } from '@/features/entry-draft/store';

export default function TodayScreen() {
  const face = useAppearance(state => state.face);
  const appearance = useAppearance(state => state.appearance);
  const hydrated = useAppearance(state => state.hydrated);
  const [playFace, setPlayFace] = useState<FaceParametersV1 | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const today = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());
  const resetPlay = () => { origin.current = null; setPlayFace(null); };
  useEffect(resetPlay, [face, reduceMotion]);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion); return () => subscription.remove(); }, []);
  const beginPlay = (event: { nativeEvent: { pageX: number; pageY: number } }) => { if (reduceMotion) return; origin.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }; setPlayFace(clampFace({ ...face, face: { ...face.face, volume: face.face.volume + .12 } })); };
  const movePlay = (event: { nativeEvent: { pageX: number; pageY: number } }) => { if (!origin.current || reduceMotion) return; const dx = event.nativeEvent.pageX - origin.current.x; const dy = event.nativeEvent.pageY - origin.current.y; setPlayFace(clampFace({ ...face, face: { ...face.face, width: face.face.width + dx / 140, length: face.face.length - dy / 140, volume: face.face.volume + .12 } })); };
  return <View style={styles.root}><Screen style={styles.content}><View style={styles.top}><IconButton label="메뉴" icon="☰" onPress={() => router.push('/settings/data' as never)} /><AppText variant="heading" style={styles.brand}>MALANG</AppText><View style={styles.placeholder} /></View><View style={styles.hero}><AppText variant="bodySmall" tone="secondary" style={styles.center}>{today}</AppText><AppText variant="title" style={styles.center}>오늘의 마음을{`\n`}가볍게 남겨 보세요.</AppText><View accessibilityLabel="말랑이 놀이 영역" accessibilityHint={reduceMotion ? '동작 줄이기 설정으로 움직임을 줄였어요.' : '누르거나 끌어도 기록에는 저장되지 않아요.'} onStartShouldSetResponder={() => !reduceMotion} onMoveShouldSetResponder={() => !reduceMotion} onResponderGrant={beginPlay} onResponderMove={movePlay} onResponderRelease={resetPlay} onResponderTerminate={resetPlay} style={styles.malang}><MalangScene face={playFace ?? face} appearance={appearance} /></View></View><Card style={styles.message}><AppText variant="bodySmall" tone="secondary" style={styles.center}>{reduceMotion ? '동작 줄이기 설정이 적용되어 말랑이 움직임을 줄였어요.' : '누르거나 끌어 보셔도 돼요. 이 움직임은 기록에 저장되지 않아요.'}</AppText></Card><Button label="오늘 남기기" disabled={!hydrated} onPress={() => { useEntryDraft.getState().startNew(); router.push('/entry/new' as never); }} /></Screen></View>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: color.bg.canvas }, content: { flexGrow: 1, justifyContent: 'space-between' }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, placeholder: { width: 44 }, brand: { letterSpacing: 1.5 }, hero: { alignItems: 'center', gap: space[3] }, center: { textAlign: 'center' }, malang: { height: 250, width: '100%', overflow: 'hidden', borderRadius: radius.large, backgroundColor: color.bg.muted, alignItems: 'center', justifyContent: 'center' }, message: { paddingVertical: space[4], backgroundColor: 'transparent', borderWidth: 0, shadowOpacity: 0 } });
