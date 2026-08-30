import { Text, TextInput } from "@/components/customFontText";
import { getDueDateCategory, type DueDateCategory } from "@/components/dueDates";
import { formatStatus, statuses, statusOptions, type TackStatus } from "@/components/statuses";
import type { TackWithTags } from "@/types/tacks";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

export const UNGROUPED_FILTER = "__ungrouped__";

export type TackFilterState = {
	query: string;
	groupIds: string[];
	tagIds: string[];
	statuses: TackStatus[];
	dueDates: DueDateCategory[];
};

export const emptyTackFilters: TackFilterState = {
	query: "",
	groupIds: [],
	tagIds: [],
	statuses: [],
	dueDates: [],
};

export const hasActiveTackFilters = (filters: TackFilterState) => Boolean(
	filters.query.trim()
	|| filters.groupIds.length
	|| filters.tagIds.length
	|| filters.statuses.length
	|| filters.dueDates.length
);

export const filterTacks = (tacks: TackWithTags[], filters: TackFilterState) => {
	const words = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);

	return tacks.filter((tack) => {
		const searchableText = `${tack.title} ${tack.description}`.toLowerCase();
		const matchesWords = words.every((word) => searchableText.includes(word));
		const groupKey = tack.group_id ?? UNGROUPED_FILTER;
		const matchesGroup = !filters.groupIds.length || filters.groupIds.includes(groupKey);
		const matchesTags = !filters.tagIds.length || filters.tagIds.some((tagId) => tack.tags.some((tag) => tag.id === tagId));
		const matchesStatus = !filters.statuses.length || filters.statuses.includes(tack.status);
		const matchesDueDate = !filters.dueDates.length || filters.dueDates.includes(getDueDateCategory(tack.due_date, tack.status));

		return matchesWords && matchesGroup && matchesTags && matchesStatus && matchesDueDate;
	});
};

type FilterOption = {
	value: string;
	label: string;
	colorClass?: string;
	color?: string;
};

type FilterDropdownProps = {
	label: string;
	options: FilterOption[];
	selectedValues: string[];
	isOpen: boolean;
	onToggleOpen: () => void;
	onToggleValue: (value: string) => void;
};

const FilterDropdown = ({ label, options, selectedValues, isOpen, onToggleOpen, onToggleValue }: FilterDropdownProps) => (
	<View className="relative">
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${label} filter${selectedValues.length ? `, ${selectedValues.length} selected` : ""}`}
			accessibilityState={{ expanded: isOpen }}
			onPress={onToggleOpen}
			className={`h-11 flex-row items-center gap-2 rounded-md border px-3 active:opacity-60 ${selectedValues.length ? "border-cyan bg-cyan/20" : "border-black/15 bg-white/80"}`}
		>
			<Text bold className="text-xl">{label}</Text>
			{selectedValues.length > 0 && (
				<View className="min-w-5 items-center rounded-full bg-black/10 px-1.5">
					<Text bold>{selectedValues.length}</Text>
				</View>
			)}
			<Text>{isOpen ? "▴" : "▾"}</Text>
		</Pressable>

		{isOpen && (
			<View className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-md border border-black/15 bg-white shadow-xl" style={{ zIndex: 50, elevation: 50 }}>
				{options.length ? (
					<ScrollView className="max-h-64" keyboardShouldPersistTaps="handled">
						{options.map((option) => {
							const isSelected = selectedValues.includes(option.value);
							return (
								<Pressable
									key={option.value}
									accessibilityRole="checkbox"
									accessibilityState={{ checked: isSelected }}
									onPress={() => onToggleValue(option.value)}
									className={`flex-row items-center gap-2 px-3 py-2 active:bg-gray-100 ${isSelected ? "bg-cyan/10" : "bg-white"}`}
								>
									<View className={`h-4 w-4 items-center justify-center rounded border ${isSelected ? "border-cyan bg-cyan" : "border-black/25 bg-white"}`}>
										{isSelected && <Text bold className="text-xs">✓</Text>}
									</View>
									{(option.colorClass || option.color) && <View className={`h-3 w-3 rounded-full ${option.colorClass ?? ""}`} style={option.color ? { backgroundColor: option.color } : undefined} />}
									<Text numberOfLines={1} className="flex-1 text-lg">{option.label}</Text>
								</Pressable>
							);
						})}
					</ScrollView>
				) : (
					<Text className="px-3 py-3 text-lg text-black/50">No options yet</Text>
				)}
			</View>
		)}
	</View>
);

type TackFiltersProps = {
	tacks: TackWithTags[];
	filters: TackFilterState;
	onChange: (filters: TackFilterState) => void;
	resultCount: number;
};

type OpenFilter = "groups" | "tags" | "statuses" | "dueDates" | null;

const toggleValue = <T extends string>(values: T[], value: T) => values.includes(value)
	? values.filter((current) => current !== value)
	: [...values, value];

const TackFilters = ({ tacks, filters, onChange, resultCount }: TackFiltersProps) => {
	const [openFilter, setOpenFilter] = useState<OpenFilter>(null);

	const groupOptions = Array.from(
		new Map(
			tacks.map((tack) => [
				tack.group_id ?? UNGROUPED_FILTER,
				{ value: tack.group_id ?? UNGROUPED_FILTER, label: tack.tack_group?.name ?? "Ungrouped", color: tack.tack_group?.color },
			])
		).values()
	).sort((left, right) => left.label.localeCompare(right.label));

	const tagOptions = Array.from(
		new Map(tacks.flatMap((tack) => tack.tags.map((tag) => [tag.id, { value: tag.id, label: `#${tag.name}` }]))).values()
	).sort((left, right) => left.label.localeCompare(right.label));

	const statusFilterOptions = statusOptions.map((status) => ({
		value: status,
		label: formatStatus(status),
		colorClass: statuses[status],
	}));
	const dueDateOptions: FilterOption[] = [
		{ value: "overdue", label: "Overdue" },
		{ value: "today", label: "Due today" },
		{ value: "upcoming", label: "Next 7 days" },
		{ value: "later", label: "Later" },
		{ value: "none", label: "No due date" },
	];

	return (
		<View className="relative z-40 mx-4 mt-4" style={{ zIndex: 40, elevation: 40 }}>
			<View className="flex-row flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-white/85 p-2 shadow-md">
				<View className="h-11 min-w-56 flex-1 flex-row items-center rounded-md border border-black/15 bg-white px-3">
					<Text className="mr-2 text-xl">⌕</Text>
					<TextInput
						accessibilityLabel="Search tack titles and descriptions"
						value={filters.query}
						onChangeText={(query) => onChange({ ...filters, query })}
						placeholder="Search titles and descriptions..."
						className="h-full flex-1 text-xl outline-none"
					/>
				</View>

				<FilterDropdown
					label="Group"
					options={groupOptions}
					selectedValues={filters.groupIds}
					isOpen={openFilter === "groups"}
					onToggleOpen={() => setOpenFilter(openFilter === "groups" ? null : "groups")}
					onToggleValue={(value) => onChange({ ...filters, groupIds: toggleValue(filters.groupIds, value) })}
				/>
				<FilterDropdown
					label="Tags"
					options={tagOptions}
					selectedValues={filters.tagIds}
					isOpen={openFilter === "tags"}
					onToggleOpen={() => setOpenFilter(openFilter === "tags" ? null : "tags")}
					onToggleValue={(value) => onChange({ ...filters, tagIds: toggleValue(filters.tagIds, value) })}
				/>
				<FilterDropdown
					label="Status"
					options={statusFilterOptions}
					selectedValues={filters.statuses}
					isOpen={openFilter === "statuses"}
					onToggleOpen={() => setOpenFilter(openFilter === "statuses" ? null : "statuses")}
					onToggleValue={(value) => onChange({ ...filters, statuses: toggleValue(filters.statuses, value as TackStatus) })}
				/>
				<FilterDropdown
					label="Due"
					options={dueDateOptions}
					selectedValues={filters.dueDates}
					isOpen={openFilter === "dueDates"}
					onToggleOpen={() => setOpenFilter(openFilter === "dueDates" ? null : "dueDates")}
					onToggleValue={(value) => onChange({ ...filters, dueDates: toggleValue(filters.dueDates, value as DueDateCategory) })}
				/>

				<Text className="px-2 text-lg text-black/60">{resultCount} of {tacks.length}</Text>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Clear all filters"
					disabled={!hasActiveTackFilters(filters)}
					onPress={() => {
						setOpenFilter(null);
						onChange(emptyTackFilters);
					}}
					className="h-11 justify-center rounded-md px-3 active:bg-black/5 disabled:opacity-30"
				>
					<Text bold className="text-xl">Clear</Text>
				</Pressable>
			</View>
		</View>
	);
};

export default TackFilters;
