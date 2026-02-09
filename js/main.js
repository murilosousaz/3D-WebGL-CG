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

// Luz (reduzida e mais elegante)
let lightPositions = [
    [0, 6, 0],      // Luz central
    [0, 6, -25],    // Luz da galeria de fundo
];

// Lista de objetos colidíveis (simplificada)
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

    console.log("🎨 WebGL inicializado. Carregando galeria de arte...");

    try {
        program = await ShaderLoader.createProgramFromFiles(gl, 'glsl/vertex.glsl', 'glsl/fragment.glsl');
        
        const cubeData = createCubeData();
        buffers = initBuffers(gl, cubeData);

        // Carregar texturas
        textures.floor = loadTexture(gl, 'assets/piso.jpg');
        textures.art = loadTexture(gl, 'assets/quadro.jpg');
        textures.wall = loadTexture(gl, 'assets/parede.jpg');
        textures.wood = loadTexture(gl, 'assets/madeira.jpg');
        textures.marble = loadTexture(gl, 'assets/marble.jpg'); // Nova textura de mármore

        // === CARREGAR MODELOS OBJ ===
        console.log("📦 Carregando modelos 3D...");
        
        // Lua
        const moonData = await loadOBJ('assets/moon.obj');
        if (moonData) {
            objModels.moon = initOBJBuffers(gl, moonData);
            objTextures.moon = loadTexture(gl, 'assets/moon_00_0.png');
            console.log("✓ Lua carregada");
        }

        // Escultura 1 (pode ser uma estátua, vaso, etc.)
        const sculpture1Data = await loadOBJ('assets/sculpture1.obj');
        if (sculpture1Data) {
            objModels.sculpture1 = initOBJBuffers(gl, sculpture1Data);
            objTextures.sculpture1 = loadTexture(gl, 'assets/sculpture1.png');
            console.log("✓ Escultura 1 carregada");
        }

        // Escultura 2
        const sculpture2Data = await loadOBJ('assets/sculpture2.obj');
        if (sculpture2Data) {
            objModels.sculpture2 = initOBJBuffers(gl, sculpture2Data);
            objTextures.sculpture2 = loadTexture(gl, 'assets/sculpture2.png');
            console.log("✓ Escultura 2 carregada");
        }

        // Objeto artístico central
        const artPieceData = await loadOBJ('assets/artpiece.obj');
        if (artPieceData) {
            objModels.artpiece = initOBJBuffers(gl, artPieceData);
            objTextures.artpiece = loadTexture(gl, 'assets/artpiece.png');
            console.log("✓ Obra central carregada");
        }

        setupInput();
        initCollisionObjects();

        console.log("✨ Galeria pronta! WASD: mover | Shift: correr | Espaço: pular");
        
        requestAnimationFrame(render);

    } catch (e) {
        console.error("❌ ERRO CRÍTICO NA INICIALIZAÇÃO:", e.message);
    }
}

/**
 * Inicializa os objetos de colisão - LAYOUT SIMPLIFICADO
 */
function initCollisionObjects() {
    collisionObjects = [
        // === PAREDES EXTERNAS (apenas necessárias) ===
        { type: 'box', pos: [0, 4, -30], size: [30, 8, 0.5] },      // Parede do fundo
        { type: 'box', pos: [-15, 4, 0], size: [0.5, 8, 60] },      // Parede esquerda
        { type: 'box', pos: [15, 4, 0], size: [0.5, 8, 60] },       // Parede direita
        { type: 'box', pos: [0, 4, 30], size: [30, 8, 0.5] },       // Parede entrada
        
        // === PEDESTAIS CENTRAIS ===
        { type: 'box', pos: [0, 0.6, -20], size: [2.5, 1.2, 2.5] },    // Pedestal central fundo
        { type: 'box', pos: [-8, 0.6, -10], size: [2, 1.2, 2] },       // Pedestal esquerda
        { type: 'box', pos: [8, 0.6, -10], size: [2, 1.2, 2] },        // Pedestal direita
        { type: 'box', pos: [0, 0.8, 0], size: [3, 1.6, 3] },          // Pedestal central principal (maior)
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
    gl.clearColor(0.08, 0.08, 0.12, 1.0); // Fundo azul escuro elegante
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 200.0);

    const viewMatrix = mat4.create();
    let target = vec3.create();
    vec3.add(target, cameraPos, cameraFront);
    mat4.lookAt(viewMatrix, cameraPos, target, cameraUp);

    // Luz principal rotativa suave
    lightPositions[0] = [Math.sin(now * 0.3) * 5, 6.0, Math.cos(now * 0.3) * 5 - 10];

    setUniformMatrix4fv(gl, program, "uProjectionMatrix", projectionMatrix);
    setUniformMatrix4fv(gl, program, "uViewMatrix", viewMatrix);
    setUniform3f(gl, program, "uLightPos", lightPositions[0]);
    setUniform3f(gl, program, "uViewPos", cameraPos);
    setUniform3f(gl, program, "uLightColor", [1.0, 0.98, 0.95]); // Luz quente suave

    drawGallery(now);

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

    // Colisão com o chão
    if (newPos[1] - playerHeight < groundLevel) {
        newPos[1] = groundLevel + playerHeight;
        velocity[1] = 0;
        isGrounded = true;
    } else {
        isGrounded = false;
    }

    // Colisão com objetos
    let finalPos = [...newPos];
    for (const obj of collisionObjects) {
        if (obj.type === 'box') {
            finalPos = resolveBoxCollision(finalPos, obj.pos, obj.size);
        }
    }

    cameraPos[0] = finalPos[0];
    cameraPos[1] = finalPos[1];
    cameraPos[2] = finalPos[2];

    if (isGrounded) {
        velocity[0] *= friction;
        velocity[2] *= friction;
    }
}

/**
 * Resolve colisão AABB (Axis-Aligned Bounding Box)
 */
function resolveBoxCollision(playerPos, boxPos, boxSize) {
    const halfSize = [boxSize[0] / 2, boxSize[1] / 2, boxSize[2] / 2];
    
    const playerMin = [
        playerPos[0] - playerRadius,
        playerPos[1] - playerHeight,
        playerPos[2] - playerRadius
    ];
    const playerMax = [
        playerPos[0] + playerRadius,
        playerPos[1],
        playerPos[2] + playerRadius
    ];
    
    const boxMin = [
        boxPos[0] - halfSize[0],
        boxPos[1] - halfSize[1],
        boxPos[2] - halfSize[2]
    ];
    const boxMax = [
        boxPos[0] + halfSize[0],
        boxPos[1] + halfSize[1],
        boxPos[2] + halfSize[2]
    ];
    
    const overlapX = playerMax[0] > boxMin[0] && playerMin[0] < boxMax[0];
    const overlapY = playerMax[1] > boxMin[1] && playerMin[1] < boxMax[1];
    const overlapZ = playerMax[2] > boxMin[2] && playerMin[2] < boxMax[2];
    
    if (overlapX && overlapY && overlapZ) {
        const pushX = Math.min(
            Math.abs(playerMax[0] - boxMin[0]),
            Math.abs(playerMin[0] - boxMax[0])
        );
        const pushZ = Math.min(
            Math.abs(playerMax[2] - boxMin[2]),
            Math.abs(playerMin[2] - boxMax[2])
        );
        
        if (pushX < pushZ) {
            if (playerPos[0] < boxPos[0]) {
                playerPos[0] = boxMin[0] - playerRadius - 0.01;
            } else {
                playerPos[0] = boxMax[0] + playerRadius + 0.01;
            }
            velocity[0] = 0;
        } else {
            if (playerPos[2] < boxPos[2]) {
                playerPos[2] = boxMin[2] - playerRadius - 0.01;
            } else {
                playerPos[2] = boxMax[2] + playerRadius + 0.01;
            }
            velocity[2] = 0;
        }
    }
    
    return playerPos;
}

/**
 * DESENHA A GALERIA - VERSÃO LIMPA E MODERNA
 */
function drawGallery(time) {
    // === PISO DE MÁRMORE ===
    drawObject([0, 0, 0], [30, 0.1, 60], [0, 0, 0], textures.floor, true);
    
    // === PAREDES PRINCIPAIS (textura de parede elegante) ===
    // Parede do fundo
    drawObject([0, 4, -30], [30, 8, 0.5], [0, 0, 0], textures.wall, true);
    
    // Paredes laterais
    drawObject([-15, 4, 0], [0.5, 8, 60], [0, 0, 0], textures.wall, true);
    drawObject([15, 4, 0], [0.5, 8, 60], [0, 0, 0], textures.wall, true);
    
    // Teto minimalista
    drawObject([0, 8, 0], [30, 0.2, 60], [0, 0, 0], null, false, [0.95, 0.95, 0.95]);
    
    // === QUADROS NAS PAREDES ===
    
    // Parede do fundo - 3 quadros horizontais
    drawArtFrame([-10, 3.5, -29.5], [3.5, 2.8, 0.2], [0, 0, 0]);
    drawArtFrame([0, 3.5, -29.5], [3.5, 2.8, 0.2], [0, 0, 0]);
    drawArtFrame([10, 3.5, -29.5], [3.5, 2.8, 0.2], [0, 0, 0]);
    
    // Parede esquerda - 4 quadros
    drawArtFrame([-14.5, 3.5, -20], [0.2, 2.2, 2.8], [0, Math.PI/2, 0]);
    drawArtFrame([-14.5, 3.5, -10], [0.2, 2.2, 2.8], [0, Math.PI/2, 0]);
    drawArtFrame([-14.5, 3.5, 5], [0.2, 2.2, 2.8], [0, Math.PI/2, 0]);
    drawArtFrame([-14.5, 3.5, 15], [0.2, 2.2, 2.8], [0, Math.PI/2, 0]);
    
    // Parede direita - 4 quadros
    drawArtFrame([14.5, 3.5, -20], [0.2, 2.2, 2.8], [0, -Math.PI/2, 0]);
    drawArtFrame([14.5, 3.5, -10], [0.2, 2.2, 2.8], [0, -Math.PI/2, 0]);
    drawArtFrame([14.5, 3.5, 5], [0.2, 2.2, 2.8], [0, -Math.PI/2, 0]);
    drawArtFrame([14.5, 3.5, 15], [0.2, 2.2, 2.8], [0, -Math.PI/2, 0]);
    
    // === PEDESTAIS E ESCULTURAS OBJ ===
    
    // Pedestal central principal com obra rotativa
    drawPedestal([0, 0.8, 0], [3, 1.6, 3], [0.9, 0.9, 0.9]);
    if (objModels.artpiece) {
        drawOBJModel(
            objModels.artpiece,
            [0, 3.0, 0],
            [2.0, 2.0, 2.0],
            [0, time * 0.3, 0], // Rotação suave
            objTextures.artpiece
        );
    }
    
    // Pedestal do fundo com a Lua
    drawPedestal([0, 0.6, -20], [2.5, 1.2, 2.5], [0.85, 0.85, 0.85]);
    if (objModels.moon) {
        drawOBJModel(
            objModels.moon,
            [0, 2.5, -20],
            [2.0, 2.0, 2.0],
            [time * 0.1, time * 0.2, 0],
            objTextures.moon
        );
    }
    
    // Escultura esquerda
    drawPedestal([-8, 0.6, -10], [2, 1.2, 2], [0.88, 0.88, 0.88]);
    if (objModels.sculpture1) {
        drawOBJModel(
            objModels.sculpture1,
            [-8, 2.4, -10],
            [1.5, 1.5, 1.5],
            [0, time * 0.15, 0],
            objTextures.sculpture1
        );
    }
    
    // Escultura direita
    drawPedestal([8, 0.6, -10], [2, 1.2, 2], [0.88, 0.88, 0.88]);
    if (objModels.sculpture2) {
        drawOBJModel(
            objModels.sculpture2,
            [8, 2.4, -10],
            [1.5, 1.5, 1.5],
            [0, time * -0.2, 0],
            objTextures.sculpture2
        );
    }
    
    // === BANCOS MINIMALISTAS ===
    drawBench([0, 0.4, 10], 5);
    drawBench([-10, 0.4, 18], 3);
    drawBench([10, 0.4, 18], 3);
    
    // === ILUMINAÇÃO AMBIENTE ===
    for (let i = 0; i < lightPositions.length; i++) {
        // Fonte de luz sutil
        drawObject(lightPositions[i], [0.4, 0.15, 0.4], [0, 0, 0], null, false, [1, 0.98, 0.9]);
    }
    
    // Spots de destaque nas obras principais
    drawSpotLight([0, 7, 0], [1, 1, 0.95]);       // Spot na obra central
    drawSpotLight([0, 7, -20], [0.95, 0.95, 1]);  // Spot na lua
}

/**
 * Desenha um quadro com moldura
 * Para paredes laterais, a escala deve ser [profundidade, altura, largura]
 */
function drawArtFrame(pos, scale, rot = [0, 0, 0]) {
    const frameDepth = 0.08;
    
    // Desenha a moldura
    drawObject(pos, scale, rot, null, false, [0.15, 0.12, 0.1]);
    
    // Calcular posição da arte baseado na rotação
    let artPos = [...pos];
    let artScale = [...scale];
    
    // Ajustar conforme a orientação do quadro
    const rotY = rot[1];
    
    if (Math.abs(rotY - Math.PI/2) < 0.1) {
        // Parede esquerda (rotação +90°)
        artPos[0] += frameDepth;
        artScale[0] *= 0.5;  // Reduz profundidade
        artScale[1] *= 0.9;  // Mantém altura
        artScale[2] *= 0.9;  // Reduz largura
    } else if (Math.abs(rotY + Math.PI/2) < 0.1) {
        // Parede direita (rotação -90°)
        artPos[0] -= frameDepth;
        artScale[0] *= 0.5;  // Reduz profundidade
        artScale[1] *= 0.9;  // Mantém altura
        artScale[2] *= 0.9;  // Reduz largura
    } else {
        // Parede do fundo (sem rotação)
        artPos[2] += frameDepth;
        artScale[0] *= 0.9;  // Reduz largura
        artScale[1] *= 0.9;  // Reduz altura
        artScale[2] *= 0.3;  // Reduz profundidade
    }
    
    // Desenha a arte com textura
    drawObject(artPos, artScale, rot, textures.art, true);
}

/**
 * Desenha um pedestal
 */
function drawPedestal(pos, scale, color = [0.9, 0.9, 0.9]) {
    // Base do pedestal
    drawObject(pos, scale, [0, 0, 0], null, false, color);
    
    // Topo com destaque
    const topPos = [pos[0], pos[1] + scale[1]/2 + 0.05, pos[2]];
    const topScale = [scale[0] * 1.05, 0.1, scale[2] * 1.05];
    drawObject(topPos, topScale, [0, 0, 0], null, false, [0.95, 0.95, 0.95]);
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
    const legOffset = width/2 - 0.2;
    drawObject([pos[0] - legOffset, pos[1] - 0.2, pos[2] - 0.3], [0.1, 0.4, 0.1], [0, 0, 0], null, false, darkWood);
    drawObject([pos[0] + legOffset, pos[1] - 0.2, pos[2] - 0.3], [0.1, 0.4, 0.1], [0, 0, 0], null, false, darkWood);
    drawObject([pos[0] - legOffset, pos[1] - 0.2, pos[2] + 0.3], [0.1, 0.4, 0.1], [0, 0, 0], null, false, darkWood);
    drawObject([pos[0] + legOffset, pos[1] - 0.2, pos[2] + 0.3], [0.1, 0.4, 0.1], [0, 0, 0], null, false, darkWood);
}

/**
 * Spot de luz decorativo
 */
function drawSpotLight(pos, color) {
    drawObject(pos, [0.3, 0.15, 0.3], [0, 0, 0], null, false, color);
}

/**
 * Desenha um objeto (cubo básico)
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
 * Desenha um modelo OBJ
 */
function drawOBJModel(model, pos, scale, rot, texture, color = [1, 1, 1]) {
    if (!model || !model.position) {
        console.warn("⚠️ Modelo OBJ inválido ou não carregado");
        return;
    }

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
    if (posLoc >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, model.position);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(posLoc);
    }

    const normalLoc = gl.getAttribLocation(program, "aNormal");
    if (normalLoc >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, model.normal);
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLoc);
    }

    const uvLoc = gl.getAttribLocation(program, "aTexCoord");
    if (uvLoc >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, model.uv);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(uvLoc);
    }

    // Desenhar (sempre sem índices na versão corrigida)
    gl.drawArrays(gl.TRIANGLES, 0, model.count);
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