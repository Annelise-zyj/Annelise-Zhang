const orbs = [...document.querySelectorAll<HTMLElement>('.directory__orb')];

type OrbMotion = {
    element: HTMLElement;
    baseX: number;
    baseY: number;
    radius: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    seed: number;
};

const motion: OrbMotion[] = orbs.map((element, index) => ({
    element,
    baseX: 0,
    baseY: 0,
    radius: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    seed: index * 2.31 + 0.8,
}));

function measure() {
    for (const orb of motion) {
        const rect = orb.element.getBoundingClientRect();
        orb.baseX = rect.left + rect.width / 2 - orb.x;
        orb.baseY = rect.top + rect.height / 2 - orb.y;
        orb.radius = rect.width * 0.49;
    }
}

let lastFrame = performance.now();
function animate(now: number) {
    const dt = Math.min((now - lastFrame) / 1000, 0.04);
    lastFrame = now;
    const time = now / 1000;

    {
        const motionScale = 1;
        for (const orb of motion) {
            const phase = orb.seed;
            const targetX = motionScale * (18 * Math.sin(time * (.46 + phase * .028) + phase) + 8 * Math.sin(time * (.91 + phase * .024) + phase * 1.8));
            const targetY = motionScale * (15 * Math.cos(time * (.38 + phase * .021) + phase * 1.3) + 8 * Math.sin(time * (.78 + phase * .019) + phase * .7));
            orb.vx += ((targetX - orb.x) * 2.3 - orb.vx * 2.2) * dt;
            orb.vy += ((targetY - orb.y) * 2.3 - orb.vy * 2.2) * dt;
        }

        // A small, damped impulse keeps nearby droplets from passing through one another.
        for (let i = 0; i < motion.length; i++) {
            for (let j = i + 1; j < motion.length; j++) {
                const a = motion[i];
                const b = motion[j];
                const dx = (b.baseX + b.x) - (a.baseX + a.x);
                const dy = (b.baseY + b.y) - (a.baseY + a.y);
                const distance = Math.hypot(dx, dy) || 1;
                const overlap = a.radius + b.radius + 3 - distance;
                if (overlap <= 0) continue;
                const nx = dx / distance;
                const ny = dy / distance;
                const separation = Math.min(overlap * 0.28, 5);
                a.x -= nx * separation;
                a.y -= ny * separation;
                b.x += nx * separation;
                b.y += ny * separation;
                const closingSpeed = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
                const impulse = Math.min(18, Math.max(4, closingSpeed * 0.4));
                a.vx -= nx * impulse;
                a.vy -= ny * impulse;
                b.vx += nx * impulse;
                b.vy += ny * impulse;
            }
        }

        for (const orb of motion) {
            orb.x = Math.max(-31, Math.min(31, orb.x + orb.vx * dt));
            orb.y = Math.max(-31, Math.min(31, orb.y + orb.vy * dt));
            orb.element.style.translate = `${orb.x.toFixed(2)}px ${orb.y.toFixed(2)}px`;
        }
    }
    requestAnimationFrame(animate);
}

measure();
window.addEventListener('resize', measure);
requestAnimationFrame(animate);

document.querySelectorAll<HTMLButtonElement>('button.directory__orb').forEach((orb) => {
    orb.addEventListener('click', () => {
        document.querySelectorAll<HTMLButtonElement>('button.directory__orb').forEach((item) => {
            item.classList.toggle('is-selected', item === orb);
        });
    });
});
