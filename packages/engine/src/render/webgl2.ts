/* The WebGL2 backend: one full-screen triangle and one program per
   character, drawn in the page's shared context (see gpu.ts) and copied
   onto the mascot's own canvas. Uniforms come straight from the pose. */

import type { CompiledCharacter } from '../compiler/compile';
import { Gpu } from './gpu';
import type { Frame, Renderer } from './renderer';

/** The camera's half field of view, as a tangent: a long lens, like a product shot. */
const TAN_HALF_FOV = 0.2;
const CAMERA_PITCH = 0.1;
const SHOW_ALL = [1e6, 1, 1];

export class WebGL2Renderer implements Renderer {
  private readonly gpu = Gpu.shared();
  private readonly target: CanvasRenderingContext2D;
  private character: CompiledCharacter | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const target = canvas.getContext('2d');
    if (!target) throw new Error('Canvas 2D is not available');
    this.target = target;
  }

  load(character: CompiledCharacter) {
    this.character = character;
    /* start building now, so it's likely ready by the first frame */
    this.gpu.program(character);
  }

  render(frame: Frame): boolean {
    const p = this.character && this.gpu.program(this.character);
    if (!p) return false;
    const { gpu } = this;
    const { gl } = gpu;
    const { width, height } = frame;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    gpu.reserve(width, height);
    gl.viewport(0, 0, width, height);
    gl.scissor(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(p.program);

    const u = p.uniforms;
    const { spec } = p.character;
    const pose = frame.pose;
    const lift = pose.lift;
    gl.uniform2f(u.uResolution, frame.width, frame.height);
    gl.uniform1f(u.uTime, frame.time);
    gl.uniform4f(u.uCamera, spec.frame.target, (spec.frame.radius * frame.framing) / TAN_HALF_FOV, TAN_HALF_FOV, CAMERA_PITCH);
    gl.uniform4f(u.uBound, 0, spec.bound.y + lift, 0, spec.bound.radius);
    gl.uniformMatrix4fv(u.uBones, false, frame.bones);
    gl.uniform1f(u.uScaleFix, pose.minScale);
    gl.uniform4fv(u.uFaceA, pose.faceA);
    gl.uniform4fv(u.uFaceB, pose.faceB);
    gl.uniform4fv(u.uFaceC, pose.faceC);
    gl.uniform4fv(u.uFaceD, pose.faceD);
    gl.uniform3fv(u.uGlow, pose.glow);
    gl.uniform3fv(u.uShadow, frame.shadow);
    gl.uniform1f(u.uFloor, frame.floor);
    gl.uniform1f(u.uLift, lift);
    gl.uniform1f(u.uExposure, frame.exposure * pose.exposure);
    gl.uniform3fv(u.uAlbedo, frame.albedo);
    gl.uniform1f(u.uGlowPool, spec.glowPool ?? 0);
    gl.uniform4fv(u.uFxA, frame.fx.a);
    gl.uniform4fv(u.uFxB, frame.fx.b);
    gl.uniform4fv(u.uFxC, frame.fx.c);
    gl.uniform1i(u.uFxCount, frame.fx.count);
    if (p.character.reveal) gl.uniform3fv(u.uReveal, frame.reveal ?? SHOW_ALL);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* GL's origin is bottom left, so the drawing sits at the bottom of the shared buffer */
    this.target.globalCompositeOperation = 'copy';
    this.target.drawImage(gpu.canvas, 0, gpu.canvas.height - height, width, height, 0, 0, width, height);
    return true;
  }

  /* programs belong to the page and stay cached for the next mascot of the same character */
  dispose() {
    this.character = null;
  }
}
