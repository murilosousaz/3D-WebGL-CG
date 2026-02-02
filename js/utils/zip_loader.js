// js/utils/zip_loader.js
export async function loadZipContent(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    const zip = await JSZip.loadAsync(blob);
    
    let objText = "";
    const textureUrls = {};

    // 1. Mapear arquivos dentro do ZIP
    for (const [filename, file] of Object.entries(zip.files)) {
        if (filename.endsWith('.obj')) {
            objText = await file.async("text");
        } else if (filename.match(/\.(jpg|jpeg|png)$/i)) {
            const imgBlob = await file.async("blob");
            // Cria uma URL temporária para a imagem extraída
            textureUrls[filename] = URL.createObjectURL(imgBlob);
        }
    }

    return { objText, textureUrls };
}