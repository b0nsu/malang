import type { FaceParametersV1 } from '@/domain/face';
import type { FaceSnapshotV1 } from '@/domain/entry';
import { StaticMalang } from './StaticMalang';

export function MalangScene(props: { face: FaceParametersV1; appearance?: FaceSnapshotV1['appearance'] }) { return <StaticMalang {...props} />; }
