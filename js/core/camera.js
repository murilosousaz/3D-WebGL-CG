const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const toRad = glMatrix.glMatrix.toRadian;

export class Camera {
  constructor(canvas) {
    this.position = [0, 1.8, 15];
    this.front = [0, 0, -1];
    this.up = [0, 1, 0];
    this.yaw = -90;
    this.pitch = 0;

    this.canvas = canvas;
  }

  updateDirection(dx, dy) {
    this.yaw += dx * 0.15;
    this.pitch -= dy * 0.15;
    this.pitch = Math.max(-89, Math.min(89, this.pitch));

    const f = [
      Math.cos(toRad(this.yaw)) * Math.cos(toRad(this.pitch)),
      Math.sin(toRad(this.pitch)),
      Math.sin(toRad(this.yaw)) * Math.cos(toRad(this.pitch))
    ];
    vec3.normalize(this.front, f);
  }

  bind(gl, program) {
    const proj = mat4.create();
    mat4.perspective(proj, toRad(45), gl.canvas.width / gl.canvas.height, 0.1, 200);

    const view = mat4.create();
    const target = vec3.create();
    vec3.add(target, this.position, this.front);
    mat4.lookAt(view, this.position, target, this.up);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjectionMatrix"), false, proj);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uViewMatrix"), false, view);
    gl.uniform3fv(gl.getUniformLocation(program, "uViewPos"), this.position);
  }
}
