import { useState } from "react";
export interface ProcessingStatus {
  current: number;
  total: number;
  currentModel: string;
  status: "loading" | "rendering" | "generating" | "saving" | "error" | "idle";
  error?: string;
}
const useStatus = () => {
  const [status, setStatus] = useState<ProcessingStatus>({
    current: 0,
    total: 0,
    currentModel: "",
    status: "idle",
  });

  return { status, setStatus };
};

export default useStatus;
