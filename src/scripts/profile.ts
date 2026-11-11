/** Codrops 020 image-motion effect, ported from the locally vendored source.
 * Source: https://github.com/codrops/codrops-sketches/tree/main/020-image-motion-svg-filter-2
 * The cursor mapping, easing amounts, displacement range and SVG filter behavior match
 * the original sketch. Only its image asset and page-specific selector are replaced.
 */

const portrait = document.querySelector<SVGSVGElement>('#portrait-svg');
const displacement = document.querySelector<SVGFEDisplacementMapElement>('#portrait-map');
const cursorElement = document.querySelector<HTMLElement>('#profile-cursor');
const profile = document.querySelector<HTMLElement>('.profile');

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
const map = (x: number, a: number, b: number, c: number, d: number) => (x - a) * (d - c) / (b - a) + c;
const distance = (x1: number, x2: number, y1: number, y2: number) => Math.hypot(x1 - x2, y1 - y2);

let viewport = { width: window.innerWidth, height: window.innerHeight };
let pointer = { x: viewport.width / 2, y: viewport.height / 2 };
let cachedPointer = pointer;
let imageX = 0;
let imageY = 0;
let imageRotation = 0;
let imageDistortion = 0;
let cursorX = pointer.x;
let cursorY = pointer.y;
let pointerSeen = false;

window.addEventListener('resize', () => {
  viewport = { width: window.innerWidth, height: window.innerHeight };
});
window.addEventListener('mousemove', (event) => {
  pointer = { x: event.clientX, y: event.clientY };
  pointerSeen = true;
  if (cursorElement) cursorElement.style.opacity = '1';
}, { passive: true });
window.addEventListener('mouseleave', () => {
  pointerSeen = false;
  if (cursorElement) cursorElement.style.opacity = '0';
});

function frame() {
  const width = Math.max(viewport.width, 1);
  const height = Math.max(viewport.height, 1);

  // Same transform mapping and interpolation from the Codrops sketch.
  imageX = lerp(imageX, map(pointer.x, 0, width, -40, 40), .1);
  imageY = lerp(imageY, map(pointer.y, 0, height, -40, 40), .1);
  imageRotation = lerp(imageRotation, map(pointer.x, 0, width, -5, 5), .1);
  if (portrait) portrait.style.transform = `translateX(${imageX}px) translateY(${imageY}px) rotateZ(${imageRotation}deg)`;

  const travelled = distance(cachedPointer.x, pointer.x, cachedPointer.y, pointer.y);
  imageDistortion = lerp(imageDistortion, map(travelled, 0, 200, 0, 200), .04);
  if (displacement) displacement.setAttribute('scale', String(imageDistortion));
  cachedPointer = pointer;

  if (cursorElement && pointerSeen && window.matchMedia('(pointer:fine)').matches) {
    cursorX = lerp(cursorX, pointer.x, .18);
    cursorY = lerp(cursorY, pointer.y, .18);
    cursorElement.style.transform = `translate3d(${cursorX - 17}px,${cursorY - 17}px,0)`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

profile?.querySelectorAll('a, button').forEach((node) => {
  node.addEventListener('pointerenter', () => cursorElement?.classList.add('is-hot'));
  node.addEventListener('pointerleave', () => cursorElement?.classList.remove('is-hot'));
});

document.querySelectorAll<HTMLButtonElement>('[data-modal]').forEach((button) => {
  button.addEventListener('click', () => {
    const id = button.dataset.modal;
    const dialog = id ? document.getElementById(id) : null;
    if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
  });
});
document.querySelectorAll<HTMLDialogElement>('.profile-modal').forEach((dialog) => {
  dialog.querySelector<HTMLButtonElement>('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

const internshipChoices = [
  [
    ['凡人修仙传','https://www.bilibili.com/bangumi/play/ep1231568?from_spmid=666.25.episode.0'],
    ['牧神记','https://www.bilibili.com/bangumi/play/ep3537940?from_spmid=666.25.episode.0'],
    ['深空彼岸','https://www.bilibili.com/bangumi/play/ep2714194?spm_id_from=333.337.0.0'],
  ],
  ['新华财经短视频','一般纳税人登记需注意哪些变化v3','云南技师学院非遗研培故事系列片','中国移动云南新闻联播第二期'],
  ['寻找童年系列纪录片之方胜纹','寻找童年系列纪录片之奶茶鸡柳摊','寻找童年系列纪录片之水浒英雄卡'],
  [
    ['网剧 繁城之下','https://v.qq.com/x/cover/mzc00200rslo568/m0047mhn8op.html'],
    ['DESCENTE 专业运动锁温科技','https://www.xinpianchang.com/a12188323?from=UserProfile'],
    ['Durex_杜蕾斯SKT','https://www.xinpianchang.com/a12068105?from=UserProfile'],
    ['骁龙「Elite Winner」','https://www.xinpianchang.com/a12085916?from=UserProfile'],
  ],
  ['中国风筝','中国剪纸','中国围棋','和陶拟古九首','六月二十日夜渡海','上堂开示颂','生命科学学院-生物工程','生命科学学院-应用化学','信息与通信工程学院-电子信息工程'],
] as const;
const internshipGroups = ['哔哩哔哩参与作品','孙与友实习项目','旭纪录实习项目','吾尔赫兹参与作品','皮皮村：中华文化 · 中华经典诵读 · 国家级一流专业'];
const choicesDialog = document.createElement('dialog');
choicesDialog.className = 'profile-modal profile-modal--choices';
choicesDialog.setAttribute('aria-label','选择参与作品');
choicesDialog.innerHTML = '<div class="profile-modal__inner"><div class="profile-modal__head"><span>SELECT A FILM</span><button type="button" data-close aria-label="关闭作品列表">×</button></div><h2>选择参与作品</h2><p class="profile-modal__choice-group"></p><div class="profile-modal__choice-list"></div></div>';
document.body.append(choicesDialog);
choicesDialog.querySelector<HTMLButtonElement>('[data-close]')?.addEventListener('click',()=>choicesDialog.close());
document.querySelectorAll<HTMLElement>('#internships .profile-modal__list article').forEach((article,index)=>{
  const button=document.createElement('button');
  button.type='button'; button.className='profile-modal__view-works';
  button.textContent='查看参与作品 ↗';
  article.append(button);
  button.addEventListener('click',()=>{
    choicesDialog.querySelector<HTMLElement>('.profile-modal__choice-group')!.textContent=internshipGroups[index];
    const list=choicesDialog.querySelector<HTMLElement>('.profile-modal__choice-list')!;
    list.replaceChildren();
    for(const choice of internshipChoices[index]){
      const label=typeof choice==='string'?choice:choice[0];
      const item=typeof choice==='string'?document.createElement('button'):document.createElement('a');
      item.className='profile-modal__choice'; item.textContent=label+' ↗';
      if(typeof choice==='string'){
        (item as HTMLButtonElement).type='button';
        item.addEventListener('click',()=>{
          choicesDialog.close();
          const internshipDialog=article.closest('dialog') as HTMLDialogElement | null;
          if(internshipDialog){ internshipDialog.dataset.skipReturn='true'; internshipDialog.close(); }
          if(window.parent!==window) window.parent.postMessage({type:'open-intern-work',title:label},location.origin);
          else {sessionStorage.setItem('profile-work',label);location.href='./page4.html?intern=1&from=profile';}
        });
      } else {
        (item as HTMLAnchorElement).href=choice[1];
        (item as HTMLAnchorElement).target='_blank';
        (item as HTMLAnchorElement).rel='noopener noreferrer';
      }
      list.append(item);
    }
    choicesDialog.showModal();
  });
});

const directoryModalId = new URLSearchParams(location.search).get('directory-modal');
if (directoryModalId === 'internships' || directoryModalId === 'honors') {
  document.body.classList.add('directory-modal-only');
  const directoryDialog = document.getElementById(directoryModalId) as HTMLDialogElement;
  directoryDialog.addEventListener('close', () => {
    if (directoryDialog.dataset.skipReturn === 'true') return;
    window.parent.postMessage({ type: 'directory-modal-closed' }, location.origin);
  });
  directoryDialog.showModal();
}
