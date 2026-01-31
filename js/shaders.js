const ShaderLoader = {
    async fetchSource(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Não foi possível carregar o shader: ${url}`);
        }
        return await response.text();
    },

    async createProgramFromFiles(gl, vsPath, fsPath) {
        const vsSource = await this.fetchSource(vsPath);
        const fsSource = await this.fetchSource(fsPath);

        const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`Erro ao linkar o programa: ${info}`);
        }

        return program;
    },

    compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Erro ao compilar ${type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment'} Shader: ${info}`);
        }

        return shader;
    }
};
