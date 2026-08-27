import type { Tack, TackWithGroup } from "@/types/tacks";
import { View } from "react-native";
import Sortable from "react-native-sortables";
import { Text } from '@/components/customFontText';
import { router } from "expo-router";

type PostItBoardProps = {
  tacks: TackWithGroup[];
  onReorder: (tacks: TackWithGroup[]) => void;
};

export default function PostIt({ tack }: { tack: TackWithGroup | Tack }) {
	return (
		<Sortable.Touchable className="aspect-square w-52 items-center bg-tack-yellow" onTap={() => router.push({ pathname: '/tack/[slug]', params: { slug:tack.slug } })} >
			<Text className="mt-1 text-4xl">{tack.title}</Text>
		</Sortable.Touchable>
	);
}




export const PostItBoard = ({ tacks, onReorder } : PostItBoardProps) => {
	const handleDragEnd = ({ fromIndex, toIndex, }: { fromIndex: number; toIndex: number; }) => {
		if (fromIndex === toIndex) return;
		const reorderedTacks = [...tacks];
		const [movedTack] = reorderedTacks.splice(fromIndex, 1);
		if (!movedTack) return;
		reorderedTacks.splice(toIndex, 0, movedTack);
		onReorder(reorderedTacks);
	};

	return (
	<View className="h-full w-full mt-8">
		<Sortable.Flex
			key={tacks.map((tack) => tack.id).join("|")} width="fill" height="fill" flexDirection="row" flexWrap="wrap"
			justifyContent="center" alignContent="flex-start" gap={24} paddingTop={8} dragActivationDelay={0} onDragEnd={handleDragEnd}
		>
			{tacks.map((tack) => (<PostIt key={tack.id} tack={tack} />))}
		</Sortable.Flex>
    </View>
)}