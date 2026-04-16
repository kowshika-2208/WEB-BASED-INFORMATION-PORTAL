const initPlacementsTabs = () => {
  const buttons = document.querySelectorAll('[data-placement-tab]');
  const sections = document.querySelectorAll('[data-placement-content]');
  if (!buttons.length || !sections.length) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-placement-tab');

      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      sections.forEach((section) => {
        section.classList.toggle('is-active', section.getAttribute('data-placement-content') === key);
      });
    });
  });
};

document.addEventListener('DOMContentLoaded', initPlacementsTabs);
