import { Text } from '@/components/customFontText';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AppHeaderProps = {
    title?: string;
    onNewTack?: () => void;
};

export default function AppHeader({ title = '📌 Tack 📌', onNewTack }: AppHeaderProps) {
    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    };

    return (
        <SafeAreaView edges={['top']}>
            <View className="w-[95%] flex-row items-center justify-between self-center py-4">
                <TouchableOpacity className="justify-center rounded bg-cyan px-4" onPress={onNewTack ? onNewTack : goBack} >
                    <Text className="text-lg leading-[30px]">{onNewTack ? '+ New Tack' : '← Back'}</Text>
                </TouchableOpacity>
                
                <Text bold className="text-5xl font-semibold dark:color-white">{title}</Text>

                <TouchableOpacity className="justify-center rounded bg-cyan px-4" onPress={() => void supabase.auth.signOut()} >
                    <Text className="text-lg leading-[30px]">Sign out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}