// ============================================
// Active Navigation Link
// ============================================
document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.href === window.location.href) {
        link.classList.add('active');
    }
});

// ============================================
// Hamburger Menu Toggle
// ============================================
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        // Toggle active class on both hamburger and nav
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

// ============================================
// Toast Notification
// ============================================
function closeToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }
}

// Auto-close after 3 seconds
setTimeout(() => {
    closeToast();
}, 3000);