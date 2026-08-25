const crypto = require('crypto');
const database = require('../database');
const { hashPassword, verifyPassword, findUserByEmail, publicUser, createSession, destroySession, setSessionCookie } = require('../services/authService');
const { clearAuthenticationLimit } = require('../middlewares/rateLimitMiddleware');

function register(request, response) {
    const name = String(request.body.name || '').trim();
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');
    if (name.length < 2 || name.length > 100 || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 128) return response.status(400).json({ error: 'Informe nome, e-mail válido e uma senha de 8 a 128 caracteres.' });
    if (findUserByEmail(email)) return response.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    const user = { id: crypto.randomUUID(), name, email, passwordHash: hashPassword(password), role: 'user', createdAt: new Date().toISOString() };
    database.prepare('INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt);
    clearAuthenticationLimit(request);
    setSessionCookie(response, createSession(user));
    response.status(201).json({ user: publicUser(user) });
}

function login(request, response) {
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');
    const user = findUserByEmail(email);
    if (email.length > 254 || password.length > 128 || !user || !verifyPassword(password, user.passwordHash)) return response.status(401).json({ error: 'E-mail ou senha incorretos.' });
    clearAuthenticationLimit(request);
    setSessionCookie(response, createSession(user));
    response.json({ user: publicUser(user) });
}

function logout(request, response) {
    destroySession(request);
    response.setHeader('Set-Cookie', 'session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    response.status(204).end();
}

function me(request, response) { response.json({ user: publicUser(request.user) }); }

module.exports = { register, login, logout, me };
