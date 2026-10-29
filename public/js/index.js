document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.querySelector('.navbar-toggler');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
  }
});
