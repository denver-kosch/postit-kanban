import type { TackWithTags } from "@/types/tacks";
import Tack from "./tacks";
import Sortable from "react-native-sortables";
import { View } from "react-native";



const SubTacks = ({ parentSlug, subtacks, className: styles }: { parentSlug: string; subtacks: TackWithTags[]; className?: string }) => {

    return (
        <View className={`w-full ${styles}`} >
            <Sortable.Flex 
                key={subtacks.map((tack) => tack.id).join("|")} width="fill" flexDirection="row" 
                flexWrap="wrap" justifyContent="center" alignContent="flex-start" gap={24} 
            >
                {subtacks.map(tack => <Tack key={tack.id} tack={tack} parentSlug={parentSlug} />)}
            </Sortable.Flex>
        </View>
    );
};

export default SubTacks;
