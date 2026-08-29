import { Text } from '@/components/customFontText';
import { TackTagRow } from '@/components/tags';
import type { TackWithTags } from "@/types/tacks";
import { router } from "expo-router";
import { View } from "react-native";
import Sortable from "react-native-sortables";
import { statuses } from './statuses';

type TackBoardProps = {
  tacks: TackWithTags[];
  onReorder: (tacks: TackWithTags[]) => void;
};

type TackProps = {
	tack: TackWithTags;
	parentSlug?: string;
};

export default function Tack({ tack, parentSlug}: TackProps) {
	const openTack = () => {
		if (parentSlug) router.push({ pathname: "/tack/[parentSlug]/[childSlug]", params: { parentSlug, childSlug: tack.slug, } });
		else router.push({ pathname: "/tack/[parentSlug]", params: { parentSlug: tack.slug } });
	};

	return (
		<Sortable.Touchable className="aspect-square w-52 overflow-hidden bg-tack-yellow active:opacity-50" onTap={openTack} >
			{/* Status ribbon */}
			<View className={`h-3 ${statuses[tack.status]}`}/>
			<View className="flex-1 justify-between overflow-hidden px-3 pb-3">
				<View className="flex-1 overflow-hidden">
					<Text numberOfLines={2} ellipsizeMode="tail" className="mb-1 mt-1 text-center text-4xl">{tack.title}</Text>
					{Boolean(tack.description.length) && <Text numberOfLines={3} ellipsizeMode="tail" className="w-full text-xl">{tack.description}</Text>}
				</View>
				<TackTagRow tags={tack.tags} />
			</View>
		</Sortable.Touchable>
	);
}




export const TackBoard = ({ tacks, onReorder } : TackBoardProps) => {
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
