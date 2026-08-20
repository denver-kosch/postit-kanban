import { useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";



const CreateTackModal = ({ visible, onClose }: { visible: boolean, onClose: () => void}) => {
	const [title, setTitle] = useState<string>("");

	return (
		<Modal animationType="slide" visible={visible} onRequestClose={onClose} className="bg-black/50">
			<View className="w-full h-full flex-1 items-center justify-center">
				<View className="w-fit bg-tack-yellow rounded p-4 flex-column items-center justify-between aspect-square">
					<TextInput value={title} onChangeText={setTitle} placeholder="Title" className="h-14 w-full border-b border-black/30 px-3 text-3xl font-bold mb-4"/>
					

					<TouchableOpacity onPress={onClose} className="bg-cyan rounded py-2 px-4 w-fit"><Text>Close</Text></TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
};


export default CreateTackModal;