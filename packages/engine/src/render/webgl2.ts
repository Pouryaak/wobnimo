/* The WebGL2 backend: one full-screen triangle, one program per
   character, uniforms straight from the pose. */

import type { CompiledCharacter } from '../compiler/compile';
import { VERTEX_SHADER } from '../compiler/compile';
import { UNIFORMS, type UniformName } from '../compiler/uniforms';
import type { Frame, Renderer } from './renderer';

/** The camera's half field of view, as a tangent: a long lens, like a product shot. */
const TAN_HALF_FOV = 0.2;
const CAMERA_PITCH = 0.1;

interface Program {
  program: WebGLProgram;
  uniforms: Record<UniformName, WebGLUniformLocation | null>;
  character: CompiledCharacter;
}

export class WebGL2Renderer implements Renderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly programs = new Map<CompiledCharacter, Program>();
  private current: Program | null = null;

  constructor(private readonly canvas: HTMLCanvasElement | OffscreenCanvas) {
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL2 is not available');
    this.gl = gl as WebGL2RenderingContext;
  }

  load(character: CompiledCharacter) {
    let p = this.programs.get(character);
    if (!p) {
      p = this.build(character);
      this.programs.set(character, p);
    }
    this.current = p;
  }

  render(frame: Frame) {
    const p = this.current;
    if (!p) return;
    const { gl } = this;
    if (this.canvas.width !== frame.width || this.canvas.height !== frame.height) {
      this.canvas.width = frame.width;
      this.canvas.height = frame.height;
    }
    gl.viewport(0, 0, frame.width, frame.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(p.program);

    const u = p.uniforms;
    const { spec } = p.character;
    const pose = frame.pose;
    const lift = pose.lift;
    gl.uniform2f(u.uResolution, frame.width, frame.height);
    gl.uniform1f(u.uTime, frame.time);
    gl.uniform4f(u.uCamera, spec.frame.target, spec.frame.radius / TAN_HALF_FOV, TAN_HALF_FOV, CAMERA_PITCH);
    gl.uniform4f(u.uBound, 0, spec.bound.y + lift, 0, spec.bound.radius);
    gl.uniformMatrix4fv(u.uBones, false, frame.bones);
    gl.uniform1f(u.uScaleFix, pose.minScale);
    gl.uniform4fv(u.uFaceA, pose.faceA);
    gl.uniform4fv(u.uFaceB, pose.faceB);
    gl.uniform4fv(u.uFaceC, pose.faceC);
    gl.uniform4fv(u.uFaceD, pose.faceD);
    gl.uniform3fv(u.uGlow, pose.glow);
    gl.uniform3fv(u.uShadow, frame.shadow);
    gl.uniform1f(u.uLift, lift);
    gl.uniform1f(u.uExposure, frame.exposure * pose.exposure);
    gl.uniform3fv(u.uAlbedo, frame.albedo);
    gl.uniform1f(u.uGlowPool, spec.glowPool ?? 0);
    gl.uniform4fv(u.uFxA, frame.fx.a);
    gl.uniform4fv(u.uFxB, frame.fx.b);
    gl.uniform4fv(u.uFxC, frame.fx.c);
    gl.uniform1i(u.uFxCount, frame.fx.count);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    for (const p of this.programs.values()) this.gl.deleteProgram(p.program);
    this.programs.clear();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private build(character: CompiledCharacter): Program {
    const { gl } = this;
    const shader = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const vs = shader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = shader(gl.FRAGMENT_SHADER, character.fragment);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(program);
      throw new Error(`${character.spec.id}: shader failed to build\n${log}`);
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    const uniforms = Object.fromEntries(
      (Object.keys(UNIFORMS) as UniformName[]).map((name) => [name, gl.getUniformLocation(program, UNIFORMS[name].includes('[') ? `${name}[0]` : name)]),
    ) as Program['uniforms'];
    return { program, uniforms, character };
  }
}
