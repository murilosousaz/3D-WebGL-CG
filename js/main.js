import { Renderer } from './core/Renderer.js';
import { Camera } from './core/Camera.js';
import { Input } from './core/Input.js';
import { Physics } from './core/Physics.js';
import { MuseumScene } from './scene/MuseumScene.js';
import { AssetManager } from '../assets/assetmanager.js';
import { HUD } from './hud.js';

let gl, renderer, camera, input, physics, scene, assets, hud;
let lastTime = 0;

async function init() {
    const canvas = document.querySelector("#glCanvas");
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    gl = canvas.getContext("webgl");
    if (!gl) throw new Error("WebGL not supported");
    
    assets = new AssetManager(gl);
    await assets.load();
    camera = new Camera(canvas);
    hud = new HUD(camera);
    input = new Input(canvas, camera);
    physics = new Physics(camera);
    renderer = new Renderer(gl, assets);
    scene = new MuseumScene();

    requestAnimationFrame(loop);
}

function loop(time) {

    time *= 0.001;
    const dt = Math.min(time - lastTime, 0.05);
    const speed = 5 * dt;
    
    lastTime = time;
    
    let currentSpeed = input.keys['shift'] ? speed * 2 : speed;

    if (input.down('w')) {
    camera.position[0] += camera.direction[0] * currentSpeed;
    camera.position[2] += camera.direction[2] * currentSpeed;
    }
    if (input.down('s')) {
    camera.position[0] -= camera.direction[0] * currentSpeed;
    camera.position[2] -= camera.direction[2] * currentSpeed;
    }

    if (input.down('a')) {
    camera.position[0] -= camera.right[0] * currentSpeed;
    camera.position[2] -= camera.right[2] * currentSpeed;
    }
    if (input.down('d')) {
    camera.position[0] += camera.right[0] * currentSpeed;
    camera.position[2] += camera.right[2] * currentSpeed;
    }

    physics.update(dt, input);
  renderer.begin(camera);
  scene.draw(renderer, time);
  hud.update();

  requestAnimationFrame(loop);
}

window.onload = init;
