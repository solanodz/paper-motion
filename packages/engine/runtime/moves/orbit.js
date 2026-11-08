import { ease, lerp, progress } from '../core.js';

/** A 3D camera around a world whose children sit at different translateZ. Ranges are [from, to]. */
export function orbit(world, t, { start = 0, duration = 5, yaw = [-20, 20], pitch = [8, -6], dolly = [-200, 200], curve = ease.inOutSine } = {}) {
  const q = curve(progress(t, start, start + duration));
  world.style.transformStyle = 'preserve-3d';
  world.style.transform = `translateZ(${lerp(...dolly, q)}px) rotateX(${lerp(...pitch, q)}deg) rotateY(${lerp(...yaw, q)}deg)`;
}
