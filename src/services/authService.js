const crypto = require('crypto');
const database = require('../database');

const sessions = new Map();
const SESSION_TTL = 1000 * 60 * 60 * 8;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password, savedHash) {
    const [salt, hash] = savedHash.split(':');
    if (!salt || !hash || !/^[a-f0-9]+$/.test(hash) || hash.length !== 128) return false;
    const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

function findUserById(id) {
    return database.prepare('SELECT id, name, email, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE id = ?').get(id);
}

function findUserByEmail(email) {
    return database.prepare('SELECT id, name, email, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE email = ?').get(email);
}

function publicUser(user) {
    const ownerEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    return { id: user.id, name: user.name, email: user.email, role: user.role === 'admin' && user.email === ownerEmail ? 'admin' : 'user', createdAt: user.createdAt };
}

function createSession(user) {
    const token = crypto.randomBytes(32).toString('hex');
    for (const [storedToken, session] of sessions) {
        if (session.expiresAt < Date.now()) sessions.delete(storedToken);
    }
    sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL });
    return token;
}

function getToken(request) {
    return (request.headers.cookie || '').split(';').map((item) => item.trim()).find((item) => item.startsWith('session='))?.slice(8);
}

function getSessionUser(request) {
    const token = getToken(request);
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
        if (token) sessions.delete(token);
        return null;
    }
    session.expiresAt = Date.now() + SESSION_TTL;
    return findUserById(session.userId);
}

function destroySession(request) {
    sessions.delete(getToken(request));
}

function setSessionCookie(response, token) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    response.setHeader('Set-Cookie', `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${secure}`);
}

function seedAdministrator() {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;
    const email = process.env.ADMIN_EMAIL.toLowerCase();
    if (findUserByEmail(email)) return;
    database.prepare('INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        crypto.randomUUID(), process.env.ADMIN_NAME || 'Administrador', email, hashPassword(process.env.ADMIN_PASSWORD), 'admin', new Date().toISOString()
    );
}

module.exports = { hashPassword, verifyPassword, findUserById, findUserByEmail, publicUser, createSession, getSessionUser, destroySession, setSessionCookie, seedAdministrator };
