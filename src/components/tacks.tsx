import { Text } from "@/components/customFontText";
import DueDateBadge from "@/components/dueDates";
import { TackTagRow } from "@/components/tags";
import { DEFAULT_GROUP_COLOR, getGroupTextColor } from "@/constants/groupColors";
import type { TackWithTags } from "@/types/tacks";
import { playTackDropFeedback, playTackPickupFeedback } from "@/utils/haptics";
import { router } from "expo-router";
import { View } from "react-native";
import Sortable from "react-native-sortables";
import { statuses } from "./statuses";

type TackBoardProps = {
	tacks: TackWithTags[];
	onReorder: (tacks: TackWithTags[]) => void;
	parentSlug?: string;
	disabled?: boolean;
	fillHeight?: boolean;
};

type TackProps = {
	tack: TackWithTags;
	parentSlug?: string;
};

const getTackRotation = (id: string) => {
	const hash = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);
	return ((hash % 7) - 3) * 0.35;
};

export default function Tack({ tack, parentSlug }: TackProps) {
	const paperColor = tack.tack_group?.color ?? DEFAULT_GROUP_COLOR;
	const textColor = getGroupTextColor(paperColor);
	const openTack = () => {
		if (parentSlug) router.push({ pathname: "/tack/[parentSlug]/[childSlug]", params: { parentSlug, childSlug: tack.slug, } });
		else router.push({ pathname: "/tack/[parentSlug]", params: { parentSlug: tack.slug } });
	};

	return (
		<Sortable.Touchable
			className="aspect-square w-52 active:opacity-70"
			style={{
				shadowColor: "#000",
				shadowOffset: { width: 2, height: 5 },
				shadowOpacity: 0.28,
				shadowRadius: 5,
				elevation: 7,
				transform: [{ rotate: `${getTackRotation(tack.id)}deg` }],
			}}
			onTap={openTack}
		>
			<View className="flex-1 overflow-hidden" style={{ backgroundColor: paperColor }}>
				{/* Status ribbon and pushpin */}
				<View className={`h-3 ${statuses[tack.status]}`} />
				<View
					pointerEvents="none"
					className="absolute left-1/2 top-1 z-10 h-4 w-4 -translate-x-1/2 items-center rounded-full border border-black/25 bg-red-600"
					style={{ shadowColor: "#000", shadowOffset: { width: 1, height: 2 }, shadowOpacity: 0.45, shadowRadius: 2, elevation: 4 }}
				>
					<View className="mt-0.5 h-1.5 w-1.5 rounded-full bg-white/60" />
				</View>
				<View className="flex-1 justify-between overflow-hidden px-3 pb-3">
					<View className="flex-1 overflow-hidden">
						{tack.tack_group && <Text numberOfLines={1} className="mt-1 text-right text-sm" style={{ color: textColor, opacity: 0.65 }}>{tack.tack_group.name}</Text>}
						<Text numberOfLines={2} ellipsizeMode="tail" className="mb-1 text-center text-4xl" style={{ color: textColor }}>{tack.title}</Text>
						{Boolean(tack.description.length) && <Text numberOfLines={3} ellipsizeMode="tail" className="w-full text-xl" style={{ color: textColor }}>{tack.description}</Text>}
					</View>
					<View className="gap-1">
						<DueDateBadge dueDate={tack.due_date} status={tack.status} compact />
						<TackTagRow tags={tack.tags} />
					</View>
				</View>
			</View>
		</Sortable.Touchable>
	);
}
export const TackBoard = ({ tacks, onReorder, parentSlug, disabled = false, fillHeight = true }: TackBoardProps) => {
	const handleDragEnd = ({ fromIndex, toIndex }: { fromIndex: number; toIndex: number; }) => {
		playTackDropFeedback();
		if (fromIndex === toIndex) return;
		const reorderedTacks = [...tacks];
		const [movedTack] = reorderedTacks.splice(fromIndex, 1);
		if (!movedTack) return;
		reorderedTacks.splice(toIndex, 0, movedTack);
		onReorder(reorderedTacks);
	};

	return (
		<View className={fillHeight ? "h-full w-full" : "w-full"}>
			<Sortable.Flex
				key={tacks.map((tack) => tack.id).join("|")} width="fill" flexDirection="row" flexWrap="wrap"
				justifyContent="center" alignContent="flex-start" gap={24} paddingVertical={12} dragActivationDelay={0}
				activeItemScale={1.06} activeItemShadowOpacity={0.45} inactiveItemOpacity={0.88}
				sortEnabled={!disabled}
				onDragStart={playTackPickupFeedback} onDragEnd={handleDragEnd}
			>
				{tacks.map((tack) => <Tack key={tack.id} tack={tack} parentSlug={parentSlug} />)}
			</Sortable.Flex>
		</View>
	);
};
