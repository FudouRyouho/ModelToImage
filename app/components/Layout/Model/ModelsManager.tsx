import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectConfig } from "~/store/configSlince";
import type { ModelInfo } from "~/types/models";
import ModelView from "./View/ModelView";
import { Button, Input, Transition } from "@headlessui/react";
import { EyeClosed, ScanEye, Square, SquareCheck, View } from "lucide-react";
import { RootState } from "~/store/store";

import {
  setSearchTerm,
  addModelToConvert,
  removeModelToConvert,
} from "~/store/modelsSlince";
import UIInput from "../UI/UI-Input";
import UIButtons from "../UI/UI-Button";

interface IProps {
  models: ModelInfo[];
}

const ModelsManager: React.FC<IProps> = ({ models }) => {
  const dispatch = useDispatch();
  const [viewModel, setViewModel] = useState<ModelInfo | null>(null);
  const searchTerm = useSelector((state: RootState) => state.models.searchTerm);
  const config = useSelector(selectConfig);
  const filteredModels = useSelector(
    (state: RootState) => state.models.filteredModels
  );
  const selectedModels = useSelector(
    (state: RootState) => state.models.selectedModels
  );

  const toggleModelSelection = (modelName: string) => {
    if (selectedModels.includes(modelName)) {
      dispatch(removeModelToConvert(modelName));
    } else {
      dispatch(addModelToConvert(modelName));
    }
  };
  const handleSearchChange = (value: string) => {
    dispatch(setSearchTerm(value));
  };

  const modelNames = filteredModels.map((model) => model.name);

  return (
    <div className="p-8 flex flex-col gap-4">
      <UIInput
        label="Search model..."
        options={modelNames}
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <div className="w-[90%] h-[1px] bg-white/15 self-center" />
      <div className="flex flex-row">
        <div className="flex flex-row flex-wrap gap-2">
          {models.length > 0 ? (
            models.map((model) => {
              const isFiltered = filteredModels.some(
                (filteredModel) => filteredModel.name === model.name
              );

              return (
                <div
                  key={model.name}
                  className={`flex flex-col border rounded-lg border-white/5 p-2 ${
                    isFiltered ? "" : "hidden"
                  }`}
                >
                  <p className="text-center w-">{model.name}</p>
                  <span className="w-full h-[1px] bg-white/15 mt-1" />
                  <ModelView
                    model={model}
                    config={config}
                    buttons={
                      <div className="absolute flex flex-col">
                        <Button className='self-end opacity-0 data-[hover]:opacity-100 p-2 w-max' >
                          <ScanEye className="size-4" />
                        </Button>

                      </div>
                    }
                    isPreview
                  />
                  <div className="flex flex-row border border-white/5 rounded-lg p-1 gap-1">
                    <Button
                      className="group bg-white/5 hover:bg-white/15 active:bg-white/10 focus:ring-2 focus:ring-indigo-300 focus:outline-none text-white hover:text-indigo-300 px-2 py-2 rounded transition-all duration-200 ease-in-out"
                      onClick={() => setViewModel(model)}
                    >
                      <View />
                    </Button>
                    <Button
                      className="group bg-white/5 hover:bg-white/15 active:bg-white/10 focus:ring-2 focus:ring-indigo-300 focus:outline-none text-white hover:text-indigo-300 px-2 py-2 rounded transition-all duration-200 ease-in-out"
                      onClick={() => toggleModelSelection(model.name)}
                    >
                      {selectedModels.includes(model.name) ? (
                        <SquareCheck />
                      ) : (
                        <Square />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>
              No models found. Please add some models to the assets/models
              directory.
            </p>
          )}
        </div>

        {viewModel && (
          <ModelView
            model={viewModel}
            config={config}
            buttons={
              <div className="absolute flex flex-col py-2">
                <UIButtons
                  variant="secondary"
                  icon={EyeClosed}
                  onClick={() => setViewModel(null)}
                />
              </div>
            }
          />
        )}
      </div>
    </div>
  );
};

export default ModelsManager;
