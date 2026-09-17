import { ActivityIndicator, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Surface';

export function LoadState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  if (loading) return <Card><View accessible accessibilityRole="progressbar" accessibilityLabel="기록 불러오는 중" accessibilityState={{ busy: true }}><ActivityIndicator /><AppText>기록을 불러오고 있어요.</AppText></View></Card>;
  if (error) return <Card><View accessibilityRole="alert" accessibilityLiveRegion="polite"><AppText>{error}</AppText></View><Button label="다시 시도" onPress={onRetry} /></Card>;
  return null;
}
