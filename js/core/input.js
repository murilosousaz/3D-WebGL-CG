export class Input {
  constructor(canvas, camera) {
    this.keys = {};
    this.camera = camera;
    this.sensitivity = 0.15;
    this.locked = false;

    canvas.addEventListener('click', () => canvas.requestPointerLock());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
    });

    window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

    canvas.addEventListener('mousemove', e => {
      if (!this.locked) return;
      camera.yaw += e.movementX * this.sensitivity;
      camera.pitch -= e.movementY * this.sensitivity;
      camera.pitch = Math.max(-89, Math.min(89, camera.pitch));
      camera.updateDirection();
    });
  }

  down(key) {
    return this.keys[key];
  }
}
