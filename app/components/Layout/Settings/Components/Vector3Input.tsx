import { Input } from '@headlessui/react';
import { RotateCcw } from 'lucide-react';
import type React from 'react';
import useNotification from '../../Notifications/Utils/useNotification';
import type { NotificationType } from '~/store/NotificationsSlice';
import { useDispatch } from 'react-redux';
import { resetOption } from '~/store/configSlince';
import UIButtons from '../../UI/UI-Button';
interface IProps {
  label: string;
  value: { x: number; y: number; z: number };
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
  path: string;
  className?: string;
  notifyOnReset?: {
    type: NotificationType;
    message: string;
  };
}

const Vector3Input: React.FC<IProps> = ({
  label,
  value,
  onChange,
  path,
  className = '',
  notifyOnReset,
}) => {
  const dispatch = useDispatch();

  const handleAddNotification = useNotification();
  const handleReset = () => {
    dispatch(resetOption({ path: path }));
    if (notifyOnReset) {
      handleAddNotification(notifyOnReset.type, notifyOnReset.message);
    }
  };
  const handleResetAxis = (axis: 'x' | 'y' | 'z') => {
    dispatch(resetOption({ path: `${path}.${axis}` }));
    if (notifyOnReset) {
      handleAddNotification(notifyOnReset.type, notifyOnReset.message);
    }
  };
  return (
    <div className={`text-center space-y-2 ${className}`}>
      <label className="text-sm">{label}</label>
      <div className="grid grid-cols-1 gap-2">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="flex items-center justify-start gap-2">
            <label className="text-xs w-6">{axis.toUpperCase()}</label>
            <Input
              type="number"
              value={value[axis]}
              onChange={(e) => onChange(axis, Number(e.target.value))}
              className="w-24 bg-zinc-800 data-[hover]:bg-white/15 border border-white/5 data-[hover]:border-indigo-500 data-[hover]:ring-indigo-500/20 data-[focus]:border-indigo-300 outline-none p-2 rounded transition-all duration-300 ease-in-out"
            />
            <UIButtons
              variant="secondary"
              onClick={() => handleResetAxis(axis)}
              icon={RotateCcw}
            />
          </div>
        ))}
      </div>
      <UIButtons
        className="w-full flex flex-auto justify-center"
        variant="secondary"
        icon={RotateCcw}
        onClick={handleReset}
      />
    </div>
  );
};

export default Vector3Input;
