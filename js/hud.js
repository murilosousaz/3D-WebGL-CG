export class HUD {
  constructor(camera) {
    this.camera = camera;
    this.el = document.getElementById('hud');
  }

  update() {
    const p = this.camera.position;
    const f = this.camera.forward ?? null;

    this.el.textContent =
      `Camera position
x: ${p[0].toFixed(2)}
y: ${p[1].toFixed(2)}
z: ${p[2].toFixed(2)}` +
      (f
        ? `

Forward vector
x: ${f[0].toFixed(2)}
y: ${f[1].toFixed(2)}
z: ${f[2].toFixed(2)}`
        : '');
  }
}
