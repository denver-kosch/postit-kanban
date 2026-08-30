import { Text, TextInput } from "@/components/customFontText";
import DatePicker from "@/components/datepicker";
import { formatStatus, statusOptions, type TackStatus } from "@/components/statuses";
import type { TackGroup, TackWithGroup, TackWithTags, Tag } from "@/types/tacks";
import { supabase } from "@/utils/supabase";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Switch, View } from "react-native";

type TackFormModalProps = {
	visible: boolean;
	onClose: () => void;
	onSaved: (tack?: TackWithTags) => void;
	parent?: TackWithGroup | null;
	tack?: TackWithTags | null;
	onDelete?: () => void | Promise<void>;
};

const sameIds = (left: Tag[], right: Tag[]) => {
	const leftIds = left.map((tag) => tag.id).sort();
	const rightIds = right.map((tag) => tag.id).sort();
	return leftIds.length === rightIds.length && leftIds.every((id, index) => id === rightIds[index]);
};

const TackFormModal = ({ visible, onClose, onSaved, parent = null, tack = null, onDelete }: TackFormModalProps) => {
	const isEditing = Boolean(tack);
	const initialGroupId = tack?.group_id ?? parent?.group_id ?? null;
	const initialDueDate = tack?.due_date ?? null;
	const initialStatus: TackStatus = tack?.status ?? "open";

	const [title, setTitle] = useState(tack?.title ?? "");
	const [description, setDescription] = useState(tack?.description ?? "");
	const [dueDate, setDueDate] = useState<string | null>(initialDueDate);
	const [hasDueDate, setHasDueDate] = useState(Boolean(initialDueDate));
	const [status, setStatus] = useState<TackStatus>(initialStatus);
	const [selectedGroup, setSelectedGroup] = useState<string | null>(initialGroupId);
	const [groups, setGroups] = useState<TackGroup[]>([]);
	const [isGroupCreatorOpen, setIsGroupCreatorOpen] = useState(false);
	const [newGroupName, setNewGroupName] = useState("");
	const [groupError, setGroupError] = useState("");
	const [isCreatingGroup, setIsCreatingGroup] = useState(false);
	const [availableTags, setAvailableTags] = useState<Tag[]>([]);
	const [selectedTags, setSelectedTags] = useState<Tag[]>(tack?.tags ?? []);
	const [newTagNames, setNewTagNames] = useState<string[]>([]);
	const [tagSearch, setTagSearch] = useState("");
	const [tagInputFocused, setTagInputFocused] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isDirty = isEditing
		? title !== tack?.title
			|| description !== tack?.description
			|| (hasDueDate ? dueDate : null) !== initialDueDate
			|| status !== initialStatus
			|| selectedGroup !== initialGroupId
			|| !sameIds(selectedTags, tack?.tags ?? [])
			|| newTagNames.length > 0
		: Boolean(
			title.trim()
			|| description.trim()
			|| hasDueDate
			|| status !== "open"
			|| selectedGroup !== initialGroupId
			|| selectedTags.length
			|| newTagNames.length
		);

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

	const resetForm = () => {
		setTitle(tack?.title ?? "");
		setDescription(tack?.description ?? "");
		setDueDate(initialDueDate);
		setHasDueDate(Boolean(initialDueDate));
		setStatus(initialStatus);
		setSelectedGroup(initialGroupId);
		setSelectedTags(tack?.tags ?? []);
		setNewTagNames([]);
		setTagSearch("");
		setTagInputFocused(false);
		setIsGroupCreatorOpen(false);
		setNewGroupName("");
		setGroupError("");
	};

	const closeModal = () => {
		resetForm();
		onClose();
	};

	const requestClose = () => {
		if (!isDirty) {
			closeModal();
			return;
		}

		Alert.alert("Discard changes?", "Your unsaved changes will be lost.", [
			{ text: "Keep editing", style: "cancel" },
			{ text: "Discard", style: "destructive", onPress: closeModal },
		]);
	};

	const handleDueDateToggle = (enabled: boolean) => {
		setHasDueDate(enabled);
		if (!enabled) setDueDate(null);
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

		const existingTag = availableTags.find((tag) => tag.name.toLowerCase() === name);
		if (existingTag) {
			addExistingTag(existingTag);
			return;
		}

		if (!newTagNames.some((existingName) => existingName.toLowerCase() === name)) setNewTagNames((current) => [...current, name]);
		setTagSearch("");
	};

	const validateForm = () => {
		if (!title.trim()) {
			Alert.alert("Title required", "Enter a title for your tack.");
			return false;
		}

		if (hasDueDate && !dueDate) {
			Alert.alert("Choose a due date", "Select a date or turn off the due-date option.");
			return false;
		}

		return true;
	};

	const submitForm = async () => {
		if (!validateForm() || isSubmitting) return;
		setIsSubmitting(true);

		const sharedValues = {
			p_title: title.trim(),
			p_description: description.trim(),
			p_due_date: hasDueDate ? dueDate ?? undefined : undefined,
			p_status: status,
			p_group_id: parent?.group_id ?? selectedGroup ?? undefined,
			p_existing_tag_ids: selectedTags.map((tag) => tag.id),
			p_new_tag_names: newTagNames,
		};

		if (!tack) {
			const { error } = await supabase.rpc("create_tack_with_tags", {
				...sharedValues,
				p_parent_tack_id: parent?.id ?? undefined,
			});

			setIsSubmitting(false);
			if (error) {
				Alert.alert("Error creating tack", error.message);
				return;
			}

			onSaved();
			closeModal();
			return;
		}

		const { error } = await supabase.rpc("update_tack_with_tags", {
			...sharedValues,
			p_tack_id: tack.id,
		});

		if (error) {
			setIsSubmitting(false);
			Alert.alert("Error updating tack", error.message);
			return;
		}

		const { data: updatedTack, error: reloadError } = await supabase
			.from("tacks")
			.select("*, tack_group:tack_groups(name, color), tags(*)")
			.eq("id", tack.id)
			.single();

		setIsSubmitting(false);
		if (reloadError) {
			Alert.alert("Tack saved", "The tack was updated, but the page could not refresh automatically.");
			onSaved();
			closeModal();
			return;
		}

		onSaved(updatedTack);
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

		setGroups((current) => [...current, data].sort((left, right) => left.name.localeCompare(right.name)));
		setSelectedGroup(data.id);
		cancelGroupCreation();
	};

	return (
		<Modal animationType="fade" transparent visible={visible} onRequestClose={requestClose}>
			<View className="h-full w-full flex-1 items-center justify-center bg-black/45 p-6">
				<View className="relative h-[78%] max-h-[760px] w-[90%] max-w-3xl rounded-lg bg-tack-yellow p-6 shadow-2xl">
					<View className="mb-4 flex-row items-center justify-between border-b border-black/20 pb-3">
						<Text bold className="text-4xl">{isEditing ? "Edit tack" : parent ? "New sub-tack" : "New tack"}</Text>
						<Text className="text-xl text-black/55">{isEditing ? "Update your note" : "Pin something new"}</Text>
					</View>

					<TextInput className="h-14 w-full border-b border-black/30 px-3 text-5xl" value={title} onChangeText={setTitle} placeholder="Title" />

					<View className="my-4 flex-row gap-4">
						<View className="flex-1 gap-2 justify-center">
							<View className="flex-row items-center">
								<Text className="mr-2 text-2xl">Due date</Text>
								<Switch accessibilityLabel="Set a due date" value={hasDueDate} onValueChange={handleDueDateToggle} />
							</View>
							{hasDueDate && <DatePicker value={dueDate} onChange={setDueDate} label="Choose date" />}
						</View>

						<View className="flex-1">
							<Text className="text-2xl">Status</Text>
							<Picker selectedValue={status} onValueChange={(value: TackStatus) => setStatus(value)}>
								{statusOptions.map((option) => <Picker.Item key={option} value={option} label={formatStatus(option)} />)}
							</Picker>
						</View>

						{(!parent || isEditing) && (
							<View className="flex-1">
								<Text className="text-2xl">Group</Text>
								<Picker selectedValue={selectedGroup ?? ""} onValueChange={setGroup}>
									<Picker.Item value="" label="Ungrouped" />
									{groups.map((group) => <Picker.Item key={group.id} value={group.id} label={group.name} />)}
									<Picker.Item value="__new__" label="+ Create new group" />
								</Picker>
							</View>
						)}
					</View>

					<View className="relative z-20">
						<Text className="mb-1 text-2xl">Tags</Text>
						<View className="min-h-12 flex-row flex-wrap items-center gap-2 rounded-md border border-black/25 bg-white/35 p-2">
							{selectedTags.map((tag) => (
								<Pressable key={tag.id} onPress={() => setSelectedTags((current) => current.filter((selected) => selected.id !== tag.id))} className="rounded-full bg-cyan-300 px-3 py-1">
									<Text>#{tag.name} ×</Text>
								</Pressable>
							))}

							{newTagNames.map((name) => (
								<Pressable key={name} onPress={() => setNewTagNames((current) => current.filter((tagName) => tagName !== name))} className="rounded-full bg-cyan-200 px-3 py-1">
									<Text>#{name} ×</Text>
								</Pressable>
							))}

							<TextInput
								value={tagSearch}
								onChangeText={setTagSearch}
								onFocus={() => setTagInputFocused(true)}
								onSubmitEditing={addNewTag}
								placeholder="Search or create a tag..."
								className="min-w-40 flex-1 outline-none"
							/>
						</View>

						{tagInputFocused && tagSearch.trim() !== "" && (
							<View className="absolute left-0 right-0 top-full z-30 overflow-hidden rounded-md border border-black/20 bg-white shadow-lg">
								{availableTags
									.filter((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase()) && !selectedTags.some((selected) => selected.id === tag.id))
									.slice(0, 5)
									.map((tag) => (
										<Pressable key={tag.id} onPress={() => addExistingTag(tag)} className="px-3 py-2 active:bg-gray-100">
											<Text>{tag.name}</Text>
										</Pressable>
									))}
								<Pressable onPress={addNewTag} className="px-3 py-2 active:bg-gray-100">
									<Text>+ Create “{tagSearch.trim()}”</Text>
								</Pressable>
							</View>
						)}
					</View>

					<TextInput
						className="my-4 min-h-28 w-full flex-1 rounded-md border border-black/25 bg-white/20 p-4 text-2xl"
						value={description}
						onChangeText={setDescription}
						placeholder="Description..."
						multiline
						textAlignVertical="top"
					/>

					<View className="flex-row items-center justify-between border-t border-black/20 pt-4">
						<View>
							{isEditing && onDelete && (
								<Pressable disabled={isSubmitting} onPress={() => void onDelete()} className="rounded-md bg-red-400 px-4 py-2 active:opacity-60 disabled:opacity-40">
									<Text bold className="text-xl">Delete tack</Text>
								</Pressable>
							)}
						</View>

						<View className="flex-row gap-3">
							<Pressable disabled={isSubmitting} onPress={requestClose} className="rounded-md border border-black/20 bg-white/65 px-4 py-2 active:opacity-60 disabled:opacity-40">
								<Text bold className="text-xl">Cancel</Text>
							</Pressable>
							<Pressable
								disabled={isSubmitting || !title.trim() || (isEditing && !isDirty)}
								onPress={() => void submitForm()}
								className="rounded-md bg-cyan px-5 py-2 active:opacity-60 disabled:opacity-40"
							>
								<Text bold className="text-xl">{isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Tack it"}</Text>
							</Pressable>
						</View>
					</View>

					{isGroupCreatorOpen && (
						<View className="absolute z-50 w-72 rounded-lg border border-black/20 bg-white p-4 shadow-xl" style={{ left: "100%", top: 100, marginLeft: 16 }}>
							<Text bold className="mb-2 text-2xl">New group</Text>
							<TextInput
								autoFocus
								value={newGroupName}
								placeholder="Group name"
								onChangeText={(value) => {
									setNewGroupName(value);
									setGroupError("");
								}}
								className="rounded border border-black/30 px-3 py-2"
								onSubmitEditing={() => void createGroup()}
							/>
							{!!groupError && <Text className="mt-1 text-red-600">{groupError}</Text>}
							<View className="mt-4 flex-row justify-end gap-2">
								<Pressable className="rounded px-3 py-2" onPress={cancelGroupCreation}><Text>Cancel</Text></Pressable>
								<Pressable className="rounded bg-cyan px-3 py-2" disabled={isCreatingGroup} onPress={() => void createGroup()}>
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

export default TackFormModal;
