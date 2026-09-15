import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/design-system/components';
import { listEntries } from '@/data/repositories/entries';
import type { DailyEntry } from '@/domain/entry';
import { buildGraphSegments, filterEntriesByRange, type GraphRange, type GraphSegment } from '@/domain/graph';
import { color, space } from '@/design-system/tokens';

const height = 200;
const ranges: Array<[GraphRange, string]> = [['week', '주'], ['month', '월'], ['year', '년'], ['all', '전체']];

export default function GraphScreen() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [range, setRange] = useState<GraphRange>('all');
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(280, windowWidth - space[5] * 2 - space[5] * 2);
  useEffect(() => { listEntries().then(setEntries); }, []);
  const segments = useMemo(() => buildGraphSegments(filterEntriesByRange(entries, range)), [entries, range]);
  const points = segments.flat();
  return <Screen><ScreenHeader title="기록의 흐름" back={() => router.back()} /><AppText variant="bodySmall" tone="secondary">내가 남긴 수치예요. 좋고 나쁨을 판단하지 않고 기록을 찾아볼 수 있어요.</AppText><View style={styles.ranges}>{ranges.map(([id, label]) => <Button key={id} label={label} variant={range === id ? 'primary' : 'subtle'} onPress={() => setRange(id)} />)}</View><Card>{points.length === 0 ? <AppText>아직 수치를 고른 기록이 없어요.</AppText> : <><AppText variant="caption" tone="secondary">세로축: 내가 남긴 수치 (-20 ~ +20) · 가로축: 날짜</AppText><Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} accessibilityLabel="날짜와 내가 남긴 수치를 표시한 기록 그래프"><Line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={color.border.default} />{segments.map((segment, index) => <Polyline key={index} fill="none" stroke={color.action.primary} strokeWidth="3" points={segment.map((point) => `${pointX(points.indexOf(point), points.length, width)},${pointY(point.value!)}`).join(' ')} />)}{points.map((point, index) => <Circle key={point.date} accessible accessibilityLabel={`${point.date}, 수치 ${point.value}. 누르면 기록 열기`} onPress={() => router.push(`/entry/${point.date}` as never)} cx={pointX(index, points.length, width)} cy={pointY(point.value!)} r="10" fill={color.action.primary} />)}</Svg></>}</Card>{points.map((point) => <Button key={point.date} variant="subtle" label={`${point.date} · ${point.value}`} onPress={() => router.push(`/entry/${point.date}` as never)} />)}<AppText variant="caption" tone="secondary">그래프의 점 또는 날짜를 누르면 해당 기록을 열어요.</AppText></Screen>;
}

const pointX = (index: number, count: number, width: number) => count === 1 ? width / 2 : 20 + index * ((width - 40) / (count - 1));
const pointY = (value: number) => height / 2 - value * 4;
const styles = StyleSheet.create({ ranges: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] } });
