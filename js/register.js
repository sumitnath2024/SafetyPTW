document.addEventListener("DOMContentLoaded", function() {
  console.log("Register script loaded");

  if (!window.auth || !window.db || !window.storage) {
    console.error("Firebase services are not initialized correctly");
    return;
  }

  console.log("Firebase services loaded", { auth: window.auth, db: window.db, storage: window.storage });

  const registerForm = document.getElementById("registerForm");

  registerForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const phoneNumber = document.getElementById("phoneNumber").value;
    const role = document.getElementById("role").value;

    console.log("Submitting registration", { fullName, email, password, phoneNumber, role });

    try {
      const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log("User created", user);

      // Hash the password before saving it
      const hashedPassword = CryptoJS.SHA256(password).toString();

      // Fetch the current count of documents in the users collection
      const usersCollection = await window.db.collection("users").get();
      const userCount = usersCollection.size;

      // Create the new document ID
      const newDocId = `U-${userCount + 1}`;

      // Save user details in Firestore with custom document ID
      await window.db.collection("users").doc(newDocId).set({
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber,
        role: role,
        password: hashedPassword // Save the hashed password in Firestore
      });

      alert("User registered successfully!");
      window.location.href = 'login.html';
    } catch (error) {
      console.error("Error registering user: ", error);
      alert("Error registering user: " + error.message);
    }
  });
});
