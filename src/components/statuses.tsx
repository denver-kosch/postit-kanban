import type { Tack } from "@/types/tacks";
import { playStatusChangeFeedback } from "@/utils/haptics";
import { supabase } from "@/utils/supabase";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Text } from "./customFontText";

export type TackStatus = Tack["status"];

export const statuses: Record<TackStatus, string> = {
	open: "bg-gray-400",
	active: "bg-blue-500",
	awaiting: "bg-amber-400",
	closed: "bg-emerald-600",
};

export const statusOptions = Object.keys(statuses) as TackStatus[];

export const formatStatus = (status: TackStatus) => status.charAt(0).toUpperCase() + status.slice(1);

const StatusRow = ({ status }: { status: TackStatus }) => (
	<View className="flex-row items-center gap-2">
		<Text bold className="text-xl">{formatStatus(status)}</Text>
		<View className={`h-3 w-3 rounded-full ${statuses[status]}`} />
	</View>
);

type StatusSetterProps = {
	status: TackStatus;
	tackId: string;
	onStatusChange: (status: TackStatus) => void;
	disabled?: boolean;
	className?: string;
};

const StatusSetter = ({ status, tackId, onStatusChange, disabled = false, className = "" }: StatusSetterProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const isDisabled = disabled || isUpdating;

	const selectStatus = (nextStatus: TackStatus) => {
		setIsOpen(false);
		if (nextStatus !== status) void updateStatus(nextStatus);
	};

	const updateStatus = async (nextStatus: TackStatus) => {
		if (isDisabled || nextStatus === status) return;

		setIsUpdating(true);
		const { data, error } = await supabase.from("tacks").update({ status: nextStatus }).eq("id", tackId).select("status").single();
		setIsUpdating(false);

		if (error) {
			Alert.alert("Unable to update status", error.message);
			return;
		}

		onStatusChange(data.status);
		playStatusChangeFeedback();
	};

	return (
		<View className={`relative z-50 self-start ${className}`} style={{ zIndex: 50, elevation: 50 }}>
			<Pressable
				accessibilityLabel={`Status: ${formatStatus(status)}`}
				accessibilityRole="button"
				accessibilityState={{ disabled: isDisabled, expanded: isOpen }}
				disabled={isDisabled}
				onPress={() => setIsOpen((current) => !current)}
				className="min-w-36 flex-row items-center justify-between gap-3 rounded-md border border-black/20 bg-white/90 px-3 py-2 shadow-sm active:opacity-60 disabled:opacity-50"
			>
				<StatusRow status={status} />
				<Text className="text-base">{isUpdating ? "…" : isOpen ? "▴" : "▾"}</Text>
			</Pressable>

			{isOpen && (
				<View className="absolute left-0 top-full z-50 mt-1 min-w-36 overflow-hidden rounded-md border border-black/20 bg-white shadow-lg" style={{ zIndex: 50, elevation: 50 }}>
					{statusOptions.map((option) => (
						<Pressable
							key={option}
							accessibilityRole="button"
							accessibilityState={{ selected: option === status }}
							onPress={() => selectStatus(option)}
							className={`px-3 py-2 active:bg-gray-200 ${option === status ? "bg-gray-100" : "bg-white"}`}
						>
							<StatusRow status={option} />
						</Pressable>
					))}
				</View>
			)}
		</View>
	);
};

export default StatusSetter;
