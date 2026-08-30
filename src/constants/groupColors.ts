export const DEFAULT_GROUP_COLOR = "#ffff99";

export type GroupColorPickerProps = {
	value: string;
	onChange: (color: string) => void;
	disabled?: boolean;
	accessibilityLabel?: string;
};

export const normalizeGroupColor = (value: string) => {
	const candidate = value.trim().startsWith("#") ? value.trim() : `#${value.trim()}`;
	return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate.toLowerCase() : null;
};

export const getGroupTextColor = (backgroundColor: string) => {
	const normalized = normalizeGroupColor(backgroundColor) ?? DEFAULT_GROUP_COLOR;
	const red = Number.parseInt(normalized.slice(1, 3), 16);
	const green = Number.parseInt(normalized.slice(3, 5), 16);
	const blue = Number.parseInt(normalized.slice(5, 7), 16);
	const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
	return luminance > 0.55 ? "#171717" : "#ffffff";
};
