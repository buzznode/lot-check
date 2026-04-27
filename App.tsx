import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { RootNavigator } from './src/navigation/RootNavigator';

const RC_ANDROID_KEY = 'goog_qzcEMTyyQXMevSXAHbtUQaLWgkU';
const RC_IOS_KEY = 'appl_REPLACE_WITH_IOS_KEY';

export default function App() {
  useEffect(() => {
    const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
    if (apiKey.startsWith('appl_REPLACE')) return;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
  }, []);

  return <RootNavigator />;
}
