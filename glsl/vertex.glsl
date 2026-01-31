// Atributos do vértice
attribute vec3 aPosition;   // Posição local do vértice
attribute vec3 aNormal;     // Vetor normal original
attribute vec2 aTexCoord;   // Coordenadas de textura (UV)

// Matrizes de Transformação
uniform mat4 uModelMatrix;      // Transforma Local -> Mundo
uniform mat4 uViewMatrix;       // Transforma Mundo -> Câmera
uniform mat4 uProjectionMatrix; // Transforma Câmera -> Tela (Perspectiva)
uniform mat3 uNormalMatrix;     // Inversa transposta da Model (para as normais)

// Variáveis de saída para o Fragment Shader (Interpoladas)
varying vec3 vNormal;   // Normal no espaço do mundo
varying vec3 vPosition; // Posição do fragmento no espaço do mundo
varying vec2 vTexCoord; // UV repassada

void main() {
    // 1. Calcula a posição do vértice no espaço do mundo
    // Necessário para calcular a direção da luz no Fragment Shader
    vPosition = vec3(uModelMatrix * vec4(aPosition, 1.0));

    // 2. Transforma a normal para o espaço do mundo
    // Usamos uNormalMatrix para evitar distorções de escala não uniforme
    vNormal = normalize(uNormalMatrix * aNormal);

    // 3. Repassa a coordenada de textura
    vTexCoord = aTexCoord;

    // 4. Posição final do vértice no clip space (obrigatório)
    // Requisito A-I: Projeção Perspectiva aplicada aqui
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}