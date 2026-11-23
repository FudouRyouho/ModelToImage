import { useRef, useState, useEffect, useCallback } from 'react';
import { SceneManager } from '~/utils/SceneManager';
import type { ModelInfo } from '~/types/models';
import type { customConfig } from '~/config/customConfig';
import { IMGGenerator } from '~/utils/GIFGenerator';

export const useScene = (
  model: ModelInfo,
  config: customConfig,
  isPreview: boolean,
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [isPreviewReady, setIsPreviewReady] = useState(false);

  useEffect(() => {
    const initializeScene = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsLoading(true);
      try {
        const sceneManager = new SceneManager(canvas, config, isPreview);
        await sceneManager.loadModel(model);

        const frame = await sceneManager.captureFrame();
        const gifGenerator = new IMGGenerator(config);
        const previewFrame = await gifGenerator.createPreview(frame);

        const previewUrl = URL.createObjectURL(previewFrame);
        setPreviewImg(previewUrl);

        setIsPreviewReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    void initializeScene();

    return () => {
      setPreviewImg(null);
      setIsPreviewReady(false);
    };
  }, [model, config]);

  const capturePreview = useCallback(() => {
    return previewImg ? <img src={previewImg} alt="Preview" /> : null;
  }, [previewImg]);

  const canvasElement = (
    <canvas
      ref={canvasRef}
      width={config.output.width}
      height={config.output.height}
    />
  );

  return {
    canvasElement,
    capturePreview,
    isLoading,
    error,
    isPreviewReady,
    previewImg,
  };
};
