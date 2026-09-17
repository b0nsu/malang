import { Children, type ReactElement } from 'react';
import { BottomTabs } from './BottomTabs';
import { ValuePicker } from '../entry-controls';
import { layout } from '../tokens';

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 12, right: 8 }) }));

it('selects tabs through callbacks, exposes selection, and reserves safe-area space', () => {
  const onToday = jest.fn();
  const onRecords = jest.fn();
  const onStudio = jest.fn();
  const onLongPress = jest.fn();
  const tree = BottomTabs({ active: 'records', onToday, onRecords, onStudio, onLongPress });
  const tabs = Children.toArray(tree.props.children) as ReactElement<any>[];
  expect(tabs.map(tab => tab.props.accessibilityState.selected)).toEqual([false, true, false]);
  expect(tabs.map(tab => tab.props.accessibilityLabel)).toEqual(['오늘', '기록', '말랑이']);
  tabs[2].props.onPress();
  tabs[1].props.onLongPress();
  expect(onStudio).toHaveBeenCalledTimes(1);
  expect(onToday).not.toHaveBeenCalled();
  expect(onRecords).not.toHaveBeenCalled();
  expect(onLongPress).toHaveBeenCalledWith('records');
  expect(tree.props.style[1]).toMatchObject({ minHeight: layout.tabBarHeight + 34, paddingBottom: 34, paddingLeft: 12, paddingRight: 8 });
  expect(tabs[0].props.style.minHeight).toBeGreaterThanOrEqual(48);
});

it('keeps the value optional and distinguishes zero from no value', () => {
  const onChange = jest.fn();
  const tree = ValuePicker({ value: 0, onChange });
  const children = Children.toArray(tree.props.children) as ReactElement<any>[];
  const none = children[1];
  const values = Children.toArray(children[2].props.children) as ReactElement<any>[];
  expect(none.props.selected).toBe(false);
  const selected = values.filter(value => value.props.selected);
  expect(selected).toHaveLength(1);
  selected[0].props.onPress();
  expect(onChange).toHaveBeenLastCalledWith(0);
  none.props.onPress();
  expect(onChange).toHaveBeenLastCalledWith(null);
});
