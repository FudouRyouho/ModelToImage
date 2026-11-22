import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { ModelInfo } from "~/types/models";

interface IModelsState {
  models: ModelInfo[];
  selectedModels: string[];
  filteredModels: ModelInfo[];
  searchTerm: string;
  error: string | null;
}

const loadSelectedModels = (): string[] => {
  if (typeof localStorage === "undefined") return [];
  const saved = localStorage.getItem("selectedModels");
  return saved ? JSON.parse(saved) : [];
};

const saveSelectedModels = (selectedModels: string[]) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("selectedModels", JSON.stringify(selectedModels));
  }
};

const initialState: IModelsState = {
  models: [],
  selectedModels: loadSelectedModels(),
  filteredModels: [],
  searchTerm: "",
  error: null,
};

// Acción asíncrona para cargar los modelos
export const loadModels = createAsyncThunk("models/loadModels", async () => {
  const response = await fetch("/models");
  if (!response.ok) {
    throw new Error(`Failed to load models, status: ${response.status}`);
  }
  const data: ModelInfo[] = await response.json();
  return data;
});

const modelsSlice = createSlice({
  name: "models",
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.filteredModels = state.models.filter((model) =>
        model.name.toLowerCase().includes(action.payload.toLowerCase())
      );
    },
    addModelToConvert: (state, action: PayloadAction<string>) => {
      if (!state.selectedModels.includes(action.payload)) {
        state.selectedModels.push(action.payload);
        saveSelectedModels(state.selectedModels);
      }
    },
    removeModelToConvert: (state, action: PayloadAction<string>) => {
      state.selectedModels = state.selectedModels.filter(
        (name) => name !== action.payload
      );
      saveSelectedModels(state.selectedModels);
    },
    setModels: (state, action: PayloadAction<ModelInfo[]>) => {
      state.models = action.payload;
      state.filteredModels = action.payload;
    },
    addModel: (state, action: PayloadAction<ModelInfo>) => {
      state.models.push(action.payload);
    },
    removeModel: (state, action: PayloadAction<string>) => {
      state.models = state.models.filter(
        (model) => model.name !== action.payload
      );
      state.selectedModels = state.selectedModels.filter(
        (name) => name !== action.payload
      );
      saveSelectedModels(state.selectedModels);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadModels.fulfilled, (state, action) => {
        state.models = action.payload;
        state.filteredModels = action.payload;
        state.error = null;

        const modelNames = new Set(state.models.map((model) => model.name));
        state.selectedModels = state.selectedModels.filter((name) =>
          modelNames.has(name)
        );
        saveSelectedModels(state.selectedModels);
      })
      .addCase(loadModels.rejected, (state, action) => {
        state.error = action.error.message || "Failed to load models";
      });
  },
});

export const {
  addModelToConvert,
  removeModelToConvert,
  addModel,
  removeModel,
  setSearchTerm,
  setModels,
} = modelsSlice.actions;
export default modelsSlice.reducer;
