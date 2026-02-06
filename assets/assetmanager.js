import ShaderLoader from '../js/shader_loader.js';
import { loadTexture, initBuffers } from '../js/utils.js';
import { createCubeData } from '../js/geometry.js';
import { loadOBJ } from '../js/obj_loader.js';  

export class AssetManager {
  constructor(gl) {
    this.gl = gl;
    this.textures = {};
    this.models = {};
  }

  async load() {
    this.program = await ShaderLoader.createProgramFromFiles(
      this.gl,
      'glsl/vertex.glsl',
      'glsl/fragment.glsl'
    );

    this.cubeBuffers = initBuffers(this.gl, createCubeData());
    this.textures.floor = loadTexture(this.gl, 'assets/piso.jpg');

    const moon = await loadOBJ('assets/moon.obj');
    this.models.moon = moon;
  }
}
