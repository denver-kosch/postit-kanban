import { Text as RNText, TextInput as RNTextInput, type TextProps, type TextInputProps } from "react-native";

type CustomTextProps = TextProps & {
  bold?: boolean;
};

export const Text = ({ bold = false, style, ...props}: CustomTextProps) => <RNText {...props} style={[bold ? {fontFamily: "AmaticSC-Bold"} : {fontFamily: "AmaticSC-Regular"}, style]} />;


type CustomTextInputProps = TextInputProps & {
  bold?: boolean
};

export const TextInput = ({ bold = false, style, ...props}: CustomTextInputProps) => <RNTextInput {...props} style={[bold ? {fontFamily: "AmaticSC-Bold"} : {fontFamily: "AmaticSC-Regular"}, style]} />;