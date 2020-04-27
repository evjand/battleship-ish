// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from 'firebase/app'

// If you enabled Analytics in your project, add the Firebase SDK for Analytics
//import "firebase/analytics";

// Add the Firebase products that you want to use
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/functions'

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: 'battleship-ish.firebaseapp.com',
  databaseURL: 'https://battleship-ish.firebaseio.com',
  projectId: 'battleship-ish',
  storageBucket: 'battleship-ish.appspot.com',
  messagingSenderId: '57723460313',
  appId: '1:57723460313:web:f55fa72d03e38eea77bcc8',
}
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig)

const auth = app.auth()
const firestore = app.firestore()
const functions = app.functions('europe-west1')

export { auth, firestore, functions }
