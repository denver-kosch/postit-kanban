import { Pressable } from "react-native";
import { Text } from "./customFontText";

type CircleButtonProps = {
	label: string;
	accessibilityLabel: string;
	onPress: () => void;
	destructive?: boolean;
};

function CircleButton({ label, accessibilityLabel, onPress, destructive = false }: CircleButtonProps) {
	return (
		<Pressable
			accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress}
			className={`h-16 w-16 items-center justify-center rounded-full active:opacity-50 ${destructive ? "bg-red-400" : "bg-white"}`}
		>
		<Text className="text-3xl">{label}</Text>
		</Pressable>
	);
}

export default CircleButton;