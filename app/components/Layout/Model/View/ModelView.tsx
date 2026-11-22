import React, { useEffect } from "react";
import { useScene } from "../Utils/useScene";
import type { ModelInfo } from "~/types/models";
import type { customConfig } from "~/config/customConfig";

interface IProps {
  model: ModelInfo;
  config: customConfig;
  onRenderComplete?: () => void;
  onError?: (error: Error) => void;
  isPreview?: boolean;
  buttons?: React.ReactNode;
}

const ModelView: React.FC<IProps> = ({
  model,
  config,
  onRenderComplete,
  isPreview = false,
  buttons = null,
}) => {
  const { canvasElement, capturePreview, isLoading, error, isPreviewReady } =
    useScene(model, config, isPreview);

  useEffect(() => {
    if (isPreview && isPreviewReady) {
      onRenderComplete?.();
    }
  }, [isPreview, isPreviewReady, onRenderComplete]);

  return (
    <div className="relative flex justify-center w-full h-full border border-red-500">
      {buttons && buttons}
      {isPreview
        ? isPreviewReady
          ? capturePreview()
          : canvasElement
        : canvasElement}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 w-full">
          <p className="text-white">Loading model...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ModelView;
