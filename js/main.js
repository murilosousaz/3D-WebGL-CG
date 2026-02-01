const mat4 = window.mat4 || (window.glMatrix ? window.glMatrix.mat4 : null);
const mat3 = window.mat3 || (window.glMatrix ? window.glMatrix.mat3 : null);
const vec3 = window.vec3 || (window.glMatrix ? window.glMatrix.vec3 : null);
const glMatrix = window.glMatrix;

if (!mat4 || !vec3) {
    console.error("Erro: gl-matrix não foi carregada corretamente. Verifique o caminho no index.html.");
}

let gl;
let program;
let buffers;
let textures = {};

// Configuração da Câmera
let cameraPos = [0, 1.8, 10];
let cameraFront = [0, 0, -1];
let cameraUp = [0, 1, 0];
let yaw = -90;
let pitch = 0;

// Luz
let lightPosition = [0, 4, 0];

/**
 * Função de Inicialização
 */
async function init() {
    const canvas = document.querySelector("#glCanvas");
    
    // Ajuste de tamanho inicial
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("WebGL não suportado!");
        return;
    }

    console.log("WebGL inicializado. Carregando recursos...");

    try {
        // 1. Carregar Shaders (Caminho relativo à raiz do servidor)
        program = await ShaderLoader.createProgramFromFiles(gl, 'glsl/vertex.glsl', 'glsl/fragment.glsl');
        
        // 2. Inicializar Geometria (Funções do geometry.js)
        const cubeData = createCubeData();
        buffers = initBuffers(gl, cubeData);

        // 3. Carregar Texturas (Requisito A-IV)
        // Se as imagens não existirem, o renderer.js usará um pixel cinza
        textures.floor = loadTexture(gl, 'assets/piso.jpg');
        textures.art = loadTexture(gl, 'assets/quadro.jpg');

        // 4. Configurar Input
        setupInput();

        console.log("Tudo pronto! Iniciando loop de renderização.");
        requestAnimationFrame(render);

    } catch (e) {
        console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", e.message);
    }
}

/**
 * Loop de Renderização
 */
function render(now) {
    const time = now * 0.001;

    // Ajustar Viewport caso a janela mude de tamanho
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.05, 0.05, 0.1, 1.0); 
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    // Matrizes Principais
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

    const viewMatrix = mat4.create();
    let target = vec3.create();
    vec3.add(target, cameraPos, cameraFront);
    mat4.lookAt(viewMatrix, cameraPos, target, cameraUp);

    // Atualizar posição da luz (ela gira no teto)
    lightPosition = [Math.sin(time) * 5, 4.0, Math.cos(time) * 5];

    // Enviar Uniforms Globais
    setUniformMatrix4fv(gl, program, "uProjectionMatrix", projectionMatrix);
    setUniformMatrix4fv(gl, program, "uViewMatrix", viewMatrix);
    setUniform3f(gl, program, "uLightPos", lightPosition);
    setUniform3f(gl, program, "uViewPos", cameraPos);
    setUniform3f(gl, program, "uLightColor", [1.0, 1.0, 0.9]);

    // --- DESENHO DO CENÁRIO ---

    // 1. Chão
    drawObject([0, 0, 0], [20, 0.1, 20], [0, 0, 0], textures.floor, true);

    // 2. Parede de Fundo
    drawObject([0, 5, -10], [20, 10, 0.5], [0, 0, 0], null, false, [0.7, 0.7, 0.7]);

    // 3. Quadro Abstrato (Texturizado)
    drawObject([0, 3, -9.4], [4, 4, 0.1], [0, 0, 0], textures.art, true);

    // 4. Escultura Animada (Requisito A-III)
    const rot = time;
    drawObject([5, 2, -5], [1, 2, 1], [rot, rot, 0], null, false, [1.0, 0.2, 0.2]);

    // 5. Lâmpada (Cubo que representa a luz)
    drawObject(lightPosition, [0.2, 0.2, 0.2], [0, 0, 0], null, false, [1, 1, 1]);

    requestAnimationFrame(render);
}

/**
 * Função Auxiliar de Desenho (Usa funções do renderer.js)
 */
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

/**
 * Controle de Teclado
 */
function setupInput() {
    window.addEventListener('keydown', (e) => {
        const speed = 0.2;
        let forward = vec3.create();
        vec3.normalize(forward, [cameraFront[0], 0, cameraFront[2]]); // Movimento no plano
        
        let right = vec3.create();
        vec3.cross(right, forward, cameraUp);

        switch(e.key.toLowerCase()) {
            case 'w': vec3.scaleAndAdd(cameraPos, cameraPos, forward, speed); break;
            case 's': vec3.scaleAndAdd(cameraPos, cameraPos, forward, -speed); break;
            case 'a': vec3.scaleAndAdd(cameraPos, cameraPos, right, -speed); break;
            case 'd': vec3.scaleAndAdd(cameraPos, cameraPos, right, speed); break;
            case 'arrowleft': yaw -= 2; break;
            case 'arrowright': yaw += 2; break;
        }
        updateCamera();
    });

    window.addEventListener('resize', () => {
        gl.canvas.width = window.innerWidth;
        gl.canvas.height = window.innerHeight;
    });
}

function updateCamera() {
    let f = [
        Math.cos(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch)),
        Math.sin(glMatrix.toRadian(pitch)),
        Math.sin(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch))
    ];
    vec3.normalize(cameraFront, f);
}

window.onload = init;