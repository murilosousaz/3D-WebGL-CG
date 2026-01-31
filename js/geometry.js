// js/geometry.js

/**
 * Retorna os dados de um cubo unitário centrado na origem.
 * Inclui posições, normais (para Phong) e UVs (para textura).
 */
export function getCubeData() {
    // 24 vértices (6 faces * 4 vértices por face para manter normais distintas)
    const positions = [
        // Face frontal
        -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
        // Face traseira
        -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5,
        // Face superior
        -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5,
        // Face inferior
        -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
        // Face direita
         0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,
        // Face esquerda
        -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5,
    ];

    const normals = [
        // Frontal (Z+)
         0.0,  0.0,  1.0,   0.0,  0.0,  1.0,   0.0,  0.0,  1.0,   0.0,  0.0,  1.0,
        // Traseira (Z-)
         0.0,  0.0, -1.0,   0.0,  0.0, -1.0,   0.0,  0.0, -1.0,   0.0,  0.0, -1.0,
        // Superior (Y+)
         0.0,  1.0,  0.0,   0.0,  1.0,  0.0,   0.0,  1.0,  0.0,   0.0,  1.0,  0.0,
        // Inferior (Y-)
         0.0, -1.0,  0.0,   0.0, -1.0,  0.0,   0.0, -1.0,  0.0,   0.0, -1.0,  0.0,
        // Direita (X+)
         1.0,  0.0,  0.0,   1.0,  0.0,  0.0,   1.0,  0.0,  0.0,   1.0,  0.0,  0.0,
        // Esquerda (X-)
        -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,
    ];

    const textureCoords = [
        // Frontal
        0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
        // Traseira
        0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
        // Superior
        0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
        // Inferior
        0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
        // Direita
        0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
        // Esquerda
        0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
    ];

    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];

    return { positions, normals, textureCoords, indices };
}

/**
 * Cria os buffers WebGL para um objeto específico
 */
export function initBuffers(gl, data) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.positions), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.textureCoords), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        normal: normalBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
        vertexCount: data.indices.length
    };
}