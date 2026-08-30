import { useState } from 'react';
import { Pressable, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Text } from '@/components/customFontText';

import type { DateFieldProps } from '@/types/datepicker.types';

function toDateString(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

function fromDateString(value: string | null) {
	if (!value) return new Date();

	const [year, month, day] = value.split('-').map(Number);

	// Local noon avoids most timezone/DST edge cases.
	return new Date(year, month - 1, day, 12);
}

export default function DateField({ value, onChange, label = 'Choose date', className = ""}: DateFieldProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<View className={className}>
			<Pressable accessibilityRole="button" onPress={() => setIsOpen(true)} className='border border-[#888] rounded px-12' >
				<Text>{value ?? label}</Text>
			</Pressable>

			<DatePicker
				modal mode="date" open={isOpen} date={fromDateString(value)}
				onConfirm={(date) => {
					setIsOpen(false);
					onChange(toDateString(date));
				}} onCancel={() => setIsOpen(false)}
			/>
		</View>
	);
}