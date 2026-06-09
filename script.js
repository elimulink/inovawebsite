document.addEventListener('DOMContentLoaded', (event) => {
    const sections = document.querySelectorAll('.section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.2
    });

    sections.forEach(section => {
        observer.observe(section);
    });

    // --- Mobile navbar toggle ---
    const navToggle = document.querySelector('.navbar-toggle');
    const navLinks = document.querySelector('.navbar-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }

    // --- Assist widget ---
    const assistPanel = document.getElementById('assist-panel');
    const assistOpen = document.getElementById('assist-open');
    const assistClose = document.getElementById('assist-close');
    const assistNo = document.getElementById('assist-no');

    if (assistOpen && assistPanel) {
        assistOpen.addEventListener('click', () => assistPanel.classList.toggle('open'));
    }
    [assistClose, assistNo].forEach(btn => {
        if (btn) btn.addEventListener('click', () => assistPanel.classList.remove('open'));
    });
});
