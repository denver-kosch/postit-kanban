import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IndexStyles as styles } from "@/constants/styles";
import { Button } from 'react-native';
import { supabase } from '@/utils/supabase';

export default function Index() {
	return (
		<ThemedView style={styles.container}>
			<ThemedText>Tack </ThemedText>

			<Button title="Sign out" onPress={() => void supabase.auth.signOut()} />
		</ThemedView>
	);
}