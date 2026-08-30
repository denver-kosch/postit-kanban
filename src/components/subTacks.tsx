import type { TackWithTags } from "@/types/tacks";
import { View } from "react-native";
import { TackBoard } from "./tacks";

type SubTacksProps = {
	parentSlug: string;
	subtacks: TackWithTags[];
	onReorder: (tacks: TackWithTags[]) => void;
	disabled?: boolean;
	className?: string;
};

const SubTacks = ({ parentSlug, subtacks, onReorder, disabled = false, className = "" }: SubTacksProps) => {
	return (
		<View className={`w-full ${className}`}>
			<TackBoard tacks={subtacks} parentSlug={parentSlug} disabled={disabled} fillHeight={false} onReorder={onReorder} />
		</View>
	);
};

export default SubTacks;
