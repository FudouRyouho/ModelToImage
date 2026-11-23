import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { customConfig } from '~/config/customConfig';
import { selectConfig } from '~/store/configSlince';
import { addNotification } from '~/store/NotificationsSlice';
import Settings from './Layout/Settings/Settings';
import { ModelProcessor } from './ModelProcessor';

export default function SingleModelWorkflow() {
  const dispatch = useDispatch();
  const config = useSelector(selectConfig);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<{
    id: number;
    file: File;
    config: customConfig;
  } | null>(null);
  const onSettled = useCallback(
    (error?: string) => {
      setBusy(false);
      dispatch(
        addNotification({
          type: error ? 'error' : 'success',
          message: error ?? 'PNG and GIF are ready to download.',
        }),
      );
    },
    [dispatch],
  );

  const start = () => {
    if (!file || busy) return;
    // The existing PNG encoder uses frame 2. Reject unusable settings before import.
    if (
      !Number.isSafeInteger(config.animation.totalFrames) ||
      config.animation.totalFrames < 2 ||
      !Number.isFinite(config.animation.fps) ||
      config.animation.fps <= 0 ||
      !Number.isSafeInteger(config.output.width) ||
      config.output.width < 1 ||
      !Number.isSafeInteger(config.output.height) ||
      config.output.height < 1
    ) {
      dispatch(
        addNotification({
          type: 'error',
          message:
            'Use at least 2 whole frames, positive FPS and positive whole output dimensions.',
        }),
      );
      return;
    }
    setBusy(true);
    setJob((previous) => ({ id: (previous?.id ?? 0) + 1, file, config }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ModelToImage</h1>
      <p>
        One local OBJ ZIP → PNG and animated GIF. Files are processed in your
        browser, not uploaded.
      </p>
      <p>
        Include exactly one OBJ, optionally one MTL and its PNG/JPEG/TGA
        textures. ZIP limit: 64 MiB, 128 entries, 64 MiB per entry, 128 MiB
        expanded.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="model-zip">Model ZIP</label>
        <input
          id="model-zip"
          type="file"
          accept=".zip,application/zip"
          disabled={busy}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setJob(null);
          }}
        />
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
          disabled={!file || busy}
          onClick={start}
        >
          {busy ? 'Processing…' : 'Generate PNG + GIF'}
        </button>
      </div>
      <p>
        Keep this tab open until processing finishes. Download both results
        before selecting another ZIP or starting again.
      </p>
      {job && (
        <ModelProcessor
          key={job.id}
          file={job.file}
          config={job.config}
          onSettled={onSettled}
        />
      )}
      <details>
        <summary className="cursor-pointer">Render settings</summary>
        <p>
          Settings apply to the next run. Every run generates both PNG and GIF.
        </p>
        <fieldset disabled={busy} className="min-w-0 overflow-x-auto">
          <Settings />
        </fieldset>
      </details>
    </div>
  );
}
