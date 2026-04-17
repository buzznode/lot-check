import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { NewInspectionScreen } from '../screens/NewInspectionScreen';
import { CategoryScreen } from '../screens/CategoryScreen';
import { ChecklistScreen } from '../screens/ChecklistScreen';
import { SummaryScreen } from '../screens/SummaryScreen';

export type RootStackParamList = {
  Home: undefined;
  NewInspection: undefined;
  Category: { inspectionId: string };
  Checklist: { inspectionId: string; categoryId: string };
  Summary: { inspectionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NewInspection" component={NewInspectionScreen} />
            <Stack.Screen name="Category" component={CategoryScreen} />
            <Stack.Screen name="Checklist" component={ChecklistScreen} />
            <Stack.Screen name="Summary" component={SummaryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
