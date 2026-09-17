import { neutralFace } from '@/domain/face';
import { defaultAppearance, normalizePersistedAppearance } from './store';

const customizedFace = {
  ...neutralFace,
  face: { ...neutralFace.face, width: 0.4 },
};

const customizedAppearance = {
  baseColor: '#A8A0C7',
  materialId: 'soft',
  decorationIds: ['sprout'],
};

describe('current appearance hydration', () => {
  it('keeps valid current face and appearance values', () => {
    expect(normalizePersistedAppearance({ face: customizedFace, appearance: customizedAppearance })).toEqual({
      face: customizedFace,
      appearance: customizedAppearance,
    });
  });

  it('recovers a corrupt face without discarding a valid appearance', () => {
    expect(normalizePersistedAppearance({ face: { version: 1 }, appearance: customizedAppearance })).toEqual({
      face: neutralFace,
      appearance: customizedAppearance,
    });
  });

  it('recovers a corrupt appearance without discarding a valid face', () => {
    expect(normalizePersistedAppearance({ face: customizedFace, appearance: { baseColor: 'invalid' } })).toEqual({
      face: customizedFace,
      appearance: defaultAppearance,
    });
  });
});
