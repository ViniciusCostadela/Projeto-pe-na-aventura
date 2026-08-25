const crypto = require('crypto');
const database = require('../database');

function listDestinations(request, response) {
    response.json({ destinations: database.prepare('SELECT id, title, location, description, link, vacancies, created_at AS createdAt FROM destinations ORDER BY created_at DESC').all() });
}

function destinationData(body) {
    return { title: String(body.title || '').trim(), location: String(body.location || '').trim(), description: String(body.description || '').trim(), link: String(body.link || '').trim(), vacancies: Number(body.vacancies) };
}

function validDestination(item) {
    let validLink = true;
    if (item.link) {
        try { validLink = ['http:', 'https:'].includes(new URL(item.link).protocol); } catch { validLink = false; }
    }
    return item.title.length >= 2 && item.title.length <= 150 && item.location.length >= 2 && item.location.length <= 150 && item.description.length >= 5 && item.description.length <= 3000 && item.link.length <= 500 && validLink && Number.isInteger(item.vacancies) && item.vacancies >= 0;
}

function createDestination(request, response) {
    const destination = { id: crypto.randomUUID(), ...destinationData(request.body), createdAt: new Date().toISOString() };
    if (!validDestination(destination)) return response.status(400).json({ error: 'Preencha nome, local, descrição e uma quantidade válida de vagas.' });
    database.prepare('INSERT INTO destinations (id, title, location, description, link, vacancies, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(destination.id, destination.title, destination.location, destination.description, destination.link, destination.vacancies, destination.createdAt);
    response.status(201).json({ destination });
}

function updateDestination(request, response) {
    const current = database.prepare('SELECT id, created_at AS createdAt FROM destinations WHERE id = ?').get(request.params.id);
    if (!current) return response.status(404).json({ error: 'Destino não encontrado.' });
    const destination = { ...current, ...destinationData(request.body) };
    if (!validDestination(destination)) return response.status(400).json({ error: 'Preencha todos os campos obrigatórios e uma quantidade válida de vagas.' });
    const reservationCount = database.prepare('SELECT COUNT(*) AS total FROM reservations WHERE destination_id = ?').get(destination.id).total;
    if (destination.vacancies < reservationCount) return response.status(409).json({ error: `Este destino já possui ${reservationCount} reserva(s); as vagas não podem ficar abaixo desse número.` });
    database.prepare('UPDATE destinations SET title = ?, location = ?, description = ?, link = ?, vacancies = ? WHERE id = ?').run(destination.title, destination.location, destination.description, destination.link, destination.vacancies, destination.id);
    response.json({ destination });
}

function deleteDestination(request, response) {
    if (database.prepare('SELECT 1 FROM reservations WHERE destination_id = ? LIMIT 1').get(request.params.id)) return response.status(409).json({ error: 'Este destino possui reservas registradas e não pode ser excluído.' });
    const result = database.prepare('DELETE FROM destinations WHERE id = ?').run(request.params.id);
    if (!result.changes) return response.status(404).json({ error: 'Destino não encontrado.' });
    response.status(204).end();
}

module.exports = { listDestinations, createDestination, updateDestination, deleteDestination };
