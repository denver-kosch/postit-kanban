import { View } from "react-native";
import { Text } from "./customFontText";
import type { Tag } from "@/types/tacks";

const MAX_TACK_TAGS = 2;

const TagChip = ({ tag, mini = false }: { tag: Tag; mini?: boolean }) => (
    <View className={`border border-black/20 bg-white/90 shadow-sm ${mini ? "max-w-16 px-2 py-0.5" : "px-3 py-1"}`}>
        <Text numberOfLines={1} ellipsizeMode="tail" className={mini ? "text-sm" : "text-base"}>#{tag.name}</Text>
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
                <View className="border border-black/15 bg-black/10 px-2 py-0.5">
                    <Text bold className="text-sm">+{overflowCount}</Text>
                </View>
            )}
        </View>
    );
};

const TagBlock = ({ tags }: { tags: Tag[] }) => {
    return (
        <View className="mt-4 flex-row flex-wrap items-center gap-2 justify-end">
            <Text bold className="mr-1 text-lg">Tags:</Text>
            {tags.map((tag) => <TagChip tag={tag} key={tag.id} />)}
        </View>
    );
};

export default TagBlock;
export { TackTagRow, TagChip };
