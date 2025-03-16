const usernameEl = document.querySelector('#username');
const passwordEl = document.querySelector('#password');

const form = document.querySelector('#signup');


const showError = (input, message) => {

    const formControl = input.parentElement;

    formControl.classList.remove('success');
    formControl.classList.add('error');

    const error = formControl.querySelector('small');

    error.textContent = message;
};

const showSuccess = (input) => {

    const formControl = input.parentElement;

    formControl.classList.remove('error');
    formControl.classList.add('success');
};

const checkUsername = () => {

    const username = usernameEl.value.trim();
    if (username === '') {
        showError(usernameEl, 'Username cannot be blank.');
        return false;


    } else {
        showSuccess(usernameEl);
        return true;
    }
};

const checkPassword = () => {

    const password = passwordEl.value.trim();
    if (password === '') {
        showError(passwordEl, 'Password cannot be blank.');
        return false;


    } else {
        showSuccess(passwordEl);
        return true;
    }
};



form.addEventListener('submit', function (e) {
    e.preventDefault();


    const isUsernameValid = checkUsername();
    const isPasswordValid = checkPassword();


    if (isUsernameValid && isPasswordValid) {
       
        const username = usernameEl.value.trim();
        const password = passwordEl.value.trim();

        console.log(username + password);


       

        if (username == "admin" && password == "1234") {

            // Login successful
            alert('Login successful');

            // Redirect to index.html
            window.location.href = 'index.html';
        } else {

            // Incorrect username or password
            showError(usernameEl);
            showError(passwordEl, 'Incorrect username or password.');


        }
    }


   

});
