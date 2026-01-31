const { vec3, mat4 } = glMatrix;

export class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Posição inicial (Requisito B-I: Altura de uma pessoa ~1.6)
        this.position = vec3.fromValues(0, 1.6, 5);
        this.up = vec3.fromValues(0, 1, 0);
        this.front = vec3.fromValues(0, 0, -1);
        this.right = vec3.create();
        
        // Ângulos de Euler (em graus)
        this.yaw = -90;   // Olhando para frente no eixo Z
        this.pitch = 0;   // Horizonte
        
        // Configurações de movimento
        this.speed = 0.05;
        this.sensitivity = 0.1;
        
        // Estado das teclas
        this.keys = {};
        
        this.initEvents();
        this.updateCameraVectors();
    }

    initEvents() {
        // Captura de teclado (Requisito B-II)
        window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });

        // Captura de mouse (Opcional - Requisito B-II)
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });

        window.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === this.canvas) {
                this.yaw += e.movementX * this.sensitivity;
                this.pitch -= e.movementY * this.sensitivity;

                // Limita a visão vertical para evitar "looping"
                if (this.pitch > 89) this.pitch = 89;
                if (this.pitch < -89) this.pitch = -89;

                this.updateCameraVectors();
            }
        });
    }

    // Calcula os vetores Front e Right com base nos ângulos atuais
    updateCameraVectors() {
        let front = vec3.create();
        const radYaw = this.yaw * Math.PI / 180;
        const radPitch = this.pitch * Math.PI / 180;

        front[0] = Math.cos(radYaw) * Math.cos(radPitch);
        front[1] = Math.sin(radPitch);
        front[2] = Math.sin(radYaw) * Math.cos(radPitch);
        
        vec3.normalize(this.front, front);
        
        // Recalcula o vetor Right (perpendicular ao Front e Up)
        vec3.cross(this.right, this.front, this.up);
        vec3.normalize(this.right, this.right);
    }

    // Processa o movimento por frame (chamado no main.js)
    update() {
        const temp = vec3.create();

        // W e S (Frente/Trás)
        if (this.keys['w'] || this.keys['arrowup']) {
            vec3.scale(temp, this.front, this.speed);
            vec3.add(this.position, this.position, temp);
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            vec3.scale(temp, this.front, this.speed);
            vec3.sub(this.position, this.position, temp);
        }

        // A e D (Laterais - Strafe)
        if (this.keys['a'] || this.keys['arrowleft']) {
            vec3.scale(temp, this.right, this.speed);
            vec3.sub(this.position, this.position, temp);
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            vec3.scale(temp, this.right, this.speed);
            vec3.add(this.position, this.position, temp);
        }

        // Mantém o utilizador no chão (ignora movimento vertical no passeio virtual)
        this.position[1] = 1.6; 
    }

    // Retorna a View Matrix para o Shader
    getViewMatrix() {
        const target = vec3.create();
        vec3.add(target, this.position, this.front);
        
        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, this.position, target, this.up);
        return viewMatrix;
    }
}