import { useEffect, useRef, useState } from 'react';
import type { customConfig } from '~/config/customConfig';
import { importObjZip } from '~/utils/objZipImport';
import { SceneManager } from '~/utils/SceneManager';
import {
  renderModelJob,
  type RenderModelJobResult,
} from '~/utils/renderModelJob';

interface ModelProcessorProps {
  file: File;
  config: customConfig;
  onSettled: (error?: string) => void;
}

/** Owns one job and its URLs. In-flight work settles before package/scene disposal. */
export function ModelProcessor({
  file,
  config,
  onSettled,
}: ModelProcessorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState('importing');
  const [result, setResult] = useState<RenderModelJobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let ownedResult: RenderModelJobResult | null = null;
    const releaseResult = () => {
      if (!ownedResult) return;
      URL.revokeObjectURL(ownedResult.gifUrl);
      URL.revokeObjectURL(ownedResult.pngUrl);
      ownedResult = null;
    };
    const run = async () => {
      // Avoid starting abandoned work during StrictMode's setup/cleanup probe.
      await Promise.resolve();
      if (!active || !canvasRef.current) return;
      let imported: Awaited<ReturnType<typeof importObjZip>> | undefined;
      let scene: SceneManager | undefined;
      let failure: string | undefined;
      try {
        imported = await importObjZip(file);
        if (!active) return;
        scene = new SceneManager(canvasRef.current, config, false);
        ownedResult = await renderModelJob(imported.model, scene, config, {
          createLoadingManager: () => imported!.createLoadingManager(),
          isActive: () => active,
          onProgress: (next) => {
            if (active) setStage(next);
          },
        });
        if (active) {
          setResult(ownedResult);
          setStage('complete');
        } else releaseResult();
      } catch (cause) {
        failure =
          cause instanceof Error ? cause.message : 'Unable to process ZIP';
        if (active) {
          setError(failure);
          setStage('error');
        }
      } finally {
        scene?.dispose();
        imported?.dispose();
        if (active) onSettled(failure);
      }
    };
    void run();
    return () => {
      active = false;
      releaseResult();
      // The service cannot cancel encoding: do not dispose resources here.
    };
  }, [file, config, onSettled]);

  const name = result?.model.name.replace(/\.obj$/i, '') ?? 'model';
  return (
    <section className="space-y-4" aria-label="Render job">
      <p role="status">Status: {stage}</p>
      {error && (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      )}
      <canvas
        ref={canvasRef}
        width={config.output.width}
        height={config.output.height}
        className="max-w-full border border-white/10"
        aria-label="Model render"
      />
      {result && (
        <div className="flex flex-wrap gap-6">
          <figure>
            <img
              src={result.pngUrl}
              alt={`${name} PNG render`}
              className="max-w-full"
            />
            <figcaption>
              <a
                className="text-blue-400 underline"
                href={result.pngUrl}
                download={`${name}.png`}
              >
                Download PNG
              </a>
            </figcaption>
          </figure>
          <figure>
            <img
              src={result.gifUrl}
              alt={`${name} animated GIF render`}
              className="max-w-full"
            />
            <figcaption>
              <a
                className="text-blue-400 underline"
                href={result.gifUrl}
                download={`${name}.gif`}
              >
                Download GIF
              </a>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
