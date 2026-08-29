import { Text, TextInput } from '@/components/customFontText';
import DatePicker from "@/components/datepicker";
import { TackGroup, TackWithGroup, Tag } from "@/types/tacks";
import { supabase } from "@/utils/supabase";
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Switch, View } from "react-native";


const CreateTackModal = ({ visible, onClose, refresh, parent=null }: { visible: boolean; onClose: () => void; refresh: () => void; parent?: TackWithGroup | null }) => {
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
	const [availableTags, setAvailableTags] = useState<Tag[]>([]);
	const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
	const [newTagNames, setNewTagNames] = useState<string[]>([]);
	const [tagSearch, setTagSearch] = useState<string>("");
	const [tagInputFocused, setTagInputFocused] = useState<boolean>(false);

	const closeModal = () => {
		refresh(); onClose(); setTitle(""); setDescription(""); setDate(null); setHasDueDate(false);
		setStartActive(false); setSelectedGroup(null); setIsCreatingGroup(false); setNewGroupName("");
		setGroupError(""); setAvailableTags([]); setSelectedTags([]); setNewTagNames([]); setTagSearch("");
		setTagInputFocused(false);
	};

	useEffect(() => {
		if (!visible) return;

		let cancelled = false;

		void (async () => {
			const [groupsResult, tagsResult] = await Promise.all([
				supabase.from("tack_groups").select("*").order("name"),
				supabase.from("tags").select("*").order("name"),
			]);

			if (cancelled) return;

			if (groupsResult.error) Alert.alert("Error getting tack groups", groupsResult.error.message);
			else setGroups(groupsResult.data);
			
			if (tagsResult.error) Alert.alert("Error getting tags", tagsResult.error.message);
			else setAvailableTags(tagsResult.data);
		})();

		return () => { cancelled = true };
	}, [visible]);

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
	
	const addExistingTag = (tag: Tag) => {
		if (!selectedTags.some((selected) => selected.id === tag.id)) setSelectedTags((current) => [...current, tag]);
		setTagSearch("");
	};
 
	const addNewTag = () => {
		const name = tagSearch.trim().toLowerCase();
		if (!name) return;

		const existingTag = availableTags.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
		if (existingTag) {
			addExistingTag(existingTag);
			return;
		}

		if (!newTagNames.some((existingName) => existingName.toLowerCase() === name.toLowerCase())) setNewTagNames((current) => [...current, name]);

		setTagSearch("");
	};

	const addTack = async () => {
		if (!title.trim()) {
			Alert.alert("Title required", "Enter a title for your tack.");
			return;
		}

		if (hasDueDate && !due_date) {
			Alert.alert( "Choose a due date", "Select a date or turn off the due-date option." );
			return;
		}

		const { error } = await supabase.rpc("create_tack_with_tags", {
			p_title: title.trim(),
			p_description: description.trim(),
			p_due_date: hasDueDate ? due_date ?? undefined : undefined,
			p_status: startActive ? "active" : "open",
			p_parent_tack_id: parent?.id ?? undefined,
			p_group_id: parent?.group_id ?? selectedGroup ?? undefined,
			p_existing_tag_ids: selectedTags.map((tag) => tag.id),
			p_new_tag_names: newTagNames,
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
				<View className="h-[75%] bg-tack-yellow rounded p-4 flex-column justify-between aspect-square relative">
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
							
							{!parent && 
							<Picker selectedValue={selectedGroup ?? ""} onValueChange={setGroup} className="w-2/3">
								<Picker.Item value="" label="Ungrouped" />
								{groups.map((group) => <Picker.Item key={group.id} value={group.id} label={group.name} />)}
								<Picker.Item value="__new__" label="+ Create new group" />
							</Picker>}
						</View>
					</View>

					<View className="relative z-20">
						<Text className="text-xl">Tags</Text>

						<View className="flex-row flex-wrap items-center gap-2 border border-black p-2">
							{selectedTags.map((tag) => (
								<Pressable key={tag.id} onPress={() => setSelectedTags((current) => current.filter((selected) => selected.id !== tag.id))} className="rounded-full bg-cyan-300 px-3 py-1">
									<Text>{tag.name} ×</Text>
								</Pressable>
							))}

							{newTagNames.map((name) => (
								<Pressable key={name} onPress={() => setNewTagNames((current) => current.filter((tagName) => tagName !== name))} className="rounded-full bg-cyan-200 px-3 py-1" >
									<Text>{name} ×</Text>
								</Pressable>
							))}

							<TextInput
								value={tagSearch} onChangeText={setTagSearch} onFocus={() => setTagInputFocused(true)} 
								onSubmitEditing={addNewTag} placeholder="Search or create a tag..." className="min-w-40 flex-1 outline-none"
							/>
						</View>

						{tagInputFocused && tagSearch.trim() !== "" && (
							<View className="absolute left-0 right-0 top-full z-30 border border-black bg-white">
								{availableTags.filter((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase()) && !selectedTags.some((selected) => selected.id === tag.id))
									.slice(0, 5).map((tag) => (
										<Pressable key={tag.id} onPress={() => addExistingTag(tag)} className="px-3 py-2 hover:bg-gray-100" >
											<Text>{tag.name}</Text>
										</Pressable>
									))
								}

								<Pressable onPress={addNewTag} className="px-3 py-2 hover:bg-gray-100">
									<Text>+ Create “{tagSearch.trim()}”</Text>
								</Pressable>
							</View>
						)}
					</View>

					<TextInput className="border p-4 w-full h-full my-4 text-2xl" value={description} onChangeText={setDescription} placeholder="Description..." multiline={true} />
					
					<View className="flex-row items-center w-full justify-evenly">
						<Pressable onPress={addTack} className="bg-cyan rounded py-2 px-4 w-fit active:opacity-50"><Text>Tack It</Text></Pressable>
						<Pressable onPress={closeModal} className="bg-cyan rounded py-2 px-4 w-fit active:opacity-50"><Text>Close</Text></Pressable>
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
								<Pressable className="rounded px-3 py-2" onPress={cancelGroupCreation} >
									<Text>Cancel</Text>
								</Pressable>

								<Pressable className="rounded bg-cyan px-3 py-2" disabled={isCreatingGroup} onPress={() => void createGroup()} >
									<Text>{isCreatingGroup ? "Creating…" : "Create"}</Text>
								</Pressable>
							</View>
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
};


export default CreateTackModal;
