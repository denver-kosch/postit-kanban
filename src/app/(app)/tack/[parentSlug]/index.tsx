import CreateTackModal from "@/components/createTackModal";
import { Text } from "@/components/customFontText";
import SubTacks from "@/components/subTacks";
import type { TackWithGroup } from "@/types/tacks";
import { supabase } from "@/utils/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ImageBackground, View } from "react-native";
import CircleButton from "@/components/circleButton";

const TackPage = () => {
	const { parentSlug: slug } = useLocalSearchParams<{ parentSlug: string }>();
	const [tack, setTack] = useState<TackWithGroup | null>(null);
	const [subtacks, setSubtacks] = useState<TackWithGroup[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [subtackModalIsVisible, setSubtackModalIsVisible] = useState<boolean>(false);

	const getSubtacks = async (pId: string) => {
		const { data, error } = await supabase.from("tacks").select("*, tack_group:tack_groups(name)").eq("parent_tack_id", pId).order("created_at");
		if (error) {
			console.error("Error getting child tacks", error.message);
			return;
		}
		setSubtacks(data);
	};

	useEffect(() => {
		if (!slug) {
			if (router.canGoBack()) router.back();
			else router.replace("/");
			return;
		}
		const getTack = async () => {
			setIsLoading(true);

			try {
				const { data: parent, error } = await supabase.from("tacks").select("*, tack_group:tack_groups(name)").eq("slug", slug).single();
				if (error) throw error;
				setTack(parent);
				if (parent.parent_tack_id === null) await getSubtacks(parent.id);
			} catch (error) {
				console.error("Error loading tack", error);
			} finally {
				setIsLoading(false);
			}
		};
		void getTack();
	}, [slug]);

	const deleteTack = async () => {
		if (!tack || isDeleting) return;

		const childCount = subtacks.length;
		const warning = childCount ? `Delete "${tack.title}" and its ${childCount} sub-tack(s)?` : `Delete "${tack.title}"?`;

		if (!window.confirm(warning)) return;

		setIsDeleting(true);

		const { data, error } = await supabase.from("tacks").delete().eq("id", tack.id).select("id");

		setIsDeleting(false);

		if (error) {
			window.alert(`Unable to delete tack: ${error.message}`);
			return;
		}

		if (!data.length) {
			window.alert("The tack was not deleted.");
			return;
		}

		router.replace("/");
	};

	const editTack = () => {

	};


	return (
		<ImageBackground source={require('@/assets/images/corkboard.jpg')} resizeMode="repeat" className="w-full h-full" >
			{isLoading ? <ActivityIndicator className="m-auto"/> : 
			<View className="w-auto h-auto grid grid-cols-5 gap-4 items-center justify-center my-4 mx-10">
				<Text bold className="col-span-3 col-start-2 justify-self-center bg-white/60 p-2 text-5xl">{tack?.title}</Text>
				<View className="col-start-5 flex-1 flex-row gap-4 place-self-center">
					<CircleButton label="✚" accessibilityLabel="Add tack" onPress={() => setSubtackModalIsVisible(true)} />
					<CircleButton label="✏️" accessibilityLabel="Edit tack" onPress={editTack} />
					<CircleButton label="🗑️" accessibilityLabel="Delete tack" onPress={deleteTack} destructive />
				</View>
				
				<Text className="text-3xl bg-white/60 p-2 w-fit col-start-1 col-span-2 justify-self-center">Description:{`\n${tack?.description}`}</Text>

				<View className="col-span-full">
					<SubTacks subtacks={subtacks} className="col-span-full" parentSlug={slug} />
				</View>

				<CreateTackModal visible={subtackModalIsVisible} onClose={() =>setSubtackModalIsVisible(false)} refresh={() => tack ? void getSubtacks(tack.id) : undefined} parent={tack} />
			</View>}
		</ImageBackground>
	);
};

export default TackPage;
