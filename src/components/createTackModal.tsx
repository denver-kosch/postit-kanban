import { useEffect, useState } from "react";
import { Alert, Modal, Switch, TouchableOpacity, View } from "react-native";
import { supabase } from "@/utils/supabase";
import DatePicker from "@/components/datepicker";
import { TackGroup } from "@/types/tacks";
import { Text, TextInput } from '@/components/customFontText';
import { Picker } from '@react-native-picker/picker';



const CreateTackModal = ({ visible, onClose, refresh }: { visible: boolean, onClose: () => void, refresh: () => void}) => {
	const [title, setTitle] = useState<string>("");
	const [groups, setGroups] = useState<TackGroup[]>([]);
	const [description, setDescription] = useState<string>("");
	const [due_date, setDate] = useState<string | null>(null);
	const [hasDueDate, setHasDueDate] = useState<boolean>(false);
	const [startActive, setStartActive] = useState<boolean>(false);
	const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
	const [isGroupCreatorOpen, setIsGroupCreatorOpen] =useState<boolean>(false);
	const [newGroupName, setNewGroupName] = useState<string>("");
	const [groupError, setGroupError] = useState<string>("");
	const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);

	const closeModal = () => {
		setTitle("");
		setDescription("");
		setDate(null);
		setHasDueDate(false);
		setStartActive(false);
		setSelectedGroup(null);
		refresh();
		onClose();
	};

	const handleDueDateToggle = (enabled: boolean) => {
		setHasDueDate(enabled);

		if (!enabled) setDate(null);
	};

	const setGroup = (value: string) => {
		if (value === "__new__") {
			setIsGroupCreatorOpen(true);
			return;
		}
		setSelectedGroup(value || null);
	};

	useEffect(() => {
		(async () => {
			const { data, error } = await supabase.from("tack_groups").select("*").order("name");
			if (error) {
				Alert.alert("Error getting user's tack groups:", error.message);
				return;
			}
			setGroups(data);
		})();
	}, [visible]);

	const addTack = async () => {
		if (hasDueDate && !due_date) {
			Alert.alert("Choose a due date", "Select a date or turn off the due-date option.");
			return;
		}
		

		const { error } = await supabase.from('tacks').insert({
			title,
			description,
			due_date,
		});

		if (error) {
			Alert.alert("Error creating tack", error.message);
			return;
		}

		closeModal();
	};

	const cancelGroupCreation = () => {
		setIsGroupCreatorOpen(false);
		setNewGroupName("");
		setGroupError("");
	};

	const createGroup = async () => {
		const name = newGroupName.trim();

		if (!name) {
			setGroupError("Enter a group name.");
			return;
		}

		setIsCreatingGroup(true);
		setGroupError("");

		const { data, error } = await supabase.from("tack_groups").insert({ name }).select().single();

		setIsCreatingGroup(false);

		if (error) {
			setGroupError(error.message);
			return;
		}

		setGroups((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));

		setSelectedGroup(data.id);
		cancelGroupCreation();
	};

	return (
		<Modal animationType="slide" visible={visible} onRequestClose={closeModal} className="bg-black/50">
			<View className="w-full h-full flex-1 items-center justify-center">
				<View className="w-fit bg-tack-yellow rounded p-4 flex-column justify-between aspect-square relative">
					<TextInput className="h-14 w-full border-b border-black/30 px-3 text-5xl font-bold" value={title} onChangeText={setTitle} placeholder="Title" />

					<View className="my-2 w-full flex-row gap-4">
						<View className="flex-1 gap-2">
							<View className="flex-row items-center">
								<Text className="mr-2 text-2xl">Set a due date</Text>
								<Switch accessibilityLabel="Set a due date" value={hasDueDate} onValueChange={handleDueDateToggle} />
							</View>
							{hasDueDate && <DatePicker value={due_date} onChange={setDate} label="Choose date" />}
						</View>

						<View className="flex-1 gap-2 items-end">
							<View className="flex-row items-center justify-end">
								<Text className="mr-2 text-2xl">Start active</Text>
								<Switch accessibilityLabel="Start active" value={startActive} onValueChange={setStartActive} />
							</View>
							<Picker selectedValue={selectedGroup ?? ""} onValueChange={setGroup} className="w-2/3">
								<Picker.Item value="" label="Ungrouped" />
								{groups.map((group) => <Picker.Item key={group.id} value={group.id} label={group.name} />)}
								<Picker.Item value="__new__" label="+ Create new group" />
							</Picker>
						</View>
						</View>

					<TextInput className="border p-4 w-full h-full my-4 text-2xl" value={description} onChangeText={setDescription} placeholder="Description..." multiline={true} />
					
					<View className="flex-row items-center w-full justify-evenly">
						<TouchableOpacity onPress={addTack} className="bg-cyan rounded py-2 px-4  w-fit"><Text>Tack It</Text></TouchableOpacity>
						<TouchableOpacity onPress={closeModal} className="bg-cyan rounded py-2 px-4 w-fit"><Text>Close</Text></TouchableOpacity>
					</View>

					{isGroupCreatorOpen && (
						<View className="absolute z-50 w-72 rounded-lg border border-black/20 bg-white p-4 shadow-xl" style={{ left: "100%", top: 80, marginLeft: 16, }} >
							<Text bold className="mb-2 text-2xl">New group</Text>

							<TextInput
								autoFocus value={newGroupName} placeholder="Group name"
								onChangeText={(value) => {
									setNewGroupName(value);
									setGroupError("");
								}} className="rounded border border-black/30 px-3 py-2" onSubmitEditing={() => void createGroup()}
							/>

							{!!groupError && <Text className="mt-1 text-red-600">{groupError}</Text>}

							<View className="mt-4 flex-row justify-end gap-2">
								<TouchableOpacity className="rounded px-3 py-2" onPress={cancelGroupCreation} >
									<Text>Cancel</Text>
								</TouchableOpacity>

								<TouchableOpacity className="rounded bg-cyan px-3 py-2" disabled={isCreatingGroup} onPress={() => void createGroup()} >
									<Text>{isCreatingGroup ? "Creating…" : "Create"}</Text>
								</TouchableOpacity>
							</View>
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
};


export default CreateTackModal;
