import { Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/design-system/components';
import { useAppearance } from '@/features/appearance/store';
import { adjustFaceAxis, type FaceAxis } from '@/domain/face';
import { MalangScene } from '@/features/malang-3d/MalangScene.android';
import { color, space } from '@/design-system/tokens';
const axes: Array<[FaceAxis, string]> = [['width', '너비'], ['length', '길이'], ['skewX', '기울기'], ['tilt', '방향'], ['volume', '볼륨']];
export default function FaceStudio() { const { face, setFace } = useAppearance(); const change = (axis: FaceAxis, delta: number) => setFace(adjustFaceAxis(face, axis, delta)); return <Screen><ScreenHeader title="말랑이 꾸미기" back={() => router.back()}/><AppText variant="bodySmall" tone="secondary">현재 모습은 이미 쓴 기록을 바꾸지 않아요.</AppText>{Platform.OS === 'web' ? <MalangScene face={face}/> : <MalangScene face={face}/>}<Card>{axes.map(([axis, label]) => <View key={axis} style={styles.row}><View style={styles.label}><AppText variant="label">{label}</AppText><AppText variant="caption" tone="secondary">{face.face[axis].toFixed(1)}</AppText></View><Button label={`${label} 줄이기`} variant="subtle" onPress={() => change(axis, -.1)}/><Button label={`${label} 늘리기`} variant="subtle" onPress={() => change(axis, .1)}/></View>)}</Card></Screen>; }
const styles=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',gap:space[2],flexWrap:'wrap'},label:{minWidth:70,gap:space[0]}});
