import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadModels } from "~/store/modelsSlince";
import ModelsManager from "~/components/Layout/Model/ModelsManager";
import { RootState, AppDispatch } from "~/store/store";

export default function ModelsManagerRoute() {
  const dispatch = useDispatch<AppDispatch>();
  const models = useSelector((state: RootState) => state.models.models);
  const error = useSelector((state: RootState) => state.models.error);

  useEffect(() => {
    dispatch(loadModels());
  }, [dispatch]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <ModelsManager models={models} />;
}