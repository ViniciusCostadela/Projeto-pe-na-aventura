document.addEventListener('DOMContentLoaded', () => {
    const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
    const menuToggle = document.querySelector('.menu-toggle');
    const links = document.querySelector('.links');
    const scrollTopButton = document.querySelector('.scroll-top');
    const revealElements = document.querySelectorAll('.reveal');
    const contatoForm = document.getElementById('contato-form');
    const feedback = document.getElementById('form-feedback');
    const dbTotal = document.getElementById('db-total');
    const dbList = document.getElementById('db-list');
    const dbDestinos = document.getElementById('db-destinos');
    const dbReservas = document.getElementById('db-reservas');
    const reservasList = document.getElementById('reservas-list');
    const destinoForm = document.getElementById('destino-form');
    const destinoFeedback = document.getElementById('destino-feedback');
    const destinosList = document.getElementById('destinos-list');
    const exportBtn = document.getElementById('exportar-btn');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminUserLabel = document.getElementById('admin-user-label');
    const logoutBtn = document.getElementById('logout-btn');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const destinoIdInput = document.getElementById('destino-id');
    const destinoTituloInput = document.getElementById('destino-titulo');
    const destinoLocalInput = document.getElementById('destino-local');
    const destinoDescricaoInput = document.getElementById('destino-descricao');
    const destinoLinkInput = document.getElementById('destino-link');
    const destinoVagasInput = document.getElementById('destino-vagas');
    const usersList = document.getElementById('users-list');
    const isAdminPage = document.body.getAttribute('data-page') === 'admin';
    const formatDate = (value) => {
        const date = new Date(value);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderDashboard = (items) => {
        if (dbTotal) {
            dbTotal.textContent = items.length;
        }

        if (dbList) {
            if (!items.length) {
                dbList.innerHTML = '<li>Nenhuma mensagem salva ainda.</li>';
                return;
            }

            dbList.innerHTML = items.slice(0, 10).map((item) => {
                return `<li><strong>${escapeHtml(item.name)}</strong><br>${escapeHtml(item.email)} • ${escapeHtml(item.phone)}<br>${escapeHtml(item.message)}<br><button data-contact-id="${escapeHtml(item.id)}" data-action="delete-contact">EXCLUIR CONTATO</button></li>`;
            }).join('');
        }
    };

    const renderDestinos = (items) => {
        if (destinosList) {
            if (!items.length) {
                destinosList.innerHTML = '<li>Nenhum destino cadastrado ainda.</li>';
                return;
            }

            destinosList.innerHTML = items.map((item) => {
                return `<li>
                    <strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(item.location)}<br>${escapeHtml(item.description)}<br><strong>Vagas disponíveis: ${escapeHtml(item.vacancies)}</strong><br>
                    <button data-action="edit" data-id="${escapeHtml(item.id)}">EDITAR</button>
                    <button data-action="delete" data-id="${escapeHtml(item.id)}">EXCLUIR</button>
                </li>`;
            }).join('');
        }
    };

    const loadDashboardData = async () => {
        const contatos = await getServerContacts();
        const destinos = await getServerDestinations();
        renderDashboard(contatos);
        renderDestinos(destinos);
        if (dbTotal) dbTotal.textContent = contatos.length;
        if (dbDestinos) dbDestinos.textContent = destinos.length;
        return { contatos, destinos };
    };

    const toggleAdminAccess = (authorized) => {
        if (adminDashboard) {
            adminDashboard.hidden = !authorized;
        }
    };

    const clearDestinoForm = () => {
        if (destinoIdInput) destinoIdInput.value = '';
        if (destinoTituloInput) destinoTituloInput.value = '';
        if (destinoLocalInput) destinoLocalInput.value = '';
        if (destinoDescricaoInput) destinoDescricaoInput.value = '';
        if (destinoLinkInput) destinoLinkInput.value = '';
        if (destinoVagasInput) destinoVagasInput.value = '';
    };

    const apiRequest = async (url, options = {}) => {
        const response = await fetch(url, options);
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a operação.');
        return result;
    };

    const getServerDestinations = async () => (await apiRequest('/api/destinations')).destinations || [];
    const getServerContacts = async () => (await apiRequest('/api/admin/contacts')).contacts || [];

    const loadReservations = async () => {
        if (!reservasList) return;
        try {
            const result = await apiRequest('/api/admin/reservations');
            if (dbReservas) dbReservas.textContent = result.reservations.length;
            reservasList.innerHTML = result.reservations.map((reservation) => `<li><strong>${escapeHtml(reservation.destinationTitle)}</strong><br>${escapeHtml(reservation.fullName)} • ${escapeHtml(reservation.email)}<br>${escapeHtml(reservation.phone)} • ${escapeHtml(formatDate(reservation.createdAt))}<br><button data-reservation-id="${escapeHtml(reservation.id)}" data-action="delete-reservation">CANCELAR RESERVA</button></li>`).join('') || '<li>Nenhuma reserva confirmada.</li>';
        } catch (error) {
            reservasList.innerHTML = '<li>Não foi possível carregar as reservas.</li>';
        }
    };

    const getCurrentUser = async () => {
        const response = await fetch('/api/auth/me');
        if (!response.ok) return null;
        return (await response.json()).user;
    };

    const loadUsers = async () => {
        if (!usersList) return;
        const response = await fetch('/api/admin/users');
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            usersList.innerHTML = '<li>Não foi possível carregar os usuários.</li>';
            return;
        }
        usersList.innerHTML = result.users.map((user) => `<li><strong>${escapeHtml(user.name)}</strong><br>${escapeHtml(user.email)} • ${user.role === 'admin' ? 'Administrador' : 'Usuário'}${user.role === 'user' ? `<br><button data-user-id="${escapeHtml(user.id)}" data-action="delete-user">EXCLUIR CADASTRO</button>` : ''}</li>`).join('') || '<li>Nenhum usuário cadastrado.</li>';
    };

    if (menuToggle && links) {
        menuToggle.addEventListener('click', () => {
            links.classList.toggle('active');
            menuToggle.classList.toggle('active');
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', String(!expanded));
        });

        document.querySelectorAll('.links a').forEach((link) => {
            link.addEventListener('click', () => {
                links.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    if (scrollTopButton) {
        const toggleScrollButton = () => {
            if (window.scrollY > 400) {
                scrollTopButton.classList.add('visible');
            } else {
                scrollTopButton.classList.remove('visible');
            }
        };

        toggleScrollButton();
        window.addEventListener('scroll', toggleScrollButton, { passive: true });

        scrollTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (contatoForm && feedback) {
        contatoForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(contatoForm);
            const payload = Object.fromEntries(formData.entries());

            try {
                await apiRequest('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: payload.nome, email: payload.email, phone: payload.telefone, message: payload.mensagem }) });
                feedback.textContent = 'Mensagem enviada e salva com sucesso!';
                contatoForm.reset();
            } catch (error) {
                feedback.textContent = 'Não foi possível salvar a mensagem no momento.';
                console.error(error);
            }
        });
    }

    if (destinoForm && destinoFeedback && isAdminPage) {
        destinoForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(destinoForm);
            const payload = Object.fromEntries(formData.entries());

            try {
                if (payload.id) {
                    await apiRequest(`/api/admin/destinations/${payload.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: payload.titulo, location: payload.local, description: payload.descricao, link: payload.link, vacancies: payload.vagas }) });
                } else {
                    await apiRequest('/api/admin/destinations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: payload.titulo, location: payload.local, description: payload.descricao, link: payload.link, vacancies: payload.vagas }) });
                }

                destinoFeedback.textContent = 'Destino salvo com sucesso!';
                clearDestinoForm();
                await loadDashboardData();
            } catch (error) {
                destinoFeedback.textContent = 'Não foi possível salvar o destino.';
                console.error(error);
            }
        });
    }

    if (destinosList && isAdminPage) {
        destinosList.addEventListener('click', async (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            const id = button.getAttribute('data-id');
            const action = button.getAttribute('data-action');

            if (action === 'delete') {
                await apiRequest(`/api/admin/destinations/${id}`, { method: 'DELETE' });
                await loadDashboardData();
            }

            if (action === 'edit') {
                const destinos = await getServerDestinations();
                const item = destinos.find((entry) => String(entry.id) === String(id));
                if (item) {
                    if (destinoIdInput) destinoIdInput.value = item.id;
                    if (destinoTituloInput) destinoTituloInput.value = item.title || '';
                    if (destinoLocalInput) destinoLocalInput.value = item.location || '';
                    if (destinoDescricaoInput) destinoDescricaoInput.value = item.description || '';
                    if (destinoLinkInput) destinoLinkInput.value = item.link || '';
                    if (destinoVagasInput) destinoVagasInput.value = item.vacancies ?? '';
                }
            }
        });
    }

    if (cancelEditBtn && isAdminPage) {
        cancelEditBtn.addEventListener('click', clearDestinoForm);
    }

    if (usersList && isAdminPage) {
        usersList.addEventListener('click', async (event) => {
            const button = event.target.closest('[data-action="delete-user"]');
            if (!button || !confirm('Excluir este cadastro de cliente? Esta ação não pode ser desfeita.')) return;
            try {
                await apiRequest(`/api/admin/users/${button.dataset.userId}`, { method: 'DELETE' });
                await loadUsers();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    if (dbList && isAdminPage) {
        dbList.addEventListener('click', async (event) => {
            const button = event.target.closest('[data-action="delete-contact"]');
            if (!button || !confirm('Excluir este contato?')) return;
            try {
                await apiRequest(`/api/admin/contacts/${button.dataset.contactId}`, { method: 'DELETE' });
                await loadDashboardData();
            } catch (error) { alert(error.message); }
        });
    }

    if (reservasList && isAdminPage) {
        reservasList.addEventListener('click', async (event) => {
            const button = event.target.closest('[data-action="delete-reservation"]');
            if (!button || !confirm('Cancelar esta reserva e devolver a vaga?')) return;
            try {
                await apiRequest(`/api/admin/reservations/${button.dataset.reservationId}`, { method: 'DELETE' });
                await loadDashboardData();
                await loadReservations();
            } catch (error) { alert(error.message); }
        });
    }

    if (logoutBtn && isAdminPage) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.replace('acesso.html');
        });
    }

    if (exportBtn && isAdminPage) {
        exportBtn.addEventListener('click', async () => {
            const { contatos, destinos } = await loadDashboardData();
            const payload = JSON.stringify({ contatos, destinos }, null, 2);
            const blob = new Blob([payload], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'pena-aventura-dados.json';
            link.click();
            URL.revokeObjectURL(url);
        });
    }

    if (isAdminPage) {
        (async () => {
            const user = await getCurrentUser();
            if (user?.role === 'admin') {
                toggleAdminAccess(true);
                if (adminUserLabel) adminUserLabel.textContent = `Logado como ${user.name}`;
                await loadDashboardData();
                await loadUsers();
                await loadReservations();
            } else {
                if (user) await fetch('/api/auth/logout', { method: 'POST' });
                window.location.replace('acesso.html');
            }
        })();
    }

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
        });

        revealElements.forEach((element) => observer.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add('is-visible'));
    }
});
