import { useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '@/utils/supabase';

export default function SignInScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const signIn = async() => {
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
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={styles.screen}
		>
			<View style={styles.form}>
				<Text style={styles.title}>Tack</Text>
				<Text style={styles.subtitle}>
					Sign in to see your personal bulletin board.
				</Text>

				<TextInput
				autoCapitalize="none" autoComplete="email" editable={!isSubmitting} keyboardType="email-address" 
				onChangeText={setEmail} placeholder="Email" style={styles.input} value={email}
				/>

				<TextInput
				autoCapitalize="none" autoComplete="password" editable={!isSubmitting} onChangeText={setPassword}
				placeholder="Password" secureTextEntry style={styles.input} value={password}
				/>

				<Button disabled={isSubmitting} onPress={signIn} title={isSubmitting ? 'Please wait…' : 'Sign in'} />

				<Button disabled={isSubmitting} onPress={signUp} title="Create account" />
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
	form: {
		gap: 16,
	},
	title: {
		fontSize: 40,
		fontWeight: '700',
	},
	subtitle: {
		color: '#666',
		fontSize: 16,
	},
	input: {
		borderColor: '#aaa',
		borderRadius: 10,
		borderWidth: 1,
		fontSize: 16,
		padding: 14,
	},
});