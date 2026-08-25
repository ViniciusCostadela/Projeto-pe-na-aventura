const crypto = require('crypto');
const database = require('../database');

function listReservations(request, response) {
    response.json({ reservations: database.prepare('SELECT id, user_id AS userId, full_name AS fullName, email, phone, destination_id AS destinationId, destination_title AS destinationTitle, created_at AS createdAt FROM reservations ORDER BY created_at DESC').all() });
}

function listMyReservations(request, response) {
    response.json({ reservations: database.prepare('SELECT id, full_name AS fullName, email, phone, destination_id AS destinationId, destination_title AS destinationTitle, created_at AS createdAt FROM reservations WHERE user_id = ? ORDER BY created_at DESC').all(request.user.id) });
}

function createReservation(request, response) {
    const fullName = String(request.body.fullName || '').trim();
    const phone = String(request.body.phone || '').trim();
    const destinationId = String(request.body.destinationId || '');
    if (fullName.length < 3 || fullName.length > 100 || phone.length > 30 || phone.replace(/\D/g, '').length < 10 || !destinationId || destinationId.length > 100) return response.status(400).json({ error: 'Informe nome completo, telefone válido e um destino.' });
    if (database.prepare('SELECT 1 FROM reservations WHERE user_id = ? AND destination_id = ? LIMIT 1').get(request.user.id, destinationId)) return response.status(409).json({ error: 'Você já possui uma reserva para este destino.' });
    const destination = database.prepare('SELECT id, title, vacancies FROM destinations WHERE id = ?').get(destinationId);
    if (!destination) return response.status(404).json({ error: 'Este destino não está mais disponível.' });
    if (destination.vacancies < 1) return response.status(409).json({ error: 'Não há mais vagas. Tente novamente assim que surgirem novas vagas.' });
    const reservation = { id: crypto.randomUUID(), userId: request.user.id, fullName, email: request.user.email, phone, destinationId: destination.id, destinationTitle: destination.title, createdAt: new Date().toISOString() };
    database.exec('BEGIN IMMEDIATE');
    try {
        const result = database.prepare('UPDATE destinations SET vacancies = vacancies - 1 WHERE id = ? AND vacancies > 0').run(destinationId);
        if (!result.changes) { database.exec('ROLLBACK'); return response.status(409).json({ error: 'Não há mais vagas. Tente novamente assim que surgirem novas vagas.' }); }
        database.prepare('INSERT INTO reservations (id, user_id, full_name, email, phone, destination_id, destination_title, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(reservation.id, reservation.userId, reservation.fullName, reservation.email, reservation.phone, reservation.destinationId, reservation.destinationTitle, reservation.createdAt);
        database.exec('COMMIT');
    } catch (error) { database.exec('ROLLBACK'); throw error; }
    response.status(201).json({ reservation, remainingVacancies: destination.vacancies - 1 });
}

function cancelReservation(reservationId, response) {
    const reservation = database.prepare('SELECT id, destination_id AS destinationId FROM reservations WHERE id = ?').get(reservationId);
    if (!reservation) return response.status(404).json({ error: 'Reserva não encontrada.' });
    database.exec('BEGIN IMMEDIATE');
    try {
        database.prepare('DELETE FROM reservations WHERE id = ?').run(reservation.id);
        database.prepare('UPDATE destinations SET vacancies = vacancies + 1 WHERE id = ?').run(reservation.destinationId);
        database.exec('COMMIT');
    } catch (error) { database.exec('ROLLBACK'); throw error; }
    return response.status(204).end();
}

function cancelMyReservation(request, response) {
    const reservation = database.prepare('SELECT user_id AS userId FROM reservations WHERE id = ?').get(request.params.id);
    if (!reservation) return response.status(404).json({ error: 'Reserva não encontrada.' });
    if (reservation.userId !== request.user.id) return response.status(403).json({ error: 'Você não pode cancelar esta reserva.' });
    return cancelReservation(request.params.id, response);
}

function cancelAdminReservation(request, response) { return cancelReservation(request.params.id, response); }

module.exports = { listReservations, listMyReservations, createReservation, cancelMyReservation, cancelAdminReservation };
