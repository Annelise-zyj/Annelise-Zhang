import * as THREE from 'three';

const page = document.querySelector<HTMLElement>('.contact');
const canvas = document.querySelector<HTMLCanvasElement>('#contact-bulge');
const stage = document.querySelector<HTMLElement>('.contact__stage');
const wechatButton = document.querySelector<HTMLButtonElement>('.contact__wechat');
const copyStatus = document.querySelector<HTMLElement>('#copy-status');

if (page && canvas && stage) {
  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.z = 5;

    // The Codrops demo rasterizes its DOM title into a texture, then places
    // that texture on a full-screen 254 × 254 plane. Keep that same structure
    // and deformation math here; only the source text and its styling differ.
    const titleTextureSource = document.createElement('canvas');
    titleTextureSource.width = 2400;
    titleTextureSource.height = 1200;
    const ctx = titleTextureSource.getContext('2d');
    if (!ctx) throw new Error('Could not create the title texture.');
    ctx.clearRect(0, 0, titleTextureSource.width, titleTextureSource.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 250px "Arial Black", "Microsoft YaHei", Arial, sans-serif';
    ctx.fillStyle = '#f7f4f8';
    ctx.fillText('Let’s Talk', titleTextureSource.width / 2, 300, 2260);

    const texture = new THREE.CanvasTexture(titleTextureSource);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const uniforms = { uMouse: { value: new THREE.Vector2(0, 0) } };
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 0.7,
      metalness: 0,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    // Direct port of the reference vertex shader's radius and lift values.
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uMouse = uniforms.uMouse;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform vec2 uMouse;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float dist = distance(uv, (uMouse * 0.5) + 0.5);
           float circleShape = 1.0 - smoothstep(0.0, 0.2, dist);
           transformed.z += circleShape * 0.7;`,
        );
    };
    material.customProgramCacheKey = () => 'codrops-bulge-text-effect';

    const pointLight = new THREE.PointLight(0xffffff, 30, 12, 1);
    pointLight.position.set(2, 4, 6);
    scene.add(pointLight);

    let geometry: THREE.PlaneGeometry;
    let mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      const aspect = width / height;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);

      const visibleHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      geometry?.dispose();
      geometry = new THREE.PlaneGeometry(visibleHeight * aspect, visibleHeight, 254, 254);
      if (mesh) mesh.geometry = geometry;
      else {
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      }
    };

    const pointerTarget = new THREE.Vector2(0, 0);
    const pointerCurrent = new THREE.Vector2(0, 0);
    const setPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(rect.width, 1);
      const y = (event.clientY - rect.top) / Math.max(rect.height, 1);
      pointerTarget.set(x * 2 - 1, 1 - y * 2);
    };

    document.addEventListener('pointermove', setPointer, { passive: true, capture: true });
    stage.addEventListener('pointerdown', setPointer, { passive: true });
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('resize', resize, { passive: true });

    let frameId = 0;
    const render = () => {
      // Same per-frame 0.1 mouse easing used by the original R3F scene.
      pointerCurrent.lerp(pointerTarget, 0.1);
      uniforms.uMouse.value.copy(pointerCurrent);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    resize();
    page.classList.add('has-webgl');
    frameId = requestAnimationFrame(render);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (!frameId) frameId = requestAnimationFrame(render);
    });
  } catch (error) {
    page.classList.remove('has-webgl');
    console.warn('Bulge text effect could not start; using the static heading.', error);
  }
}

if (wechatButton && copyStatus) {
  wechatButton.addEventListener('click', async () => {
    const value = wechatButton.dataset.copy || '';
    try {
      await navigator.clipboard.writeText(value);
      copyStatus.textContent = '微信号已复制';
    } catch {
      copyStatus.textContent = value;
    }
    window.setTimeout(() => {
      if (copyStatus) copyStatus.textContent = '';
    }, 2200);
  });
}
