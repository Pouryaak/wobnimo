/* Runs in a headless browser: draws every character's still with the
   real engine and hands back WebP data URLs. See posters.mjs. */
import { snapshot } from '@wobnimo/engine';
import { characters } from '@wobnimo/characters';
import { FACE_SIZE, posterOptions } from './_poster-spec';

const webp = (canvas: HTMLCanvasElement, quality: number) => canvas.toDataURL('image/webp', quality);

async function render(id: string) {
  const index = characters.findIndex((c) => c.id === id);
  const still = await snapshot(characters[index], posterOptions(index));
  const face = document.createElement('canvas');
  face.width = face.height = FACE_SIZE;
  const g = face.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(still, 0, 0, FACE_SIZE, FACE_SIZE);
  return { poster: webp(still, 0.86), face: webp(face, 0.9) };
}

Object.assign(window, { renderPoster: render });
