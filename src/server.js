const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { securityHeaders, sameOrigin, blockSensitiveFiles } = require('./middlewares/securityMiddleware');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { seedAdministrator } = require('./services/authService');

const app = express();
const projectRoot = path.join(__dirname, '..');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(sameOrigin);
app.use(express.json({ limit: '20kb' }));
app.use(blockSensitiveFiles);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

app.get('/', (request, response) => response.sendFile(path.join(projectRoot, 'index.html')));

app.use(express.static(projectRoot, {
    dotfiles: 'deny',
    index: false,
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
    seedAdministrator();
    app.listen(process.env.PORT || 3000, () => console.log(`Site rodando em http://localhost:${process.env.PORT || 3000}`));
}

module.exports = app;
