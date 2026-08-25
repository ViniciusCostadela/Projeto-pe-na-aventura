const crypto = require('crypto');
const database = require('../database');

function createContact(request, response) {
    const name = String(request.body.name || '').trim();
    const email = String(request.body.email || '').trim().toLowerCase();
    const phone = String(request.body.phone || '').trim();
    const message = String(request.body.message || '').trim();
    if (name.length < 2 || name.length > 100 || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email) || phone.length < 8 || phone.length > 30 || message.length < 5 || message.length > 2000) return response.status(400).json({ error: 'Preencha os campos com valores válidos.' });
    const contact = { id: crypto.randomUUID(), name, email, phone, message, createdAt: new Date().toISOString() };
    database.prepare('INSERT INTO contacts (id, name, email, phone, message, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(contact.id, contact.name, contact.email, contact.phone, contact.message, contact.createdAt);
    response.status(201).json({ contact });
}

function listContacts(request, response) {
    response.json({ contacts: database.prepare('SELECT id, name, email, phone, message, created_at AS createdAt FROM contacts ORDER BY created_at DESC').all() });
}

function deleteContact(request, response) {
    const result = database.prepare('DELETE FROM contacts WHERE id = ?').run(request.params.id);
    if (!result.changes) return response.status(404).json({ error: 'Contato não encontrado.' });
    response.status(204).end();
}

module.exports = { createContact, listContacts, deleteContact };
