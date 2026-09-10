import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import { color, radius, space } from './tokens';
type Variant = 'display'|'title'|'body'|'bodySmall'|'caption';
const typography: Record<Variant, TextStyle> = { display:{fontSize:32,lineHeight:40,fontWeight:'700'}, title:{fontSize:24,lineHeight:32,fontWeight:'700'}, body:{fontSize:16,lineHeight:24}, bodySmall:{fontSize:14,lineHeight:20}, caption:{fontSize:12,lineHeight:16} };
export function AppText({variant='body', children}: PropsWithChildren<{variant?:Variant}>) { return <Text style={[styles.text, typography[variant]]}>{children}</Text>; }
export function Card({children,style}: PropsWithChildren<{style?:ViewStyle}>) { return <View style={[styles.card,style]}>{children}</View>; }
export function Button({label,onPress,variant='primary'}:{label:string;onPress?:()=>void;variant?:'primary'|'subtle'}) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed})=>[styles.button,variant==='primary'?styles.primary:styles.subtle,pressed&&styles.pressed]}><Text style={styles.buttonText}>{label}</Text></Pressable>; }
const styles=StyleSheet.create({text:{color:color.text.primary},card:{backgroundColor:color.bg.surface,borderRadius:radius.card,padding:space[4],gap:space[2],borderWidth:1,borderColor:color.border.default},button:{minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:radius.control,paddingHorizontal:space[4]},primary:{backgroundColor:color.action.primary},subtle:{backgroundColor:color.action.subtle},pressed:{opacity:.75},buttonText:{color:color.text.primary,fontSize:14,lineHeight:20,fontWeight:'600'}});
