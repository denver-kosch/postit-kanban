import AppHeader from '@/components/appHeader';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function AppLayout() {
	return (
		<SafeAreaProvider>
			<Stack screenOptions={{ headerShown: true, header: ({ options }) => <AppHeader title={options.title} /> }} >
				<Stack.Screen name="index" options={{ title: '📌 Tack 📌' }} />
				<Stack.Screen name="tack/[slug]" options={{ title: 'Tack details' }} />
			</Stack>
		</SafeAreaProvider>
	);
}