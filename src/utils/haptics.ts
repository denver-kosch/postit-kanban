import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const runOnDevice = (feedback: () => Promise<void>) => {
	if (Platform.OS === "web") return;
	void feedback().catch(() => undefined);
};

export const playTackPickupFeedback = () => {
	runOnDevice(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
};

export const playTackDropFeedback = () => {
	runOnDevice(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
};

export const playStatusChangeFeedback = () => {
	runOnDevice(() => Haptics.selectionAsync());
};
