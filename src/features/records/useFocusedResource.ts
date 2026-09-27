import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useFocusedResource<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: string | null }>({ data: undefined, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setState({ data: undefined, loading: true, error: null });
    Promise.resolve().then(load).then(
      data => { if (active) setState({ data, loading: false, error: null }); },
      () => { if (active) setState({ data: undefined, loading: false, error: '기록을 불러오지 못했어요. 다시 시도해 주세요.' }); },
    );
    return () => { active = false; };
  }, [load, attempt]));
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return { ...state, retry };
}
