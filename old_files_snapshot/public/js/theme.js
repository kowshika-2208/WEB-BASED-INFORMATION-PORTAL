(function () {
  const THEME_KEY = 'cip_theme';

  const applyTheme = (theme) => {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.body.classList.toggle('theme-dark', next === 'dark');
    document.body.classList.toggle('theme-light', next === 'light');
    localStorage.setItem(THEME_KEY, next);

    document.querySelectorAll('.mode-icon').forEach((icon) => {
      icon.innerHTML = next === 'dark' ? '&#9728;' : '&#9789;';
      icon.setAttribute('aria-label', next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      icon.setAttribute('title', next === 'dark' ? 'Light theme' : 'Dark theme');
    });
  };

  const init = () => {
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(saved);

    document.querySelectorAll('.mode-icon').forEach((icon) => {
      icon.setAttribute('role', 'button');
      icon.setAttribute('tabindex', '0');
      icon.style.cursor = 'pointer';
      icon.addEventListener('click', () => {
        const isDark = document.body.classList.contains('theme-dark');
        applyTheme(isDark ? 'light' : 'dark');
      });
      icon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const isDark = document.body.classList.contains('theme-dark');
          applyTheme(isDark ? 'light' : 'dark');
        }
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
