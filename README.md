# 🎨 Galeria de Arte 3D Interativa - WebGL

> Uma galeria de arte virtual moderna e minimalista construída com WebGL puro, featuring sistema completo de carregamento de modelos OBJ, física realista e iluminação dinâmica.

[![WebGL](https://img.shields.io/badge/WebGL-2.0-990000?style=for-the-badge&logo=webgl)](https://www.khronos.org/webgl/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

![Galeria Preview](https://via.placeholder.com/1200x600/667eea/ffffff?text=Galeria+de+Arte+3D)

---

## 📋 Índice

- [✨ Características](#-características)
- [🚀 Quick Start](#-quick-start)
- [📂 Estrutura do Projeto](#-estrutura-do-projeto)
- [🎮 Controles](#-controles)
- [🎯 Adicionando Seus Modelos OBJ](#-adicionando-seus-modelos-obj)
- [🔧 Configuração Avançada](#-configuração-avançada)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [📚 Documentação Adicional](#-documentação-adicional)
- [🤝 Contribuindo](#-contribuindo)
- [📄 Licença](#-licença)

---

## ✨ Características

### 🎨 **Sistema de Galeria**
- ✅ Layout minimalista e moderno
- ✅ 11 quadros distribuídos em 3 paredes
- ✅ 4 pedestais para esculturas/modelos 3D
- ✅ Bancos de madeira para apreciação
- ✅ Iluminação cinematográfica dinâmica

### 🗿 **Carregamento de Modelos OBJ**
- ✅ Parser OBJ completo e robusto
- ✅ Suporte para todos os formatos de face (v, v/vt, v//vn, v/vt/vn)
- ✅ Triangulação automática de quads e n-gons
- ✅ Cálculo automático de normais
- ✅ Suporta modelos grandes (>65k vértices)
- ✅ Cache de vértices para otimização

### 🎮 **Física e Movimento**
- ✅ Sistema de física com gravidade
- ✅ Colisão AABB (Axis-Aligned Bounding Box)
- ✅ Movimento suave com aceleração
- ✅ Pulo realista
- ✅ Modo corrida (Shift)
- ✅ Controle FPS com mouse lock

### 💡 **Iluminação**
- ✅ Luz principal rotativa
- ✅ Spots de destaque nas obras
- ✅ Iluminação Phong/Blinn-Phong
- ✅ Suporte para múltiplas fontes de luz

### 🎯 **Otimização**
- ✅ Renderização eficiente
- ✅ Sistema de cache
- ✅ Performance otimizada para 60 FPS
- ✅ Colisões calculadas apenas quando necessário

---

## 🚀 Quick Start

### Pré-requisitos

- Navegador moderno com suporte a WebGL 2.0
- Servidor HTTP local (não funciona abrindo direto do sistema de arquivos)

### Instalação Rápida

1. **Clone ou baixe o projeto**
```bash
git clone https://github.com/seu-usuario/galeria-3d.git
cd galeria-3d
```

2. **Estrutura básica de arquivos**
```
galeria-3d/
├── index.html
├── js/
│   ├── main.js
│   ├── obj_loader.js
│   ├── camera.js
│   ├── geometry.js
│   ├── shader_loader.js
│   └── utils.js
├── glsl/
│   ├── vertex.glsl
│   └── fragment.glsl
├── assets/
│   ├── piso.jpg
│   ├── parede.jpg
│   ├── quadro.jpg
│   ├── madeira.jpg
│   ├── moon.obj
│   ├── moon_00_0.png
│   ├── sculpture1.obj       ⬅️ SEUS MODELOS
│   ├── sculpture1.png
│   ├── sculpture2.obj
│   ├── sculpture2.png
│   ├── artpiece.obj
│   └── artpiece.png
└── libs/
    └── gl-matrix-min.js
```

3. **Inicie um servidor local**

**Opção 1 - Python 3:**
```bash
python -m http.server 8000
```

**Opção 2 - Node.js (npx):**
```bash
npx http-server -p 8000
```

**Opção 3 - VS Code:**
- Instale a extensão "Live Server"
- Clique direito em `index.html` → "Open with Live Server"

4. **Acesse no navegador**
```
http://localhost:8000
```

5. **Clique na tela e comece a explorar! 🎉**

---

## 📂 Estrutura do Projeto

### Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| **index.html** | Página principal com canvas WebGL |
| **main.js** | Lógica principal, renderização, física |
| **obj_loader.js** | 🆕 Parser de arquivos OBJ robusto |
| **camera.js** | Sistema de câmera FPS |
| **geometry.js** | Geometrias básicas (cubo) |
| **shader_loader.js** | Carregador de shaders GLSL |
| **utils.js** | Funções utilitárias (texturas, buffers) |

### Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| **README.md** | Este arquivo (documentação principal) |
| **QUICK_START.md** | Guia rápido em 3 passos |
| **LAYOUT_GUIDE.md** | Mapa visual da galeria |
| **DEBUG_OBJ.md** | Troubleshooting de modelos OBJ |
| **FIX_QUADROS.md** | Correção dos quadros nas paredes |

### Ferramentas

| Arquivo | Descrição |
|---------|-----------|
| **test_obj.html** | 🔍 Validador visual de arquivos OBJ |

---

## 🎮 Controles

### Teclado

| Tecla | Ação |
|-------|------|
| **W** | Mover para frente |
| **S** | Mover para trás |
| **A** | Mover para esquerda (strafe) |
| **D** | Mover para direita (strafe) |
| **Shift** | Correr (2x velocidade) |
| **Espaço** | Pular |
| **Arrow Keys** | Alternativa para WASD |

### Mouse

| Ação | Controle |
|------|----------|
| **Clique** | Travar cursor (Pointer Lock) |
| **Movimento** | Olhar ao redor (yaw e pitch) |
| **ESC** | Liberar cursor |

### Dicas de Navegação

💡 **Dica 1**: Clique na tela para ativar o controle de mouse  
💡 **Dica 2**: Use Shift para explorar rapidamente a galeria  
💡 **Dica 3**: Aproxime-se dos modelos para ver os detalhes  

---

## 🎯 Adicionando Seus Modelos OBJ

### Método Rápido (3 Passos)

#### **1️⃣ Preparar Arquivos**

Coloque na pasta `assets/`:
```
assets/
├── sculpture1.obj    ⬅️ Seu modelo 3D
├── sculpture1.png    ⬅️ Textura (opcional)
```

#### **2️⃣ O Sistema Carrega Automaticamente**

Os seguintes arquivos são carregados automaticamente:
- ✅ `moon.obj` + `moon_00_0.png` (já incluído)
- ⬜ `sculpture1.obj` + `sculpture1.png`
- ⬜ `sculpture2.obj` + `sculpture2.png`
- ⬜ `artpiece.obj` + `artpiece.png`

#### **3️⃣ Pronto! 🎉**

Recarregue a página e seus modelos aparecerão na galeria!

### Posições dos Modelos

```
                    PAREDE DO FUNDO
    ╔═══════════════════════════════════════╗
    ║  🖼️  🖼️  🖼️                          ║
    ║                                       ║
    ║    [sculpture1]  [Lua]  [sculpture2] ║
    ║        🗿          🌙        🗿       ║
    ║                                       ║
    ║           [Artpiece Central]          ║
    ║                🎨                     ║
    ║              Rotativa                 ║
    ║                                       ║
    ║       🪑       🪑       🪑            ║
    ╚═══════════════════════════════════════╝
                    ENTRADA
```

### Requisitos do Arquivo OBJ

✅ **Formatos Suportados:**
```obj
f 1 2 3              # Apenas vértices
f 1/1 2/2 3/3        # Vértices + UVs
f 1//1 2//2 3//3     # Vértices + Normais
f 1/1/1 2/2/2 3/3/3  # Completo (RECOMENDADO)
```

✅ **Características:**
- Vértices (v)
- Normais (vn) - opcional, serão calculadas
- UVs (vt) - opcional, mas recomendado para texturas
- Faces triangulares ou quads (serão trianguladas)

❌ **Não Suportado:**
- Materiais MTL complexos
- Curvas NURBS
- Subdivisão de superfície

---

## 🔧 Configuração Avançada

### Ajustar Posição de um Modelo

Edite `main.js` na função `drawGallery()`:

```javascript
// Encontre a seção do modelo
if (objModels.sculpture1) {
    drawOBJModel(
        objModels.sculpture1,
        [-8, 2.4, -10],        // ⬅️ [X, Y, Z] Posição
        [1.5, 1.5, 1.5],       // ⬅️ Escala
        [0, time * 0.15, 0],   // ⬅️ Rotação
        objTextures.sculpture1
    );
}
```

### Adicionar Novo Modelo

**1. Carregar o modelo** (em `init()`):
```javascript
const myModelData = await loadOBJ('assets/mymodel.obj');
if (myModelData) {
    objModels.mymodel = initOBJBuffers(gl, myModelData);
    objTextures.mymodel = loadTexture(gl, 'assets/mymodel.png');
}
```

**2. Adicionar colisão** (em `initCollisionObjects()`):
```javascript
{ type: 'box', pos: [X, 0.6, Z], size: [2, 1.2, 2] },
```

**3. Desenhar** (em `drawGallery()`):
```javascript
drawPedestal([X, 0.6, Z], [2, 1.2, 2]);
if (objModels.mymodel) {
    drawOBJModel(
        objModels.mymodel,
        [X, 2.4, Z],
        [1.5, 1.5, 1.5],
        [0, time * 0.2, 0],
        objTextures.mymodel
    );
}
```

### Personalizar Iluminação

```javascript
// Adicionar nova luz
lightPositions.push([X, Y, Z]);

// Spotlight colorido
drawSpotLight([X, Y, Z], [R, G, B]);

// Exemplos:
drawSpotLight([0, 7, -20], [1, 0.8, 0.9]);  // Rosa suave
drawSpotLight([5, 6, 5], [0.8, 1, 0.9]);    // Verde água
```

### Adicionar Quadros

**Parede do Fundo:**
```javascript
drawArtFrame([X, 3.5, -29.5], [3.5, 2.8, 0.2], [0, 0, 0]);
```

**Parede Esquerda:**
```javascript
drawArtFrame([-14.5, 3.5, Z], [0.2, 2.2, 2.8], [0, Math.PI/2, 0]);
```

**Parede Direita:**
```javascript
drawArtFrame([14.5, 3.5, Z], [0.2, 2.2, 2.8], [0, -Math.PI/2, 0]);
```

---

## 🛠️ Troubleshooting

### ❓ Modelo não aparece

**Verifique no console (F12):**
```
✅ assets/sculpture1.obj carregado com sucesso!  ← Deve aparecer
   Vértices: 1234
   Normais: 1234
   UVs: 1234
```

**Soluções:**
1. Confirme que o arquivo está em `assets/`
2. Verifique o nome exato do arquivo
3. Use `test_obj.html` para validar o arquivo
4. Tente aumentar muito a escala: `[10, 10, 10]`
5. Elevar posição Y: `[X, 10, Z]`

### ❓ Modelo aparece distorcido

**Soluções:**
```javascript
// Tente diferentes escalas
[0.1, 0.1, 0.1]   // Modelo muito grande?
[5.0, 5.0, 5.0]   // Modelo muito pequeno?

// Rotacionar
[Math.PI/2, 0, 0]  // 90° em X
[0, Math.PI, 0]    // 180° em Y

// Inverter eixo
[1, -1, 1]  // Espelhar verticalmente
[-1, 1, 1]  // Espelhar horizontalmente
```

### ❓ Modelo aparece todo preto

**Soluções:**
1. **Verificar normais:**
   ```javascript
   console.log("Normais:", objModels.sculpture1.normal ? "✓" : "✗");
   ```

2. **Adicionar luz próxima:**
   ```javascript
   drawSpotLight([posX, posY + 2, posZ], [1, 1, 1]);
   ```

3. **Testar sem textura:**
   ```javascript
   drawOBJModel(model, pos, scale, rot, 
       null,        // SEM textura
       [1, 0, 0]    // Cor vermelha brilhante
   );
   ```

### ❓ Textura não aparece

**Checklist:**
- [ ] Arquivo `.png` ou `.jpg` existe?
- [ ] Nome correto no código?
- [ ] Modelo tem UVs? (verificar no `test_obj.html`)

**Se modelo não tem UVs:**
```javascript
// Use cor sólida ao invés de textura
drawOBJModel(model, pos, scale, rot, 
    null,              // Sem textura
    [0.8, 0.7, 0.6]   // Cor bege
);
```

### ❓ Performance ruim / Travamentos

**Soluções:**

1. **Verificar contagem de vértices:**
   ```
   Use test_obj.html
   
   < 10.000 vértices   → ✅ Excelente
   10.000 - 50.000     → ✅ Bom
   50.000 - 100.000    → ⚠️ Cuidado
   > 100.000           → ❌ Simplificar
   ```

2. **Simplificar no Blender:**
   - Add Modifier → Decimate
   - Ratio: 0.5 (reduz 50%)
   - Apply → Export novamente

3. **Renderizar condicionalmente:**
   ```javascript
   const distance = Math.sqrt(
       Math.pow(cameraPos[0] - posX, 2) + 
       Math.pow(cameraPos[2] - posZ, 2)
   );
   
   if (distance < 25) {  // Só renderiza se próximo
       drawOBJModel(...);
   }
   ```

### ❓ Erro "Cross-Origin"

**Problema:** Arquivos não carregam

**Solução:** Use um servidor HTTP local (veja [Quick Start](#-quick-start))

❌ **Não funciona:**
```
file:///C:/Users/projeto/index.html
```

✅ **Funciona:**
```
http://localhost:8000
```

---

## 📚 Documentação Adicional

### Arquivos de Referência

| Documento | Descrição |
|-----------|-----------|
| **QUICK_START.md** | Tutorial prático em 3 passos |
| **LAYOUT_GUIDE.md** | Mapa completo da galeria com coordenadas |
| **DEBUG_OBJ.md** | Guia completo de troubleshooting |
| **FIX_QUADROS.md** | Explicação da correção dos quadros |

### Ferramentas Úteis

- **test_obj.html** - Validador visual de arquivos OBJ
- **Console do Navegador (F12)** - Mensagens de debug
- **WebGL Inspector** - Extensão para Chrome/Firefox

### Tutoriais Externos

- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Khronos WebGL Wiki](https://www.khronos.org/webgl/wiki/)
- [Blender OBJ Export](https://docs.blender.org/manual/en/latest/addons/import_export/scene_obj.html)

---

## 🎨 Exportando Modelos do Blender

### Passo a Passo

1. **Selecione seu modelo**
2. **File → Export → Wavefront (.obj)**
3. **Configurações de Export:**
   ```
   ✓ Selection Only (se quiser só o selecionado)
   ✓ Apply Modifiers
   ✓ Write Normals
   ✓ Include UVs
   ✓ Triangulate Faces  ⬅️ IMPORTANTE
   ✓ Keep Vertex Order
   
   Objects as OBJ Objects: Off
   Material Groups: Off
   ```
4. **Export**
5. **Teste no `test_obj.html`**

### Otimizar Modelo

**Reduzir polígonos:**
1. Select model → Tab (Edit Mode)
2. Add Modifier → Decimate
3. Ratio: 0.5 (ajuste conforme necessário)
4. Apply
5. Re-export

**UV Unwrap (para texturas):**
1. Tab (Edit Mode) → A (Select All)
2. U → Smart UV Project
3. Tab (Object Mode)
4. Shading workspace → Adicionar textura

---

## 🌟 Exemplos de Uso

### Galeria de Arte Clássica
```javascript
// Estátuas greco-romanas
sculpture1.obj → Vênus de Milo
sculpture2.obj → David de Michelangelo
artpiece.obj → Discóbolo
```

### Museu de História Natural
```javascript
sculpture1.obj → Fóssil de dinossauro
sculpture2.obj → Esqueleto de mamute
artpiece.obj → Meteorito
```

### Exposição de Arte Moderna
```javascript
sculpture1.obj → Escultura abstrata 1
sculpture2.obj → Instalação interativa
artpiece.obj → Obra central rotativa
```

### Showroom de Produtos
```javascript
sculpture1.obj → Produto A
sculpture2.obj → Produto B
artpiece.obj → Produto destaque
```

---

## 🔍 FAQ (Perguntas Frequentes)

### **P: Posso usar qualquer modelo 3D?**
R: Sim, desde que seja formato OBJ. Modelos em FBX, GLTF, etc precisam ser convertidos.

### **P: Qual o tamanho máximo de modelo?**
R: Recomendamos < 50.000 vértices para performance em tempo real. Modelos maiores funcionam mas podem travar em dispositivos mais fracos.

### **P: Preciso de texturas?**
R: Não é obrigatório. Modelos sem textura renderizam com cor sólida.

### **P: Como adiciono mais de 4 modelos?**
R: Siga o template em `QUICK_START.md` para adicionar quantos modelos quiser.

### **P: Funciona em mobile?**
R: Funciona, mas controles touch não estão implementados. É otimizado para desktop.

### **P: Posso vender projetos usando este código?**
R: Sim, licença MIT permite uso comercial. Veja [LICENSE](LICENSE).

### **P: Como adiciono som?**
R: Use Web Audio API. Exemplo:
```javascript
const audio = new Audio('assets/ambient.mp3');
audio.loop = true;
audio.play();
```

---

## 🎓 Conceitos Técnicos

### Arquitetura

```
┌─────────────────────────────────────┐
│         main.js (Core)              │
│  ┌──────────┐  ┌──────────────┐    │
│  │ Physics  │  │ Render Loop  │    │
│  └──────────┘  └──────────────┘    │
└─────────────────────────────────────┘
         │              │
    ┌────┴────┐    ┌────┴────┐
    │ Camera  │    │ Shaders │
    └─────────┘    └─────────┘
         │              │
    ┌────┴──────────────┴────┐
    │      obj_loader.js     │
    │   ┌──────────────┐     │
    │   │ Parse OBJ    │     │
    │   │ Triangulate  │     │
    │   │ Calculate N  │     │
    │   └──────────────┘     │
    └────────────────────────┘
```

### Sistema de Colisão

Usa **AABB** (Axis-Aligned Bounding Box):
```
Player Box:
  Min: [x - radius, y - height, z - radius]
  Max: [x + radius, y, z + radius]

Object Box:
  Min: [x - width/2, y - height/2, z - depth/2]
  Max: [x + width/2, y + height/2, z + depth/2]

Colisão quando todos os eixos se sobrepõem
```

### Pipeline de Renderização

```
1. Update Physics → 2. Update Camera → 3. Clear Buffers
         ↓
4. Set Uniforms → 5. Draw Objects → 6. Draw OBJ Models
         ↓
7. Swap Buffers → 8. Request Next Frame
```

## 👨‍💻 Autores

- Eduardo Matias
- Lucas Emanuel
- Murilo Sousa

</div>