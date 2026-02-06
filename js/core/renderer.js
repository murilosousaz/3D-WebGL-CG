import {
  setUniformMatrix4fv,
  setUniformMatrix3fv,
  setUniform3f,
  setUniform1i,
  bindBuffers
} from '../utils.js';

const mat4 = glMatrix.mat4;
const mat3 = glMatrix.mat3;

export class Renderer {
  constructor(gl, assets) {
    this.gl = gl;
    this.program = assets.program;
    this.buffers = assets.cubeBuffers;
    this.assets = assets;

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.05, 0.05, 0.1, 1.0);
  }

  begin(camera) {
    const { gl, program } = this;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    camera.bind(gl, program);
  }

  drawCube({ pos, scale, rot = [0,0,0], texture = null, color = [1,1,1] }) {
    const model = mat4.create();
    mat4.translate(model, model, pos);
    mat4.rotateX(model, model, rot[0]);
    mat4.rotateY(model, model, rot[1]);
    mat4.rotateZ(model, model, rot[2]);
    mat4.scale(model, model, scale);

    const normal = mat3.create();
    mat3.normalFromMat4(normal, model);

    setUniformMatrix4fv(this.gl, this.program, "uModelMatrix", model);
    setUniformMatrix3fv(this.gl, this.program, "uNormalMatrix", normal);
    setUniform3f(this.gl, this.program, "uObjectColor", color);
    setUniform1i(this.gl, this.program, "uUseTexture", texture ? 1 : 0);

    if (texture) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      setUniform1i(this.gl, this.program, "uSampler", 0);
    }

    bindBuffers(this.gl, this.program, this.buffers);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 36);
  }

  drawOBJ({ model, pos, scale, rot, texture }) {
    const gl = this.gl;

    const m = mat4.create();
    mat4.translate(m, m, pos);
    mat4.rotateX(m, m, rot[0]);
    mat4.rotateY(m, m, rot[1]);
    mat4.rotateZ(m, m, rot[2]);
    mat4.scale(m, m, scale);

    const n = mat3.create();
    mat3.normalFromMat4(n, m);

    setUniformMatrix4fv(gl, this.program, "uModelMatrix", m);
    setUniformMatrix3fv(gl, this.program, "uNormalMatrix", n);
    setUniform1i(gl, this.program, "uUseTexture", 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    setUniform1i(gl, this.program, "uSampler", 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.position);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normal);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.uv);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(2);

    if (model.indices) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices);
      gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, model.count);
    }
  }
}
