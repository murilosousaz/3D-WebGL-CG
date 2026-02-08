export class HUD2 {
  constructor() {
    this.el = document.getElementById('hud');
  }

  update(cameraPos, cameraFront) {
    const p = cameraPos;
    const f = cameraFront ?? null;

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
