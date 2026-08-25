const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function limitAuthentication(request, response, next) {
    const now = Date.now();
    const record = attempts.get(request.ip) || { count: 0, resetAt: now + WINDOW };
    if (record.resetAt < now) { record.count = 0; record.resetAt = now + WINDOW; }
    if (record.count >= MAX_ATTEMPTS) return response.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
    record.count += 1;
    attempts.set(request.ip, record);
    next();
}

function clearAuthenticationLimit(request) { attempts.delete(request.ip); }

module.exports = { limitAuthentication, clearAuthenticationLimit };
