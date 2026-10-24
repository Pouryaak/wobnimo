/* One WebGL2 context for every mascot on the page.

   Browsers allow a page only a handful of live WebGL contexts, and each
   one compiles its own copy of every shader. So mascots don't own a
   context: they share this one. A mascot draws into a corner of the
   shared drawing buffer and copies the result onto its own canvas, which
   stays an ordinary element in the page's layout. A character's shader is
   compiled once for the whole page, in the background where the browser
   supports it, and a page can hold as many mascots as it likes. */

import type { CompiledCharacter } from '../compiler/compile';
import { VERTEX_SHADER } from '../compiler/compile';
import { UNIFORMS, type UniformName } from '../compiler/uniforms';

export interface Program {
  program: WebGLProgram;
  uniforms: Record<UniformName, WebGLUniformLocation | null>;
  character: CompiledCharacter;
}

interface Building {
  building: WebGLProgram;
  fragment: WebGLShader;
  vertex: WebGLShader;
}

type Entry = Program | Building | 'failed';

/* without background compiling, build at most one shader every few frames,
   so a page full of new characters doesn't freeze while it loads. None is
   built before the page has painted once, so a build never holds up the
   first paint. */
const SYNC_BUILD_GAP_MS = 48;
/* the shared buffer grows in steps, so resizing mascots don't reallocate it every frame */
const BUFFER_STEP = 128;

let instance: Gpu | null = null;

export class Gpu {
  /** The page's shared context, created on first use. */
  static shared(): Gpu {
    return (instance ??= new Gpu());
  }

  readonly canvas = document.createElement('canvas');
  readonly gl: WebGL2RenderingContext;
  private readonly programs = new Map<CompiledCharacter, Entry>();
  private readonly parallel: { COMPLETION_STATUS_KHR: number } | null;
  private lastSyncBuild = Infinity;

  private constructor() {
    const gl = this.canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 is not available');
    this.gl = gl;
    this.parallel = gl.getExtension('KHR_parallel_shader_compile');
    /* a task queued from a frame callback runs once that frame is painted */
    if (!this.parallel) requestAnimationFrame(() => setTimeout(() => (this.lastSyncBuild = -Infinity)));
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);
    /* a lost context takes every program with it: rebuild them as they're asked for */
    this.canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
    this.canvas.addEventListener('webglcontextrestored', () => {
      this.programs.clear();
      gl.enable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
    });
  }

  /**
   * The character's program, or null while it is still being built. The
   * first call starts the build; call it again each frame until it's ready.
   */
  program(character: CompiledCharacter): Program | null {
    const entry = this.programs.get(character);
    if (entry === 'failed') return null;
    if (entry && 'program' in entry) return entry;
    if (!entry) {
      if (!this.parallel) {
        const now = performance.now();
        if (now - this.lastSyncBuild < SYNC_BUILD_GAP_MS) return null;
        this.lastSyncBuild = now;
      }
      const started = this.start(character);
      this.programs.set(character, started);
      return this.parallel ? null : this.finish(character, started);
    }
    if (this.parallel && !this.gl.getProgramParameter(entry.building, this.parallel.COMPLETION_STATUS_KHR)) return null;
    return this.finish(character, entry);
  }

  /** Grows the shared drawing buffer to hold at least `width` × `height` device pixels. */
  reserve(width: number, height: number) {
    const w = Math.ceil(width / BUFFER_STEP) * BUFFER_STEP;
    const h = Math.ceil(height / BUFFER_STEP) * BUFFER_STEP;
    if (w > this.canvas.width) this.canvas.width = w;
    if (h > this.canvas.height) this.canvas.height = h;
  }

  private start(character: CompiledCharacter): Building {
    const { gl } = this;
    const shader = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const vertex = shader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = shader(gl.FRAGMENT_SHADER, character.fragment);
    const building = gl.createProgram()!;
    gl.attachShader(building, vertex);
    gl.attachShader(building, fragment);
    gl.linkProgram(building);
    return { building, vertex, fragment };
  }

  private finish(character: CompiledCharacter, { building, vertex, fragment }: Building): Program {
    const { gl } = this;
    if (!gl.getProgramParameter(building, gl.LINK_STATUS)) {
      const log = gl.getShaderInfoLog(fragment) || gl.getProgramInfoLog(building);
      this.programs.set(character, 'failed');
      throw new Error(`${character.spec.id}: shader failed to build\n${log}`);
    }
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    const uniforms = Object.fromEntries(
      (Object.keys(UNIFORMS) as UniformName[]).map((name) => [name, gl.getUniformLocation(building, UNIFORMS[name].includes('[') ? `${name}[0]` : name)]),
    ) as Program['uniforms'];
    const program = { program: building, uniforms, character };
    this.programs.set(character, program);
    return program;
  }
}
