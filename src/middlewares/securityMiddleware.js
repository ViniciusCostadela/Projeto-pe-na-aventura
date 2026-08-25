function securityHeaders(request, response, next) {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if (process.env.NODE_ENV === 'production') response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
}

function sameOrigin(request, response, next) {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return next();
    const origin = request.get('origin');
    if (!origin) return next();
    const expectedOrigin = `${request.protocol}://${request.get('host')}`;
    if (origin !== expectedOrigin) return response.status(403).json({ error: 'Origem da solicitação não autorizada.' });
    next();
}

function blockSensitiveFiles(request, response, next) {
    const blocked = ['/src/', '/data/', '/node_modules/', '/.git/', '/.env', '/package.json', '/package-lock.json', '/readme.md'];
    if (blocked.some((pathPart) => request.path.toLowerCase().startsWith(pathPart))) return response.status(404).end();
    next();
}

module.exports = { securityHeaders, sameOrigin, blockSensitiveFiles };
