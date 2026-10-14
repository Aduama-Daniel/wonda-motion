// Renders the work grid from work.json. To add a piece, append an entry there and drop its
// video.mp4 and poster.jpg in media/<slug>/. Newest entries show first. A piece with a
// widescreen cut also sets videoWide and posterWide.

const grid = document.getElementById('work-grid');
const viewer = document.getElementById('viewer');
const viewerVideo = document.getElementById('viewer-video');
const viewerCuts = document.getElementById('viewer-cuts');
const heroVideo = document.getElementById('hero-video');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

const formatDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {month: 'long', year: 'numeric'});

// Muted previews only play while they are on screen.
const previews = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !reduceMotion && !viewer.open) {
        entry.target.play().catch(() => {});
      } else {
        entry.target.pause();
      }
    }
  },
  {threshold: 0.35},
);

const reveals = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        reveals.unobserve(entry.target);
      }
    }
  },
  {threshold: 0.12},
);

// Shows the vertical or widescreen cut of a piece in the viewer.
const showCut = (piece, wide) => {
  viewer.classList.toggle('wide', wide);
  viewerVideo.poster = wide ? piece.posterWide : piece.poster;
  viewerVideo.src = wide ? piece.videoWide : piece.video;
  viewerCuts.querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-pressed', String((button.dataset.cut === 'wide') === wide));
  });
  viewerVideo.play().catch(() => {});
};

const section = (id, text) => {
  const body = document.getElementById(id);
  body.textContent = text || '';
  body.hidden = !text;
  body.previousElementSibling.hidden = !text;
};

const openViewer = (piece) => {
  document.getElementById('viewer-kind').textContent = piece.kind;
  document.getElementById('viewer-title').textContent = piece.title;
  document.getElementById('viewer-meta').textContent =
    [piece.brand, piece.sector, piece.length, piece.format, formatDate(piece.date)].filter(Boolean).join(' · ');
  document.getElementById('viewer-summary').textContent = piece.summary;
  section('viewer-noticed', piece.noticed);
  section('viewer-built', piece.built);

  viewerCuts.replaceChildren();
  viewerCuts.hidden = !piece.videoWide;
  if (piece.videoWide) {
    for (const [cut, name] of [['tall', 'Vertical'], ['wide', 'Widescreen']]) {
      const button = el('button', 'cut', name);
      button.type = 'button';
      button.dataset.cut = cut;
      button.addEventListener('click', () => showCut(piece, cut === 'wide'));
      viewerCuts.append(button);
    }
  }

  document.querySelectorAll('.card video, #hero-video').forEach((video) => video.pause());
  viewer.showModal();
  showCut(piece, false);
};

const closeViewer = () => {
  viewerVideo.pause();
  viewerVideo.removeAttribute('src');
  viewerVideo.load();
  if (!reduceMotion) heroVideo.play().catch(() => {});
};

viewer.addEventListener('close', closeViewer);
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) viewer.close();
});
document.getElementById('viewer-close').addEventListener('click', () => viewer.close());

const pieceCard = (piece, index) => {
  const card = el('button', 'card');
  card.type = 'button';
  card.style.transitionDelay = `${Math.min(index, 5) * 70}ms`;
  card.setAttribute('aria-label', `Watch ${piece.title}, ${piece.kind.toLowerCase()} for ${piece.brand}`);

  const media = el('div', 'card-media');
  const video = el('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.poster = piece.poster;
  video.src = piece.video;
  media.append(video, el('span', 'tag', piece.kind), el('span', 'play', '▶ Watch with sound'));

  const text = el('div', 'card-text');
  text.append(el('h3', '', piece.brand), el('p', '', `${piece.sector} · ${piece.length}`));

  card.append(media, text);
  card.addEventListener('click', () => openViewer(piece));
  previews.observe(video);
  reveals.observe(card);
  return card;
};

const nextCard = () => {
  const card = el('div', 'card next');
  const top = el('div');
  top.append(el('p', 'tag', 'Next up'), el('h3', '', 'Your launch could sit here.'));
  top.querySelector('h3').style.marginTop = '18px';
  top.append(el('p', '', 'New pieces are added as they are finished.'));
  const link = el('a', 'button', 'Start a project');
  link.href = '#contact';
  card.append(top, link);
  reveals.observe(card);
  return card;
};

fetch('work.json')
  .then((response) => response.json())
  .then((work) => {
    const pieces = [...work].sort((a, b) => b.date.localeCompare(a.date));
    pieces.forEach((piece, index) => grid.append(pieceCard(piece, index)));
    grid.append(nextCard());

    if (pieces.length) {
      heroVideo.poster = pieces[0].poster;
      heroVideo.src = pieces[0].video;
      if (!reduceMotion) heroVideo.play().catch(() => {});
    }
  })
  .catch(() => {
    grid.append(el('p', '', 'The work list could not be loaded. Open this site through a web server, not as a local file.'));
  });
