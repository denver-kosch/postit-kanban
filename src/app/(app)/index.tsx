import AppHeader from '@/components/appHeader';
import { Text } from '@/components/customFontText';
import TackFormModal from "@/components/tackFormModal";
import { TackBoard } from "@/components/tacks";
import { type TackWithTags } from "@/types/tacks";
import { supabase } from '@/utils/supabase';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ImageBackground } from 'react-native';

export default function Index() {
	const [tacks, setTacks] = useState<TackWithTags[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);

	const loadTacks = async () => {
		const { data, error } = await supabase.from('tacks').select('*, tack_group:tack_groups(name), tags(*)').is('parent_tack_id', null).order('created_at', { ascending: true });
		if (error) Alert.alert('Error getting parent tacks', error.message);
		else setTacks(data);
		setIsLoading(false);
	};

	useFocusEffect(useCallback(() => {
		let cancelled = false;

		void (async () => {
			const { data, error } = await supabase.from("tacks").select("*, tack_group:tack_groups(name), tags(*)").is("parent_tack_id", null).order("created_at", { ascending: true });

			if (cancelled) return;

			if (error) Alert.alert("Error getting parent tacks", error.message);
			else setTacks(data);

			setIsLoading(false);
		})();

		return () => { cancelled = true };
	}, []));

	return (
		<>
			<Stack.Screen options={{ header: () => <AppHeader onNewTack={() => setCreateModalVisible(true)} /> }} />

			<ImageBackground source={require('@/assets/images/corkboard.jpg')} resizeMode="repeat" className="w-full flex-1 self-stretch justify-center" >
			{isLoading && <ActivityIndicator />}

			{!isLoading && (tacks.length ? <TackBoard tacks={tacks} onReorder={setTacks} />
			: <Text className="self-center text-center text-5xl font-semibold">Make some tacks to track!</Text>
			)}
			</ImageBackground>

			<TackFormModal visible={createModalVisible} onClose={() => setCreateModalVisible(false)} onSaved={loadTacks} />
		</>
	);
}
