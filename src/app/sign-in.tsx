import { Text } from '@/components/customFontText';
import { supabase } from '@/utils/supabase';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, TextInput, View, Pressable } from 'react-native';

export default function SignInScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const signIn = async () => {
		if (!email.trim() || !password) {
			Alert.alert('Missing information', 'Enter your email and password.');
			return;
		}
		setIsSubmitting(true);
		const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
		setIsSubmitting(false);

		if (error) Alert.alert('Could not sign in', error.message);
	};

	const signUp = async () => {
		if (!email.trim() || password.length < 6) {
			Alert.alert('Check your information', 'Enter an email and a password with at least 6 characters.');
			return;
		}

		setIsSubmitting(true);
		const { data: { session }, error } = await supabase.auth.signUp({ email: email.trim(), password });
		setIsSubmitting(false);

		if (error) {
			Alert.alert('Could not create account', error.message);
			return;
		}

		if (!session) Alert.alert('Check your email', 'Confirm your email address, then return to Tack and sign in.');
	};

	const handlePressEnter = (e: any) => (e.nativeEvent.key === "Enter") && signIn();

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className='flex-1 justify-center p-24' >
			<View className='gap-[16px] items-center'>
				<Text className='text-[40px] font-bold dark:color-secondary'>Tack</Text>
				<Text className='text-base dark:color-secondary'>Sign in to see your personal bulletin board.</Text>

				<TextInput
				autoComplete="email" editable={!isSubmitting} autoCapitalize="none" keyboardType="email-address" placeholder="Email" onKeyPress={handlePressEnter}
				onChangeText={setEmail} className='w-full md:w-1/2 outline-gray-400 outline rounded text-base p-[14px] dark:color-secondary' value={email}
				/>

				<TextInput
				autoComplete="password" editable={!isSubmitting} onChangeText={setPassword} secureTextEntry onKeyPress={handlePressEnter}
				placeholder="Password" className='w-full md:w-1/2 outline-gray-400 outline rounded text-base p-[14px] dark:color-secondary' value={password}
				/>

				<Pressable className="bg-cyan rounded items-center w-fit self-center px-4 py-2" disabled={isSubmitting} onPress={signIn}>
					<Text>{isSubmitting ? 'Please wait…' : 'Sign in'}</Text>
				</Pressable>
				<Pressable className="bg-cyan rounded items-center w-fit self-center px-4 py-2" disabled={isSubmitting} onPress={signUp}>
					<Text>Create account</Text>
				</Pressable>

			</View>
		</KeyboardAvoidingView>
	);
}