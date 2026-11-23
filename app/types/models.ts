export interface ModelInfo {
  name: string;
  objPath: string;
  mtlPath: string | null;
  texturePath?: string;
  metadata?: {
    author?: string;
    date?: string;
    description?: string;
  };
}
