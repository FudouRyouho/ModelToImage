// utils/modelScanner.ts
import type { ModelInfo } from '~/types/models';

export async function scanModels(): Promise<ModelInfo[]> {
  try {
    const response = await fetch('/models');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const models = (await response.json()) as ModelInfo[];
    return models;
  } catch (error) {
    console.error('Error scanning models:', error);
    return [];
  }
}
