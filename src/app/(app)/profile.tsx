import { Text } from "@/components/customFontText";
import GroupColorPicker from "@/components/groupColorPicker";
import { getGroupTextColor } from "@/constants/groupColors";
import { useAuth } from "@/providers/auth-provider";
import type { TackGroup } from "@/types/tacks";
import { supabase } from "@/utils/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ImageBackground, ScrollView, View } from "react-native";

const ProfilePage = () => {
	const { session } = useAuth();
	const [groups, setGroups] = useState<TackGroup[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [savingGroupId, setSavingGroupId] = useState<string | null>(null);

	useFocusEffect(useCallback(() => {
		let cancelled = false;

		void (async () => {
			setIsLoading(true);
			const { data, error } = await supabase.from("tack_groups").select("*").order("name");
			if (cancelled) return;

			if (error) Alert.alert("Unable to load groups", error.message);
			else setGroups(data);
			setIsLoading(false);
		})();

		return () => { cancelled = true };
	}, []));

	const updateGroupColor = async (group: TackGroup, color: string) => {
		if (group.color === color || savingGroupId) return;

		const previousColor = group.color;
		setSavingGroupId(group.id);
		setGroups((current) => current.map((item) => item.id === group.id ? { ...item, color } : item));
		const { data, error } = await supabase.from("tack_groups").update({ color }).eq("id", group.id).select().single();
		setSavingGroupId(null);

		if (error) {
			setGroups((current) => current.map((item) => item.id === group.id ? { ...item, color: previousColor } : item));
			Alert.alert("Unable to update group color", error.message);
			return;
		}

		setGroups((current) => current.map((item) => item.id === data.id ? data : item));
	};

	return (
		<ImageBackground source={require("@/assets/images/corkboard.jpg")} resizeMode="repeat" className="h-full w-full">
			<ScrollView contentContainerClassName="items-center px-6 py-8">
				<View className="w-full max-w-3xl gap-6">
					<View className="rounded-lg border border-black/10 bg-white/85 p-5 shadow-md">
						<Text bold className="text-4xl">Your profile</Text>
						<Text className="mt-1 text-xl text-black/60">{session?.user.email ?? "Signed-in user"}</Text>
					</View>

					<View className="rounded-lg border border-black/10 bg-white/85 p-5 shadow-md">
						<Text bold className="text-4xl">Group colors</Text>
						<Text className="mb-5 mt-1 text-xl text-black/60">Choose any paper color with the color picker or enter a six-digit hex value.</Text>

						{isLoading ? (
							<ActivityIndicator />
						) : groups.length ? (
							<View className="gap-4">
								{groups.map((group) => (
									<View key={group.id} className="rounded-lg border border-black/10 p-4" style={{ backgroundColor: group.color }}>
										<View className="mb-3 flex-row items-center justify-between">
											<Text bold className="text-3xl" style={{ color: getGroupTextColor(group.color) }}>{group.name}</Text>
											{savingGroupId === group.id && <Text className="text-lg" style={{ color: getGroupTextColor(group.color) }}>Saving…</Text>}
										</View>

										<GroupColorPicker
											key={`${group.id}:${group.color}`}
											value={group.color}
											disabled={Boolean(savingGroupId)}
											accessibilityLabel={`${group.name} color`}
											onChange={(color) => void updateGroupColor(group, color)}
										/>
									</View>
								))}
							</View>
						) : (
							<View className="rounded-md bg-black/5 p-4">
								<Text bold className="text-2xl">No groups yet</Text>
								<Text className="mt-1 text-lg text-black/60">Create a group from the tack form, then return here to customize it.</Text>
							</View>
						)}
					</View>
				</View>
			</ScrollView>
		</ImageBackground>
	);
};

export default ProfilePage;
