import type { Tack } from "@/types/tacks";
import { useCallback } from "react";
import { Text, TouchableOpacity } from "react-native";
import Sortable, {
  type SortableGridRenderItem,
} from "react-native-sortables";

export default function PostIt({ tack }: { tack: Tack }) {
  return (
    <TouchableOpacity
      disabled={!!tack.parent_tack_id}
      onPress={() => {}}
      className="bg-tack-yellow"
    >
      <Text>{tack.title}</Text>
    </TouchableOpacity>
  );
}

export function PostItBoard({ tacks }: { tacks: Tack[] }) {
  const renderItem = useCallback<SortableGridRenderItem<Tack>>(({ item }) => <PostIt tack={item} key={item.id} />, []);

  return <Sortable.Grid data={tacks} renderItem={renderItem} />;
}