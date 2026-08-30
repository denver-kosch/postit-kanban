import { Text } from "@/components/customFontText";
import { getDueDateCategory } from "@/components/dueDates";
import { statuses, type TackStatus } from "@/components/statuses";
import type { TackWithTags } from "@/types/tacks";
import { View } from "react-native";

type BoardSummaryProps = {
	tacks: TackWithTags[];
};

type SummaryItem = {
	label: string;
	count: number;
	dotClassName?: string;
	icon?: string;
};

const trackedStatuses: { label: string; status: TackStatus }[] = [
	{ label: "Open", status: "open" },
	{ label: "Active", status: "active" },
	{ label: "Awaiting", status: "awaiting" },
];

const BoardSummary = ({ tacks }: BoardSummaryProps) => {
	const items: SummaryItem[] = [
		...trackedStatuses.map(({ label, status }) => ({
			label,
			count: tacks.filter((tack) => tack.status === status).length,
			dotClassName: statuses[status],
		})),
		{
			label: "Due today",
			count: tacks.filter((tack) => getDueDateCategory(tack.due_date, tack.status) === "today").length,
			icon: "◷",
		},
		{
			label: "Overdue",
			count: tacks.filter((tack) => getDueDateCategory(tack.due_date, tack.status) === "overdue").length,
			icon: "!",
		},
	];

	return (
		<View className="mx-3 mb-2 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-lg border border-black/10 bg-white/75 px-4 py-2 shadow-sm">
			<Text bold className="text-lg text-black/55">Board snapshot</Text>
			{items.map((item) => (
				<View key={item.label} accessibilityLabel={`${item.label}: ${item.count}`} className="flex-row items-center gap-1.5">
					{item.dotClassName ? (
						<View className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} />
					) : (
						<Text bold className={item.label === "Overdue" ? "text-base text-red-700" : "text-base text-amber-700"}>{item.icon}</Text>
					)}
					<Text bold className="text-lg">{item.count}</Text>
					<Text className="text-lg text-black/65">{item.label}</Text>
				</View>
			))}
		</View>
	);
};

export default BoardSummary;
