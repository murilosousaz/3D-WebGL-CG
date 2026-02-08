/**
 * OBJ LOADER OTIMIZADO E FUNCIONAL
 */

export function parseOBJ(text) {
    console.log("📦 Parse OBJ iniciado...");
    
    const positions = [], normals = [], uvs = [];
    const finalPositions = [], finalNormals = [], finalUVs = [], finalIndices = [];
    const vertexCache = new Map();
    let currentIndex = 0;
    
    const lines = text.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        
        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;
        
        switch (parts[0]) {
            case 'v':
                if (parts.length >= 4) positions.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
                break;
            case 'vn':
                if (parts.length >= 4) normals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
                break;
            case 'vt':
                if (parts.length >= 3) uvs.push([parseFloat(parts[1]), parseFloat(parts[2])]);
                break;
            case 'f':
                processFace(parts.slice(1), {positions, normals, uvs, finalPositions, finalNormals, finalUVs, finalIndices, vertexCache, currentIndex});
                currentIndex = vertexCache.size;
                break;
        }
    }
    
    if (finalNormals.length === 0 && finalPositions.length > 0) {
        console.log("⚠️ Calculando normais...");
        calculateNormals(finalPositions, finalNormals);
    }
    
    console.log(`✅ Parse OK: ${positions.length}v, ${finalIndices.length/3} triângulos`);
    
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
            
            if (vIdx >= 0 && vIdx < data.positions.length) {
                data.finalPositions.push(...data.positions[vIdx]);
            } else {
                data.finalPositions.push(0, 0, 0);
            }
            
            if (nIdx >= 0 && nIdx < data.normals.length) {
                data.finalNormals.push(...data.normals[nIdx]);
            } else {
                data.finalNormals.push(0, 1, 0);
            }
            
            if (tIdx >= 0 && tIdx < data.uvs.length) {
                data.finalUVs.push(...data.uvs[tIdx]);
            } else {
                data.finalUVs.push(0, 0);
            }
            
            const newIndex = data.currentIndex + data.vertexCache.size;
            data.vertexCache.set(vertexKey, newIndex);
            faceIndices.push(newIndex);
        }
    }
    
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
        const n = [nx/len, ny/len, nz/len];
        
        for (let j = 0; j < 3; j++) {
            normals[i + j*3] = n[0];
            normals[i + j*3 + 1] = n[1];
            normals[i + j*3 + 2] = n[2];
        }
    }
}

export async function loadOBJ(url) {
    console.log(`🔄 Carregando: ${url}`);
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const text = await response.text();
        if (!text) throw new Error("Arquivo vazio");
        
        const meshData = parseOBJ(text);
        if (!meshData || meshData.positions.length === 0) throw new Error("Sem geometria");
        
        console.log(`✅ ${url} carregado!`);
        return meshData;
        
    } catch (error) {
        console.error(`❌ Erro: ${error.message}`);
        return null;
    }
}
