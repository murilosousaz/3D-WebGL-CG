import { loadOBJ, parseOBJ } from './obj_loader.js';
import ShaderLoader from './shader_loader.js';
import {createCubeData} from './geometry.js';
import { loadTexture, initBuffers, setUniformMatrix4fv, isPowerOf2, setUniformMatrix3fv, setUniform3f, setUniform1f, setUniform1i, bindBuffers } from './utils.js';




const toRadian = window.glMatrix.glMatrix.toRadian;
const mat4 = window.mat4 || (window.glMatrix ? window.glMatrix.mat4 : null);
const mat3 = window.mat3 || (window.glMatrix ? window.glMatrix.mat3 : null);
const vec3 = window.vec3 || (window.glMatrix ? window.glMatrix.vec3 : null);
const glMatrix = window.glMatrix;
const angle = toRadian(45);

if (!mat4 || !vec3) {
    console.error("Erro: gl-matrix não foi carregada corretamente. Verifique o caminho no index.html.");
}

let gl;
let program;
let buffers;
let textures = {};
let objModels = {}; // Armazena os modelos OBJ carregados
let objTextures = {}; // Armazena as texturas dos modelos OBJ

// Configuração da Câmera
let cameraPos = [0, 1.8, 15];
let cameraFront = [0, 0, -1];
let cameraUp = [0, 1, 0];
let yaw = -90;
let pitch = 0;

// Controle do Mouse
let mouseX = 0;
let mouseY = 0;
let sensitivity = 0.15;
let isPointerLocked = false;

// === FÍSICA ===
let velocity = [0, 0, 0];
let gravity = -20.0;
let isGrounded = false;
let jumpForce = 7.0;
let friction = 0.85;
let airResistance = 0.96;

// Configurações do jogador
const playerHeight = 1.8;
const playerRadius = 0.4;
const groundLevel = 0;
const moveSpeed = 12.0;
const acceleration = 0.8;

// Luz
let lightPositions = [
    [0, 5, 0],
    [15, 5, -10],
    [-15, 5, -10],
    [0, 5, -30]
];

// Lista de objetos colidíveis
let collisionObjects = [];

/**
 * Função de Inicialização
 */
async function init() {
    const canvas = document.querySelector("#glCanvas");
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("WebGL não suportado!");
        return;
    }

    console.log("WebGL inicializado. Carregando recursos...");

    try {
        program = await ShaderLoader.createProgramFromFiles(gl, 'glsl/vertex.glsl', 'glsl/fragment.glsl');
        
        const cubeData = createCubeData();
        buffers = initBuffers(gl, cubeData);

        // Carregar texturas do museu
        textures.floor = loadTexture(gl, 'assets/piso.jpg');
        textures.art = loadTexture(gl, 'assets/quadro.jpg');
        textures.wall = loadTexture(gl, 'assets/parede.jpg');
        textures.wood = loadTexture(gl, 'assets/madeira.jpg');

        // === CARREGAR MODELOS OBJ ===
        console.log("Carregando modelo da lua...");
        const moonData = await loadOBJ('assets/moon.obj');
        if (moonData) {
            objModels.moon = initOBJBuffers(gl, moonData);
            
            // Carregar texturas da lua
            objTextures.moonDiffuse = loadTexture(gl, 'assets/moon_00_0.png');
            objTextures.moonSpecular = loadTexture(gl, 'assets/moon_00_0_sp.png');
            
            console.log("✓ Modelo da lua carregado com sucesso!");
        } else {
            console.error("✗ Erro ao carregar modelo da lua");
        }

        console.log("Carregando escultura central...");
        const statueData = await loadOBJ('assets/statue.obj');
        if (statueData) {
            objModels.statue = initOBJBuffers(gl, statueData);
            console.log("✓ Escultura OBJ carregada com sucesso!");
        } else {
            console.error("✗ Erro ao carregar escultura OBJ");
        }

        setupInput();
        initCollisionObjects();

        console.log("Pronto! WASD: mover | Shift: correr | Espaço: pular");
        
        requestAnimationFrame(render);

    } catch (e) {
        console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", e.message);
    }
}

/**
 * Inicializa os objetos de colisão
 */
function initCollisionObjects() {
    collisionObjects = [
        // Paredes externas
        { type: 'box', pos: [0, 4, -30], size: [40, 8, 0.3] },
        { type: 'box', pos: [-15, 4, 30], size: [10, 8, 0.3] },
        { type: 'box', pos: [15, 4, 30], size: [10, 8, 0.3] },
        { type: 'box', pos: [-20, 4, 0], size: [0.3, 8, 60] },
        { type: 'box', pos: [20, 4, 0], size: [0.3, 8, 60] },
        
        // Divisórias internas
        { type: 'box', pos: [-10, 4, -10], size: [0.2, 8, 15] },
        { type: 'box', pos: [10, 4, -10], size: [0.2, 8, 15] },
        { type: 'box', pos: [0, 4, 10], size: [30, 8, 0.2] },
        
        // Pedestais
        { type: 'box', pos: [0, 0.5, -15], size: [1.5, 1, 1.5] },
        { type: 'box', pos: [7, 0.5, 0], size: [1.5, 1, 1.5] },
        { type: 'box', pos: [-7, 0.5, 0], size: [1.5, 1, 1.5] },
        { type: 'box', pos: [0, 0.5, 5], size: [2.5, 1, 2.5] },
        
        // Pedestais das luas
        { type: 'box', pos: [0, 0.5, -20], size: [2, 1, 2] },
        { type: 'box', pos: [-12, 0.5, -25], size: [1.5, 1, 1.5] },
        { type: 'box', pos: [12, 0.5, -25], size: [1.5, 1, 1.5] },

        // Pedestal da nova escultura OBJ
        { type: 'box', pos: [0, 0.7, 14], size: [2.8, 1.4, 2.8] }
    ];
}

/**
 * Inicializa buffers para um modelo OBJ
 */
function initOBJBuffers(gl, objData) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objData.positions, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objData.normals, gl.STATIC_DRAW);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objData.uvs, gl.STATIC_DRAW);

    let indexBuffer = null;
    if (objData.indices) {
        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, objData.indices, gl.STATIC_DRAW);
    }

    return {
        position: positionBuffer,
        normal: normalBuffer,
        uv: uvBuffer,
        indices: indexBuffer,
        count: objData.count,
        indexCount: objData.indices ? objData.indices.length : 0
    };
}

let lastTime = 0;

/**
 * Loop de Renderização
 */
function render(now) {
    now *= 0.001;
    const deltaTime = now - lastTime;
    lastTime = now;

    updatePhysics(deltaTime);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.05, 0.05, 0.1, 1.0); 
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 200.0);

    const viewMatrix = mat4.create();
    let target = vec3.create();
    vec3.add(target, cameraPos, cameraFront);
    mat4.lookAt(viewMatrix, cameraPos, target, cameraUp);

    lightPositions[0] = [Math.sin(now) * 8, 5.0, Math.cos(now) * 8];

    setUniformMatrix4fv(gl, program, "uProjectionMatrix", projectionMatrix);
    setUniformMatrix4fv(gl, program, "uViewMatrix", viewMatrix);
    setUniform3f(gl, program, "uLightPos", lightPositions[0]);
    setUniform3f(gl, program, "uViewPos", cameraPos);
    setUniform3f(gl, program, "uLightColor", [1.0, 1.0, 0.9]);

    drawMuseum(now);

    requestAnimationFrame(render);
}

/**
 * Sistema de Física
 */
function updatePhysics(deltaTime) {
    deltaTime = Math.min(deltaTime, 0.05);

    if (!isGrounded) {
        velocity[1] += gravity * deltaTime;
    }

    velocity[0] *= airResistance;
    velocity[2] *= airResistance;

    const newPos = [
        cameraPos[0] + velocity[0] * deltaTime,
        cameraPos[1] + velocity[1] * deltaTime,
        cameraPos[2] + velocity[2] * deltaTime
    ];

    if (newPos[1] - playerHeight <= groundLevel) {
        newPos[1] = groundLevel + playerHeight;
        velocity[1] = 0;
        isGrounded = true;
    } else {
        isGrounded = false;
    }

    const resolvedPos = resolveCollisions(newPos);
    
    cameraPos[0] = resolvedPos[0];
    cameraPos[1] = resolvedPos[1];
    cameraPos[2] = resolvedPos[2];

    if (isGrounded) {
        velocity[0] *= friction;
        velocity[2] *= friction;
    }
}

/**
 * Resolve colisões com objetos
 */
function resolveCollisions(pos) {
    let resolvedPos = [...pos];

    for (let obj of collisionObjects) {
        if (obj.type === 'box') {
            const collision = checkBoxCollision(resolvedPos, obj);
            if (collision) {
                resolvedPos = collision.resolvedPos;
                
                if (Math.abs(collision.normal[0]) > 0.5) velocity[0] = 0;
                if (Math.abs(collision.normal[2]) > 0.5) velocity[2] = 0;
            }
        }
    }

    return resolvedPos;
}

/**
 * Verifica colisão com caixa (AABB)
 */
function checkBoxCollision(playerPos, box) {
    const halfSize = [box.size[0] / 2, box.size[1] / 2, box.size[2] / 2];
    
    const closest = [
        Math.max(box.pos[0] - halfSize[0], Math.min(playerPos[0], box.pos[0] + halfSize[0])),
        Math.max(box.pos[1] - halfSize[1], Math.min(playerPos[1], box.pos[1] + halfSize[1])),
        Math.max(box.pos[2] - halfSize[2], Math.min(playerPos[2], box.pos[2] + halfSize[2]))
    ];

    const distance = Math.sqrt(
        Math.pow(playerPos[0] - closest[0], 2) +
        Math.pow(playerPos[1] - closest[1], 2) +
        Math.pow(playerPos[2] - closest[2], 2)
    );

    if (distance < playerRadius) {
        let normal = [
            playerPos[0] - closest[0],
            playerPos[1] - closest[1],
            playerPos[2] - closest[2]
        ];

        const len = Math.sqrt(normal[0]**2 + normal[1]**2 + normal[2]**2);
        if (len > 0) {
            normal[0] /= len;
            normal[1] /= len;
            normal[2] /= len;
        }

        const penetration = playerRadius - distance;
        const resolvedPos = [
            playerPos[0] + normal[0] * penetration,
            playerPos[1] + normal[1] * penetration,
            playerPos[2] + normal[2] * penetration
        ];

        return { resolvedPos, normal };
    }

    return null;
}

/**
 * Desenha todo o ambiente do museu
 */
function drawMuseum(time) {
    // === ESTRUTURA BÁSICA ===
    drawObject([0, 0, 0], [40, 0.1, 60], [0, 0, 0], textures.floor, true);
    drawObject([0, 8, 0], [40, 0.1, 60], [0, 0, 0], null, false, [0.9, 0.9, 0.9]);

    // Faixa central para guiar o visitante
    drawObject([0, 0.06, -8], [6, 0.02, 40], [0, 0, 0], null, false, [0.45, 0.08, 0.1]);
    drawObject([0, 0.07, -8], [4.5, 0.02, 39], [0, 0, 0], null, false, [0.62, 0.12, 0.15]);
    
    // Paredes externas
    drawObject([0, 4, -30], [40, 8, 0.3], [0, 0, 0], null, false, [0.85, 0.85, 0.82]);
    drawObject([-15, 4, 30], [10, 8, 0.3], [0, 0, 0], null, false, [0.85, 0.85, 0.82]);
    drawObject([15, 4, 30], [10, 8, 0.3], [0, 0, 0], null, false, [0.85, 0.85, 0.82]);
    drawObject([0, 7, 30], [10, 2, 0.3], [0, 0, 0], null, false, [0.85, 0.85, 0.82]);
    drawObject([-20, 4, 0], [0.3, 8, 60], [0, 0, 0], null, false, [0.85, 0.85, 0.82]);
    drawObject([20, 4, 0], [0.3, 8, 60], [0, 0, 0], null, false, [0.85, 0.85, 0.82]);

    // Colunas decorativas próximas à entrada
    drawObject([-15, 2.5, 27], [0.9, 5, 0.9], [0, 0, 0], null, false, [0.72, 0.72, 0.74]);
    drawObject([15, 2.5, 27], [0.9, 5, 0.9], [0, 0, 0], null, false, [0.72, 0.72, 0.74]);
    drawObject([-15, 5.3, 27], [1.2, 0.25, 1.2], [0, 0, 0], null, false, [0.62, 0.62, 0.65]);
    drawObject([15, 5.3, 27], [1.2, 0.25, 1.2], [0, 0, 0], null, false, [0.62, 0.62, 0.65]);
    
    // Divisórias internas
    drawObject([-10, 4, -10], [0.2, 8, 15], [0, 0, 0], null, false, [0.8, 0.8, 0.78]);
    drawObject([10, 4, -10], [0.2, 8, 15], [0, 0, 0], null, false, [0.8, 0.8, 0.78]);
    drawObject([0, 4, 10], [30, 8, 0.2], [0, 0, 0], null, false, [0.8, 0.8, 0.78]);
    
    // === GALERIA PAREDE DE FUNDO (muito mais quadros) ===
    
    // Linha superior de quadros pequenos
    for (let i = -3; i <= 3; i++) {
        if (i !== 0) { // Pula o centro
            drawObject([i * 5, 6.5, -29.5], [2, 1.5, 0.1], [0, 0, 0], textures.art, true);
            drawFrame([i * 5, 6.5, -29.4], [2.2, 1.7, 0.15]);
        }
    }
    
    // Linha do meio - Quadro grande central
    drawObject([0, 4, -29.5], [6, 5, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([0, 4, -29.4], [6.3, 5.3, 0.15]);
    
    // Quadros médios ao lado do grande
    drawObject([-10, 4, -29.5], [4, 3, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([-10, 4, -29.4], [4.3, 3.3, 0.15]);
    
    drawObject([10, 4, -29.5], [4, 3, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([10, 4, -29.4], [4.3, 3.3, 0.15]);
    
    // Quadros nas extremidades
    drawObject([-16, 4, -29.5], [3, 2.5, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([-16, 4, -29.4], [3.2, 2.7, 0.15]);
    
    drawObject([16, 4, -29.5], [3, 2.5, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([16, 4, -29.4], [3.2, 2.7, 0.15]);
    
    // Linha inferior de quadros
    drawObject([-12, 2, -29.5], [2.5, 2, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([-12, 2, -29.4], [2.7, 2.2, 0.15]);
    
    drawObject([12, 2, -29.5], [2.5, 2, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([12, 2, -29.4], [2.7, 2.2, 0.15]);
    
    // === GALERIA LATERAL ESQUERDA (mais quadros) ===
    
    // Sequência vertical completa
    for (let z = -20; z <= 20; z += 5) {
        drawObject([-19.5, 3.5, z], [0.1, 3, 3.5], [0, 0, 0], textures.art, true);
        drawFrame([-19.4, 3.5, z], [0.15, 3.3, 3.8]);
    }
    
    // Quadros pequenos intercalados
    for (let z = -17.5; z <= 17.5; z += 5) {
        drawObject([-19.5, 6, z], [0.1, 1.5, 2], [0, 0, 0], textures.art, true);
        drawFrame([-19.4, 6, z], [0.15, 1.7, 2.2]);
    }
    
    // === GALERIA LATERAL DIREITA (mais quadros) ===
    
    // Sequência vertical completa
    for (let z = -20; z <= 20; z += 5) {
        drawObject([19.5, 3.5, z], [0.1, 3, 3.5], [0, 0, 0], textures.art, true);
        drawFrame([19.4, 3.5, z], [0.15, 3.3, 3.8]);
    }
    
    // Quadros pequenos intercalados
    for (let z = -17.5; z <= 17.5; z += 5) {
        drawObject([19.5, 6, z], [0.1, 1.5, 2], [0, 0, 0], textures.art, true);
        drawFrame([19.4, 6, z], [0.15, 1.7, 2.2]);
    }
    
    // === DIVISÓRIAS CENTRAIS COM QUADROS (ambos os lados) ===
    
    // Divisória esquerda - lado frontal
    drawObject([-9.9, 3.5, -5], [0.1, 3, 4], [0, 0, 0], textures.art, true);
    drawFrame([-9.8, 3.5, -5], [0.15, 3.3, 4.3]);
    
    drawObject([-9.9, 6, -5], [0.1, 1.5, 2], [0, 0, 0], textures.art, true);
    drawFrame([-9.8, 6, -5], [0.15, 1.7, 2.2]);
    
    // Divisória esquerda - lado traseiro
    drawObject([-10.1, 3.5, -15], [0.1, 3, 4], [0, 0, 0], textures.art, true);
    drawFrame([-10.2, 3.5, -15], [0.15, 3.3, 4.3]);
    
    drawObject([-10.1, 6, -15], [0.1, 1.5, 2], [0, 0, 0], textures.art, true);
    drawFrame([-10.2, 6, -15], [0.15, 1.7, 2.2]);
    
    drawObject([-10.1, 3.5, -10], [0.1, 3, 2.5], [0, 0, 0], textures.art, true);
    drawFrame([-10.2, 3.5, -10], [0.15, 3.3, 2.7]);
    
    // Divisória direita - lado frontal
    drawObject([9.9, 3.5, -5], [0.1, 3, 4], [0, 0, 0], textures.art, true);
    drawFrame([9.8, 3.5, -5], [0.15, 3.3, 4.3]);
    
    drawObject([9.9, 6, -5], [0.1, 1.5, 2], [0, 0, 0], textures.art, true);
    drawFrame([9.8, 6, -5], [0.15, 1.7, 2.2]);
    
    // Divisória direita - lado traseiro
    drawObject([10.1, 3.5, -15], [0.1, 3, 4], [0, 0, 0], textures.art, true);
    drawFrame([10.2, 3.5, -15], [0.15, 3.3, 4.3]);
    
    drawObject([10.1, 6, -15], [0.1, 1.5, 2], [0, 0, 0], textures.art, true);
    drawFrame([10.2, 6, -15], [0.15, 1.7, 2.2]);
    
    drawObject([10.1, 3.5, -10], [0.1, 3, 2.5], [0, 0, 0], textures.art, true);
    drawFrame([10.2, 3.5, -10], [0.15, 3.3, 2.7]);
    
    // === PAREDE FRONTAL - QUADROS NA ENTRADA ===
    
    // Lado esquerdo da entrada
    drawObject([-17, 4, 29.5], [2.5, 3, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([-17, 4, 29.6], [2.7, 3.2, 0.15]);
    
    drawObject([-12, 4, 29.5], [2.5, 3, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([-12, 4, 29.6], [2.7, 3.2, 0.15]);
    
    // Lado direito da entrada
    drawObject([17, 4, 29.5], [2.5, 3, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([17, 4, 29.6], [2.7, 3.2, 0.15]);
    
    drawObject([12, 4, 29.5], [2.5, 3, 0.1], [0, 0, 0], textures.art, true);
    drawFrame([12, 4, 29.6], [2.7, 3.2, 0.15]);
    
    // === ESCULTURAS ANIMADAS ===
    
    const rot1 = time * 0.5;
    drawObject([0, 2, -15], [1, 3, 1], [0, rot1, 0], null, false, [0.8, 0.3, 0.2]);
    drawPedestal([0, 0.5, -15], [1.5, 1, 1.5]);
    
    const scale2 = 1 + Math.sin(time * 2) * 0.2;
    drawObject([7, 1.5, 0], [scale2, scale2 * 2, scale2], [0, 0, 0], null, false, [0.2, 0.6, 0.8]);
    drawPedestal([7, 0.5, 0], [1.5, 1, 1.5]);
    
    const rot3 = Math.sin(time) * 0.5;
    drawObject([-7, 2, 0], [0.8, 3.5, 0.8], [rot3, 0, rot3], null, false, [0.9, 0.7, 0.1]);
    drawPedestal([-7, 0.5, 0], [1.5, 1, 1.5]);
    
    drawObject([0, 1.5, 5], [2, 0.5, 2], [time * 0.3, 0, 0], null, false, [0.5, 0.5, 0.5]);
    drawPedestal([0, 0.5, 5], [2.5, 1, 2.5]);

    // Escultura OBJ principal no hall de entrada
    if (objModels.statue) {
        drawOBJModel(
            objModels.statue,
            [0, 2.2, 14],
            [1.8, 1.8, 1.8],
            [0, time * 0.15, 0],
            null,
            [0.82, 0.78, 0.68]
        );
        drawPedestal([0, 0.7, 14], [2.8, 1.4, 2.8], [0.58, 0.58, 0.6]);
    }
    
    // === MODELOS DA LUA (OBJ) ===
    if (objModels.moon) {
        // Lua principal girando lentamente no centro do museu
        const moonRotation = time * 0.3;
        const moonHeight = 3 + Math.sin(time * 0.5) * 0.5; // Flutua suavemente
        
        drawOBJModel(
            objModels.moon,
            [0, moonHeight, -20], // Posição
            [2, 2, 2], // Escala
            [0, moonRotation, 0], // Rotação
            objTextures.moonDiffuse // Textura
        );
        
        // Pedestal para a lua principal
        drawPedestal([0, 0.5, -20], [2, 1, 2]);
        
        // Lua secundária esquerda
        drawOBJModel(
            objModels.moon,
            [-12, 2.5, -25],
            [1.5, 1.5, 1.5],
            [time * 0.2, time * 0.4, 0],
            objTextures.moonDiffuse
        );
        drawPedestal([-12, 0.5, -25], [1.5, 1, 1.5]);
        
        // Lua secundária direita
        drawOBJModel(
            objModels.moon,
            [12, 2.5, -25],
            [1.5, 1.5, 1.5],
            [0, time * -0.3, time * 0.1],
            objTextures.moonDiffuse
        );
        drawPedestal([12, 0.5, -25], [1.5, 1, 1.5]);
    }
    
    // === BANCOS COM TEXTURA DE MADEIRA ===
    
    drawBench([0, 0.4, 0], 4);
    drawBench([-8, 0.4, 20], 3);
    drawBench([8, 0.4, 20], 3);
    drawBench([0, 0.4, -25], 5);
    drawBench([-15, 0.4, -20], 3);
    drawBench([15, 0.4, -20], 3);
    
    // === ILUMINAÇÃO ===
    
    for (let i = 0; i < lightPositions.length; i++) {
        drawObject(lightPositions[i], [0.3, 0.3, 0.3], [0, 0, 0], null, false, [1, 1, 0.9]);
        drawObject([lightPositions[i][0], lightPositions[i][1] - 0.5, lightPositions[i][2]], 
                   [0.5, 0.1, 0.5], [0, 0, 0], null, false, [1, 1, 0.7]);
    }
    
    drawSpotLight([-15, 6, -29], [0, 0.8, 0.8]);
    drawSpotLight([15, 6, -29], [0.8, 0.8, 0]);
    drawSpotLight([-19, 5, 0], [0.8, 0.8, 0]);
    drawSpotLight([19, 5, 0], [0.8, 0, 0.8]);

    // Trilho de luminárias no teto
    for (let z = -24; z <= 24; z += 8) {
        drawObject([0, 7.85, z], [12, 0.05, 0.4], [0, 0, 0], null, false, [0.95, 0.95, 0.9]);
    }
}

function drawFrame(pos, scale, color = [0.2, 0.15, 0.1]) {
    drawObject(pos, scale, [0, 0, 0], null, false, color);
}

function drawPedestal(pos, scale, color = [0.6, 0.6, 0.6]) {
    drawObject(pos, scale, [0, 0, 0], null, false, color);
}

/**
 * Desenha um banco com textura de madeira
 */
function drawBench(pos, width) {
    // Assento com textura de madeira
    drawObject([pos[0], pos[1], pos[2]], [width, 0.1, 0.8], [0, 0, 0], textures.wood, true);
    
    // Encosto com textura de madeira
    drawObject([pos[0], pos[1] + 0.4, pos[2] - 0.35], [width, 0.7, 0.1], [0, 0, 0], textures.wood, true);
    
    // Pernas (madeira mais escura)
    const darkWood = [0.3, 0.2, 0.1];
    drawObject([pos[0] - width/2 + 0.2, pos[1] - 0.2, pos[2] - 0.3], [0.1, 0.4, 0.1], [0, 0, 0], null, false, darkWood);
    drawObject([pos[0] + width/2 - 0.2, pos[1] - 0.2, pos[2] - 0.3], [0.1, 0.4, 0.1], [0, 0, 0], null, false, darkWood);
    drawObject([pos[0] - width/2 + 0.2, pos[1] - 0.2, pos[2] + 0.3], [0.1, 0.4, 0.1], [0, 0, 0], null, false, darkWood);
    drawObject([pos[0] + width/2 - 0.2, pos[1] - 0.2, pos[2] + 0.3], [0.1, 0.4, 0.1], [0, 0, 0], null, false, darkWood);
}

function drawSpotLight(pos, color) {
    drawObject(pos, [0.2, 0.2, 0.2], [0, 0, 0], null, false, color);
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

/**
 * Desenha um modelo OBJ
 */
function drawOBJModel(model, pos, scale, rot, texture, color = [1, 1, 1]) {
    if (!model) return;

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
    setUniform1i(gl, program, "uUseTexture", texture ? 1 : 0);
    setUniform3f(gl, program, "uObjectColor", color);

    if (texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        setUniform1i(gl, program, "uSampler", 0);
    }

    // Bind dos buffers do OBJ
    const posLoc = gl.getAttribLocation(program, "aPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, model.position);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    const normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normal);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    const uvLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, model.uv);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uvLoc);

    // Desenhar
    if (model.indices) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices);
        gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_SHORT, 0);
    } else {
        gl.drawArrays(gl.TRIANGLES, 0, model.count);
    }
}

/**
 * Controle de Teclado e Mouse
 */
function setupInput() {
    const canvas = document.querySelector("#glCanvas");
    
    canvas.addEventListener('click', () => {
        canvas.requestPointerLock();
    });
    
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === canvas;
        if (isPointerLocked) {
            console.log("🎮 Mouse capturado! WASD: mover | Shift: correr | Espaço: pular | ESC: sair");
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isPointerLocked) return;
        
        yaw += (e.movementX || 0) * sensitivity;
        pitch -= (e.movementY || 0) * sensitivity;
        pitch = Math.max(-89, Math.min(89, pitch));
        
        updateCamera();
    });
    
    const keys = {};
    
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        if (e.key === ' ' && isGrounded) {
            velocity[1] = jumpForce;
            isGrounded = false;
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    function updateMovement() {
        const currentSpeed = keys['shift'] ? moveSpeed * 2 : moveSpeed;
        
        let forward = vec3.create();
        vec3.normalize(forward, [cameraFront[0], 0, cameraFront[2]]);
        
        let right = vec3.create();
        vec3.cross(right, forward, cameraUp);
        
        if (keys['w']) {
            velocity[0] += forward[0] * currentSpeed * acceleration;
            velocity[2] += forward[2] * currentSpeed * acceleration;
        }
        if (keys['s']) {
            velocity[0] -= forward[0] * currentSpeed * acceleration;
            velocity[2] -= forward[2] * currentSpeed * acceleration;
        }
        if (keys['a']) {
            velocity[0] -= right[0] * currentSpeed * acceleration;
            velocity[2] -= right[2] * currentSpeed * acceleration;
        }
        if (keys['d']) {
            velocity[0] += right[0] * currentSpeed * acceleration;
            velocity[2] += right[2] * currentSpeed * acceleration;
        }
        
        requestAnimationFrame(updateMovement);
    }
    
    updateMovement();
    
    window.addEventListener('resize', () => {
        gl.canvas.width = window.innerWidth;
        gl.canvas.height = window.innerHeight;
    });
}

function updateCamera() {
    let f = [
        Math.cos(toRadian(yaw)) * Math.cos(toRadian(pitch)),
        Math.sin(toRadian(pitch)),
        Math.sin(toRadian(yaw)) * Math.cos(toRadian(pitch))
    ];
    vec3.normalize(cameraFront, f);
}

window.onload = init;
