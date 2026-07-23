import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  projectId: 'notaryhost-33a33',
  appId: '1:1018880442313:web:1aa7e9c7e0fc53392ab218',
  storageBucket: 'notaryhost-33a33.firebasestorage.app',
  apiKey: 'AIzaSyBgDREKYT_iOk8v0-7U02BCSTJb5ypm8GI',
  authDomain: 'notaryhost-33a33.firebaseapp.com',
  messagingSenderId: '1018880442313',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
