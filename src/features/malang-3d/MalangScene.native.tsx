import { Component, type ReactNode, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button } from '@/design-system/components';
import { color, space } from '@/design-system/tokens';
import type { FaceParametersV1 } from '@/domain/face';
import type { FaceSnapshotV1 } from '@/domain/entry';
import { StaticMalang } from './StaticMalang';

type Props = { face: FaceParametersV1; appearance?: FaceSnapshotV1['appearance'] };

function RendererFallback({ face, appearance, onRetry }: Props & { onRetry: () => void }) {
  return <View style={styles.fallback}><StaticMalang face={face} appearance={appearance} /><View style={styles.retry}><View accessibilityRole="alert" accessibilityLiveRegion="polite"><AppText variant="bodySmall">3D 미리보기를 불러오지 못했어요. 2D 모습으로 계속 볼 수 있어요.</AppText></View><Button label="3D 다시 시도" variant="subtle" onPress={onRetry} /></View></View>;
}

class RendererBoundary extends Component<Props & { children: ReactNode; onRetry: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <RendererFallback face={this.props.face} appearance={this.props.appearance} onRetry={this.props.onRetry} /> : this.props.children; }
}

function NativeRenderer(props: Props & { onFailure: () => void }) {
  const { FilamentMalang } = require('./FilamentMalang') as typeof import('./FilamentMalang');
  return <FilamentMalang {...props} />;
}

export function MalangScene(props: Props) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const onFailure = useCallback(() => setFailed(true), []);
  const retry = () => { setFailed(false); setAttempt(value => value + 1); };
  return <View accessibilityLabel="말랑이 미리보기" style={styles.container}><RendererBoundary key={attempt} {...props} onRetry={retry}>{failed ? <RendererFallback {...props} onRetry={retry} /> : <NativeRenderer {...props} onFailure={onFailure} />}</RendererBoundary></View>;
}
const styles = StyleSheet.create({ container: { height: 320, width: '100%', overflow: 'hidden', borderRadius: 20 }, fallback: { flex: 1 }, retry: { position: 'absolute', left: space[3], right: space[3], bottom: space[3], backgroundColor: color.bg.surface, borderRadius: 14, padding: space[2], gap: space[1] } });
