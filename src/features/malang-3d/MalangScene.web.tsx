import type { FaceParametersV1 } from '@/domain/face';
import type { FaceSnapshotV1 } from '@/domain/entry';
import { StaticMalang } from './StaticMalang';

/** Browser-safe visual fallback: native development builds render the GLB. */
export function MalangScene({ appearance }: { face: FaceParametersV1; appearance?: FaceSnapshotV1['appearance'] }) { return <StaticMalang appearance={appearance} />; }
