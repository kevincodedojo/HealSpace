document.querySelectorAll('nav a').forEach(link => {
  if (link.href === window.location.href) {
    link.classList.add('active');
  }
});


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