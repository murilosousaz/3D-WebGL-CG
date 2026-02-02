// js/obj_loader.js

/**
 * Interpreta o conteúdo de um arquivo .OBJ
 * @param {string} text Conteúdo textual do arquivo
 * @returns {Object} Dados formatados para Buffers do WebGL
 */
export function parseOBJ(text) {
    const positions = [];
    const normals = [];
    const uvs = [];
    
    const finalPositions = [];
    const finalNormals = [];
    const finalUVs = [];

    const lines = text.split('\n');

    for (let line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;

        switch (parts[0]) {
            case 'v': // Vértices (x, y, z)
                positions.push(parts.slice(1, 4).map(Number));
                break;
            case 'vn': // Normais (x, y, z)
                normals.push(parts.slice(1, 4).map(Number));
                break;
            case 'vt': // Coordenadas de Textura (u, v)
                uvs.push(parts.slice(1, 3).map(Number));
                break;
            case 'f': // Faces (v/t/n)
                // Suporta apenas triângulos. Se for quad, precisará de lógica extra.
                for (let i = 1; i <= 3; i++) {
                    const specs = parts[i].split('/');
                    
                    // Índices no OBJ começam em 1
                    const vIdx = parseInt(specs[0]) - 1;
                    const tIdx = specs[1] ? parseInt(specs[1]) - 1 : -1;
                    const nIdx = specs[2] ? parseInt(specs[2]) - 1 : -1;

                    // Adiciona Posição
                    finalPositions.push(...positions[vIdx]);

                    // Adiciona Normal (se existir)
                    if (nIdx >= 0 && normals[nIdx]) {
                        finalNormals.push(...normals[nIdx]);
                    } else {
                        finalNormals.push(0, 0, 0); // Fallback
                    }

                    // Adiciona UV (se existir)
                    if (tIdx >= 0 && uvs[tIdx]) {
                        finalUVs.push(uvs[tIdx][0], uvs[tIdx][1]);
                    } else {
                        finalUVs.push(0, 0); // Fallback
                    }
                }
                break;
        }
    }

    return {
        positions: new Float32Array(finalPositions),
        normals: new Float32Array(finalNormals),
        uvs: new Float32Array(finalUVs),
        count: finalPositions.length / 3
    };
}

/**
 * Carrega um arquivo .OBJ via URL
 */
export async function loadOBJ(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro ao carregar OBJ: ${response.statusText}`);
        const text = await response.text();
        return parseOBJ(text);
    } catch (e) {
        console.error(e);
        return null;
    }
}