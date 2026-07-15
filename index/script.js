document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const links = document.querySelector('.links');
    const scrollTopButton = document.querySelector('.scroll-top');
    const revealElements = document.querySelectorAll('.reveal');
    const contatoForm = document.getElementById('contato-form');
    const feedback = document.getElementById('form-feedback');

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
        contatoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            feedback.textContent = 'Mensagem enviada com sucesso! Em breve entraremos em contato.';
            contatoForm.reset();
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
