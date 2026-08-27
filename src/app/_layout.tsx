import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "@/global.css";
 
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const colorScheme = useColorScheme();

	const [fontsLoaded, fontError] = useFonts({
		"AmaticSC-Regular": require("../../assets/fonts/AmaticSC-Regular.ttf"),
		"AmaticSC-Bold": require("../../assets/fonts/AmaticSC-Bold.ttf"),
	});

	if (!fontsLoaded && !fontError) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<AuthProvider>
				<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
					<RootNavigator />
				</ThemeProvider>
			</AuthProvider>
		</GestureHandlerRootView>
	);
}

function RootNavigator() {
	const { session, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading) void SplashScreen.hideAsync();
	}, [isLoading]);

	if (isLoading) return null;

	return (
		<Stack>
			<Stack.Protected guard={!!session}>
				<Stack.Screen name="(app)" options={{ headerShown: false }} />
			</Stack.Protected>

			<Stack.Protected guard={!session}>
				<Stack.Screen name="sign-in" options={{ title: 'Sign in', headerShown: false }} />
			</Stack.Protected>
		</Stack>
	);
}