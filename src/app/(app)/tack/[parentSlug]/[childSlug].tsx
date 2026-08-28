import { Text } from "@/components/customFontText";
import type { TackWithGroup } from "@/types/tacks";
import { supabase } from "@/utils/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ImageBackground, Pressable, View } from "react-native";

const TackPage = () => {
	const { parentSlug, childSlug } = useLocalSearchParams<{ parentSlug: string; childSlug: string }>();
	const [tack, setTack] = useState<TackWithGroup | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		if (!childSlug) {
			if (router.canGoBack()) router.back();
			else router.replace("/");
			return;
		}
		const getTack = async () => {
			setIsLoading(true);

			try {
				const { data, error } = await supabase.from("tacks").select("*, tack_group:tack_groups(name)").eq("slug", childSlug).single();
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
				<Text bold className="col-span-3 col-start-2 w-fit justify-self-center bg-white/60 p-2 text-5xl">{tack?.title}</Text>
				
				<View className="col-start-5 flex-1 flex-row gap-4 place-self-center align-items-end">
					<Pressable onPress={void{}} className="h-16 w-16 items-center justify-center rounded-full bg-white active:opacity-50" >
						<Text className="text-3xl">✏️</Text>
					</Pressable>
					<Pressable onPress={deleteTack} className="h-16 w-16 items-center justify-center rounded-full bg-red-400 active:opacity-50" >
						<Text className="text-3xl">🗑️</Text>
					</Pressable>
				</View>
				
				
				<Text className="text-3xl bg-white/60 p-2 w-fit col-start-1 col-span-2 justify-self-center">Description:{`\n`}{tack?.description}</Text>
				
			</View>}
		</ImageBackground>
	);
};

export default TackPage;
