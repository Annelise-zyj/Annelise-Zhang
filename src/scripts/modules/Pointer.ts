/** @format */

import * as THREE from 'three';
import Common from './Common';

class Pointer {
    pointerMoved: boolean;
    coords: THREE.Vector2;
    private prevCoords: THREE.Vector2;
    diff: THREE.Vector2;
    private timer: number | null;

    /**
     * @constructor
     */
    constructor() {
        this.pointerMoved = false;
        this.coords = new THREE.Vector2();
        this.prevCoords = new THREE.Vector2();
        this.diff = new THREE.Vector2();
        this.timer = null;

        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
    }

    /**
     * # Register event listeners
     */
    init() {
        document.body.addEventListener('pointermove', this.onPointerMove, false);
        document.body.addEventListener('pointerdown', this.onPointerDown, false);
    }

    /**
     * # Set coordinates
     * @param {number} x
     * @param {number} y
     */
    setCoords(x: number, y: number) {
        if (this.timer) clearTimeout(this.timer);

        const coordsX = (x / Common.width) * 2 - 1;
        const coordsY = -(y / Common.height) * 2 + 1;
        this.coords.set(coordsX, coordsY);

        this.pointerMoved = true;

        this.timer = setTimeout(() => {
            this.pointerMoved = false;
        }, 100);
    }

    /**
     * # Pointer interaction handling
     * @param {PointerEvent} e
     */
    onPointerMove(e: PointerEvent) {
        if (e.pointerType == 'touch' && e.isPrimary) {
            this.setCoords(e.pageX, e.pageY);
        } else {
            this.setCoords(e.clientX, e.clientY);
        }
    }

    /**
     * # Touch input handling
     * @param {PointerEvent} e
     */
    onPointerDown(e: PointerEvent) {
        if (e.pointerType !== 'touch' || !e.isPrimary) return;

        this.setCoords(e.pageX, e.pageY);
    }

    /**
     * # Update the difference in pointer coordinates
     */
    update() {
        this.diff.subVectors(this.coords, this.prevCoords);
        this.prevCoords.copy(this.coords);
    }
}

export default new Pointer();
