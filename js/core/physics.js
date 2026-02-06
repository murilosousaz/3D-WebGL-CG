import { collisionMap } from '../scene/collisionmap.js';

export class Physics {
  constructor(camera) {
    this.camera = camera;

    this.velocity = [0, 0, 0];
    this.gravity = -20;

    this.playerHeight = 1.8;
    this.playerRadius = 0.35;

    this.grounded = true;
  }

  update(dt) {
    
    if (!this.grounded) {
      this.velocity[1] += this.gravity * dt;
    }

    const nextPos = [
      this.camera.position[0] + this.velocity[0] * dt,
      this.camera.position[1] + this.velocity[1] * dt,
      this.camera.position[2] + this.velocity[2] * dt
    ];

    for (const obj of collisionMap) {
        
        if (obj.type !== 'box') continue;
        
        if (this.intersectsBox(nextPos, obj)) {
          this.grounded = false;
        const boxTop = box.pos[1] + box.size[1] / 2;
const feetY  = nextPos[1] - this.playerHeight;

        if (
        this.velocity[1] <= 0 &&          // falling or standing
        collision &&                      // actual intersection
        collision.normal[1] > 0.7 &&      // surface facing up
        feetY >= boxTop - 0.2 &&          // close to top
        feetY <= boxTop + 0.05            // not penetrating
        ) {
        nextPos[1] = boxTop + this.playerHeight;
        this.velocity[1] = 0;
        this.grounded = true;
        }

      }
    }

    this.camera.position[0] = nextPos[0];
    this.camera.position[1] = nextPos[1];
    this.camera.position[2] = nextPos[2];
  }

  // -------------------------------------------------------------------------
  // AABB vs capsule-foot approximation
  intersectsBox(pos, box) {
    const [bx, by, bz] = box.pos;
    const [bw, bh, bd] = box.size;

    const px = pos[0];
    const py = pos[1] - this.playerHeight / 2;
    const pz = pos[2];

    return (
      Math.abs(px - bx) <= bw / 2 + this.playerRadius &&
      Math.abs(py - by) <= bh / 2 + this.playerHeight / 2 &&
      Math.abs(pz - bz) <= bd / 2 + this.playerRadius
    );
  }
}
