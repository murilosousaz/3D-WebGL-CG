import { HUD2 } from "./hud.js";

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
let cameraPos = [0, 1.8, 26];
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
    [0, 9, 0],
    [16, 8, -18],
    [-16, 8, -18],
    [0, 8, -38]
];

const hall = {
    width: 46,
    depth: 72,
    height: 11
};

const exhibitionItems = [
    { model: 'statue', pos: [-14, 0.45, -12], scale: [0.24, 0.24, 0.24], rotSpeed: 0.25, color: [0.9, 0.9, 0.92] },
    { model: 'moon', pos: [-7, 0.55, -12], scale: [0.55, 0.55, 0.55], rotSpeed: -0.2, color: [0.82, 0.86, 0.96] },
    { model: 'statue', pos: [0, 0.45, -12], scale: [0.24, 0.24, 0.24], rotSpeed: 0.15, color: [0.95, 0.87, 0.82] },
    { model: 'moon', pos: [7, 0.55, -12], scale: [0.58, 0.58, 0.58], rotSpeed: -0.22, color: [0.8, 0.88, 0.9] },
    { model: 'statue', pos: [14, 0.45, -12], scale: [0.24, 0.24, 0.24], rotSpeed: 0.21, color: [0.88, 0.9, 0.85] },

    { model: 'moon', pos: [-14, 0.55, -26], scale: [0.55, 0.55, 0.55], rotSpeed: 0.24, color: [0.86, 0.84, 0.95] },
    { model: 'statue', pos: [-7, 0.45, -26], scale: [0.24, 0.24, 0.24], rotSpeed: -0.22, color: [0.96, 0.9, 0.8] },
    { model: 'moon', pos: [0, 0.55, -26], scale: [0.58, 0.58, 0.58], rotSpeed: 0.19, color: [0.85, 0.9, 0.92] },
    { model: 'statue', pos: [7, 0.45, -26], scale: [0.24, 0.24, 0.24], rotSpeed: 0.26, color: [0.89, 0.88, 0.96] },
    { model: 'moon', pos: [14, 0.55, -26], scale: [0.56, 0.56, 0.56], rotSpeed: -0.15, color: [0.9, 0.82, 0.88] },

    { model: 'statue', pos: [-14, 0.45, -40], scale: [0.24, 0.24, 0.24], rotSpeed: -0.18, color: [0.95, 0.86, 0.78] },
    { model: 'moon', pos: [-7, 0.55, -40], scale: [0.55, 0.55, 0.55], rotSpeed: 0.28, color: [0.8, 0.9, 0.95] },
    { model: 'statue', pos: [0, 0.45, -40], scale: [0.24, 0.24, 0.24], rotSpeed: -0.23, color: [0.94, 0.91, 0.85] },
    { model: 'moon', pos: [7, 0.55, -40], scale: [0.58, 0.58, 0.58], rotSpeed: 0.17, color: [0.92, 0.85, 0.86] },
    { model: 'statue', pos: [14, 0.45, -40], scale: [0.24, 0.24, 0.24], rotSpeed: -0.2, color: [0.9, 0.87, 0.95] },

    { model: 'moon', pos: [-10.5, 0.55, -54], scale: [0.56, 0.56, 0.56], rotSpeed: -0.2, color: [0.85, 0.89, 0.95] },
    { model: 'statue', pos: [-3.5, 0.45, -54], scale: [0.24, 0.24, 0.24], rotSpeed: 0.24, color: [0.94, 0.86, 0.84] },
    { model: 'moon', pos: [3.5, 0.55, -54], scale: [0.56, 0.56, 0.56], rotSpeed: -0.24, color: [0.9, 0.9, 0.82] },
    { model: 'statue', pos: [10.5, 0.45, -54], scale: [0.24, 0.24, 0.24], rotSpeed: 0.22, color: [0.84, 0.9, 0.88] }
];

// Lista de objetos colidíveis
let collisionObjects = [];
let hud;
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
    hud = new HUD2();

    console.log("WebGL inicializado. Carregando recursos...");

    try {
        program = await ShaderLoader.createProgramFromFiles(gl, 'glsl/vertex.glsl', 'glsl/fragment.glsl');
        
        const cubeData = createCubeData();
        buffers = initBuffers(gl, cubeData);

        // Texturas do grande hall
        textures.floor = loadTexture(gl, 'assets/piso.jpg');
        textures.wall = loadTexture(gl, 'assets/parede.jpg');
        textures.wood = loadTexture(gl, 'assets/madeira.jpg');

        console.log("Carregando acervo OBJ da galeria...");
        const statueData = await loadOBJ('assets/statue.obj');
        if (statueData) {
            objModels.statue = initOBJBuffers(gl, statueData);
            console.log("✓ Esculturas carregadas com sucesso!");
        } else {
            console.error("✗ Erro ao carregar statue.obj");
        }

        const moonData = await loadOBJ('assets/moon.obj');
        if (moonData) {
            objModels.moon = initOBJBuffers(gl, moonData);
            console.log("✓ Artefato moon.obj carregado com sucesso!");
        } else {
            console.error("✗ Erro ao carregar moon.obj");
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
        { type: 'box', pos: [0, hall.height / 2, -hall.depth / 2], size: [hall.width, hall.height, 0.6] },
        { type: 'box', pos: [0, hall.height / 2, 0.2], size: [hall.width, hall.height, 0.6] },
        { type: 'box', pos: [-hall.width / 2, hall.height / 2, -hall.depth / 2], size: [0.6, hall.height, hall.depth] },
        { type: 'box', pos: [hall.width / 2, hall.height / 2, -hall.depth / 2], size: [0.6, hall.height, hall.depth] }
    ];

    exhibitionItems.forEach((item) => {
        collisionObjects.push({
            type: 'box',
            pos: [item.pos[0], 0.4, item.pos[2]],
            size: [2.4, 0.8, 2.4]
        });
    });
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
    hud.update(cameraPos, cameraFront);
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
    const wallZ = -hall.depth / 2;

    // Grande hall principal
    drawObject([0, 0, wallZ], [hall.width, 0.1, hall.depth], [0, 0, 0], textures.floor, true);
    drawObject([0, hall.height, wallZ], [hall.width, 0.1, hall.depth], [0, 0, 0], textures.wall, true, [0.95, 0.95, 0.95]);
    drawObject([0, hall.height / 2, 0], [hall.width, hall.height, 0.1], [0, 0, 0], textures.wall, true);
    drawObject([0, hall.height / 2, -hall.depth], [hall.width, hall.height, 0.1], [0, 0, 0], textures.wall, true);
    drawObject([-hall.width / 2, hall.height / 2, wallZ], [0.1, hall.height, hall.depth], [0, 0, 0], textures.wall, true);
    drawObject([hall.width / 2, hall.height / 2, wallZ], [0.1, hall.height, hall.depth], [0, 0, 0], textures.wall, true);

    // Passarela principal
    drawObject([0, 0.02, wallZ], [8, 0.04, hall.depth - 6], [0, 0, 0], textures.wood, true, [0.85, 0.82, 0.74]);

    // Exposição com inúmeros itens OBJ
    exhibitionItems.forEach((item, index) => {
        drawPedestal([item.pos[0], 0.38, item.pos[2]], [2.1, 0.76, 2.1], [0.88, 0.88, 0.9]);
        drawPedestal([item.pos[0], 0.78, item.pos[2]], [1.6, 0.08, 1.6], [0.78, 0.78, 0.8]);

        const wobble = Math.sin(time + index * 0.7) * 0.025;
        drawOBJModel(
            objModels[item.model],
            [item.pos[0], item.pos[1] + wobble, item.pos[2]],
            item.scale,
            [0, time * item.rotSpeed, 0],
            null,
            item.color
        );
    });
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
