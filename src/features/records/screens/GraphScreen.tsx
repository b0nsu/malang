import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { AppText, Button, Card, LoadState, Screen, ScreenHeader } from '@/design-system/components';
import { listEntries } from '@/data/repositories/entries';
import { emotionName } from '@/domain/emotions/catalog';
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
  const filteredEntries = useMemo(() => filterEntriesByRange(entries ?? [], range), [entries, range]);
  const segments = useMemo(() => buildGraphSegments(filteredEntries), [filteredEntries]);
  const points = segments.flat();
  const firstDate = points[0]?.date;
  const lastDate = points.at(-1)?.date;
  const emotionsByDate = new Map(filteredEntries.map(entry => [entry.date, emotionName(entry.emotionId)]));
  const openRecord = (date: string) => router.push(`/entry/${date}` as never);

  return <Screen>
    <ScreenHeader title="기록의 흐름" back={() => router.canGoBack() ? router.back() : router.replace('/records' as never)} />
    <AppText variant="bodySmall" tone="secondary">내가 직접 남긴 수치예요. 좋고 나쁨을 판단하는 점수가 아니라, 기록을 찾아보는 데 써요.</AppText>
    <View style={styles.ranges}>{ranges.map(([id, label]) => <Button key={id} label={label} selected={range === id} variant={range === id ? 'primary' : 'subtle'} onPress={() => setRange(id)} />)}</View>
    <LoadState loading={loading} error={error} onRetry={retry} />
    {!loading && !error ? <>
      <Card>
        <AppText variant="bodySmall">{ranges.find(([id]) => id === range)?.[1]} 기간 · 수치를 남긴 기록 {points.length}개</AppText>
        {points.length === 0 ? <AppText>이 기간에는 수치를 고른 기록이 없어요. 수치 없이 남긴 기록은 기록 목록에서 볼 수 있어요.</AppText> : <>
          <AppText variant="caption" tone="secondary">세로축: 내가 남긴 수치 (-20 ~ +20) · 가로축: 날짜 · 비어 있는 날은 연결하지 않아요.</AppText>
          <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={color.border.default} />
            {segments.map((segment, index) => <Polyline key={index} fill="none" stroke={color.action.primary} strokeWidth="3" points={segment.map(point => `${pointX(point.date, firstDate!, lastDate!, width)},${pointY(point.value!)}`).join(' ')} />)}
            {points.map(point => <Circle key={`hit-${point.date}`} cx={pointX(point.date, firstDate!, lastDate!, width)} cy={pointY(point.value!)} r="24" fill={color.action.primary} fillOpacity={0.01} onPress={() => openRecord(point.date)} />)}
            {points.map(point => <Circle key={point.date} cx={pointX(point.date, firstDate!, lastDate!, width)} cy={pointY(point.value!)} r="6" fill={color.action.primary} pointerEvents="none" />)}
          </Svg>
          <AppText variant="caption" tone="secondary">{firstDate} ~ {lastDate} · 그래프의 점이나 아래 기록을 누르면 상세로 이동해요.</AppText>
        </>}
      </Card>
      {points.map(point => <Button key={point.date} variant="subtle" label={`${point.date} · ${emotionsByDate.get(point.date)} · 내가 남긴 수치 ${point.value} · 기록 보기`} onPress={() => openRecord(point.date)} />)}
    </> : null}
  </Screen>;
}

const pointX = (date: string, firstDate: string, lastDate: string, width: number) => {
  const first = Date.parse(`${firstDate}T00:00:00Z`);
  const last = Date.parse(`${lastDate}T00:00:00Z`);
  return first === last ? width / 2 : 20 + (Date.parse(`${date}T00:00:00Z`) - first) / (last - first) * (width - 40);
};
const pointY = (value: number) => height / 2 - value * ((height / 2 - 24) / 20);
const styles = StyleSheet.create({ ranges: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] } });
