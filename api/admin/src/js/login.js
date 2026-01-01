const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const btnLogin = document.getElementById('btnLogin');
const btnText = btnLogin.querySelector('span');
const btnIcon = document.getElementById('btnIcon');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    btnText.innerText = "Authenticating...";
    btnIcon.className = "fa-solid fa-spinner fa-spin";
    btnLogin.style.opacity = "0.8";
    btnLogin.style.pointerEvents = "none";
    errorMessage.classList.remove('show');

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            sessionStorage.setItem('adminToken', data.token);
            btnIcon.className = "fa-solid fa-check";
            btnText.innerText = "Success!";
            setTimeout(() => {
                window.location.href = "/api/admin/index.html";
            }, 500);
        } else {
            throw new Error();
        }
    } catch (error) {
        errorMessage.classList.add('show');
        btnText.innerText = "Login to Dashboard";
        btnIcon.className = "fa-solid fa-arrow-right";
        btnLogin.style.opacity = "1";
        btnLogin.style.pointerEvents = "auto";
    }
});
