// js/shader_loader.js

const ShaderLoader = {
    async loadShader(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Erro ao carregar shader "${url}":`, error);
            return null;
        }
    },

    compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            const typeName = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
            console.error(`Erro ao compilar shader ${typeName}:`, info);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    },

    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            console.error('Erro ao linkar programa:', info);
            gl.deleteProgram(program);
            return null;
        }
        return program;
    },

    async createProgramFromFiles(gl, vertexPath, fragmentPath) {
        console.log(`Carregando shaders: ${vertexPath}, ${fragmentPath}`);

        const [vertexSource, fragmentSource] = await Promise.all([
            this.loadShader(vertexPath),
            this.loadShader(fragmentPath)
        ]);

        if (!vertexSource || !fragmentSource) {
            throw new Error('Falha ao carregar shaders (verifique os caminhos)');
        }

        const vertexShader = this.compileShader(gl, vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            throw new Error('Falha ao compilar shaders');
        }

        const program = this.createProgram(gl, vertexShader, fragmentShader);

        // Após linkar o programa, os objetos shader individuais podem ser deletados
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }
};

export default ShaderLoader; // Torna o loader disponível para importação