function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Erro ao ligar shaders:', gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function bindBuffers(gl, program, buffers) {
    // Posição (aPosition)
    const posLoc = gl.getAttribLocation(program, "aPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    // Normais (aNormal)
    const normLoc = gl.getAttribLocation(program, "aNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normLoc);

    // Textura (aTexCoord)
    const texLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texLoc);
}

function setUniformMatrix4fv(gl, program, name, value) {
    const loc = gl.getUniformLocation(program, name);
    gl.uniformMatrix4fv(loc, false, value);
}

function setUniformMatrix3fv(gl, program, name, value) {
    const loc = gl.getUniformLocation(program, name);
    gl.uniformMatrix3fv(loc, false, value);
}

function setUniform3f(gl, program, name, value) {
    const loc = gl.getUniformLocation(program, name);
    gl.uniform3fv(loc, value);
}

function setUniform1i(gl, program, name, value) {
    const loc = gl.getUniformLocation(program, name);
    gl.uniform1i(loc, value);
}

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Coloca um pixel temporário enquanto a imagem carrega
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 255]));

    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // WebGL1 precisa de potências de 2 para Mipmaps, ou filtros específicos
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;
    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}