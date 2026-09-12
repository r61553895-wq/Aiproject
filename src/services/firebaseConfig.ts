import configFile from '../../firebase-applet-config.json';

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

const fallbackConfig: FirebaseAppConfig = {
  projectId: "gen-lang-client-0843319081",
  appId: "1:498804527104:web:ea804bd40a64126de008e5",
  apiKey: "AIzaSyCyJj-FuAQrVHk1orwRk-pLOAh-eEIsOdA",
  authDomain: "gen-lang-client-0843319081.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-gigachatai-07683d51-cc7f-41dd-9015-7fe75eb3ce7f",
  storageBucket: "gen-lang-client-0843319081.firebasestorage.app",
  messagingSenderId: "498804527104",
  measurementId: "",
  oAuthClientId: "498804527104-uf64qcvobf0g81u3gcb0hj1bi93ui8sl.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

export const firebaseConfig: FirebaseAppConfig = (configFile && configFile.apiKey) ? (configFile as FirebaseAppConfig) : fallbackConfig;
export default firebaseConfig;
