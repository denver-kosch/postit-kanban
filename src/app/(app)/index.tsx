import PostIt, { PostItBoard } from "@/components/postit";
import { type Tack } from "@/types/tacks";
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import CreateTackModal from "./createTackModal";

export default function Index() {
	const [tacks, setTacks] = useState<Tack[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);

	useEffect(() => {
		let isMounted = true;

		async function loadTacks() {
			const { data, error } = await supabase.from('tacks').select('*').is('parent_tack_id', null).order('created_at', { ascending: false });
			if (!isMounted) return;
			if (error) Alert.alert('Error getting parent tacks', error.message);
			else setTacks(data);
			setIsLoading(false);
		}

		void loadTacks();

		return () => {isMounted = false;}
	}, []);

	return (
		<SafeAreaProvider>
			<SafeAreaView className="h-full w-full flex-1 items-center justify-center">
				<View className="flex-row items-center justify-between py-[16px] border-b dark:border-gray-400 w-[95%] self-center">
					<TouchableOpacity className="px-[15px] bg-cyan rounded justify-center" onPress={() => void supabase.auth.signOut()}><Text className="leading-[30px] font-sm" >Sign out</Text></TouchableOpacity>
					<Text className="text-5xl font-semibold dark:color-white">📌 Tack 📌</Text>
					<TouchableOpacity className="px-[15px] bg-cyan rounded justify-center" onPress={() => setCreateModalVisible(true)}><Text className="leading-[30px] font-sm">+ New Tack</Text></TouchableOpacity>
				</View>

				<ImageBackground source={require("@/assets/images/corkboard.jpg")} resizeMode="repeat" className="flex-1 w-full self-stretch justify-center" >
					{isLoading && <ActivityIndicator />}
					{tacks.length ? <PostItBoard tacks={tacks} /> : <Text className="text-5xl font-semibold dark:color-white self-center text-center border-black">Make some tacks to track!</Text>}
				</ImageBackground>

				<CreateTackModal visible={createModalVisible} onClose={() => setCreateModalVisible(false)}/>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}
