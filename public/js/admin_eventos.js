// admin_eventos.js

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('eventModal');
    const createEventButton = document.getElementById('createEventButton');
    const closeButton = document.querySelector('.close');
    const eventForm = document.getElementById('eventForm');
    const eventsList = document.querySelector('.events-list');
    const fechaInput = document.getElementById('fecha');
    const horaInput = document.getElementById('hora');

    // Configurar fecha mínima como hoy
    const today = new Date().toISOString().split('T')[0];
    fechaInput.min = today;

    // Asegurar que el modal esté oculto al cargar
    modal.style.display = 'flex';
    modal.classList.remove('active');

    // Cargar eventos al iniciar
    loadEvents();

    // Función para abrir el modal
    function openModal() {
        modal.style.display = 'flex';
        // Trigger reflow para asegurar la transición
        modal.offsetHeight;
        modal.classList.add('active');
        eventForm.reset();
        fechaInput.min = today;
        document.body.style.overflow = 'hidden';
        // Enfocar el primer campo del formulario
        setTimeout(() => {
            document.getElementById('titulo').focus();
        }, 300); // Esperar a que termine la transición
    }

    // Función para cerrar el modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        eventForm.reset();
        // Esperar a que termine la transición antes de ocultar
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Abrir modal con el botón
    createEventButton.addEventListener('click', openModal);

    // Cerrar modal con el botón de cerrar
    closeButton.addEventListener('click', closeModal);

    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Cerrar modal con la tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // Manejar envío del formulario
    eventForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('titulo', document.getElementById('titulo').value);
        formData.append('descripcion', document.getElementById('descripcion').value);
        formData.append('fecha', document.getElementById('fecha').value);
        formData.append('hora', document.getElementById('hora').value);
        formData.append('lugar', document.getElementById('lugar').value);

        const imagenInput = document.getElementById('imagen');
        if (imagenInput.files[0]) {
            formData.append('eventImage', imagenInput.files[0]);
        }

        try {
            const response = await fetch('/eventos', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Evento creado:', result);
                closeModal();
                loadEvents(); // Recargar eventos
            } else {
                const error = await response.json();
                console.error('Error al crear evento:', error);
                alert('Error al crear el evento: ' + (error.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al crear el evento');
        }
    });

    // Función para cargar eventos
    async function loadEvents() {
        try {
            const response = await fetch('/eventos');
            if (!response.ok) {
                throw new Error('Error al cargar eventos');
            }
            const eventos = await response.json();
            displayEvents(eventos);
        } catch (error) {
            console.error('Error al cargar eventos:', error);
            eventsList.innerHTML = '<p class="no-events">Error al cargar los eventos</p>';
        }
    }

    // Función para mostrar eventos
    function displayEvents(eventos) {
        eventsList.innerHTML = '';
        
        if (!eventos || eventos.length === 0) {
            eventsList.innerHTML = '<p class="no-events">No hay eventos disponibles</p>';
            return;
        }

        eventos.forEach(evento => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <img src="${evento.imagen}" alt="${evento.titulo}" class="event-image">
                <div class="event-details">
                    <h3 class="event-title">${evento.titulo}</h3>
                    <div class="event-info">
                        <p class="event-date">
                            <i class="far fa-calendar-alt"></i>
                            ${new Date(evento.fecha).toLocaleDateString()}
                        </p>
                        <p class="event-time">
                            <i class="far fa-clock"></i>
                            ${evento.hora}
                        </p>
                        <p class="event-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${evento.lugar}
                        </p>
                    </div>
                    <p class="event-description">${evento.descripcion}</p>
                </div>
                <button class="delete-event-button" data-id="${evento.id}">Eliminar</button>`;

            eventsList.appendChild(eventCard);

            // Agregar evento para eliminar
            const deleteButton = eventCard.querySelector('.delete-event-button');
            deleteButton.addEventListener('click', async () => {
                if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
                    try {
                        const response = await fetch(`/eventos/${evento.id}`, {
                            method: 'DELETE'
                        });

                        if (response.ok) {
                            eventCard.remove();
                            if (eventsList.children.length === 0) {
                                eventsList.innerHTML = '<p class="no-events">No hay eventos disponibles</p>';
                            }
                        } else {
                            const error = await response.json();
                            console.error('Error al eliminar evento:', error);
                            alert('Error al eliminar el evento: ' + (error.error || 'Error desconocido'));
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Error al eliminar el evento');
                    }
                }
            });
        });
    }
});
