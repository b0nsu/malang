import { Component, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FaceParametersV1 } from '@/domain/face';
import type { FaceSnapshotV1 } from '@/domain/entry';
import { StaticMalang } from './StaticMalang';

type Props = { face: FaceParametersV1; appearance?: FaceSnapshotV1['appearance'] };

class RendererBoundary extends Component<Props & { children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <StaticMalang face={this.props.face} appearance={this.props.appearance} /> : this.props.children; }
}

function NativeRenderer(props: Props) {
  const { FilamentMalang } = require('./FilamentMalang') as typeof import('./FilamentMalang');
  return <FilamentMalang {...props} />;
}

export function MalangScene(props: Props) {
  return <View accessibilityLabel="말랑이 미리보기" style={styles.container}><RendererBoundary {...props}><NativeRenderer {...props} /></RendererBoundary></View>;
}
const styles = StyleSheet.create({ container: { height: 320, width: '100%', overflow: 'hidden', borderRadius: 20 } });
