import type { DateFieldProps } from '@/types/datepicker.types';
import { View } from 'react-native';
import { Text } from '@/components/customFontText';

const DatePicker = ({ value, onChange, label = 'Choose date', className = ""}: DateFieldProps) => (
    <View className={`flex-row h-fit w-fit justify-center items-center ${className}`} >
        <Text className='text-xl'>{label}  </Text>
        <input 
            aria-label={label} type="date" value={value ?? ''} className='border-b border-black/30'
            onChange={(event) => onChange(event.currentTarget.value || null)} 
        />
    </View>
);

export default DatePicker;