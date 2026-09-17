import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { AppText, Button, Card, LoadState, Screen, ScreenHeader } from '@/design-system/components';
import { listEntries } from '@/data/repositories/entries';
import { buildGraphSegments, filterEntriesByRange, type GraphRange } from '@/domain/graph';
import { layout, color, space } from '@/design-system/tokens';
import { useFocusedResource } from '../useFocusedResource';

const height = 200;
const ranges: Array<[GraphRange, string]> = [['week', '주'], ['month', '월'], ['year', '년'], ['all', '전체']];

export default function GraphScreen() {
  const { data: entries, loading, error, retry } = useFocusedResource(listEntries);
  const [range, setRange] = useState<GraphRange>('all');
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(120, Math.min(layout.contentMaxWidth, windowWidth) - space[5] * 4 - 2);
  const segments = useMemo(() => buildGraphSegments(filterEntriesByRange(entries ?? [], range)), [entries, range]);
  const points = segments.flat();
  return <Screen><ScreenHeader title="기록의 흐름" back={() => router.canGoBack() ? router.back() : router.replace('/records' as never)} /><AppText variant="bodySmall" tone="secondary">내가 남긴 수치예요. 좋고 나쁨을 판단하지 않고 기록을 찾아볼 수 있어요.</AppText><View style={styles.ranges}>{ranges.map(([id, label]) => <Button key={id} label={label} selected={range === id} variant={range === id ? 'primary' : 'subtle'} onPress={() => setRange(id)} />)}</View><LoadState loading={loading} error={error} onRetry={retry} />{!loading && !error ? <><Card>{points.length === 0 ? <AppText>이 기간에는 수치를 고른 기록이 없어요.</AppText> : <><AppText variant="caption" tone="secondary">세로축: 내가 남긴 수치 (-20 ~ +20) · 가로축: 날짜</AppText><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={color.border.default} />{segments.map((segment, index) => <Polyline key={index} fill="none" stroke={color.action.primary} strokeWidth="3" points={segment.map((point) => `${pointX(points.indexOf(point), points.length, width)},${pointY(point.value!)}`).join(' ')} />)}{points.map((point, index) => <Circle key={point.date} cx={pointX(index, points.length, width)} cy={pointY(point.value!)} r="6" fill={color.action.primary} />)}</Svg></>}</Card>{points.map((point) => <Button key={point.date} variant="subtle" label={`${point.date} · 수치 ${point.value} · 기록 보기`} onPress={() => router.push(`/entry/${point.date}` as never)} />)}{points.length ? <AppText variant="caption" tone="secondary">날짜를 누르면 해당 기록을 열어요.</AppText> : null}</> : null}</Screen>;
}

const pointX = (index: number, count: number, width: number) => count === 1 ? width / 2 : 20 + index * ((width - 40) / (count - 1));
const pointY = (value: number) => height / 2 - value * 4;
const styles = StyleSheet.create({ ranges: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] } });
