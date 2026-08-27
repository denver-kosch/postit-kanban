import { Text } from "@/components/customFontText";
import type { Tack, TackWithGroup } from "@/types/tacks";
import { supabase } from "@/utils/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

type TackWithChildren = TackWithGroup & {
    children: Tack[];
};

const StickyNotePage = () => {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [tack, setTack] = useState<TackWithChildren | null>(null);

    useEffect(() => {
        if (!slug) {
            if (router.canGoBack()) router.back();
            else router.replace("/");
            return;
        }

        const getTack = async () => {
            const { data: parent, error: parentError } = await supabase
                .from("tacks")
                .select("*, tack_group:tack_groups(name)")
                .eq("slug", slug)
                .single();

            if (parentError) {
                console.error("Error getting tack", parentError.message);
                return;
            }

            const { data: children, error: childrenError } = await supabase
                .from("tacks")
                .select("*")
                .eq("parent_tack_id", parent.id)
                .order("created_at");

            if (childrenError) {
                console.error("Error getting child tacks", childrenError.message);
                return;
            }

            setTack({ ...parent, children });
        };

        void getTack();
    }, [slug]);

    return (
        <View className="h-full w-full">
            <Text bold className="ml-10 text-5xl">{tack?.title}</Text>
        </View>
    );
};

export default StickyNotePage;
