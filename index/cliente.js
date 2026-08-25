document.addEventListener('DOMContentLoaded', async () => {
    const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
    const response = await fetch('/api/auth/me');
    if (!response.ok) { window.location.replace('acesso.html'); return; }
    const { user } = await response.json();
    if (user.role === 'admin') { window.location.replace('admin.html'); return; }
    document.getElementById('client-name').textContent = user.name;
    document.getElementById('client-email').textContent = user.email;
    document.getElementById('reservation-name').value = user.name;
    document.getElementById('reservation-email').value = user.email;
    document.getElementById('client-created-at').textContent = new Date(user.createdAt).toLocaleDateString('pt-BR');
    document.getElementById('client-area').hidden = false;

    const destinationSelect = document.getElementById('reservation-destination');
    const feedback = document.getElementById('reservation-feedback');
    const reservationsList = document.getElementById('my-reservations-list');
    const loadDestinations = async () => {
        try {
            const destinationsResponse = await fetch('/api/destinations');
            const { destinations } = await destinationsResponse.json();
            destinationSelect.innerHTML = '<option value="">Selecione um destino</option>';
            destinations.forEach((destination) => {
                const option = document.createElement('option');
                option.value = destination.id;
                option.textContent = `${destination.title} — ${destination.vacancies} vaga${destination.vacancies === 1 ? '' : 's'}`;
                option.disabled = destination.vacancies < 1;
                destinationSelect.appendChild(option);
            });
            if (!destinations.length) destinationSelect.innerHTML = '<option value="">Nenhum destino cadastrado no momento</option>';
        } catch (error) {
            destinationSelect.innerHTML = '<option value="">Não foi possível carregar os destinos</option>';
        }
    };
    await loadDestinations();

    const loadMyReservations = async () => {
        try {
            const reservationsResponse = await fetch('/api/reservations/me');
            const { reservations } = await reservationsResponse.json();
            reservationsList.innerHTML = reservations.map((reservation) => `<li><strong>${escapeHtml(reservation.destinationTitle)}</strong><br>Reservado em ${escapeHtml(new Date(reservation.createdAt).toLocaleString('pt-BR'))}<br><button data-reservation-id="${escapeHtml(reservation.id)}">CANCELAR RESERVA</button></li>`).join('') || '<li>Você ainda não possui reservas.</li>';
        } catch (error) {
            reservationsList.innerHTML = '<li>Não foi possível carregar suas reservas.</li>';
        }
    };
    await loadMyReservations();

    document.getElementById('reservation-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        feedback.textContent = '';
        try {
            const reservationResponse = await fetch('/api/reservations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: document.getElementById('reservation-name').value, phone: document.getElementById('reservation-phone').value, destinationId: destinationSelect.value })
            });
            const result = await reservationResponse.json().catch(() => ({}));
            if (!reservationResponse.ok) throw new Error(result.error || 'Não foi possível concluir a reserva.');
            feedback.textContent = `Reserva confirmada! Restam ${result.remainingVacancies} vaga(s) neste destino.`;
            document.getElementById('reservation-phone').value = '';
            await loadDestinations();
            await loadMyReservations();
        } catch (error) {
            feedback.textContent = error.message;
        }
    });

    reservationsList.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-reservation-id]');
        if (!button || !confirm('Deseja cancelar esta reserva? A vaga voltará a ficar disponível.')) return;
        try {
            const cancelResponse = await fetch(`/api/reservations/me/${button.dataset.reservationId}`, { method: 'DELETE' });
            const result = await cancelResponse.json().catch(() => ({}));
            if (!cancelResponse.ok) throw new Error(result.error || 'Não foi possível cancelar a reserva.');
            await loadDestinations();
            await loadMyReservations();
        } catch (error) { alert(error.message); }
    });

    document.getElementById('client-logout').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.replace('acesso.html');
    });
});
