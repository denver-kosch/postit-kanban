import { Text } from "@/components/customFontText";
import type { Tack } from "@/types/tacks";
import { View } from "react-native";

export type DueDateCategory = "overdue" | "today" | "upcoming" | "later" | "none";

const parseDateOnly = (value: string) => {
	const [year, month, day] = value.slice(0, 10).split("-").map(Number);
	return new Date(year, month - 1, day, 12);
};

const getDayDifference = (date: Date) => {
	const today = new Date();
	const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
	const dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
	return Math.round((dateUtc - todayUtc) / 86_400_000);
};

export const getDueDateCategory = (dueDate: string | null, status?: Tack["status"]): DueDateCategory => {
	if (!dueDate) return "none";
	if (status === "closed") return "later";

	const difference = getDayDifference(parseDateOnly(dueDate));
	if (difference < 0) return "overdue";
	if (difference === 0) return "today";
	if (difference <= 7) return "upcoming";
	return "later";
};

const getDueDateLabel = (dueDate: string, status?: Tack["status"]) => {
	const date = parseDateOnly(dueDate);
	const difference = getDayDifference(date);

	if (status !== "closed") {
		if (difference < -1) return `${Math.abs(difference)} days overdue`;
		if (difference === -1) return "1 day overdue";
		if (difference === 0) return "Due today";
		if (difference === 1) return "Due tomorrow";
		if (difference <= 7) return `Due in ${difference} days`;
	}

	return `Due ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date)}`;
};

const categoryStyles: Record<Exclude<DueDateCategory, "none">, string> = {
	overdue: "border-red-400/50 bg-red-100",
	today: "border-amber-400/60 bg-amber-100",
	upcoming: "border-blue-400/40 bg-blue-100",
	later: "border-black/15 bg-white/75",
};

type DueDateBadgeProps = {
	dueDate: string | null;
	status?: Tack["status"];
	compact?: boolean;
	className?: string;
};

const DueDateBadge = ({ dueDate, status, compact = false, className = "" }: DueDateBadgeProps) => {
	if (!dueDate) return null;

	const category = getDueDateCategory(dueDate, status);
	const label = getDueDateLabel(dueDate, status);

	return (
		<View
			accessibilityLabel={label}
			className={`self-start rounded-full border ${categoryStyles[category === "none" ? "later" : category]} ${compact ? "px-2 py-0.5" : "px-3 py-1"} ${className}`}
		>
			<Text bold className={compact ? "text-sm" : "text-xl"}>📅 {label}</Text>
		</View>
	);
};

export default DueDateBadge;
