import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { color, type } from '../tokens';

type TextVariant = keyof typeof type;

export function AppText({ variant = 'body', tone = 'primary', style, children }: PropsWithChildren<{ variant?: TextVariant; tone?: 'primary' | 'secondary' | 'tertiary' | 'inverse'; style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.text, type[variant], { color: color.text[tone] }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({ text: { includeFontPadding: false } });
