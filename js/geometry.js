function createCubeData() {
    // 1. Posições dos vértices (36 vértices para 12 triângulos)
    const positions = [
        // Face frontal
        -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
        -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
        // Face traseira
        -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
        // Topo
        -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
        // Base
        -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
        -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
        // Direita
         0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
         0.5, -0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
        // Esquerda
        -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
        -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
    ];

    // 2. Normais (Essenciais para o Requisito A-II - Phong)
    const normals = [
        0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,  // Frente
        0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1,  // Trás
        0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,  // Topo
        0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,  // Base
        1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,  // Direita
       -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0   // Esquerda
    ];

    // 3. Coordenadas de Textura (Requisito A-IV)
    const texCoords = [
        0,0, 1,0, 1,1,  0,0, 1,1, 0,1, // Repete para as 6 faces
        0,0, 1,0, 1,1,  0,0, 1,1, 0,1,
        0,0, 1,0, 1,1,  0,0, 1,1, 0,1,
        0,0, 1,0, 1,1,  0,0, 1,1, 0,1,
        0,0, 1,0, 1,1,  0,0, 1,1, 0,1,
        0,0, 1,0, 1,1,  0,0, 1,1, 0,1
    ];

    return { positions, normals, texCoords };
}

function initBuffers(gl, data) {
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.positions), gl.STATIC_DRAW);

    const normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.texCoords), gl.STATIC_DRAW);

    return { position: posBuffer, normal: normBuffer, texCoord: texBuffer };
}