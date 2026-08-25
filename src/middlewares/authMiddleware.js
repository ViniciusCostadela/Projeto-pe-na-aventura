const { getSessionUser } = require('../services/authService');

function authenticated(request, response, next) {
    const user = getSessionUser(request);
    if (!user) return response.status(401).json({ error: 'Faça login para continuar.' });
    request.user = user;
    next();
}

function administrator(request, response, next) {
    const ownerEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!ownerEmail || !process.env.ADMIN_PASSWORD) return response.status(503).json({ error: 'O acesso administrativo ainda não foi configurado pelo responsável do projeto.' });
    if (request.user.role !== 'admin' || request.user.email !== ownerEmail) return response.status(403).json({ error: 'Acesso restrito à administração.' });
    next();
}

module.exports = { authenticated, administrator };
