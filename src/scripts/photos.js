import * as THREE from 'three';

const files = [
  'DSC00300(1).jpg','DSC03517.jpg','DSC03705(1).jpg','DSC04153(1).jpg','DSC05502(1).jpg','DSC05604.jpg',
  'DSC07225.jpg','DSC08783.jpg','DSC08945.jpg','DSC09601.jpg','P5291057.jpg','P6222004.jpg',
  'P6222048.jpg','P6222082.jpg','P8010779.jpg','P9070118.jpg','P9070251.jpg','P9070256.jpg',
  'P1270187.jpg','P1270201.jpg','P1270206.jpg','P1270221.jpg','P1270232.jpg','P1270243.jpg',
  'P1270257.jpg','P1270267.jpg','P1270279.jpg','P1270290.jpg','P1270295.jpg','P1270306.jpg',
  'added/DSC01942.jpg','added/DSC02547.jpg','added/DSC02712.jpg','added/DSC03629.jpg','added/DSC03705.jpg',
  'added/DSC03851.jpg','added/DSC04153.jpg','added/P1130140.jpg','added/P5180474.jpg','added/P6111653.jpg',
  'added/P6111655.jpg','added/P8147386.jpg','added/P8157721.jpg','added/P9088291.jpg','added/P9088305.jpg',
  'added/P9098595.jpg','added/P9098608.jpg','added/P9098615.jpg','added/P9179144.jpg','added/P9179246.jpg',
];
const sceneHost = document.querySelector('#photo-scene');
const stage = document.querySelector('.photo-sphere');
const dialog = document.querySelector('#photo-viewer');
const dialogImage = document.querySelector('#photo-viewer-image');
const dialogIndex = document.querySelector('#photo-viewer-index');
const keyboardList = document.querySelector('#photo-keyboard-list');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const photos = files.map((file, index) => ({ src: `./images/photos/${encodeURIComponent(file).replaceAll('%2F', '/')}`, index }));

let renderer;
let camera;
let scene;
let sphere;
let raycaster;
let pointer;
let hovered = null;
let pointerDown = null;
let dragging = false;
let lastDragAt = -Infinity;
let previousPointer = { x: 0, y: 0 };
let angularVelocity = { x: 0, y: 0 };
let raf = 0;
let lastFocused = null;
const interactiveMeshes = [];

function makeKeyboardItems() {
  keyboardList.innerHTML = photos.map(({ src, index }) => `<button type="button" data-photo="${index}">打开摄影作品 ${String(index + 1).padStart(2, '0')}</button>`).join('');
  keyboardList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-photo]');
    if (button) openPhoto(Number(button.dataset.photo));
  });
}

function layout() {
  const width = Math.max(320, stage.clientWidth);
  const height = Math.max(340, stage.clientHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.z = width < 700 ? 1500 : 1420;
  camera.updateProjectionMatrix();
}

function addPhoto({ src, index }) {
  const loader = new THREE.TextureLoader();
  loader.load(src, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    const image = texture.image;
    const aspect = image.width / image.height;
    // Keep each image's native landscape/portrait ratio. Small planes leave
    // visible air between prints as they wrap around the sphere.
    const maxWidth = innerWidth < 700 ? 138 : 158;
    const maxHeight = innerWidth < 700 ? 118 : 134;
    const width = aspect >= maxWidth / maxHeight ? maxWidth : maxHeight * aspect;
    const height = width / aspect;
    const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, toneMapped: false });
    const mesh = new THREE.Mesh(geometry, material);
    // Fibonacci points give the images even spacing over the whole sphere,
    // rather than bunching them into a few horizontal rows.
    const count = photos.length;
    const y = 1 - 2 * (index + 0.5) / count;
    const latitude = Math.asin(y);
    const longitude = index * Math.PI * (3 - Math.sqrt(5));
    const radius = innerWidth < 700 ? 365 : 435;
    const normal = new THREE.Vector3(Math.cos(latitude) * Math.sin(longitude), Math.sin(latitude), Math.cos(latitude) * Math.cos(longitude)).normalize();
    mesh.position.copy(normal).multiplyScalar(radius);
    const worldUp = new THREE.Vector3(0, 1, 0);
    let tangentUp = worldUp.clone().addScaledVector(normal, -worldUp.dot(normal));
    if (tangentUp.lengthSq() < 0.0001) tangentUp = new THREE.Vector3(0, 0, 1);
    tangentUp.normalize();
    const tangentRight = new THREE.Vector3().crossVectors(tangentUp, normal).normalize();
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangentRight, tangentUp, normal));
    mesh.userData = { index, baseScale: 1, targetScale: 1 };
    sphere.add(mesh);
    interactiveMeshes.push(mesh);
  }, undefined, () => {
    console.warn(`摄影图片无法加载：${src}`);
  });
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    console.error('无法创建摄影球体 WebGL 场景。', error);
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  sceneHost.append(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(39, 1, 1, 5000);
  camera.position.set(0, 0, 1370);
  sphere = new THREE.Group();
  scene.add(sphere);
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  photos.forEach((photo) => addPhoto(photo));
  layout();
  new ResizeObserver(layout).observe(stage);
  window.addEventListener('resize', layout, { passive: true });
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointercancel', onPointerUp);
  renderer.domElement.addEventListener('pointerleave', () => { if (!dragging) setHovered(null); });
  renderer.domElement.addEventListener('lostpointercapture', onPointerUp);
  renderer.domElement.addEventListener('click', onClick);
  animate();
}

function intersect(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(interactiveMeshes, false)[0]?.object || null;
}

function setHovered(mesh) {
  if (hovered === mesh) return;
  if (hovered) hovered.userData.targetScale = 1;
  hovered = mesh;
  if (hovered) hovered.userData.targetScale = 1.045;
  renderer.domElement.style.cursor = dragging ? 'grabbing' : hovered ? 'pointer' : 'grab';
}

function onPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  pointerDown = { x: event.clientX, y: event.clientY, mesh: intersect(event), moved: false };
  previousPointer = { x: event.clientX, y: event.clientY };
  dragging = false;
  renderer.domElement.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (pointerDown) {
    const dx = event.clientX - previousPointer.x;
    const dy = event.clientY - previousPointer.y;
    const total = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    if (total > 5) {
      pointerDown.moved = true;
      dragging = true;
    }
    if (dragging) {
      const gain = 0.0065;
      sphere.rotation.y += dx * gain;
      sphere.rotation.x += dy * gain;
      sphere.rotation.x = THREE.MathUtils.clamp(sphere.rotation.x, -0.75, 0.75);
      angularVelocity = { x: dy * gain * 0.12, y: dx * gain * 0.12 };
    }
    previousPointer = { x: event.clientX, y: event.clientY };
  } else if (event.pointerType === 'mouse') {
    setHovered(intersect(event));
  }
  if (dragging) event.preventDefault();
}

function onPointerUp(event) {
  // pointerup is followed by lostpointercapture in some browsers. Ignore the
  // second notification so it cannot clear the drag-click guard.
  if (!pointerDown) return;
  const wasDragging = pointerDown.moved;
  if (wasDragging) lastDragAt = performance.now();
  pointerDown = null;
  dragging = false;
  if (event.pointerType === 'mouse') setHovered(intersect(event));
  else renderer.domElement.style.cursor = 'grab';
}

function onClick(event) {
  if (dragging || performance.now() - lastDragAt < 350) return;
  const mesh = intersect(event);
  if (mesh) openPhoto(mesh.userData.index);
}

function openPhoto(index) {
  const photo = photos[index];
  if (!photo) return;
  lastFocused = document.activeElement;
  dialogImage.src = photo.src;
  dialogImage.alt = `摄影作品 ${String(index + 1).padStart(2, '0')}`;
  dialogIndex.textContent = `${String(index + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  dialog.showModal();
  document.body.classList.add('photo-modal-open');
  dialog.querySelector('.photo-viewer__close').focus({ preventScroll: true });
}

dialog.querySelector('.photo-viewer__close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  dialogImage.removeAttribute('src');
  document.body.classList.remove('photo-modal-open');
  lastFocused?.focus?.({ preventScroll: true });
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && dialog.open) dialog.close(); });

function animate() {
  raf = requestAnimationFrame(animate);
  if (!reducedMotion && !dragging) {
    sphere.rotation.y += angularVelocity.y;
    sphere.rotation.x = THREE.MathUtils.clamp(sphere.rotation.x + angularVelocity.x, -0.75, 0.75);
    angularVelocity.x *= 0.94;
    angularVelocity.y *= 0.94;
    if (Math.abs(angularVelocity.y) < 0.00015) angularVelocity.y = 0.0002;
  }
  for (const mesh of interactiveMeshes) {
    const scale = THREE.MathUtils.damp(mesh.scale.x, mesh.userData.targetScale, 12, 1 / 60);
    mesh.scale.setScalar(scale);
  }
  renderer.render(scene, camera);
}

makeKeyboardItems();
init();
