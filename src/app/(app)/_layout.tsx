import AppHeader from '@/components/appHeader';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function AppLayout() {
	return (
		<SafeAreaProvider>
			<Stack screenOptions={{ headerShown: true, header: ({ options }) => <AppHeader title={options.title} /> }} >
				<Stack.Screen name="index" options={{ title: '📌 Tack 📌' }} />
				<Stack.Screen name="tack/[parentSlug]/index" options={{ title: "Tack details" }} />
				<Stack.Screen name="tack/[parentSlug]/[childSlug]" options={{ title: "Sub-tack details" }} />
			</Stack>
		</SafeAreaProvider>
	);
}