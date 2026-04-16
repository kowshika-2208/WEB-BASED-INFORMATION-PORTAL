const renderAnnouncementDetail = (card) => {
  const get = (name) => card.getAttribute(name) || '';
  const title = document.getElementById('announceDetailTitle');
  const date = document.getElementById('announceDetailDate');
  const text = document.getElementById('announceDetailText');
  const status = document.getElementById('announceStatusPill');
  const time = document.getElementById('announceDetailTime');
  const venue = document.getElementById('announceDetailVenue');
  const cta = document.getElementById('announceDetailCta');

  if (!title || !date || !text || !status || !time || !venue || !cta) return;

  const statusText = get('data-status');
  title.textContent = get('data-title');
  date.textContent = get('data-date');
  text.textContent = get('data-detail');
  status.textContent = statusText;
  status.className = `announce-status-pill status-${statusText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  time.textContent = get('data-time');
  venue.textContent = get('data-venue');
  cta.textContent = get('data-cta');
};

const initHomeAnnouncements = () => {
  const cards = document.querySelectorAll('.announce-card-action');
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      renderAnnouncementDetail(card);
      cards.forEach((item) => {
        const active = item === card;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    });
  });

  renderAnnouncementDetail(cards[0]);
};

document.addEventListener('DOMContentLoaded', initHomeAnnouncements);
