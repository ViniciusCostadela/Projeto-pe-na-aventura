document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const links = document.querySelector('.links');
    const scrollTopButton = document.querySelector('.scroll-top');
    const revealElements = document.querySelectorAll('.reveal');
    const contatoForm = document.getElementById('contato-form');
    const feedback = document.getElementById('form-feedback');
    const dbStatus = document.getElementById('db-status');
    const dbTotal = document.getElementById('db-total');
    const dbUltima = document.getElementById('db-ultima');
    const dbList = document.getElementById('db-list');
    const dbDestinos = document.getElementById('db-destinos');
    const destinoForm = document.getElementById('destino-form');
    const destinoFeedback = document.getElementById('destino-feedback');
    const destinosList = document.getElementById('destinos-list');
    const exportBtn = document.getElementById('exportar-btn');
    const accessForm = document.getElementById('access-form');
    const accessFeedback = document.getElementById('access-feedback');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminLoginSection = document.getElementById('admin-login-section');
    const adminUserLabel = document.getElementById('admin-user-label');
    const logoutBtn = document.getElementById('logout-btn');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const destinoIdInput = document.getElementById('destino-id');
    const destinoTituloInput = document.getElementById('destino-titulo');
    const destinoLocalInput = document.getElementById('destino-local');
    const destinoDescricaoInput = document.getElementById('destino-descricao');
    const destinoLinkInput = document.getElementById('destino-link');
    const isAdminPage = document.body.getAttribute('data-page') === 'admin';
    const DB_NAME = 'peNaAventuraDB';
    const ADMIN_USER = 'admin';
    const ADMIN_PASSWORD = 'penaaventura2026';
    const STORE_CONTACTS = 'contatos';
    const STORE_DESTINOS = 'destinos';

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

    const openDatabase = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 2);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_CONTACTS)) {
                    const contactsStore = db.createObjectStore(STORE_CONTACTS, { keyPath: 'id', autoIncrement: true });
                    contactsStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORE_DESTINOS)) {
                    const destinosStore = db.createObjectStore(STORE_DESTINOS, { keyPath: 'id', autoIncrement: true });
                    destinosStore.createIndex('titulo', 'titulo', { unique: false });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const saveToDatabase = (storeName, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await openDatabase();
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const record = {
                    ...data,
                    createdAt: new Date().toISOString()
                };
                const addRequest = store.add(record);

                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(addRequest.error);
                transaction.oncomplete = () => db.close();
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    };

    const updateDestino = (id, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await openDatabase();
                const transaction = db.transaction([STORE_DESTINOS], 'readwrite');
                const store = transaction.objectStore(STORE_DESTINOS);
                const getRequest = store.get(Number(id));

                getRequest.onsuccess = () => {
                    const existing = getRequest.result || {};
                    const updated = {
                        ...existing,
                        ...data,
                        id: Number(id),
                        createdAt: existing.createdAt || new Date().toISOString()
                    };
                    const putRequest = store.put(updated);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                };

                getRequest.onerror = () => reject(getRequest.error);
                transaction.oncomplete = () => db.close();
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    };

    const deleteDestino = (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await openDatabase();
                const transaction = db.transaction([STORE_DESTINOS], 'readwrite');
                const store = transaction.objectStore(STORE_DESTINOS);
                const deleteRequest = store.delete(Number(id));

                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => reject(deleteRequest.error);
                transaction.oncomplete = () => db.close();
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    };

    const loadFromDatabase = (storeName) => {
        return new Promise(async (resolve) => {
            try {
                const db = await openDatabase();
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const getAllRequest = store.getAll();

                getAllRequest.onsuccess = () => {
                    const items = getAllRequest.result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    db.close();
                    resolve(items);
                };

                getAllRequest.onerror = () => {
                    db.close();
                    resolve([]);
                };
            } catch (error) {
                resolve([]);
            }
        });
    };

    const renderDashboard = (items) => {
        if (dbTotal) {
            dbTotal.textContent = items.length;
        }

        if (dbUltima) {
            dbUltima.textContent = items.length ? formatDate(items[0].createdAt) : '—';
        }

        if (dbStatus) {
            dbStatus.textContent = items.length ? 'Banco ativo' : 'Aguardando dados';
        }

        if (dbList) {
            if (!items.length) {
                dbList.innerHTML = '<li>Nenhuma mensagem salva ainda.</li>';
                return;
            }

            dbList.innerHTML = items.slice(0, 10).map((item) => {
                return `<li><strong>${item.nome}</strong><br>${item.email} • ${item.telefone}<br>${item.mensagem}</li>`;
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
                    <strong>${item.titulo}</strong><br>${item.local}<br>${item.descricao}<br>
                    <button data-action="edit" data-id="${item.id}">EDITAR</button>
                    <button data-action="delete" data-id="${item.id}">EXCLUIR</button>
                </li>`;
            }).join('');
        }
    };

    const loadDashboardData = async () => {
        const contatos = await loadFromDatabase(STORE_CONTACTS);
        const destinos = await loadFromDatabase(STORE_DESTINOS);
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
        if (adminLoginSection) {
            adminLoginSection.hidden = authorized;
        }
    };

    const clearDestinoForm = () => {
        if (destinoIdInput) destinoIdInput.value = '';
        if (destinoTituloInput) destinoTituloInput.value = '';
        if (destinoLocalInput) destinoLocalInput.value = '';
        if (destinoDescricaoInput) destinoDescricaoInput.value = '';
        if (destinoLinkInput) destinoLinkInput.value = '';
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
                await saveToDatabase(STORE_CONTACTS, payload);
                feedback.textContent = 'Mensagem enviada e salva com sucesso!';
                contatoForm.reset();
            } catch (error) {
                feedback.textContent = 'Não foi possível salvar a mensagem no momento.';
                console.error(error);
            }
        });
    }

    if (accessForm && accessFeedback && isAdminPage) {
        accessForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const user = document.getElementById('admin-user').value;
            const password = document.getElementById('admin-password').value;

            if (user === ADMIN_USER && password === ADMIN_PASSWORD) {
                toggleAdminAccess(true);
                if (adminUserLabel) adminUserLabel.textContent = `Logado como ${user}`;
                accessFeedback.textContent = 'Acesso liberado.';
                await loadDashboardData();
            } else {
                accessFeedback.textContent = 'Usuário ou senha incorretos.';
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
                    await updateDestino(payload.id, payload);
                } else {
                    await saveToDatabase(STORE_DESTINOS, payload);
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
                await deleteDestino(id);
                await loadDashboardData();
            }

            if (action === 'edit') {
                const destinos = await loadFromDatabase(STORE_DESTINOS);
                const item = destinos.find((entry) => String(entry.id) === String(id));
                if (item) {
                    if (destinoIdInput) destinoIdInput.value = item.id;
                    if (destinoTituloInput) destinoTituloInput.value = item.titulo || '';
                    if (destinoLocalInput) destinoLocalInput.value = item.local || '';
                    if (destinoDescricaoInput) destinoDescricaoInput.value = item.descricao || '';
                    if (destinoLinkInput) destinoLinkInput.value = item.link || '';
                }
            }
        });
    }

    if (cancelEditBtn && isAdminPage) {
        cancelEditBtn.addEventListener('click', clearDestinoForm);
    }

    if (logoutBtn && isAdminPage) {
        logoutBtn.addEventListener('click', () => {
            toggleAdminAccess(false);
            if (accessFeedback) accessFeedback.textContent = 'Sessão encerrada.';
            clearDestinoForm();
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
        toggleAdminAccess(false);
        loadDashboardData();
    }

    if (contatoForm && feedback && !isAdminPage) {
        contatoForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(contatoForm);
            const payload = Object.fromEntries(formData.entries());

            try {
                await saveToDatabase(STORE_CONTACTS, payload);
                feedback.textContent = 'Mensagem enviada e salva com sucesso!';
                contatoForm.reset();
            } catch (error) {
                feedback.textContent = 'Não foi possível salvar a mensagem no momento.';
                console.error(error);
            }
        });
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
