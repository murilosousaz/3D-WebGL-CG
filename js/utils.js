// js/utils.js

/**
 * Carrega uma textura
 */
export function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Pixel temporário (azul) enquanto a imagem carrega
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // Configurações para evitar texturas esticadas ou bugadas
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };
    image.src = url;

    return texture;
}

export function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

/**
 * Define uniform Matrix4fv
 */
export function setUniformMatrix4fv(gl, program, name, matrix) {
    const location = gl.getUniformLocation(program, name);
    if (location !== null) {
        gl.uniformMatrix4fv(location, false, matrix);
    }
}

/**
 * Define uniform Matrix3fv
 */
export function setUniformMatrix3fv(gl, program, name, matrix) {
    const location = gl.getUniformLocation(program, name);
    if (location !== null) {
        gl.uniformMatrix3fv(location, false, matrix);
    }
}

/**
 * Define uniform 3f (vec3)
 */
export function setUniform3f(gl, program, name, vec) {
    const location = gl.getUniformLocation(program, name);
    if (location !== null) {
        gl.uniform3f(location, vec[0], vec[1], vec[2]);
    }
}

/**
 * Define uniform 1i (int)
 */
export function setUniform1i(gl, program, name, value) {
    const location = gl.getUniformLocation(program, name);
    if (location !== null) {
        gl.uniform1i(location, value);
    }
}

/**
 * Define uniform 1f (float)
 */
export function setUniform1f(gl, program, name, value) {
    const location = gl.getUniformLocation(program, name);
    if (location !== null) {
        gl.uniform1f(location, value);
    }
}

/**
 * Bind buffers aos atributos do shader
 */
export function bindBuffers(gl, program, buffers) {
    // Position
    const positionLoc = gl.getAttribLocation(program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    // Normal
    const normalLoc = gl.getAttribLocation(program, 'aNormal');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    // TexCoord
    const texCoordLoc = gl.getAttribLocation(program, 'aTexCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);
}

/**
 * Inicializa buffers com dados de geometria
 */
export function initBuffers(gl, data) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.positions), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.texCoords), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        normal: normalBuffer,
        texCoord: texCoordBuffer
    };
}