export class MuseumScene {
  draw(renderer, time) {
    renderer.drawCube({
      pos: [0, 0, 0],
      scale: [40, 0.1, 60],
      texture: renderer.assets.textures.floor
    });

    renderer.drawCube({
      pos: [0, 4, -30],
      scale: [40, 8, 0.3],
      color: [0.85, 0.85, 0.82]
    });
  }
}
