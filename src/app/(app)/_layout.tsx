import { Stack } from 'expo-router';

export default function AppLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: 'Tack', headerShown: false }} />
            <Stack.Screen name="stickynote/index" options={{ title: 'Tack details', headerShown: false }} />
        </Stack>
    );
}