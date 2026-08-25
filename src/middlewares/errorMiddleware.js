function notFound(request, response) {
    response.status(404).json({ error: 'Rota não encontrada.' });
}

function errorHandler(error, request, response, next) {
    console.error(error);
    response.status(500).json({ error: 'Não foi possível concluir a operação.' });
}

module.exports = { notFound, errorHandler };
