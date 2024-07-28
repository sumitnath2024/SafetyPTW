document.addEventListener("DOMContentLoaded", function() {
  // Add event listeners or any interactive JavaScript here
  const forms = document.querySelectorAll("form");
  
  forms.forEach(form => {
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      alert("PTW form submitted successfully!");
      // Perform form submission logic here
    });
  });
});
