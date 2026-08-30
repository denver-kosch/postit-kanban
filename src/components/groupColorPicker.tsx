import { Text, TextInput } from "@/components/customFontText";
import { normalizeGroupColor, type GroupColorPickerProps } from "@/constants/groupColors";
import { useState } from "react";
import { View } from "react-native";

const GroupColorPicker = ({ value, onChange, disabled = false, accessibilityLabel = "Group color" }: GroupColorPickerProps) => {
	const [draft, setDraft] = useState(value);

	const commitDraft = () => {
		const normalized = normalizeGroupColor(draft);
		if (normalized) onChange(normalized);
		else setDraft(value);
	};

	return (
		<View className="flex-row items-center gap-3 rounded-md bg-white/80 p-2">
			<View className="h-10 w-10 rounded-full border border-black/20" style={{ backgroundColor: normalizeGroupColor(draft) ?? value }} />
			<View>
				<Text className="text-base text-black/55">Hex color</Text>
				<TextInput
					accessibilityLabel={`${accessibilityLabel} hex value`}
					value={draft}
					readOnly={disabled}
					maxLength={7}
					autoCapitalize="none"
					autoCorrect={false}
					onChangeText={setDraft}
					onBlur={commitDraft}
					onSubmitEditing={commitDraft}
					className="w-28 rounded border border-black/20 bg-white px-3 py-2 text-xl"
				/>
			</View>
		</View>
	);
};

export default GroupColorPicker;
