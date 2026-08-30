import CircleButton from "@/components/circleButton";
import { Text } from "@/components/customFontText";
import DueDateBadge from "@/components/dueDates";
import StatusSetter from "@/components/statuses";
import TagBlock from "@/components/tags";
import TackFormModal from "@/components/tackFormModal";
import type { TackWithTags } from "@/types/tacks";
import { supabase } from "@/utils/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ImageBackground, View } from "react-native";

const TackPage = () => {
	const { parentSlug, childSlug } = useLocalSearchParams<{ parentSlug: string; childSlug: string }>();
	const [tack, setTack] = useState<TackWithTags | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [editModalIsVisible, setEditModalIsVisible] = useState(false);

	useEffect(() => {
		if (!childSlug) {
			if (router.canGoBack()) router.back();
			else router.replace("/");
			return;
		}
		const getTack = async () => {
			setIsLoading(true);

			try {
				const { data, error } = await supabase.from("tacks").select("*, tack_group:tack_groups(name, color), tags(*)").eq("slug", childSlug).single();
				if (error) throw error;
				setTack(data);
			} catch (error) {
				console.error("Error loading tack", error);
			} finally {
				setIsLoading(false);
			}
		};
		void getTack();
	}, [childSlug]);

	const deleteTack = async () => {
		if (!tack || isDeleting) return;
		if (!window.confirm(`Delete "${tack.title}"?`)) return;
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

		router.replace({ pathname: "/tack/[parentSlug]", params: { parentSlug } });
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

				<Text bold className="col-span-3 col-start-2 w-fit justify-self-center bg-white/60 p-2 text-5xl">{tack?.title}</Text>
				
				<View className="col-start-5 flex-1 flex-row gap-4 place-self-center align-items-end">
					<CircleButton label="✏️" accessibilityLabel="Edit tack" onPress={() => setEditModalIsVisible(true)} />
					<CircleButton label="🗑️" accessibilityLabel="Delete tack" onPress={deleteTack} destructive />
				</View>
				
				
				<Text className="text-3xl bg-white/60 p-2 w-fit col-start-1 col-span-2 justify-self-center rounded">Description:{`\n`}{tack?.description}</Text>

				{tack && <DueDateBadge dueDate={tack.due_date} status={tack.status} className="col-start-3 self-start justify-self-center" />}

				<TagBlock tags={tack?.tags ?? []} className="col-start-4 col-span-2 self-start justify-self-center" />

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
