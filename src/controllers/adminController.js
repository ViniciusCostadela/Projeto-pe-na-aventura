const database = require('../database');
const { publicUser } = require('../services/authService');

function listUsers(request, response) {
    const users = database.prepare('SELECT id, name, email, role, created_at AS createdAt FROM users ORDER BY created_at DESC').all();
    response.json({ users: users.map(publicUser) });
}

function deleteUser(request, response) {
    if (request.params.id === request.user.id) return response.status(400).json({ error: 'O administrador não pode excluir a própria conta.' });
    const target = database.prepare('SELECT id, role FROM users WHERE id = ?').get(request.params.id);
    if (!target) return response.status(404).json({ error: 'Usuário não encontrado.' });
    if (target.role === 'admin') return response.status(403).json({ error: 'Contas administrativas não podem ser removidas por aqui.' });
    if (database.prepare('SELECT 1 FROM reservations WHERE user_id = ? LIMIT 1').get(target.id)) return response.status(409).json({ error: 'Este cliente possui reserva ativa. Cancele a reserva antes de excluir o cadastro.' });
    database.prepare('DELETE FROM users WHERE id = ?').run(target.id);
    response.status(204).end();
}

module.exports = { listUsers, deleteUser };
