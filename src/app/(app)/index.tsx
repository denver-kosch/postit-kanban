import { PostItBoard } from "@/components/postit";
import { type TackWithGroup } from "@/types/tacks";
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ImageBackground } from 'react-native';
import CreateTackModal from "@/components/createTackModal";
import { Text } from '@/components/customFontText';
import AppHeader from '@/components/appHeader';
import { Stack } from 'expo-router';

export default function Index() {
	const [tacks, setTacks] = useState<TackWithGroup[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);

	const loadTacks = async () => {
		const { data, error } = await supabase.from('tacks').select('*, tack_group:tack_groups(name)').is('parent_tack_id', null).order('created_at', { ascending: true });
		if (error) Alert.alert('Error getting parent tacks', error.message);
		else setTacks(data);
		setIsLoading(false);
	};

	useEffect(() => {
		void loadTacks();
	}, []);

	return (
		<>
			<Stack.Screen options={{ header: () => <AppHeader onNewTack={() => setCreateModalVisible(true)} /> }} />

			<ImageBackground source={require('@/assets/images/corkboard.jpg')} resizeMode="repeat" className="w-full flex-1 self-stretch justify-center" >
			{isLoading && <ActivityIndicator />}

			{tacks.length ? <PostItBoard tacks={tacks} onReorder={setTacks} />
			: <Text className="self-center text-center text-5xl font-semibold">Make some tacks to track!</Text>
			}
			</ImageBackground>

			<CreateTackModal visible={createModalVisible} onClose={() => setCreateModalVisible(false)} refresh={loadTacks} />
		</>
	);
}
