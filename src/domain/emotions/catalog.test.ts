import { EMOTIONS, emotionName } from './catalog';
describe('emotion catalog', () => {
  it('provides 43 stable choices', () => { expect(EMOTIONS).toHaveLength(43); expect(new Set(EMOTIONS.map(emotion => emotion.id)).size).toBe(43); });
  it('gives every choice a distinct display name', () => expect(new Set(EMOTIONS.map(emotion => emotion.name)).size).toBe(43));
  it('resolves a stored id to its display name', () => expect(emotionName('emotion-01')).toBe('기쁨'));
});
