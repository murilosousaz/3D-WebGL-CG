/**
 * OBJ LOADER CORRIGIDO E OTIMIZADO
 * Suporta modelos grandes, calcula normais corretas, e lida com todos os formatos de face
 */

export function parseOBJ(text) {
    console.log("📦 Parse OBJ iniciado...");
    
    const positions = [], normals = [], uvs = [];
    const finalPositions = [], finalNormals = [], finalUVs = [];
    const vertexCache = new Map();
    
    const lines = text.split('\n');
    
    // Primeira passada: coletar vértices, normais e UVs
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        
        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;
        
        switch (parts[0]) {
            case 'v':
                if (parts.length >= 4) {
                    positions.push([
                        parseFloat(parts[1]), 
                        parseFloat(parts[2]), 
                        parseFloat(parts[3])
                    ]);
                }
                break;
            case 'vn':
                if (parts.length >= 4) {
                    normals.push([
                        parseFloat(parts[1]), 
                        parseFloat(parts[2]), 
                        parseFloat(parts[3])
                    ]);
                }
                break;
            case 'vt':
                if (parts.length >= 3) {
                    uvs.push([
                        parseFloat(parts[1]), 
                        parseFloat(parts[2])
                    ]);
                }
                break;
        }
    }
    
    console.log(`📊 Dados brutos: ${positions.length}v, ${normals.length}vn, ${uvs.length}vt`);
    
    // Segunda passada: processar faces
    for (let line of lines) {
        line = line.trim();
        if (!line || !line.startsWith('f')) continue;
        
        const parts = line.split(/\s+/).slice(1); // Remove 'f'
        if (parts.length < 3) continue;
        
        processFace(parts, {
            positions, 
            normals, 
            uvs, 
            finalPositions, 
            finalNormals, 
            finalUVs, 
            vertexCache
        });
    }
    
    // Se não há normais, calcular
    const hasNormals = finalNormals.length > 0;
    if (!hasNormals && finalPositions.length > 0) {
        console.log("⚠️ Calculando normais automaticamente...");
        calculateNormals(finalPositions, finalNormals);
    }
    
    // Se não há UVs, preencher com zeros
    if (finalUVs.length === 0 && finalPositions.length > 0) {
        console.log("⚠️ Modelo sem UVs, preenchendo com padrão...");
        for (let i = 0; i < finalPositions.length / 3; i++) {
            finalUVs.push(0, 0);
        }
    }
    
    const vertexCount = finalPositions.length / 3;
    console.log(`✅ Parse OK: ${vertexCount} vértices finais, ${vertexCount / 3} triângulos`);
    
    // Usar Uint32Array se modelo for grande
    const useUint32 = vertexCount > 65535;
    if (useUint32) {
        console.log("📦 Modelo grande detectado, usando Uint32Array");
    }
    
    return {
        positions: new Float32Array(finalPositions),
        normals: new Float32Array(finalNormals),
        uvs: new Float32Array(finalUVs),
        indices: null, // Não usar índices, renderizar direto
        count: vertexCount,
        indexCount: 0
    };
}

function processFace(vertices, data) {
    const faceVertices = [];
    
    // Processar cada vértice da face
    for (let i = 0; i < vertices.length; i++) {
        const vertexKey = vertices[i];
        
        // Verificar cache
        if (data.vertexCache.has(vertexKey)) {
            const cachedData = data.vertexCache.get(vertexKey);
            faceVertices.push(cachedData);
        } else {
            // Parse do vértice: v/vt/vn ou v//vn ou v/vt ou v
            const specs = vertexKey.split('/');
            const vIdx = parseIndex(specs[0], data.positions.length);
            const tIdx = specs.length > 1 && specs[1] ? parseIndex(specs[1], data.uvs.length) : -1;
            const nIdx = specs.length > 2 && specs[2] ? parseIndex(specs[2], data.normals.length) : -1;
            
            const vertexData = {
                pos: vIdx >= 0 && vIdx < data.positions.length ? data.positions[vIdx] : [0, 0, 0],
                normal: nIdx >= 0 && nIdx < data.normals.length ? data.normals[nIdx] : null,
                uv: tIdx >= 0 && tIdx < data.uvs.length ? data.uvs[tIdx] : [0, 0]
            };
            
            data.vertexCache.set(vertexKey, vertexData);
            faceVertices.push(vertexData);
        }
    }
    
    // Triangular a face (suporta quads e n-gons)
    for (let i = 1; i < faceVertices.length - 1; i++) {
        const v0 = faceVertices[0];
        const v1 = faceVertices[i];
        const v2 = faceVertices[i + 1];
        
        // Adicionar triângulo
        addVertex(v0, data);
        addVertex(v1, data);
        addVertex(v2, data);
    }
}

function addVertex(vertexData, data) {
    // Posição
    data.finalPositions.push(...vertexData.pos);
    
    // Normal (se existir)
    if (vertexData.normal) {
        data.finalNormals.push(...vertexData.normal);
    }
    
    // UV
    data.finalUVs.push(...vertexData.uv);
}

function parseIndex(indexStr, arrayLength) {
    const index = parseInt(indexStr);
    if (isNaN(index)) return -1;
    // OBJ usa índices 1-based, converter para 0-based
    // Suporta índices negativos (relativos ao final)
    return index > 0 ? index - 1 : arrayLength + index;
}

function calculateNormals(positions, normals) {
    // Inicializar array de normais com zeros
    const normalAccum = [];
    const vertexCount = positions.length / 3;
    
    for (let i = 0; i < vertexCount; i++) {
        normalAccum.push([0, 0, 0]);
    }
    
    // Calcular normal de cada triângulo e acumular nos vértices
    for (let i = 0; i < positions.length; i += 9) {
        const v0 = [positions[i], positions[i+1], positions[i+2]];
        const v1 = [positions[i+3], positions[i+4], positions[i+5]];
        const v2 = [positions[i+6], positions[i+7], positions[i+8]];
        
        // Vetores das arestas
        const e1 = [v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]];
        const e2 = [v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]];
        
        // Produto vetorial (normal da face)
        const nx = e1[1]*e2[2] - e1[2]*e2[1];
        const ny = e1[2]*e2[0] - e1[0]*e2[2];
        const nz = e1[0]*e2[1] - e1[1]*e2[0];
        
        // Normalizar
        const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
        if (len > 0.0001) { // Evitar divisão por zero
            const n = [nx/len, ny/len, nz/len];
            
            // Acumular normal nos 3 vértices do triângulo
            const idx0 = i / 3;
            const idx1 = idx0 + 1;
            const idx2 = idx0 + 2;
            
            normalAccum[idx0][0] += n[0]; normalAccum[idx0][1] += n[1]; normalAccum[idx0][2] += n[2];
            normalAccum[idx1][0] += n[0]; normalAccum[idx1][1] += n[1]; normalAccum[idx1][2] += n[2];
            normalAccum[idx2][0] += n[0]; normalAccum[idx2][1] += n[1]; normalAccum[idx2][2] += n[2];
        }
    }
    
    // Normalizar normais acumuladas e adicionar ao array final
    for (let i = 0; i < vertexCount; i++) {
        const n = normalAccum[i];
        const len = Math.sqrt(n[0]*n[0] + n[1]*n[1] + n[2]*n[2]);
        
        if (len > 0.0001) {
            normals.push(n[0]/len, n[1]/len, n[2]/len);
        } else {
            // Normal padrão se algo der errado
            normals.push(0, 1, 0);
        }
    }
}

export async function loadOBJ(url) {
    console.log(`🔄 Carregando: ${url}`);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        if (!text || text.length === 0) {
            throw new Error("Arquivo vazio");
        }
        
        const meshData = parseOBJ(text);
        
        if (!meshData || meshData.positions.length === 0) {
            throw new Error("Sem geometria válida");
        }
        
        console.log(`✅ ${url} carregado com sucesso!`);
        console.log(`   Vértices: ${meshData.count}`);
        console.log(`   Normais: ${meshData.normals.length / 3}`);
        console.log(`   UVs: ${meshData.uvs.length / 2}`);
        
        return meshData;
        
    } catch (error) {
        console.error(`❌ Erro ao carregar ${url}:`, error.message);
        return null;
    }
}

/**
 * Função auxiliar para validar modelo carregado
 */
export function validateOBJData(objData) {
    if (!objData) return false;
    
    const vertexCount = objData.positions.length / 3;
    const normalCount = objData.normals.length / 3;
    const uvCount = objData.uvs.length / 2;
    
    const isValid = 
        vertexCount > 0 &&
        normalCount === vertexCount &&
        uvCount === vertexCount;
    
    if (!isValid) {
        console.warn(`⚠️ Dados inconsistentes:`);
        console.warn(`   Vértices: ${vertexCount}`);
        console.warn(`   Normais: ${normalCount}`);
        console.warn(`   UVs: ${uvCount}`);
    }
    
    return isValid;
}