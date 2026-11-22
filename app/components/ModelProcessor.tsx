import { useEffect, useRef, useState, useCallback } from "react";
import { SceneManager } from "~/utils/SceneManager";
import { renderModelJob } from "~/utils/renderModelJob";
import { useSelector } from "react-redux";
import type { ModelInfo } from "../types/models";
import JSZip from "jszip";
import * as FileSaver from "file-saver";
import { selectConfig } from "~/store/configSlince";
import useStatus, { ProcessingStatus } from "./Layout/Model/Utils/useStatus";

interface ModelProcessorProps {
  models: ModelInfo[];
  onComplete?: (results: { model: ModelInfo; gifUrl: string }[]) => void;
  onError?: (error: Error, model: ModelInfo) => void;
  onProgress?: (status: ProcessingStatus) => void;
}

export function ModelProcessor({
  models,
  onComplete,
  onError,
  onProgress,
}: ModelProcessorProps) {
  const config = useSelector(selectConfig)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const processingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(false);

  
  const {status, setStatus} = useStatus()

  const [results, setResults] = useState<{
    model: ModelInfo;
    gifUrl: string;
    pngUrl: string;
  }[]>([]);

  const [gifListOpen, setGifListOpen] = useState(false);
  const [pngListOpen, setPngListOpen] = useState(false);

  const handleDownload = (modelName: string, type: "gif" | "png") => {
    setResults((prev) =>
      prev.map((result) => {
        if (result.model.name === modelName) {
          if (type === "gif") {
            return { ...result, gifUrl: "" };
          } else if (type === "png") {
            return { ...result, pngUrl: "" };
          }
        }
        return result;
      })
    );
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const { saveAs } = FileSaver;

    const downloadPromises = results.map(({ model, gifUrl, pngUrl }) => {
      const folder = zip.folder(model?.name);

      const gifPromise = gifUrl
        ? fetch(gifUrl)
            .then((response) => response.blob())
            .then((gifBlob) => {
              folder?.file(`${model.name}.gif`, gifBlob);
            })
        : Promise.resolve();

      const pngPromise = pngUrl
        ? fetch(pngUrl)
            .then((response) => response.blob())
            .then((pngBlob) => {
              folder?.file(`${model.name}.png`, pngBlob);
            })
        : Promise.resolve();

      return Promise.all([gifPromise, pngPromise]);
    });

    try {
      await Promise.all(downloadPromises);

      const content = await zip.generateAsync({ type: "blob" });

      saveAs(content, "models.zip");
    } catch (error) {
      console.error("Error downloading ZIP:", error);
    }
  };

  const processModel = useCallback(
    (model: ModelInfo, index: number, sceneManager: SceneManager) =>
      renderModelJob(model, sceneManager, config, {
        isActive: () => mountedRef.current,
        onProgress: (stage) => {
          setStatus((prev) => ({
            ...prev,
            ...(stage === "loading"
              ? { current: index, currentModel: model.name }
              : {}),
            status: stage,
          }));
        },
      }),
    [config]
  );

  const processAllModels = useCallback(async () => {
    if (
      !canvasRef.current ||
      !models.length ||
      processingRef.current ||
      !mountedRef.current
    )
      return;

    processingRef.current = true;

    try {
      if (!sceneManagerRef.current) {
        sceneManagerRef.current = new SceneManager(canvasRef.current!, config, false);
      }

      setStatus({
        current: 0,
        total: models.length,
        currentModel: models[0].name,
        status: "loading",
      });

      const processedResults = [];

      for (let i = 0; i < models.length; i++) {
        if (!mountedRef.current) break;

        const result = await processModel(
          models[i],
          i,
          sceneManagerRef.current
        );

        if (result && mountedRef.current) {
          processedResults.push(result);
          setResults((prev) => [...prev, result]);

          onProgress?.({
            current: i + 1,
            total: models.length,
            currentModel: models[i].name,
            status: "idle",
          });
        }
      }

      if (mountedRef.current) {
        onComplete?.(processedResults);
      }
    } catch (error) {
      console.error("Error in batch processing:", error);
      if (mountedRef.current) {
        setStatus((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        }));

        if (error instanceof Error) {
          onError?.(error, models[status.current]);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [models, config, onComplete, onError, onProgress, processModel]);

  useEffect(() => {
    mountedRef.current = true;

    const timer = setTimeout(() => {
      processAllModels();
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);

      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
        sceneManagerRef.current = null;
      }
      results.forEach((result) => URL.revokeObjectURL(result.gifUrl));
    };
  }, [models, processAllModels]);

  return (
    <div className="">
      <canvas
        ref={canvasRef}
        className="border border-red-500"
        width={config.output.width}
        height={config.output.height}
      />

      {processingRef.current && (
        <div className="fixed bottom-4 left-4 bg-black/70 text-white p-4 rounded-lg space-y-2">
          <div className="font-medium">Processing: {status.currentModel}</div>

          <div className="text-sm text-gray-300">
            {status.current + 1} of {status.total} models
          </div>

          <div className="text-sm text-gray-300">
            Status: {status.status}
            {status.error && (
              <span className="text-red-400 ml-2">{status.error}</span>
            )}
          </div>

          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${(status.current / status.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {results.length > 0 && !processingRef.current && (
        <div className="fixed top-4 right-4 bg-black/70 text-white p-4 rounded-lg">
          <h3 className="font-medium mb-2">Processed Models</h3>
          
          {/* GIF List Accordion */}
          <div>
            <button
              onClick={() => setGifListOpen((prev) => !prev)}
              className="text-white bg-gray-600 px-4 py-2 rounded-lg w-full text-left"
            >
              GIFs
            </button>
            {gifListOpen && (
              <ul className="space-y-2 mt-2">
                {results.map(({ model, gifUrl }) => (
                  gifUrl && (
                    <li key={model.name} className="flex items-center gap-2">
                      <span>{model.name}</span>
                      <a
                        href={gifUrl}
                        download={`${model.name}.gif`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                        onClick={() => handleDownload(model.name, "gif")}
                      >
                        Download GIF
                      </a>
                    </li>
                  )
                ))}
              </ul>
            )}
          </div>

          {/* PNG List Accordion */}
          <div className="mt-4">
            <button
              onClick={() => setPngListOpen((prev) => !prev)}
              className="text-white bg-gray-600 px-4 py-2 rounded-lg w-full text-left"
            >
              PNGs
            </button>
            {pngListOpen && (
              <ul className="space-y-2 mt-2">
                {results.map(({ model, pngUrl }) => (
                  pngUrl && (
                    <li key={model.name} className="flex items-center gap-2">
                      <span>{model.name}</span>
                      <a
                        href={pngUrl}
                        download={`${model.name}.png`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                        onClick={() => handleDownload(model.name, "png")}
                      >
                        Download PNG
                      </a>
                    </li>
                  )
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={handleDownloadZip}
            className="text-white bg-blue-500 px-4 py-2 rounded-lg mt-4"
          >
            Download All Models (ZIP)
          </button>
        </div>
      )}
    </div>
  );
}
