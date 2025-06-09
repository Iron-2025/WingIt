document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
});

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        const result = await response.json();

        if (result.success) {
            // Set admin session
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminLoginTime', Date.now().toString());

            // Redirect to dashboard
            window.location.href = '/admin/dashboard';
        } else {
            showError('Invalid username or password');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showError('An error occurred. Please try again.');
    }
}

function showError(message) {
    // Remove existing error
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 10px;
        border-radius: 5px;
        margin-top: 15px;
        text-align: center;
        border: 1px solid #f5c6cb;
    `;
    
    const loginForm = document.getElementById('loginForm');
    loginForm.appendChild(errorDiv);
    
    // Remove error after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}
