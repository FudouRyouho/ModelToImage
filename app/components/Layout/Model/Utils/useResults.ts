import { useState } from 'react';
import type { ModelInfo } from '~/types/models';

const useResults = () => {
  const [results, setResults] = useState<
    {
      model: ModelInfo;
      gifUrl: string;
      pngUrl: string;
    }[]
  >([]);

  return { results, setResults };
};

export default useResults;
