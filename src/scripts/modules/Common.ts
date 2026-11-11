/** @format */

import * as THREE from 'three';

class Common {
    readonly devicePixelRatio: number;
    readonly clock: THREE.Clock;
    readonly renderer: THREE.WebGLRenderer;
    width: number;
    height: number;
    aspect: number;
    time: number;
    timeScale: number;

    static RENDERER_PARAM = {
        clearColor: 0xffffff,
        alpha: 0,
        width: window.innerWidth,
        height: window.innerHeight,
    };

    /**
     * @constructor
     */
    constructor() {
        this.devicePixelRatio = window.devicePixelRatio;
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.clock = new THREE.Clock();
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.aspect = this.width / this.height;
        this.time = 0;
        this.timeScale = 2.0;
    }

    /**
     * # Initialization
     */
    init() {
        const clearColor = new THREE.Color(Common.RENDERER_PARAM.clearColor);
        this.renderer.setClearColor(clearColor, Common.RENDERER_PARAM.alpha);
        this.resize();
    }

    /**
     * # Resize handling
     */
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.aspect = this.width / this.height;

        this.renderer.setSize(this.width, this.height);
        // this.renderer.setPixelRatio(this.devicePixelRatio);
    }

    /**
     * # rAF update
     */
    update(){
        this.time = this.clock.getElapsedTime() * this.timeScale;
    }
}

export default new Common();
