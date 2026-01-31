/**
 * main.js - Lógica Principal do Museu de Arte Abstrata
 */

let gl;
let program;
let buffers;
let textures = {};

// Configuração da Câmera (Requisito B-I)
let cameraPos = vec3.fromValues(0, 1.8, 10);
let cameraFront = vec3.fromValues(0, 0, -1);
let cameraUp = vec3.fromValues(0, 1, 0);
let yaw = -90, pitch = 0;

// Variáveis para a Luz Móvel (Requisito A-II)
let lightPosition = vec3.create();

async function init() {
    const canvas = document.querySelector("#glCanvas");
    gl = canvas.getContext("webgl");

    if (!gl) {
        alert("WebGL não disponível.");
        return;
    }

    // 1. Carregar Shaders via ShaderLoader (seu shaders.js)
    try {
        program = await ShaderLoader.createProgramFromFiles(gl, 'glsl/vertex.glsl', 'glsl/fragment.glsl');
    } catch (e) {
        console.error(e);
        return;
    }

    // 2. Inicializar Geometria (seu geometry.js)
    const cubeData = createCubeData();
    buffers = initBuffers(gl, cubeData);

    // 3. Carregar Texturas (Requisito A-IV)
    // Certifique-se de ter uma imagem em assets/piso.jpg e quadro.jpg
    textures.floor = loadTexture(gl, 'assets/piso.jpg');
    textures.art = loadTexture(gl, 'assets/quadro.jpg');

    // 4. Configurar Eventos (Requisito B-II)
    setupInput();

    // Iniciar Loop
    requestAnimationFrame(render);
}

function render(now) {
    const time = now * 0.001; // Segundos

    // Ajustar viewport e limpar tela
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.05, 0.05, 0.08, 1.0); // Cor de fundo do museu
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    // Matriz de Projeção (Requisito A-I)
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

    // Matriz de View (Câmera FPS)
    const viewMatrix = mat4.create();
    let target = vec3.create();
    vec3.add(target, cameraPos, cameraFront);
    mat4.lookAt(viewMatrix, cameraPos, target, cameraUp);

    // Movimentação da Luz (Requisito A-II)
    // A luz orbita o centro da sala a 4 unidades de altura
    lightPosition = [Math.sin(time) * 7, 4.0, Math.cos(time) * 7];

    // Enviar Uniforms Globais
    setUniformMatrix4fv(gl, program, "uProjectionMatrix", projectionMatrix);
    setUniformMatrix4fv(gl, program, "uViewMatrix", viewMatrix);
    setUniform3f(gl, program, "uLightPos", lightPosition);
    setUniform3f(gl, program, "uViewPos", cameraPos);
    setUniform3f(gl, program, "uLightColor", [1.0, 1.0, 0.9]); // Luz levemente quente

    // --- DESENHAR O CENÁRIO ---

    // 1. Chão (Texturizado)
    drawObject([0, 0, 0], [30, 0.1, 30], [0, 0, 0], textures.floor, true);

    // 2. Parede de Fundo (Cor Sólida - Requisito A-V)
    drawObject([0, 5, -15], [30, 10, 0.5], [0, 0, 0], null, false, [0.8, 0.8, 0.8]);

    // 3. Escultura Abstrata Animada (Requisito A-III)
    const rotSpeed = time * 0.5;
    drawObject([0, 2, -5], [1.5, 1.5, 1.5], [rotSpeed, rotSpeed, 0], null, false, [1.0, 0.3, 0.3]);

    // 4. Quadro na Parede (Texturizado)
    drawObject([5, 3, -14.4], [4, 4, 0.1], [0, 0, 0], textures.art, true);

    // 5. Representação da Luz (Pequeno cubo branco)
    drawObject(lightPosition, [0.2, 0.2, 0.2], [0, 0, 0], null, false, [1, 1, 1]);

    requestAnimationFrame(render);
}

function drawObject(pos, scale, rot, texture, useTex, color = [1,1,1]) {
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, pos);
    mat4.rotateX(modelMatrix, modelMatrix, rot[0]);
    mat4.rotateY(modelMatrix, modelMatrix, rot[1]);
    mat4.rotateZ(modelMatrix, modelMatrix, rot[2]);
    mat4.scale(modelMatrix, modelMatrix, scale);

    const normalMatrix = mat3.create();
    mat3.fromMat4(normalMatrix, modelMatrix);
    mat3.invert(normalMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);

    setUniformMatrix4fv(gl, program, "uModelMatrix", modelMatrix);
    setUniformMatrix3fv(gl, program, "uNormalMatrix", normalMatrix);
    setUniform1i(gl, program, "uUseTexture", useTex ? 1 : 0);
    setUniform3f(gl, program, "uObjectColor", color);

    if (useTex && texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        setUniform1i(gl, program, "uSampler", 0);
    }

    bindBuffers(gl, program, buffers);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function setupInput() {
    const speed = 0.15;
    const sensitivity = 2.0;

    window.addEventListener('keydown', (e) => {
        let forward = vec3.create();
        // Caminha apenas no plano XZ (sem voar)
        vec3.normalize(forward, [cameraFront[0], 0, cameraFront[2]]);
        let right = vec3.create();
        vec3.cross(right, forward, cameraUp);

        if (e.key.toLowerCase() === 'w') vec3.scaleAndAdd(cameraPos, cameraPos, forward, speed);
        if (e.key.toLowerCase() === 's') vec3.scaleAndAdd(cameraPos, cameraPos, forward, -speed);
        if (e.key.toLowerCase() === 'a') vec3.scaleAndAdd(cameraPos, cameraPos, right, -speed);
        if (e.key.toLowerCase() === 'd') vec3.scaleAndAdd(cameraPos, cameraPos, right, speed);

        // Rotação simplificada via setas
        if (e.key === 'ArrowLeft') yaw -= sensitivity;
        if (e.key === 'ArrowRight') yaw += sensitivity;
        if (e.key === 'ArrowUp') pitch += sensitivity;
        if (e.key === 'ArrowDown') pitch -= sensitivity;

        // Limitar pitch
        if (pitch > 89) pitch = 89;
        if (pitch < -89) pitch = -89;

        updateCameraVectors();
    });
}

function updateCameraVectors() {
    let front = vec3.create();
    front[0] = Math.cos(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch));
    front[1] = Math.sin(glMatrix.toRadian(pitch));
    front[2] = Math.sin(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch));
    vec3.normalize(cameraFront, front);
}

// Iniciar app quando a página carregar
window.onload = init;