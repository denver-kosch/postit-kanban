import { Text as RNText, type TextProps } from "react-native";

type CustomTextProps = TextProps & {
  bold?: boolean;
};

export const Text = ({ bold = false, style, ...props}: CustomTextProps) => <RNText {...props} style={[bold ? {fontFamily: "AmaticSC-Bold"} : {fontFamily: "AmaticSC-Regular"}, style]} />;
