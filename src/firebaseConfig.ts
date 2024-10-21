// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 
import { getStorage } from 'firebase/storage'; 

const firebaseConfig = {
  apiKey: "AIzaSyBGytCikT0mYJTxQN3CRRiWcr9LeApr3mo",
  authDomain: "menubyqr.firebaseapp.com",
  databaseURL: "https://menubyqr-default-rtdb.firebaseio.com",
  projectId: "menubyqr",
  storageBucket: "menubyqr.appspot.com",
  messagingSenderId: "120912014433",
  appId: "1:120912014433:web:555d46cf64d55e69f98e20",
  measurementId: "G-7G05KEZ74C"


  // apiKey: "AIzaSyBhRzs2NmBj5qzefXhyLviIJl4LJvsDqnc",
  // authDomain: "menus-74417.firebaseapp.com",
  // databaseURL: "https://menus-74417-default-rtdb.firebaseio.com",
  // projectId: "menus-74417",
  // storageBucket: "menus-74417.appspot.com",
  // messagingSenderId: "1001175615681",
  // appId: "1:1001175615681:web:c166229ccddd28d310ac40",
  // measurementId: "G-2HZM4H8YMF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Google Auth Provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Set auth persistence to local (stay signed in across reloads)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

// Initialize Firestore and Storage if needed
const db = getFirestore(app); 
const storage = getStorage(app);

export { auth, googleProvider, db, storage };
