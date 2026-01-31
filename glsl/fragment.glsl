precision mediump float;

// Dados vindos do Vertex Shader
varying vec3 vNormal;      // Normal do fragmento (interpolada)
varying vec3 vPosition;    // Posição do fragmento no mundo
varying vec2 vTexCoord;    // Coordenadas de textura

// Uniforms de Iluminação (Phong)
uniform vec3 uLightPos;    // Posição da fonte de luz móvel
uniform vec3 uViewPos;     // Posição da câmera (para o especular)
uniform vec3 uLightColor;  // Cor da luz (geralmente branco vec3(1.0))

// Uniforms de Material
uniform vec3 uObjectColor; // Cor sólida (Requisito A-V)
uniform sampler2D uSampler;// Textura (Requisito A-IV)
uniform bool uUseTexture;  // Define se usa textura ou cor sólida

void main() {
    // 1. Configurações de intensidade do modelo de Phong
    float ambientStrength = 0.15;
    float specularStrength = 0.5;
    float shininess = 32.0;

    // 2. Componente AMBIENTE
    vec3 ambient = ambientStrength * uLightColor;

    // 3. Componente DIFUSA (Lambert)
    vec3 norm = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos - vPosition);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * uLightColor;

    // 4. Componente ESPECULAR (Phong puro)
    vec3 viewDir = normalize(uViewPos - vPosition);
    vec3 reflectDir = reflect(-lightDir, norm); 
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = specularStrength * spec * uLightColor;

    // 5. Determinação da cor base (Textura vs Cor Sólida)
    vec4 baseColor;
    if (uUseTexture) {
        baseColor = texture2D(uSampler, vTexCoord);
    } else {
        baseColor = vec4(uObjectColor, 1.0);
    }

    // 6. Combinação Final: (Amb + Diff + Spec) * Cor do Objeto
    vec3 lightingResult = (ambient + diffuse + specular);
    gl_FragColor = vec4(lightingResult, 1.0) * baseColor;
}