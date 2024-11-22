// eventos.js

document.addEventListener('DOMContentLoaded', function() {
    const eventsList = document.querySelector('.events-list');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    let currentSection = 'all';

    // Cargar eventos al iniciar
    loadEvents();

    // Event listeners para los filtros de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            
            // Actualizar navegación activa
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            
            currentSection = section;
            loadEvents();
        });
    });

    // Función para cargar eventos
    async function loadEvents() {
        try {
            const response = await fetch('/eventos');
            if (!response.ok) {
                throw new Error('Error al cargar eventos');
            }
            const eventos = await response.json();
            
            // Obtener el estado de inscripción para cada evento
            const eventosConInscripcion = await Promise.all(eventos.map(async (evento) => {
                const inscripcionResponse = await fetch(`/eventos/${evento.id}/inscrito`);
                const inscripcionData = await inscripcionResponse.json();
                return { ...evento, inscrito: inscripcionData.inscrito };
            }));
            
            // Filtrar eventos según la sección actual
            const eventosFiltrados = currentSection === 'all' ? 
                eventosConInscripcion : 
                eventosConInscripcion.filter(evento => evento.inscrito);
            
            displayEvents(eventosFiltrados);
        } catch (error) {
            console.error('Error al cargar eventos:', error);
            eventsList.innerHTML = '<p class="no-events">Error al cargar los eventos</p>';
        }
    }

    // Función para mostrar eventos
    function displayEvents(eventos) {
        eventsList.innerHTML = '';
        
        if (!eventos || eventos.length === 0) {
            const mensaje = currentSection === 'all' ? 
                'No hay eventos disponibles' : 
                'No te has inscrito a ningún evento';
            eventsList.innerHTML = `<p class="no-events">${mensaje}</p>`;
            return;
        }

        eventos.forEach(evento => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <img src="${evento.imagen || 'https://via.placeholder.com/300x200'}" alt="${evento.titulo}" class="event-image">
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
                <button class="join-event-button" data-id="${evento.id}">
                    ${evento.inscrito ? 'Abandonar' : 'Inscribirse'}
                </button>
            `;

            const joinButton = eventCard.querySelector('.join-event-button');
            if (evento.inscrito) {
                joinButton.classList.add('joined');
            }

            joinButton.addEventListener('click', async () => {
                try {
                    const method = evento.inscrito ? 'DELETE' : 'POST';
                    const response = await fetch(`/eventos/${evento.id}/join`, {
                        method: method
                    });

                    if (response.ok) {
                        loadEvents(); // Recargar eventos para actualizar el estado
                    } else {
                        const error = await response.json();
                        alert(error.message || 'Error al procesar la solicitud');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al procesar la solicitud');
                }
            });

            eventsList.appendChild(eventCard);
        });
    }
});