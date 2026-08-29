import type { Tag } from "@/types/tacks";
import { View } from "react-native";
import { Text } from "./customFontText";

const MAX_TACK_TAGS = 3;

const TagChip = ({ tag, mini = false }: { tag: Tag; mini?: boolean }) => (
	<View className={`rounded-full border border-black/15 bg-white/90 shadow-sm ${mini ? "max-w-16 px-2 py-0.5" : "max-w-40 px-3 py-1"}`}>
		<Text numberOfLines={1} ellipsizeMode="tail" className={mini ? "text-sm" : "text-lg"}>#{tag.name}</Text>
	</View>
);

const TackTagRow = ({ tags }: { tags: Tag[] }) => {
	if (!tags.length) return null;

	const visibleTags = tags.slice(0, MAX_TACK_TAGS);
	const overflowCount = tags.length - visibleTags.length;

	return (
		<View className="h-7 w-full flex-row items-center gap-1 overflow-hidden" accessibilityLabel={`Tags: ${tags.map((tag) => tag.name).join(", ")}`}>
			{visibleTags.map((tag) => <TagChip tag={tag} mini key={tag.id} />)}
			{overflowCount > 0 && (
				<View className="rounded-full border border-black/15 bg-black/10 px-2 py-0.5">
					<Text bold className="text-sm">+{overflowCount}</Text>
				</View>
			)}
		</View>
	);
};

type TagBlockProps = {
	tags: Tag[];
	className?: string;
};

const TagBlock = ({ tags, className = "" }: TagBlockProps) => (
	<View
		className={`w-fit max-w-full rounded-lg border border-black/10 bg-white/75 p-3 shadow-sm ${className}`}
		accessibilityLabel={tags.length ? `Tags: ${tags.map((tag) => tag.name).join(", ")}` : "No tags"}
	>
		<View className="mb-2 flex-row items-center justify-between">
			<Text bold className="text-2xl">Tags</Text>
			<View className="rounded-full bg-black/10 px-2 py-0.5">
				<Text bold className="text-base">{tags.length}</Text>
			</View>
		</View>

		{tags.length ? (
			<View className="flex-row flex-wrap gap-2">
				{tags.map((tag) => <TagChip tag={tag} key={tag.id} />)}
			</View>
		) : (
			<Text className="text-lg text-black/55">No tags yet</Text>
		)}
	</View>
);

export default TagBlock;
export { TackTagRow, TagChip };
