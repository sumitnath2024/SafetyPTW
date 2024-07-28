// firebase-config.js
document.addEventListener("DOMContentLoaded", function() {
  const firebaseConfig = {
    apiKey: "AIzaSyDJa-enrUoz-C9TfzwzYG2vP7qoGMtm5CY",
    authDomain: "safetyptw.firebaseapp.com",
    projectId: "safetyptw",
    storageBucket: "safetyptw.appspot.com",
    messagingSenderId: "223838440306",
    appId: "1:223838440306:web:798f15898dad48a8f66beb",
    measurementId: "G-KECD3L1DBP"
  };

  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();

  console.log("Firebase initialized", { auth: window.auth, db: window.db, storage: window.storage });
});
