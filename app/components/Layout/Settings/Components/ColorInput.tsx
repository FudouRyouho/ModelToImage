import { Input } from "@headlessui/react";
import { RotateCcw } from "lucide-react";
import React from "react";
import * as THREE from "three";
import useNotification from "../../Notifications/Utils/useNotification";
import { NotificationType } from "~/store/NotificationsSlice";
import UIButtons from "../../UI/UI-Button";

interface IProps {
  label: string;
  value: THREE.ColorRepresentation;
  onChange: (color: THREE.Color) => void;
  onReset: () => void;
  className?: string;
  notifyOnReset?: {
    type: NotificationType
    message: string;
  };
}

const ColorInput: React.FC<IProps> = ({
  label,
  value,
  onChange,
  onReset,
  className = "",
  notifyOnReset,
}) => {
  const handleAddNotification = useNotification();

  const colorValue = value instanceof THREE.Color ? value : new THREE.Color(value);

  const handleReset = () => {
    onReset();
    if (notifyOnReset) {
      handleAddNotification(notifyOnReset.type, notifyOnReset.message);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm">{label}</label>
      <Input
        type="color"
        value={`#${colorValue.getHexString()}`}
        onChange={(e) => onChange(new THREE.Color(e.target.value))}
        className="w-24 bg-zinc-800 data-[hover]:bg-white/15 border border-white/5 data-[hover]:border-indigo-500 data-[hover]:ring-indigo-500/20 data-[focus]:border-indigo-300 outline-none p-[2px] rounded transition-all duration-300 ease-in-out"
      />
      <UIButtons variant="secondary" onClick={handleReset} icon={RotateCcw} />
    </div>
  );
};

export default ColorInput;
