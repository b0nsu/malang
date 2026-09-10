import { neutralFace } from '@/domain/face';
import { morphWeights } from './face-mapper';
it('maps neutral parameters to stable GLB morph target names', () => { expect(morphWeights(neutralFace)).toMatchObject({ eye_left_open: 1, mouth_open: 0, face_width: 0 }); });
