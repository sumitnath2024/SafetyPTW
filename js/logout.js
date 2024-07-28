document.addEventListener("DOMContentLoaded", function() {
  const logoutButton = document.getElementById("logoutButton");

  logoutButton.addEventListener("click", function() {
    window.auth.signOut().then(() => {
      console.log("User signed out");
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("email");
      window.location.href = 'login.html'; // Redirect to login page
    }).catch((error) => {
      console.error("Error signing out: ", error);
    });
  });
});
