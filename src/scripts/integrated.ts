/** One-page orchestration for the six preserved portfolio chapters.
 * AboveBeneath scene timings, background images, audio files, and rising
 * pointer bubbles are adapted from the locally deployed Codrops demo.
 */

const site = document.querySelector<HTMLElement>('#portfolio')!;
const track = document.querySelector<HTMLElement>('#chapter-track')!;
const curtain = document.querySelector<HTMLElement>('#scene-transition')!;
const frames = [...document.querySelectorAll<HTMLIFrameElement>('.chapter iframe')];
const internWorkOverlay = document.querySelector<HTMLElement>('#intern-work-overlay')!;
const internWorkFrame = document.querySelector<HTMLIFrameElement>('#intern-work-frame')!;
const directoryModalOverlay = document.querySelector<HTMLElement>('#directory-modal-overlay')!;
const directoryModalFrame = document.querySelector<HTMLIFrameElement>('#directory-modal-frame')!;
const bubbles = document.querySelector<HTMLCanvasElement>('#pointer-bubbles')!;
const bubbleContext = bubbles.getContext('2d')!;
const soundToggle = document.querySelector<HTMLButtonElement>('#sound-toggle')!;
const soundLabel = soundToggle.querySelector<HTMLElement>('.sound-toggle__text')!;
const status = document.querySelector<HTMLElement>('#chapter-status')!;
const lake = document.querySelector<HTMLAudioElement>('#sound-lake')!;
const underwater = document.querySelector<HTMLAudioElement>('#sound-underwater')!;
const splash = document.querySelector<HTMLAudioElement>('#sound-splash')!;
const chapterNames = ['封面', '目录', '个人简介', '影像档案', '摄影档案', '保持联系'];
const hashes = ['cover', 'contents', 'profile', 'films', 'photos', 'contact'];

let active = Math.max(0, hashes.indexOf(location.hash.slice(1)));
let busy = false;
let soundDesired = false;
let videoPlaying = false;
let modalReturnToContents = false;
let internWorkFrameLoaded = false;
let pendingInternWork = '';
let lastWheel = 0;
let pointerX = innerWidth - 30;
let pointerY = innerHeight - 30;
const loaded = new Map<number, Promise<void>>();
const installedDocuments = new WeakSet<Document>();
const circles: { x: number; y: number; r: number }[] = [];

function resizeBubbles() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  bubbles.width = Math.ceil(innerWidth * ratio);
  bubbles.height = Math.ceil(innerHeight * ratio);
  bubbleContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}
resizeBubbles();
addEventListener('resize', resizeBubbles, { passive: true });

function pointerMoved(x: number, y: number) {
  pointerX = x;
  pointerY = y;
}
addEventListener('pointermove', (event) => pointerMoved(event.clientX, event.clientY), { passive: true });

// The source demo spawns one rising, gently wandering circle each frame.
function drawBubbles() {
  requestAnimationFrame(drawBubbles);
  bubbleContext.clearRect(0, 0, innerWidth, innerHeight);
  if (active < 2) { circles.length = 0; return; }
  circles.push({ x: pointerX, y: pointerY, r: Math.random() * innerHeight / 60 });
  for (const circle of circles) {
    const min = pointerX <= innerWidth * .4 ? -4 : -2;
    const max = pointerX >= innerWidth * .6 ? 4 : 2;
    circle.x += Math.floor(Math.random() * (max-min+1)) + min;
    circle.y -= Math.random() * 15;
    bubbleContext.beginPath();
    bubbleContext.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
    bubbleContext.fillStyle = 'rgba(23,57,100,.3)';
    bubbleContext.fill();
  }
  while (circles.length > 2 && circles[0].y + circles[0].r < 0) circles.shift();
}
requestAnimationFrame(drawBubbles);

function updateSoundButton() {
  soundToggle.setAttribute('aria-pressed', String(soundDesired));
  soundToggle.setAttribute('aria-label', soundDesired ? '关闭环境声音' : '开启环境声音');
  soundLabel.textContent = soundDesired ? 'SOUND ON' : 'SOUND OFF';
}

async function syncSound() {
  updateSoundButton();
  const backgroundSound = active === 0 ? lake : underwater;
  const inactiveSound = active === 0 ? underwater : lake;
  inactiveSound.pause();
  if (!soundDesired || videoPlaying || document.hidden) {
    backgroundSound.pause();
    splash.pause();
    return;
  }
  backgroundSound.volume = .65;
  try {
    if (backgroundSound.paused) await backgroundSound.play();
  } catch {
    soundDesired = false;
    updateSoundButton();
  }
}

soundToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  soundDesired = !soundDesired;
  void syncSound();
});
document.addEventListener('visibilitychange', () => void syncSound());

function projectVideoState(playing: boolean) {
  videoPlaying = playing;
  void syncSound();
}

internWorkFrame.addEventListener('load', () => {
  internWorkFrameLoaded = true;
  if (pendingInternWork) internWorkFrame.contentWindow?.postMessage({ type: 'open-intern-work', title: pendingInternWork }, location.origin);
});

function openInternWork(title: string) {
  directoryModalOverlay.classList.remove('is-open');
  directoryModalFrame.onload = null;
  directoryModalFrame.src = 'about:blank';
  pendingInternWork = title;
  internWorkOverlay.classList.remove('is-open');
  internWorkOverlay.classList.add('is-loading');
  if (!internWorkFrame.src || internWorkFrame.src === 'about:blank') internWorkFrame.src = './page4.html?intern=1';
  else if (internWorkFrameLoaded) internWorkFrame.contentWindow?.postMessage({ type: 'open-intern-work', title }, location.origin);
}

function openDirectoryModal(name: string) {
  if (active !== 1 || !['实习经历', '荣誉奖项'].includes(name)) return;
  const id = name === '实习经历' ? 'internships' : 'honors';
  directoryModalOverlay.classList.remove('is-open');
  directoryModalFrame.onload = () => {
    if (directoryModalFrame.src.includes('directory-modal=')) directoryModalOverlay.classList.add('is-open');
  };
  directoryModalFrame.src = `./page3.html?directory-modal=${id}`;
}

function setActive(index: number) {
  active = index;
  site.dataset.chapter = String(index);
  status.textContent = `${String(index + 1).padStart(2, '0')} / 06`;
  status.setAttribute('aria-label', `${chapterNames[index]}，第 ${index + 1} 页，共 6 页`);
  history.replaceState(null, '', `#${hashes[index]}`);
  void syncSound();
}

function mapDestination(element: Element): number | null {
  if (element.matches('.directory__orb[data-section]')) {
    const section = (element as HTMLElement).dataset.section;
    return ({ '个人简介': 2, '影像档案': 3, '摄影档案': 4, '实习经历': 2, '荣誉奖项': 2, '联系方式': 5 } as Record<string, number>)[section || ''] ?? null;
  }
  if (element instanceof HTMLAnchorElement) {
    const href = element.getAttribute('href') || '';
    if (/page2\.html/.test(href)) return 1;
    if (/page3\.html/.test(href)) return 2;
    if (/page4\.html/.test(href)) return 3;
    if (/page5\.html/.test(href)) return 4;
    if (/page6\.html/.test(href)) return 5;
    if (/(?:^|\/)index\.html/.test(href) || /cover\.html/.test(href)) return 0;
  }
  return null;
}

function atScrollBoundary(doc: Document, delta: number) {
  if (doc.querySelector('dialog[open]')) return false;
  const scroll = doc.scrollingElement || doc.documentElement;
  if (delta > 0) return scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 3;
  return scroll.scrollTop <= 3;
}

function navigateFromWheel(event: WheelEvent, doc: Document) {
  if (Math.abs(event.deltaY) < 7 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  if (!atScrollBoundary(doc, event.deltaY)) return;
  const now = performance.now();
  if (busy || now - lastWheel < 950) { event.preventDefault(); return; }
  const next = active + Math.sign(event.deltaY);
  if (next < 0 || next >= frames.length) return;
  event.preventDefault();
  lastWheel = now;
  void goTo(next);
}

function installFrame(frame: HTMLIFrameElement, index: number) {
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win || installedDocuments.has(doc)) return;
  installedDocuments.add(doc);

  doc.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a, button.directory__orb[data-section]') : null;
    if (!target) return;
    const destination = mapDestination(target);
    if (destination === null) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const requestedModal = target instanceof HTMLElement ? target.dataset.section : '';
    if (target.matches('.directory__orb')) {
      if (index === 1 && (requestedModal === '实习经历' || requestedModal === '荣誉奖项')) {
        setTimeout(() => openDirectoryModal(requestedModal), 240);
      } else setTimeout(() => void goTo(destination, requestedModal, index === 1), 240);
    } else void goTo(destination);
  }, true);

  win.addEventListener('wheel', (event) => navigateFromWheel(event, doc), { passive: false, capture: true });
  win.addEventListener('pointermove', (event) => pointerMoved(event.clientX, event.clientY), { passive: true });
  if (index === 2) {
    doc.querySelectorAll<HTMLDialogElement>('.profile-modal').forEach(dialog => {
      dialog.addEventListener('close', () => {
        if (dialog.dataset.skipReturn === 'true') { delete dialog.dataset.skipReturn; modalReturnToContents = false; return; }
        if (modalReturnToContents) {
          modalReturnToContents = false;
          void goTo(1);
        }
      });
    });
  }
  let touchStart: { x: number; y: number; sphere: boolean } | null = null;
  win.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchStart = { x: touch.clientX, y: touch.clientY, sphere: event.target instanceof Element && !!event.target.closest('.photo-sphere') };
  }, { passive: true });
  win.addEventListener('touchend', (event) => {
    if (!touchStart || touchStart.sphere || doc.querySelector('dialog[open]')) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dy) < 70 || Math.abs(dy) < Math.abs(dx) * 1.3) return;
    const delta = dy < 0 ? 1 : -1;
    if (atScrollBoundary(doc, delta)) void goTo(active + delta);
  }, { passive: true });
  win.addEventListener('keydown', (event) => {
    if (doc.querySelector('dialog[open]') || event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (event.key === 'ArrowDown' || event.key === 'PageDown') { if (atScrollBoundary(doc, 1)) { event.preventDefault(); void goTo(active + 1); } }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') { if (atScrollBoundary(doc, -1)) { event.preventDefault(); void goTo(active - 1); } }
  });

  if (index === 3) {
    const film = doc.querySelector<HTMLVideoElement>('#work-video');
    film?.addEventListener('play', () => projectVideoState(true));
    film?.addEventListener('playing', () => projectVideoState(true));
    film?.addEventListener('pause', () => projectVideoState(false));
    film?.addEventListener('ended', () => projectVideoState(false));
  }
}

function loadChapter(index: number): Promise<void> {
  if (index < 0 || index >= frames.length) return Promise.resolve();
  const existing = loaded.get(index);
  if (existing) return existing;
  const frame = frames[index];
  const promise = new Promise<void>((resolve) => {
    frame.addEventListener('load', () => {
      // The chapter bridge below handles navigation even when the browser
      // isolates iframe documents from the parent window.
      try { installFrame(frame, index); } catch { /* chapter bridge remains active */ }
      resolve();
    }, { once: true });
    frame.src = frame.dataset.src || '';
  });
  loaded.set(index, promise);
  return promise;
}

async function goTo(index: number, modalName = '', fromContents = false) {
  if (index < 0 || index >= frames.length || busy) return;
  if ((modalName === '实习经历' || modalName === '荣誉奖项') && fromContents) modalReturnToContents = true;
  else if (index !== 2) modalReturnToContents = false;
  if (index === active) {
    if (modalName === '实习经历' || modalName === '荣誉奖项') {
      const id = modalName === '实习经历' ? 'internships' : 'honors';
      frames[2].contentWindow?.postMessage({ type: 'open-modal', id }, location.origin);
    }
    return;
  }
  busy = true;
  await loadChapter(index);
  const duration = 1600;
  curtain.classList.remove('is-moving', 'is-revealing');
  curtain.classList.add('is-visible');
  // Original AboveBeneath motion: the upper layer moves one viewport up,
  // scales 1.2 and fades while revealing the lower image.
  requestAnimationFrame(() => requestAnimationFrame(() => curtain.classList.add('is-moving')));
  track.style.transform = `translate3d(0, -${index * 100}svh, 0)`;
  const previous = active;
  setActive(index);
  if (previous === 3) frames[3].contentWindow?.postMessage({ type: 'pause-video' }, location.origin);
  if (soundDesired && !videoPlaying) {
    splash.volume = .5;
    splash.currentTime = 0;
    setTimeout(() => { if (soundDesired && !videoPlaying) void splash.play().catch(() => {}); }, 700);
  }
  setTimeout(() => {
    curtain.classList.add('is-revealing');
    setTimeout(() => {
      curtain.classList.remove('is-visible', 'is-moving', 'is-revealing');
      busy = false;
      if (modalName) void goTo(index, modalName);
      void loadChapter(index + 1);
    }, 240);
  }, duration);
}

addEventListener('wheel', (event) => navigateFromWheel(event, document), { passive: false });
addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'PageDown') { event.preventDefault(); void goTo(active + 1); }
  if (event.key === 'ArrowUp' || event.key === 'PageUp') { event.preventDefault(); void goTo(active - 1); }
});
addEventListener('hashchange', () => {
  const index = hashes.indexOf(location.hash.slice(1));
  if (index >= 0) void goTo(index);
});

addEventListener('message', (event: MessageEvent) => {
  if (event.origin !== location.origin || !event.data || typeof event.data !== 'object') return;
  const sender = frames.findIndex(frame => frame.contentWindow === event.source);
  const fromInternWork = event.source === internWorkFrame.contentWindow;
  const fromDirectoryModal = event.source === directoryModalFrame.contentWindow;
  if (sender < 0 && !fromInternWork && !fromDirectoryModal) return;
  const data = event.data as { type?: string; index?: number; modal?: string; delta?: number; x?: number; y?: number; playing?: boolean };
  if (data.type === 'navigate' && Number.isInteger(data.index)) {
    if (sender === 1 && (data.modal === '实习经历' || data.modal === '荣誉奖项')) openDirectoryModal(data.modal);
    else void goTo(data.index!, data.modal || '', sender === 1);
  }
  if (data.type === 'directory-modal-closed' && fromDirectoryModal) {
    directoryModalOverlay.classList.remove('is-open');
    directoryModalFrame.onload = null;
    directoryModalFrame.src = 'about:blank';
  }
  if (data.type === 'wheel' && sender === active && (data.delta === 1 || data.delta === -1)) void goTo(active + data.delta);
  if (data.type === 'pointer' && sender === active && typeof data.x === 'number' && typeof data.y === 'number') pointerMoved(data.x, data.y);
  if (data.type === 'profile-modal-close' && sender === 2 && modalReturnToContents) {
    modalReturnToContents = false;
    void goTo(1);
  }
  if (data.type === 'open-intern-work' && (sender === 2 || fromDirectoryModal) && typeof (data as {title?:unknown}).title === 'string') {
    openInternWork((data as {title:string}).title);
  }
  if (data.type === 'intern-work-ready' && fromInternWork) {
    internWorkOverlay.classList.remove('is-loading');
    internWorkOverlay.classList.add('is-open');
  }
  if (data.type === 'intern-work-closed' && fromInternWork) {
    pendingInternWork = '';
    internWorkOverlay.classList.remove('is-open', 'is-loading');
  }
  if (data.type === 'video' && (sender === 3 || fromInternWork)) projectVideoState(!!data.playing);
});

site.dataset.chapter = String(active);
track.style.transition = 'none';
track.style.transform = `translate3d(0, -${active * 100}svh, 0)`;
status.textContent = `${String(active + 1).padStart(2, '0')} / 06`;
requestAnimationFrame(() => { track.style.transition = ''; });
void loadChapter(active);
void loadChapter(active + 1);
