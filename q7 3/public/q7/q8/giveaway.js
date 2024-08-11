document.addEventListener('DOMContentLoaded', () => {
    // Attach the validateForm function to the form's submit event
    document.getElementById('pet-form').addEventListener('submit', validateForm);
});

function validateForm(event) {
    event.preventDefault(); // Prevent form submission

    const type = document.querySelector('input[name="Type"]:checked');
    const breed = document.querySelector('input[name="breed"]');
    const age = document.querySelector('select[name="age"]');
    const gender = document.querySelector('input[name="Gender"]:checked');
    const ownerFirstName = document.querySelector('input[name="first_name"]');
    const ownerLastName = document.querySelector('input[name="last_name"]');
    const email = document.querySelector('input[name="email"]');
    const errorElement = document.getElementById('error-message');
    let errorMessage = '';

    if (!type) {
        errorMessage += 'Please select a type.\n';
    }
    if (!breed.value) {
        errorMessage += 'Please enter the breed.\n';
    }
    if (!age.value) {
        errorMessage += 'Please select an age category.\n';
    }
    if (!gender) {
        errorMessage += 'Please select a gender.\n';
    }
    if (!ownerFirstName.value) {
        errorMessage += 'Please enter the owner\'s first name.\n';
    }
    if (!ownerLastName.value) {
        errorMessage += 'Please enter the owner\'s last name.\n';
    }
    if (!validateEmail(email.value)) {
        errorMessage += 'Please enter a valid email address.\n';
    }

    if (errorMessage) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
    } else {
        errorElement.style.display = 'none';
        document.getElementById('pet-form').submit();
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}
