// scripts.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const usernameError = document.getElementById('username-error');
    const passwordError = document.getElementById('password-error');
    const closeButton = document.querySelector('.close-button');

    // Función para validar el formulario
    const validateForm = () => {
        let isValid = true;
        
        // Validar nombre de usuario
        if (!usernameInput.value.trim()) {
            usernameError.textContent = 'Por favor, ingresa tu nombre de usuario';
            usernameError.style.display = 'block';
            isValid = false;
        } else {
            usernameError.style.display = 'none';
        }
        
        // Validar contraseña
        if (!passwordInput.value) {
            passwordError.textContent = 'Por favor, ingresa tu contraseña';
            passwordError.style.display = 'block';
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            passwordError.textContent = 'La contraseña debe tener al menos 6 caracteres';
            passwordError.style.display = 'block';
            isValid = false;
        } else {
            passwordError.style.display = 'none';
        }
        
        return isValid;
    };

    // Event listener para el envío del formulario
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: usernameInput.value,
                        password: passwordInput.value
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    if (data.isAdmin) {
                        window.location.href = '/admin_eventos.html';
                    } else {
                        window.location.href = '/eventos.html';
                    }
                } else {
                    alert(data.error || 'Error en el inicio de sesión');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al conectar con el servidor');
            }
        }
    });

    // Event listener para el botón de cerrar
    closeButton.addEventListener('click', () => {
        // Aquí puedes añadir la lógica para cerrar el modal o redirigir
        console.log('Cerrando formulario de inicio de sesión');
    });

    // Limpiar mensajes de error cuando el usuario comienza a escribir
    usernameInput.addEventListener('input', () => {
        usernameError.style.display = 'none';
    });

    passwordInput.addEventListener('input', () => {
        passwordError.style.display = 'none';
    });
});