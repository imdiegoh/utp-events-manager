// signup-scripts.js

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const usernameInput = document.getElementById('username');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Función para validar el formulario
    const validateForm = () => {
        let isValid = true;
        const errors = {};

        // Validar username
        if (!usernameInput.value.trim()) {
            errors.username = 'El nombre de usuario es requerido';
            isValid = false;
        }

        // Validar nombre
        if (!nombreInput.value.trim()) {
            errors.nombre = 'El nombre es requerido';
            isValid = false;
        }

        // Validar apellido
        if (!apellidoInput.value.trim()) {
            errors.apellido = 'El apellido es requerido';
            isValid = false;
        }

        // Validar email
        if (!emailInput.value.trim()) {
            errors.email = 'El correo electrónico es requerido';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
            errors.email = 'Ingrese un correo electrónico válido';
            isValid = false;
        }

        // Validar contraseña
        if (!passwordInput.value) {
            errors.password = 'La contraseña es requerida';
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            errors.password = 'La contraseña debe tener al menos 6 caracteres';
            isValid = false;
        }

        // Validar confirmación de contraseña
        if (passwordInput.value !== confirmPasswordInput.value) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
            isValid = false;
        }

        // Mostrar errores
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`${field}-error`);
            if (errorElement) {
                errorElement.textContent = errors[field];
                errorElement.style.display = 'block';
            }
        });

        return isValid;
    };

    // Event listener para el envío del formulario
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Limpiar mensajes de error previos
        document.querySelectorAll('.error-message').forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
        
        if (validateForm()) {
            try {
                const response = await fetch('/registro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: usernameInput.value.trim(),
                        nombre: nombreInput.value.trim(),
                        apellido: apellidoInput.value.trim(),
                        email: emailInput.value.trim(),
                        password: passwordInput.value
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    alert('¡Registro exitoso! Por favor, inicia sesión.');
                    window.location.href = '/index.html';
                } else {
                    // Mostrar error específico en el campo correspondiente
                    const errorMessage = data.error;
                    if (errorMessage.includes('nombre de usuario')) {
                        document.getElementById('username-error').textContent = errorMessage;
                        document.getElementById('username-error').style.display = 'block';
                    } else if (errorMessage.includes('correo electrónico')) {
                        document.getElementById('email-error').textContent = errorMessage;
                        document.getElementById('email-error').style.display = 'block';
                    } else {
                        alert(errorMessage);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al conectar con el servidor. Por favor, intenta nuevamente.');
            }
        }
    });

    // Limpiar mensajes de error cuando el usuario comienza a escribir
    const inputs = [usernameInput, nombreInput, apellidoInput, emailInput, passwordInput, confirmPasswordInput];
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const errorElement = document.getElementById(`${input.id}-error`);
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        });
    });
});