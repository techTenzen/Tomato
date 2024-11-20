import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyBwlGNbJegj4BxrLMdkE5YugRS0nfMcE48",
  authDomain: "fost---food-street.firebaseapp.com",
  projectId: "fost---food-street",
  storageBucket: "fost---food-street.appspot.com",
  messagingSenderId: "1036530834692",
  appId: "1:1036530834692:web:bf2dfcfb8fd3ab1f29c451",
  measurementId: "G-LYETE6N9P6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
const analytics = getAnalytics(app);

export const getCurrentUser = async () => {
  const user = auth.currentUser;

  if (user) {
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    return {
      uid: user.uid,
      email: user.email,
      role: userData?.role || 'customer',
      shopId: userData?.shopId || null
    };
  }

  return null;
};