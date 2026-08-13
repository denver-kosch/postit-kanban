import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IndexStyles as styles } from "@/constants/styles";

export default function Index() {
	return (
		<ThemedView style={styles.container}>
			<ThemedText>Tack </ThemedText>
		</ThemedView>
	);
}