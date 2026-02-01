const ShaderLoader = {
    // Esta função busca o arquivo e retorna o texto puro
    async fetchSource(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status} ao carregar ${url}`);
            }
            return await response.text();
        } catch (err) {
            console.error("Falha no fetch do shader:", err);
            throw err;
        }
    },

    // Esta função organiza a compilação de ambos os shaders
    async createProgramFromFiles(gl, vsPath, fsPath) {
        console.log("Buscando shaders...");
        const vsSource = await this.fetchSource(vsPath);
        const fsSource = await this.fetchSource(fsPath);
        
        // Aqui você chama as funções de compilação que estão no renderer.js
        const vs = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }
        console.log("Shaders carregados e compilados!");
        return program;
    }
};