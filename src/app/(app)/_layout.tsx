import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Tack' }} />
      <Stack.Screen
        name="stickynote/index"
        options={{ title: 'Tack details' }}
      />
    </Stack>
  );
}