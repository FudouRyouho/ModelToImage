import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ModelInfo } from "~/types/models";
import { ModelProcessor } from "~/components/ModelProcessor";
import { AppDispatch, RootState } from "~/store/store";
import { loadModels } from "~/store/modelsSlince";

export default function Index() {
  // Obtener modelos y modelos seleccionados del estado global
  const dispatch = useDispatch<AppDispatch>();
  const models = useSelector((state: RootState) => state.models.models);
  const error = useSelector((state: RootState) => state.models.error);
  const selectedModels = useSelector((state: RootState) => state.models.selectedModels);

  // Estado para almacenar solo los modelos seleccionados
  const [filteredModels, setFilteredModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    dispatch(loadModels());
  }, [dispatch]);

  useEffect(() => {
    // Filtrar los modelos para incluir solo los seleccionados
    const selectedModelsData = models.filter((model) =>
      selectedModels.includes(model.name)
    );
    setFilteredModels(selectedModelsData);
  }, [models, selectedModels]);

  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <div>
      <h1>3D Model to GIF Converter</h1>
      {filteredModels.length > 0 ? (
      
        <ModelProcessor models={filteredModels} />
      ) : (<>

        <p>No models selected or found in the selected models list.</p></>
      )}
    </div>
  );
}
