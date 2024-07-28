document.addEventListener("DOMContentLoaded", function() {
  const loginForm = document.getElementById("loginForm");
  const forgotPasswordLink = document.getElementById("forgotPassword");

  loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    try {
      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log("User logged in", user);

      // Get the custom UID from Firestore
      const userDoc = await window.db.collection("users").where("email", "==", email).get();
      let customUID;
      userDoc.forEach((doc) => {
        customUID = doc.id;
      });

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("email", email);
        localStorage.setItem("password", password); // Storing password for auto-login
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("email");
        localStorage.removeItem("password");
      }

      // Store the custom UID in localStorage
      localStorage.setItem("userUID", customUID);
      console.log("Custom UID saved in localStorage:", localStorage.getItem("userUID"));

      alert("Login successful!");
      window.location.href = 'dashboard.html'; // Redirect to dashboard or home page
    } catch (error) {
      console.error("Error logging in: ", error);
      alert("Error logging in: " + error.message);
    }
  });

  forgotPasswordLink.addEventListener("click", async function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;

    if (!email) {
      alert("Please enter your email address first.");
      return;
    }

    try {
      await window.auth.sendPasswordResetEmail(email);
      alert("Password reset email sent. Please check your inbox.");
    } catch (error) {
      console.error("Error sending password reset email: ", error);
      alert("Error sending password reset email: " + error.message);
    }
  });

  function autoLogin() {
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");

    if (rememberMe && email && password) {
      document.getElementById("email").value = email;
      document.getElementById("password").value = password;
      document.getElementById("rememberMe").checked = true;

      window.auth.signInWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
          const user = userCredential.user;
          console.log("User auto logged in", user);

          // Get the custom UID from Firestore
          const userDoc = await window.db.collection("users").where("email", "==", email).get();
          let customUID;
          userDoc.forEach((doc) => {
            customUID = doc.id;
          });

          // Store the custom UID in localStorage
          localStorage.setItem("userUID", customUID);
          console.log("Custom UID saved in localStorage (auto-login):", localStorage.getItem("userUID"));

          window.location.href = 'dashboard.html'; // Redirect to dashboard or home page
        })
        .catch((error) => {
          console.error("Error auto logging in: ", error);
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("email");
          localStorage.removeItem("password");
        });
    }
  }

  autoLogin();
});
