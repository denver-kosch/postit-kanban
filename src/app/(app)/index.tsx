import AppHeader from '@/components/appHeader';
import BoardSummary from '@/components/boardSummary';
import { Text } from '@/components/customFontText';
import TackFilters, { emptyTackFilters, filterTacks, hasActiveTackFilters, type TackFilterState } from '@/components/tackFilters';
import TackFormModal from "@/components/tackFormModal";
import { TackBoard } from "@/components/tacks";
import { type TackWithTags } from "@/types/tacks";
import { supabase } from '@/utils/supabase';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ImageBackground, View } from 'react-native';

export default function Index() {
	const [tacks, setTacks] = useState<TackWithTags[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
	const [isReordering, setIsReordering] = useState(false);
	const [filters, setFilters] = useState<TackFilterState>(emptyTackFilters);
	const filteredTacks = useMemo(() => filterTacks(tacks, filters), [tacks, filters]);

	const loadTacks = async () => {
		const { data, error } = await supabase.from('tacks').select('*, tack_group:tack_groups(name, color), tags(*)').is('parent_tack_id', null).order('sort_order', { ascending: true });
		if (error) Alert.alert('Error getting parent tacks', error.message);
		else setTacks(data);
		setIsLoading(false);
	};

	useFocusEffect(useCallback(() => {
		let cancelled = false;

		void (async () => {
			const { data, error } = await supabase.from("tacks").select("*, tack_group:tack_groups(name, color), tags(*)").is("parent_tack_id", null).order("sort_order", { ascending: true });

			if (cancelled) return;

			if (error) Alert.alert("Error getting parent tacks", error.message);
			else setTacks(data);

			setIsLoading(false);
		})();

		return () => { cancelled = true };
	}, []));

	const reorderFilteredTacks = async (reorderedVisibleTacks: TackWithTags[]) => {
		if (isReordering) return;

		const visibleIds = new Set(reorderedVisibleTacks.map((tack) => tack.id));
		let visibleIndex = 0;
		const previousTacks = tacks;
		const reorderedTacks = tacks.map((tack) => {
			if (!visibleIds.has(tack.id)) return tack;
			const reorderedTack = reorderedVisibleTacks[visibleIndex];
			visibleIndex += 1;
			return reorderedTack ?? tack;
		}).map((tack, sortOrder) => ({ ...tack, sort_order: sortOrder }));

		setTacks(reorderedTacks);
		setIsReordering(true);

		const { error } = await supabase.rpc("reorder_tacks", {
			p_ordered_tack_ids: reorderedTacks.map((tack) => tack.id),
		});

		setIsReordering(false);

		if (error) {
			setTacks(previousTacks);
			Alert.alert("Unable to save tack order", error.message);
		}
	};

	return (
		<>
			<Stack.Screen options={{ header: () => <AppHeader onNewTack={() => setCreateModalVisible(true)} /> }} />

			<ImageBackground source={require('@/assets/images/corkboard.jpg')} resizeMode="repeat" className="w-full flex-1 self-stretch" >
				{isLoading && <ActivityIndicator className="m-auto" />}

				{!isLoading && tacks.length > 0 && (
					<>
						<TackFilters tacks={tacks} filters={filters} onChange={setFilters} resultCount={filteredTacks.length} />
						<BoardSummary tacks={filteredTacks} />

						<View className="flex-1">
							{filteredTacks.length ? (
								<TackBoard tacks={filteredTacks} disabled={isReordering} onReorder={(orderedTacks) => void reorderFilteredTacks(orderedTacks)} />
							) : (
								<View className="m-auto items-center rounded-lg bg-white/70 px-8 py-6">
									<Text bold className="text-center text-4xl">No matching tacks</Text>
									<Text className="mt-1 text-center text-xl">Try removing a filter or changing your search.</Text>
									{hasActiveTackFilters(filters) && (
										<Text className="mt-2 text-center text-lg text-black/55">Use Clear to show everything again.</Text>
									)}
								</View>
							)}
						</View>
					</>
				)}

				{!isLoading && !tacks.length && <Text className="m-auto text-center text-5xl font-semibold">Make some tacks to track!</Text>}
			</ImageBackground>

			<TackFormModal visible={createModalVisible} onClose={() => setCreateModalVisible(false)} onSaved={loadTacks} />
		</>
	);
}
