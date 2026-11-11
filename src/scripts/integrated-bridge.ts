/** Keeps each original chapter usable alone and connects it to the six-page shell. */
const chapterNav = document.querySelector('.profile__nav, .photo-nav, .contact__nav');
chapterNav?.querySelectorAll<HTMLAnchorElement>('a:not([class*="talk"])').forEach(link => {
  let drawing: Animation | null = null;
  function draw() {
    drawing?.cancel();
    link.querySelector('.portfolio-nav-underline')?.remove();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.setAttribute('viewBox', '0 0 258 18');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'portfolio-nav-underline');
    path.setAttribute('d', 'M4 10 C24 7 44 3 66 5 C84 7 102 13 122 13 C145 13 161 4 184 5 C207 7 230 13 254 8');
    svg.append(path); link.append(svg);
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    drawing = path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
      duration: 520,
      easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards'
    });
  }
  function erase() { drawing?.cancel(); link.querySelector('.portfolio-nav-underline')?.remove(); }
  link.addEventListener('pointerenter', draw);
  link.addEventListener('pointerleave', erase);
  link.addEventListener('focus', draw);
  link.addEventListener('blur', erase);
});

if (window.parent !== window) {
  const origin = location.origin;
  const sectionIndex: Record<string, number> = {
    '个人简介': 2, '影像档案': 3, '摄影档案': 4,
    '实习经历': 2, '荣誉奖项': 2, '联系方式': 5,
  };

  function send(data: Record<string, unknown>) {
    window.parent.postMessage(data, origin);
  }

  function burstOrb(orb: Element) {
    if (!(orb instanceof HTMLElement)) return;
    const rect = orb.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const size = Math.min(rect.width, rect.height);
    orb.animate([
      { transform: 'scale(1)', filter: 'brightness(1)', opacity: 1 },
      { transform: 'scale(1.11)', filter: 'brightness(1.8)', opacity: 1, offset: .3 },
      { transform: 'scale(.62)', filter: 'brightness(2)', opacity: 0 }
    ], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
    for (let i = 0; i < 14; i++) {
      const shard = document.createElement('span');
      const angle = (i / 14) * Math.PI * 2;
      const travel = size * (.42 + (i % 3) * .11);
      shard.className = 'directory__burst-shard';
      Object.assign(shard.style, {
        position: 'fixed', left: `${centerX}px`, top: `${centerY}px`,
        width: `${5 + i % 3 * 3}px`, height: `${5 + i % 3 * 3}px`,
        border: '1px solid rgba(230,209,255,.75)', borderRadius: '50%',
        background: 'rgba(181,148,223,.42)', pointerEvents: 'none', zIndex: '30'
      });
      document.body.appendChild(shard);
      shard.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: .9 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * travel}px),calc(-50% + ${Math.sin(angle) * travel}px)) scale(.2)`, opacity: 0 }
      ], { duration: 650, easing: 'cubic-bezier(.12,.7,.2,1)' }).onfinish = () => shard.remove();
    }
  }

  function destination(target: Element): { index: number; modal?: string } | null {
    if (target.matches('.directory__orb[data-section]')) {
      const section = (target as HTMLElement).dataset.section || '';
      const index = sectionIndex[section];
      if (index === undefined) return null;
      return { index, modal: section === '实习经历' || section === '荣誉奖项' ? section : '' };
    }
    if (target instanceof HTMLAnchorElement) {
      const href = target.getAttribute('href') || '';
      const names = ['cover.html', 'page2.html', 'page3.html', 'page4.html', 'page5.html', 'page6.html'];
      const index = names.findIndex(name => href.includes(name));
      if (index >= 0) return { index };
      if (/(?:^|\/)index\.html/.test(href)) return { index: 0 };
    }
    return null;
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('a, button.directory__orb[data-section]') : null;
    if (!target) return;
    const next = destination(target);
    if (!next) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (target.matches('.directory__orb')) {
      burstOrb(target);
      setTimeout(() => send({ type: 'navigate', ...next }), 240);
    } else send({ type: 'navigate', ...next });
  }, true);

  function atBoundary(delta: number) {
    if (document.querySelector('dialog[open]')) return false;
    const scroll = document.scrollingElement || document.documentElement;
    return delta > 0
      ? scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 3
      : scroll.scrollTop <= 3;
  }

  addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) < 7 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const delta = Math.sign(event.deltaY);
    if (!atBoundary(delta)) return;
    event.preventDefault();
    send({ type: 'wheel', delta });
  }, { passive: false, capture: true });

  addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]')) return;
    const delta = event.key === 'ArrowDown' || event.key === 'PageDown' ? 1 :
      event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 0;
    if (delta && atBoundary(delta)) { event.preventDefault(); send({ type: 'wheel', delta }); }
  });

  let touchStart: { x: number; y: number; sphere: boolean } | null = null;
  addEventListener('touchstart', event => {
    const touch = event.changedTouches[0];
    if (touch) touchStart = { x: touch.clientX, y: touch.clientY, sphere: event.target instanceof Element && !!event.target.closest('.photo-sphere') };
  }, { passive: true });
  addEventListener('touchend', event => {
    if (!touchStart || touchStart.sphere) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.3) {
      const delta = dy < 0 ? 1 : -1;
      if (atBoundary(delta)) send({ type: 'wheel', delta });
    }
  }, { passive: true });

  addEventListener('pointermove', event => send({ type: 'pointer', x: event.clientX, y: event.clientY }), { passive: true });
  addEventListener('pointerdown', () => send({ type: 'gesture' }), { passive: true });

  document.addEventListener('playing', event => {
    if (event.target instanceof HTMLVideoElement && event.target.id === 'work-video') send({ type: 'video', playing: true });
  }, true);
  document.addEventListener('play', event => {
    if (event.target instanceof HTMLVideoElement && event.target.id === 'work-video') send({ type: 'video', playing: true });
  }, true);
  document.addEventListener('pause', event => {
    if (event.target instanceof HTMLVideoElement && event.target.id === 'work-video') send({ type: 'video', playing: false });
  }, true);
  document.querySelector('#work-modal')?.addEventListener('close', () => send({ type: 'video', playing: false }));

  addEventListener('message', event => {
    if (event.origin !== origin || !event.data) return;
    if (event.data.type === 'pause-video') document.querySelector<HTMLVideoElement>('#work-video')?.pause();
    if (event.data.type === 'open-modal') {
      const dialog = document.getElementById(event.data.id);
      if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
    }
  });
}
