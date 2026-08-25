async function sendAuth(url, data) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a solicitação.');
    return result;
}
document.getElementById('login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = document.getElementById('login-feedback');
    try { const result = await sendAuth('/api/auth/login', { email: document.getElementById('login-email').value, password: document.getElementById('login-password').value }); window.location.href = result.user.role === 'admin' ? 'admin.html' : 'cliente.html'; } catch (error) { feedback.textContent = error.message; }
});
document.getElementById('register-form')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const feedback = document.getElementById('register-feedback');
    try { await sendAuth('/api/auth/register', { name: document.getElementById('register-name').value, email: document.getElementById('register-email').value, password: document.getElementById('register-password').value }); window.location.href = 'cliente.html'; } catch (error) { feedback.textContent = error.message; }
});
