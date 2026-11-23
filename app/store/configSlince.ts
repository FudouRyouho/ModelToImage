import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { defaultConfig } from '~/config/customConfig';
import type { customConfig } from '~/config/customConfig';
import type { RootState } from './store';
import { Color } from 'three';
import type { ColorRepresentation } from 'three';

interface Vector3Update {
  x?: number;
  y?: number;
  z?: number;
}

interface LightingUpdate {
  color?: ColorRepresentation;
  intensity?: number;
  position?: Vector3Update;
}

type ConfigState = customConfig;

const loadConfigFromLocalStorage = (): ConfigState => {
  if (typeof localStorage === 'undefined') return defaultConfig;
  const saved = localStorage.getItem('appConfig');
  return saved ? (JSON.parse(saved) as ConfigState) : defaultConfig;
};

const saveConfigToLocalStorage = (config: ConfigState) => {
  localStorage.setItem('appConfig', JSON.stringify(config));
};

const saveConfig = (state: ConfigState) => {
  saveConfigToLocalStorage(state);
};

const configSlice = createSlice({
  name: 'config',
  initialState: loadConfigFromLocalStorage(),
  reducers: {
    updateConfig: (state, action: PayloadAction<Partial<ConfigState>>) => {
      const newState = { ...state, ...action.payload };
      saveConfig(newState);
    },
    resetConfig: (state) => {
      Object.assign(state, defaultConfig);
      saveConfig(state);
    },
    resetOption: (state, action: PayloadAction<{ path: string }>) => {
      const { path } = action.payload;
      const defaultValue = getNestedValue(defaultConfig, path);

      if (defaultValue !== undefined) {
        setNestedValue(state, path, defaultValue);
        saveConfig(state);
      }
    },
    updateCameraPosition: (state, action: PayloadAction<Vector3Update>) => {
      state.camera.position = { ...state.camera.position, ...action.payload };
      saveConfig(state);
    },
    updateCameraFov: (state, action: PayloadAction<number>) => {
      state.camera.fov = action.payload;
      saveConfig(state);
    },
    updateCameraAspect: (state, action: PayloadAction<number>) => {
      state.camera.aspect = action.payload;
      saveConfig(state);
    },
    updateSceneBackground: (
      state,
      action: PayloadAction<ColorRepresentation>,
    ) => {
      state.scene.background = action.payload;
      saveConfig(state);
    },
    updateSceneFog: (
      state,
      action: PayloadAction<customConfig['scene']['fog']>,
    ) => {
      state.scene.fog = action.payload;
      saveConfig(state);
    },
    updateAmbientLight: (state, action: PayloadAction<LightingUpdate>) => {
      if (action.payload.color)
        state.lighting.ambient.color = action.payload.color;
      if (action.payload.intensity !== undefined)
        state.lighting.ambient.intensity = action.payload.intensity;
      saveConfig(state);
    },
    updateDirectionalLight: (state, action: PayloadAction<LightingUpdate>) => {
      const { color, intensity, position } = action.payload;
      if (color) state.lighting.directional.color = color;
      if (intensity !== undefined)
        state.lighting.directional.intensity = intensity;
      if (position) {
        state.lighting.directional.position = {
          ...state.lighting.directional.position,
          ...position,
        };
      }
      saveConfig(state);
    },
    updateAnimation: (
      state,
      action: PayloadAction<Partial<customConfig['animation']>>,
    ) => {
      state.animation = { ...state.animation, ...action.payload };
      saveConfig(state);
    },
    updateModelScale: (state, action: PayloadAction<Vector3Update>) => {
      state.model.scale = { ...state.model.scale, ...action.payload };
      saveConfig(state);
    },
    updateModelPosition: (state, action: PayloadAction<Vector3Update>) => {
      state.model.position = { ...state.model.position, ...action.payload };
      saveConfig(state);
    },
    updateModelSize: (state, action: PayloadAction<number>) => {
      state.model.defaultSize = action.payload;
      saveConfig(state);
    },
    updateOutput: (
      state,
      action: PayloadAction<Partial<customConfig['output']>>,
    ) => {
      state.output = { ...state.output, ...action.payload };
      saveConfig(state);
    },
    updatePreview: (
      state,
      action: PayloadAction<Partial<customConfig['preview']>>,
    ) => {
      state.preview = { ...state.preview, ...action.payload };
      saveConfig(state);
    },
    updateDebug: (state, action: PayloadAction<customConfig['debug']>) => {
      state.debug = action.payload;
      saveConfig(state);
    },
  },
});

export const {
  updateConfig,
  resetConfig,
  resetOption,
  updateCameraPosition,
  updateCameraFov,
  updateCameraAspect,
  updateSceneBackground,
  updateSceneFog,
  updateAmbientLight,
  updateDirectionalLight,
  updateAnimation,
  updateModelScale,
  updateModelPosition,
  updateModelSize,
  updateOutput,
  updatePreview,
  updateDebug,
} = configSlice.actions;

export const selectConfig = (state: RootState): ConfigState => state.config;
export const selectCamera = (state: RootState) => state.config.camera;
export const selectScene = (state: RootState) => state.config.scene;
export const selectLighting = (state: RootState) => state.config.lighting;
export const selectAnimation = (state: RootState) => state.config.animation;
export const selectModel = (state: RootState) => state.config.model;
export const selectOutput = (state: RootState) => state.config.output;
export const selectPreview = (state: RootState) => state.config.preview;
export const selectDebug = (state: RootState) => state.config.debug;

export default configSlice.reducer;

type NestedConfigRecord = Record<string, unknown>;

const getNestedValue = (obj: ConfigState, path: string): unknown => {
  const value = path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as NestedConfigRecord)[part];
    }
    return undefined;
  }, obj);

  if (value instanceof Color) {
    return value.clone();
  }

  if (
    value &&
    typeof value === 'object' &&
    'x' in value &&
    'y' in value &&
    'z' in value
  ) {
    return { ...value };
  }

  return value;
};

const setNestedValue = (
  obj: ConfigState,
  path: string,
  value: unknown,
): ConfigState => {
  const parts = path.split('.');
  const lastPart = parts.pop()!;
  const target = parts.reduce<NestedConfigRecord>(
    (acc, part) => {
      if (!(part in acc)) acc[part] = {};
      return acc[part] as NestedConfigRecord;
    },
    obj as unknown as NestedConfigRecord,
  );

  if (value instanceof Color) {
    target[lastPart] = value.clone();
  } else if (
    value &&
    typeof value === 'object' &&
    'x' in value &&
    'y' in value &&
    'z' in value
  ) {
    target[lastPart] = { ...value };
  } else {
    target[lastPart] = value;
  }

  return obj;
};
