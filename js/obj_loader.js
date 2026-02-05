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
    const finalIndices = [];

    // Cache para evitar duplicação de vértices
    const vertexCache = new Map();
    
    // OBJETO DE ESTADO: Agora currentIndex é uma propriedade de um objeto,
    // permitindo que seja passado por referência e atualizado corretamente.
    const state = {
        currentIndex: 0
    };

    const lines = text.split('\n');

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;

        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;

        switch (parts[0]) {
            case 'v':
                positions.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
                break;
            case 'vn':
                normals.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
                break;
            case 'vt':
                uvs.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2])
                ]);
                break;
            case 'f':
                processFace(parts.slice(1), {
                    positions,
                    normals,
                    uvs,
                    finalPositions,
                    finalNormals,
                    finalUVs,
                    finalIndices,
                    vertexCache,
                    state // Passa o objeto de estado
                });
                break;
        }
    }

    // Calcula normais se o arquivo não as forneceu
    if (finalNormals.length === 0 && finalPositions.length > 0) {
        calculateNormals(finalPositions, finalNormals);
    }

    return {
        positions: new Float32Array(finalPositions),
        normals: new Float32Array(finalNormals),
        uvs: new Float32Array(finalUVs),
        indices: finalIndices.length > 0 ? new Uint16Array(finalIndices) : null,
        count: finalIndices.length > 0 ? finalIndices.length : finalPositions.length / 3
    };
}

function processFace(vertices, data) {
    const faceIndices = [];
    
    for (let i = 0; i < vertices.length; i++) {
        const vertexKey = vertices[i];
        
        if (data.vertexCache.has(vertexKey)) {
            faceIndices.push(data.vertexCache.get(vertexKey));
        } else {
            const specs = vertexKey.split('/');
            
            const vIdx = parseIndex(specs[0], data.positions.length);
            const tIdx = specs[1] ? parseIndex(specs[1], data.uvs.length) : -1;
            const nIdx = specs[2] ? parseIndex(specs[2], data.normals.length) : -1;

            // Posição
            if (vIdx >= 0 && data.positions[vIdx]) {
                data.finalPositions.push(...data.positions[vIdx]);
            } else {
                data.finalPositions.push(0, 0, 0);
            }

            // Normal
            if (nIdx >= 0 && data.normals[nIdx]) {
                data.finalNormals.push(...data.normals[nIdx]);
            } else {
                data.finalNormals.push(0, 0, 0);
            }

            // UV
            if (tIdx >= 0 && data.uvs[tIdx]) {
                data.finalUVs.push(...data.uvs[tIdx]);
            } else {
                data.finalUVs.push(0, 0);
            }

            data.vertexCache.set(vertexKey, data.state.currentIndex);
            faceIndices.push(data.state.currentIndex);
            data.state.currentIndex++; // Incrementa no objeto de referência
        }
    }

    // Triangulação (Fan conversion)
    for (let i = 1; i < faceIndices.length - 1; i++) {
        data.finalIndices.push(faceIndices[0], faceIndices[i], faceIndices[i + 1]);
    }
}

function parseIndex(indexStr, arrayLength) {
    const index = parseInt(indexStr);
    if (isNaN(index)) return -1;
    return index > 0 ? index - 1 : arrayLength + index;
}

function calculateNormals(positions, normals) {
    // Redimensiona o array de normais para bater com o de posições
    for (let i = 0; i < positions.length; i++) normals.push(0);

    for (let i = 0; i < positions.length; i += 9) {
        const v0 = [positions[i], positions[i+1], positions[i+2]];
        const v1 = [positions[i+3], positions[i+4], positions[i+5]];
        const v2 = [positions[i+6], positions[i+7], positions[i+8]];

        const e1 = [v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]];
        const e2 = [v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]];

        const nx = e1[1]*e2[2] - e1[2]*e2[1];
        const ny = e1[2]*e2[0] - e1[0]*e2[2];
        const nz = e1[0]*e2[1] - e1[1]*e2[0];

        const len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
        
        for (let j = 0; j < 3; j++) {
            normals[i + j*3] = nx/len;
            normals[i + j*3 + 1] = ny/len;
            normals[i + j*3 + 2] = nz/len;
        }
    }
}

export async function loadOBJ(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        return parseOBJ(text);
    } catch (error) {
        console.error(`Erro ao carregar OBJ: ${url}`, error);
        return null;
    }
}