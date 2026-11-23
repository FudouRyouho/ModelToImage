import type { LoadingManager } from 'three';
import type { customConfig } from '~/config/customConfig';
import type { ModelInfo } from '../types/models';
import { IMGGenerator } from './GIFGenerator';
import type { SceneManager } from './SceneManager';

export type RenderModelJobStage =
  'generating' | 'loading' | 'rendering' | 'saving';

export interface RenderModelJobResult {
  model: ModelInfo;
  gifUrl: string;
  pngUrl: string;
}

export interface RenderModelJobOptions {
  onProgress?: (stage: RenderModelJobStage) => void;
  /** Creates a fresh isolated manager; caller keeps package URLs alive until job settles. */
  createLoadingManager?: (this: void) => LoadingManager;
  /** Checked before loading and before creating URLs; does not cancel in-flight work. */
  isActive?: () => boolean;
}

/**
 * Renders and encodes one model using the caller-owned scene and config.
 * The caller retains ownership of scene disposal and returned object URL cleanup.
 */
export async function renderModelJob(
  model: ModelInfo,
  sceneManager: SceneManager,
  config: customConfig,
  { onProgress, isActive, createLoadingManager }: RenderModelJobOptions = {},
): Promise<RenderModelJobResult | null> {
  if (isActive && !isActive()) return null;

  try {
    onProgress?.('loading');
    await sceneManager.loadModel(model, createLoadingManager);

    onProgress?.('rendering');
    const frames = await sceneManager.captureFrames();

    onProgress?.('generating');
    const gifGenerator = new IMGGenerator(config);
    const gifBlob = await gifGenerator.createGIF(frames);
    const pngBlob = await gifGenerator.createPNG(frames[1]!);

    if (isActive && !isActive()) return null;

    onProgress?.('saving');
    const gifUrl = URL.createObjectURL(gifBlob);
    const pngUrl = URL.createObjectURL(pngBlob);

    return { model, gifUrl, pngUrl };
  } catch (error) {
    console.error(`Error processing model ${model.name}:`, error);
    throw error;
  }
}
