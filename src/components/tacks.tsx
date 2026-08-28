import { Text } from '@/components/customFontText';
import type { TackWithGroup } from "@/types/tacks";
import { router } from "expo-router";
import { View } from "react-native";
import Sortable from "react-native-sortables";

type PostItBoardProps = {
  tacks: TackWithGroup[];
  onReorder: (tacks: TackWithGroup[]) => void;
};

type TackProps = {
	tack: TackWithGroup;
	parentSlug?: string;
};

export default function Tack({ tack, parentSlug}: TackProps) {
	const openTack = () => {
		if (parentSlug) router.push({ pathname: "/tack/[parentSlug]/[childSlug]", params: { parentSlug, childSlug: tack.slug, } });
		else router.push({ pathname: "/tack/[parentSlug]", params: { parentSlug: tack.slug } });
	};

	return (
		<Sortable.Touchable className={"aspect-square w-52 items-center bg-tack-yellow active:opacity-50"} onTap={openTack} >
			<Text className={"mt-1 text-4xl"} >{tack.title}</Text>
		</Sortable.Touchable>
	);
}




export const TackBoard = ({ tacks, onReorder } : PostItBoardProps) => {
	const handleDragEnd = ({ fromIndex, toIndex, }: { fromIndex: number; toIndex: number; }) => {
		if (fromIndex === toIndex) return;
		const reorderedTacks = [...tacks];
		const [movedTack] = reorderedTacks.splice(fromIndex, 1);
		if (!movedTack) return;
		reorderedTacks.splice(toIndex, 0, movedTack);
		onReorder(reorderedTacks);
	};

	return (
	<View className="h-full w-full">
		<Sortable.Flex
			key={tacks.map((tack) => tack.id).join("|")} width="fill" flexDirection="row" flexWrap="wrap"
			justifyContent="center" alignContent="flex-start" gap={24} paddingVertical={8} dragActivationDelay={0} onDragEnd={handleDragEnd}
		>
			{tacks.map((tack) => <Tack key={tack.id} tack={tack} /> )}
		</Sortable.Flex>
    </View>
)}
