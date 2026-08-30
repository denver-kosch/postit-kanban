import { TextInput } from "@/components/customFontText";
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
			<input
				aria-label={`${accessibilityLabel} picker`}
				type="color"
				value={normalizeGroupColor(draft) ?? value}
				disabled={disabled}
				onChange={(event) => {
					const color = event.currentTarget.value.toLowerCase();
					setDraft(color);
					onChange(color);
				}}
				style={{ width: 52, height: 40, padding: 0, border: 0, background: "transparent", cursor: disabled ? "default" : "pointer" }}
			/>
			<TextInput
				accessibilityLabel={`${accessibilityLabel} hex value`}
				value={draft}
				editable={!disabled}
				maxLength={7}
				autoCapitalize="none"
				autoCorrect={false}
				onChangeText={setDraft}
				onBlur={commitDraft}
				onSubmitEditing={commitDraft}
				className="w-28 rounded border border-black/20 bg-white px-3 py-2 text-xl"
			/>
		</View>
	);
};

export default GroupColorPicker;
