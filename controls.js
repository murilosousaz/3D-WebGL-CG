const K = {
    W: false,
    A: false,
    S: false,
    D: false,
    Q: false,
    E: false,
};

let movVel = 0.055;
let mouseSensitivity = 0.002;

// Controle de pointer lock
let isPointerLocked = false;

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'w':
            if (!K.S) K.W = true;
            break;
        case 'a':
            if (!K.D) K.A = true;
            break;
        case 's':
            if (!K.W) K.S = true;
            break;
        case 'd':
            if (!K.A) K.D = true;
            break;
        case 'q':
            if (!K.E) K.Q = true;
            break;
        case 'e':
            if (!K.Q) K.E = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w':
            K.W = false;
            break;
        case 'a':
            K.A = false;
            break;
        case 's':
            K.S = false;
            break;
        case 'd':
            K.D = false;
            break;
        case 'q':
            K.Q = false;
            break;
        case 'e':
            K.E = false;
            break;
    }
});

// Ativar pointer lock ao clicar no canvas
document.addEventListener('click', () => {
    if (!isPointerLocked) {
        document.body.requestPointerLock();
    }
});

// Detectar mudanças no pointer lock
document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === document.body;
});

// Movimentação da câmera com o mouse
document.addEventListener('mousemove', (e) => {
    if (isPointerLocked) {
        camera.yaw += e.movementX * mouseSensitivity;
        camera.pitch -= e.movementY * mouseSensitivity;
        
        // Limitar o pitch para evitar flip da câmera
        const maxPitch = Math.PI / 2 - 0.01;
        camera.pitch = Math.max(-maxPitch, Math.min(maxPitch, camera.pitch));
    }
});

function applyViewBob(deltaTime) {
    const bobAmount = 0.05;
    const swayAmount = 0.03;

    if (isMoving) {
        camera.viewBobTime += deltaTime * 8; // bob speed
    } else {
        camera.viewBobTime = 0; // reset if standing still
    }

    const verticalBob = Math.sin(camera.viewBobTime) * bobAmount;
    const sidewaysSway = Math.cos(camera.viewBobTime * 0.5) * swayAmount;

    // clone the real position, add bob offsets
    const renderPos = vec3.clone(camera.position);
    renderPos[1] += verticalBob;  // up/down
    renderPos[0] += sidewaysSway; // left/right

    return renderPos;
}

const moveCamera = () => {
    camera.direction[0] = Math.cos(camera.pitch) * Math.cos(camera.yaw);
    camera.direction[1] = Math.sin(camera.pitch);
    camera.direction[2] = Math.cos(camera.pitch) * Math.sin(camera.yaw);

    camera.noYdirection[0] = Math.cos(0) * Math.cos(camera.yaw);
    camera.noYdirection[1] = Math.sin(0);
    camera.noYdirection[2] = Math.cos(0) * Math.sin(camera.yaw);

    camera.right = vec3.fromValues(-1 * Math.sin(camera.yaw), 0, Math.cos(camera.yaw));

    let movementDirection = vec3.create();
    
    // WASD para movimento
    if (K.W) {
        vec3.scale(movementDirection, camera.noYdirection, movVel);
        vec3.add(camera.position, camera.position, movementDirection);
    }
    if (K.S) {
        vec3.scale(movementDirection, camera.noYdirection, -movVel);
        vec3.add(camera.position, camera.position, movementDirection);
    }
    if (K.A) {
        vec3.scale(movementDirection, camera.right, -movVel);
        vec3.add(camera.position, camera.position, movementDirection);
    }
    if (K.D) {
        vec3.scale(movementDirection, camera.right, movVel);
        vec3.add(camera.position, camera.position, movementDirection);
    }

    isMoving = (K.W || K.S || K.A || K.D);
}