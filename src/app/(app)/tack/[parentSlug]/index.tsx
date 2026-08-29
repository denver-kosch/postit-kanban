import CircleButton from "@/components/circleButton";
import { Text } from "@/components/customFontText";
import StatusSetter from "@/components/statuses";
import SubTacks from "@/components/subTacks";
import TagBlock from "@/components/tags";
import TackFormModal from "@/components/tackFormModal";
import type { TackWithTags } from "@/types/tacks";
import { supabase } from "@/utils/supabase";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ImageBackground, View } from "react-native";

const TackPage = () => {
	const { parentSlug: slug } = useLocalSearchParams<{ parentSlug: string }>();
	const [tack, setTack] = useState<TackWithTags | null>(null);
	const [subtacks, setSubtacks] = useState<TackWithTags[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [subtackModalIsVisible, setSubtackModalIsVisible] = useState<boolean>(false);
	const [editModalIsVisible, setEditModalIsVisible] = useState(false);

	const getSubtacks = async (pId: string) => {
		const { data, error } = await supabase.from("tacks").select("*, tack_group:tack_groups(name), tags(*)").eq("parent_tack_id", pId).order("created_at");
		if (error) {
			console.error("Error getting child tacks", error.message);
			return;
		}
		setSubtacks(data);
	};

	useFocusEffect(useCallback(() => {
		if (!slug) {
			if (router.canGoBack()) router.back();
			else router.replace("/");
			return;
		}
		const getTack = async () => {
			setIsLoading(true);

			try {
				const { data: parent, error } = await supabase.from("tacks").select("*, tack_group:tack_groups(name), tags(*)").eq("slug", slug).single();
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
	}, [slug]));

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

	return (
		<ImageBackground source={require('@/assets/images/corkboard.jpg')} resizeMode="repeat" className="w-full h-full" >
			{isLoading ? <ActivityIndicator className="m-auto"/> : 
			<View className="w-auto h-auto grid grid-cols-5 gap-4 items-center justify-center my-4 mx-10">
				{tack && (
					<StatusSetter
						status={tack.status} tackId={tack.id} className="place-self-center"
						onStatusChange={(status) => setTack((current) => current ? { ...current, status } : current)}
					/>
				)}

				<Text bold className="col-span-3 justify-self-center bg-white/60 p-2 text-5xl">{tack?.title}</Text>

				<View className="col-start-5 flex-1 flex-row gap-4 place-self-center">
					<CircleButton label="✚" accessibilityLabel="Add tack" onPress={() => setSubtackModalIsVisible(true)} />
					<CircleButton label="✏️" accessibilityLabel="Edit tack" onPress={() => setEditModalIsVisible(true)} />
					<CircleButton label="🗑️" accessibilityLabel="Delete tack" onPress={deleteTack} destructive />
				</View>
				
				<Text className="text-3xl bg-white/60 p-2 w-fit col-start-1 col-span-2 justify-self-center rounded">Description:{`\n${tack?.description}`}</Text>

				<TagBlock tags={tack?.tags ?? []} className="col-start-5 self-start justify-self-center" />

				<View className="col-span-full"><SubTacks subtacks={subtacks} className="col-span-full" parentSlug={slug} /></View>

				<TackFormModal
					visible={subtackModalIsVisible}
					onClose={() => setSubtackModalIsVisible(false)}
					onSaved={() => tack ? void getSubtacks(tack.id) : undefined}
					parent={tack}
				/>

				{tack && (
					<TackFormModal
						key={tack.updated_at}
						visible={editModalIsVisible}
						onClose={() => setEditModalIsVisible(false)}
						onSaved={(updated) => { if (updated) setTack(updated) }}
						onDelete={deleteTack}
						tack={tack}
					/>
				)}
			</View>}
		</ImageBackground>
	);
};

export default TackPage;
