import workData from '../data/works.json';

if (new URLSearchParams(location.search).has('intern')) document.body.classList.add('intern-only');

const groups = [
  { title: 'AI 辅助影像', eyebrow: 'AI ASSISTED IMAGE', category: 'AI 辅助影像' },
  { title: '纪录短片', eyebrow: 'DOCUMENTARY SHORTS', category: '纪录短片' },
  { title: '微纪录片', eyebrow: 'MICRO DOCUMENTARIES', category: '微纪录片' },
  { title: '剧情片', eyebrow: 'NARRATIVE FILM', category: '剧情片' },
  { title: '广告', eyebrow: 'COMMERCIAL', category: '广告' },
  { title: '项目作品', eyebrow: 'PROJECT WORKS', category: '项目作品' },
];
const root = document.querySelector('#work-groups');
const dialog = document.querySelector('#work-modal');
const video = document.querySelector('#work-video');
const playButton = document.querySelector('#modal-play');
const videoError = document.querySelector('#video-error');
const videoSourceLink = document.querySelector('#video-source-link');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let activeCard = null;
let works = [];

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const cardSlug = (work) => work.thumbnail.split('/').pop().replace('.jpg', '');
const renderCard = (work, index, count) => `<button class="work-card" type="button" data-id="${escapeHTML(cardSlug(work))}" data-work-index="${works.indexOf(work)}" aria-label="查看作品：${escapeHTML(work.displayTitle)}">
  <div class="work-card__image"><img src="${work.thumbnail}" alt="${escapeHTML(work.displayTitle)} 封面" loading="lazy"><span class="work-card__index">${String(index + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}</span><span class="work-card__open" aria-hidden="true">↗</span></div>
  <div class="work-card__caption"><div><div class="work-card__title">${escapeHTML(work.displayTitle)}</div><div class="work-card__sub">${escapeHTML(work.english || work.category)}</div></div><span>${escapeHTML(work.project || work.category)}</span></div>
</button>`;

function renderGroups() {
root.innerHTML = groups.map((group) => {
  const items = works.filter((work) => work.category === group.category);
  const projectGroups = group.category === '项目作品'
    ? [...items.reduce((map, work) => {
      const key = work.project || '其他项目';
      map.set(key, [...(map.get(key) || []), work]);
      return map;
    }, new Map()).entries()]
    : [];
  const cards = group.category === '项目作品'
    ? projectGroups.map(([project, projectItems]) => `<div class="project-cluster"><div class="project-cluster__head"><h3>${escapeHTML(project)}</h3><span>${String(projectItems.length).padStart(2, '0')} WORK${projectItems.length === 1 ? '' : 'S'}</span></div><div class="work-grid">${projectItems.map((work, index) => renderCard(work, index, projectItems.length)).join('')}</div></div>`).join('')
    : `<div class="work-grid">${items.map((work, index) => renderCard(work, index, items.length)).join('')}</div>`;
  return `<section class="archive-section" aria-labelledby="section-${group.category.replaceAll(' ', '-')}">
    <div class="archive-section__head"><div><p>${group.eyebrow}</p><h2 id="section-${group.category.replaceAll(' ', '-')}">${group.title}</h2></div><span>${group.category === '项目作品' ? `${projectGroups.length} PROJECTS · ${items.length} WORKS` : `${String(items.length).padStart(2, '0')} WORKS`}</span></div>
    ${cards}
  </section>`;
}).join('');
}

function fillModal(work) {
  document.querySelector('#modal-category').textContent = `影像档案 / ${work.category === '项目作品' ? work.project : work.category}`;
  document.querySelector('#modal-english').textContent = work.english || '';
  document.querySelector('#modal-project').textContent = work.project || work.category;
  document.querySelector('#modal-title').textContent = work.displayTitle;
  document.querySelector('#modal-description').textContent = work.description;
  const englishDescription = document.querySelector('#modal-description-en');
  englishDescription.textContent = work.descriptionEn || '';
  englishDescription.hidden = !work.descriptionEn;
  const englishDetails = document.querySelector('#modal-english-details');
  document.querySelector('#modal-english').textContent = work.english || '';
  englishDetails.hidden = !work.english && !work.descriptionEn;
  englishDetails.open = false;
  const meta = work.meta || {};
  const rows = [
    ['制作时间', work.date || meta.date],
    ['影片类型', work.type || meta.type],
    ['导演', work.director || meta.director],
    ['主创团队', work.team || meta.team],
    ['指导老师', work.advisor || meta.advisor],
    ['拍摄地点', work.location || meta.location],
    ['B站链接', work.bilibiliUrl],
    ['播放数据（截至2026年11月11日）', work.bilibiliStats],
    ['AI 模型', work.models?.length ? work.models.join('、') : (meta.models || []).join('、')],
  ].filter(([, value]) => value);
  document.querySelector('#modal-meta').innerHTML = rows.map(([label, value]) => `<div><dt>${escapeHTML(label)}</dt><dd>${label === 'B站链接' ? `<a href="${escapeHTML(value)}" target="_blank" rel="noopener noreferrer">在 B 站观看 ↗</a>` : escapeHTML(value)}</dd></div>`).join('');
  document.querySelector('#modal-runtime').textContent = work.duration ? `${Math.floor(work.duration / 60)}:${String(work.duration % 60).padStart(2, '0')}` : '';
  const honors = work.honors || [];
  document.querySelector('#honors-wrap').hidden = !honors.length;
  document.querySelector('#modal-honors').innerHTML = honors.map((item) => `<li>${escapeHTML(item)}</li>`).join('');
  const materials = work.materials || [];
  const materialsRoot = document.querySelector('#modal-materials');
  const labels = { '海报': '海报 / POSTER', '剧照': '剧照 / STILLS', '花絮工作照': '花絮工作照 / BEHIND THE SCENES', 'AI工作流': 'AI 工作流 / AI WORKFLOW', 'AI数字资产': 'AI 数字资产 / AI DIGITAL ASSETS', '获得荣誉': '获得荣誉 / AWARDS', '剧本': '剧本 / SCRIPT', '前期文件': '前期文件 / PRE-PRODUCTION', '志愿服务证明': '志愿服务证明 / VOLUNTEER CERTIFICATE' };
  const categoryOrder = ['剧照', '剧本', '前期文件', 'AI数字资产', 'AI工作流', '海报', '获得荣誉', '志愿服务证明', '花絮工作照'];
  const categories = [...new Set(materials.map((item) => item.category))].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    return (aIndex < 0 ? categoryOrder.length : aIndex) - (bIndex < 0 ? categoryOrder.length : bIndex);
  });
  materialsRoot.innerHTML = categories.map((category) => `<section class="material-group${category === '剧照' ? ' material-group--stills' : ''}"><h3>${labels[category] || escapeHTML(category)}</h3><div class="material-grid">${materials.filter((item) => item.category === category).map((item, index) => `<button class="material-card" type="button" aria-label="${escapeHTML(work.displayTitle)} · ${escapeHTML(category)} ${index + 1}" data-src="${escapeHTML(item.src)}" data-caption=""><img src="${escapeHTML(item.src)}" alt="${escapeHTML(work.displayTitle)} · ${escapeHTML(category)} ${index + 1}" loading="lazy"></button>`).join('')}</div></section>`).join('');
  materialsRoot.hidden = !materials.length;
}

function openModal(work) {
  fillModal(work);
  video.pause();
  video.src = work.video;
  video.poster = work.thumbnail;
  video.load();
  videoError.hidden = true;
  playButton.hidden = false;
  videoSourceLink.href = work.video;
  dialog.showModal();
  document.body.classList.add('modal-open');
  dialog.querySelector('.work-modal__close').focus({ preventScroll: true });
}

playButton.addEventListener('click', () => video.play().catch(() => { videoError.hidden = false; }));
video.addEventListener('playing', () => { playButton.hidden = true; videoError.hidden = true; });
video.addEventListener('pause', () => { if (video.currentTime === 0) playButton.hidden = false; });
video.addEventListener('error', () => { videoError.hidden = false; playButton.hidden = true; });

function transitionFrom(card, work) {
  if (reduced || !window.gsap) return openModal(work);
  const layer = document.querySelector('#transition-layer');
  const image = card.querySelector('img');
  const start = image.getBoundingClientRect();
  const target = { x: innerWidth * 0.5, y: Math.min(innerHeight * 0.42, 360), w: Math.min(innerWidth * 0.65, 760), h: Math.min(innerHeight * 0.58, 450) };
  const copies = [];
  for (let index = 0; index < 7; index += 1) {
    const copy = document.createElement('div');
    copy.className = 'transition-copy';
    copy.style.backgroundImage = `url("${work.thumbnail}")`;
    copy.style.left = `${start.left}px`;
    copy.style.top = `${start.top}px`;
    copy.style.width = `${start.width}px`;
    copy.style.height = `${start.height}px`;
    copy.style.clipPath = 'inset(50% 50% 50% 50%)';
    copy.style.opacity = '0';
    layer.append(copy);
    copies.push(copy);
  }
  const tl = gsap.timeline({ onComplete: () => { copies.forEach((copy) => copy.remove()); openModal(work); } });
  copies.forEach((copy, index) => {
    const progress = (index + 1) / copies.length;
    const rect = { left: start.left + (target.x - start.left) * progress, top: start.top + (target.y - start.top) * progress, width: start.width + (target.w - start.width) * progress, height: start.height + (target.h - start.height) * progress };
    tl.set(copy, { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }, index * 0.075);
    tl.to(copy, { left: rect.left, top: rect.top, width: rect.width, height: rect.height, rotate: (index % 2 ? -1 : 1) * (2.4 - progress * 2), duration: 0.42, ease: 'power3.inOut' }, index * 0.075);
    tl.to(copy, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.2, ease: 'power2.in' }, index * 0.075 + 0.36);
  });
}

root.addEventListener('click', (event) => {
  const card = event.target.closest('.work-card');
  if (!card) return;
  activeCard = card;
  transitionFrom(card, works[Number(card.dataset.workIndex)]);
});

dialog.querySelector('.work-modal__close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  video.pause();
  video.removeAttribute('src');
  video.load();
  document.body.classList.remove('modal-open');
  activeCard?.focus({ preventScroll: true });
  if (window.parent !== window) window.parent.postMessage({ type: 'intern-work-closed' }, location.origin);
  else if (new URLSearchParams(location.search).get('from') === 'profile') location.href = './page3.html#profile';
});
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
const materialViewer = document.querySelector('#material-viewer');
const materialViewerImage = document.querySelector('#material-viewer-image');
document.querySelector('#modal-materials').addEventListener('click', (event) => {
  const card = event.target.closest('.material-card');
  if (!card) return;
  materialViewerImage.src = card.dataset.src;
  materialViewerImage.alt = card.dataset.caption;
  materialViewer.showModal();
});
materialViewer.querySelector('.material-viewer__close').addEventListener('click', () => materialViewer.close());
materialViewer.addEventListener('click', (event) => { if (event.target === materialViewer) materialViewer.close(); });
materialViewer.addEventListener('close', () => { materialViewerImage.removeAttribute('src'); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && dialog.open) dialog.close(); });

const underlinePaths = [
  'M4 10 C24 7 44 3 66 5 C84 7 102 13 122 13 C145 13 161 4 184 5 C207 7 230 13 254 8',
  'M4 8 C28 9 50 2 77 4 S122 15 148 9 S200 1 254 7',
  'M4 11 C23 3 37 5 56 11 S89 13 108 6 S143 4 160 10 S198 14 218 7 S241 4 254 9',
  'M4 7 C46 13 75 3 112 7 S184 13 254 5',
  'M4 10 C39 9 53 1 86 4 C111 6 124 15 151 10 S207 2 254 8',
  'M4 6 C40 4 70 10 102 8 S164 2 194 5 S231 10 254 7',
];
document.querySelectorAll('.archive__nav a:not(.archive__talk)').forEach((link) => {
  let path = null;
  let animation = null;
  const draw = () => {
    animation?.cancel();
    link.querySelector('.underline')?.remove();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 258 18');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'underline');
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', underlinePaths[Math.floor(Math.random() * underlinePaths.length)]);
    svg.append(path);
    link.append(svg);
    const length = path.getTotalLength();
    animation = path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
      duration: reduced ? 1 : 520,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'forwards',
    });
  };
  const erase = () => {
    if (!path) return;
    animation?.cancel();
    const length = path.getTotalLength();
    animation = path.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -length }], {
      duration: reduced ? 1 : 420,
      easing: 'cubic-bezier(.65,0,.35,1)',
      fill: 'forwards',
    });
    animation.onfinish = () => {
      link.querySelector('.underline')?.remove();
      path = null;
    };
  };
  link.addEventListener('pointerenter', draw);
  link.addEventListener('pointerleave', erase);
  link.addEventListener('focus', draw);
  link.addEventListener('blur', erase);
});

works = workData;
renderGroups();
window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.data?.type !== 'open-intern-work') return;
  const work = works.find((item) => item.displayTitle === event.data.title);
  if (work && !dialog.open) {
    activeCard = null;
    openModal(work);
    if (document.body.classList.contains('intern-only')) window.parent.postMessage({type:'intern-work-ready'},location.origin);
  }
});
const requestedWork = sessionStorage.getItem('profile-work');
if (requestedWork) {
  sessionStorage.removeItem('profile-work');
  const work = works.find((item) => item.displayTitle === requestedWork);
  if (work) openModal(work);
}
