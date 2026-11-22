import React from "react";
import { Button } from "@headlessui/react";
import { Camera, Monitor, Sun, Play, Box, Download, Image } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  resetOption,
  selectConfig,
  updateCameraPosition,
  updateCameraFov,
  updateCameraAspect,
  updateSceneBackground,
  updateSceneFog,
  updateAmbientLight,
  updateDirectionalLight,
  updateAnimation,
  updateModelScale,
  updateModelPosition,
  updateModelSize,
  updateOutput,
  updateDebug,
  updatePreview,
} from "~/store/configSlince";
import type { RootState } from "~/store/store";
import { Color } from "three";
import NumberInput from "./Components/NumberInput";
import ColorInput from "./Components/ColorInput";
import Vector3Input from "./Components/Vector3Input";
import SettingsCard from "./Components/Settings-card";
import Masonry from "react-masonry-css";
import SelectMenu from "./Components/SelectMenu";

interface IProps {}

const Settings: React.FC<IProps> = ({}) => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => selectConfig(state));

  const breakpointColumns = {
    default: 5,
    840: 1,
    1140: 2,
    1440: 3,
    1740: 4,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="flex flex-auto w-max gap-4 p-8"
      columnClassName=""
    >
      {/* Camera Settings */}
      <SettingsCard label="Camera" Icon={Camera}>
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <NumberInput
          label="FOV"
          value={config.camera.fov}
          onChange={(value) => dispatch(updateCameraFov(value))}
          onReset={() => dispatch(resetOption({ path: "camera.fov" }))}
          min={1}
          max={180}
          notifyOnReset={{
            type: "success",
            message: "Camera FOV has been reset to default value",
          }}
        />

        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <Vector3Input
          label="Position"
          value={config.camera.position}
          onChange={(axis, value) =>
            dispatch(updateCameraPosition({ [axis]: value }))
          }
          path="camera.position"
        />
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <NumberInput
          label="Aspect"
          value={config.camera.aspect}
          onChange={(value) => dispatch(updateCameraAspect(value))}
          onReset={() => dispatch(resetOption({ path: "camera.aspect" }))}
          min={0.1}
          notifyOnReset={{
            type: "success",
            message: "Camera aspect has been reset to default value",
          }}
        />
      </SettingsCard>
      {/* Scene Settings */}
      <SettingsCard label="Scene" Icon={Monitor}>
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <ColorInput
          label="Background"
          value={config.scene.background}
          onChange={(color) => dispatch(updateSceneBackground(color))}
          onReset={() => dispatch(resetOption({ path: "scene.background" }))}
          notifyOnReset={{
            type: "success",
            message: "Scene background color has been reset to default value",
          }}
        />
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <NumberInput
          label="Fog Density"
          value={config.scene.fog?.density || 0}
          onChange={(value) =>
            dispatch(updateSceneFog({ ...config.scene.fog, density: value }))
          }
          onReset={() => dispatch(resetOption({ path: "scene.fog" }))}
          min={0}
          max={1}
          step={0.01}
          notifyOnReset={{
            type: "success",
            message: "Scene fog has been reset to default value",
          }}
        />
      </SettingsCard>
      {/* Lighting Settings */}
      <SettingsCard label="Lighting" Icon={Sun}>
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Ambient Light</h4>
          <ColorInput
            label="Color"
            value={config.lighting.ambient.color}
            onChange={(color) => dispatch(updateAmbientLight({ color }))}
            onReset={() =>
              dispatch(resetOption({ path: "lighting.ambient.color" }))
            }
            notifyOnReset={{
              type: "success",
              message:
                "Ambiental Lighting color has been reset to default value",
            }}
          />
          <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
          <NumberInput
            label="Intensity"
            value={config.lighting.ambient.intensity}
            onChange={(value) =>
              dispatch(updateAmbientLight({ intensity: value }))
            }
            onReset={() =>
              dispatch(resetOption({ path: "lighting.ambient.intensity" }))
            }
            min={0}
            max={10}
            step={0.1}
            notifyOnReset={{
              type: "success",
              message:
                "Ambient lighting Intensity has been reset to default value",
            }}
          />
          <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Directional Light</h4>
          <ColorInput
            label="Color"
            value={config.lighting.directional.color}
            onChange={(color) => dispatch(updateDirectionalLight({ color }))}
            onReset={() =>
              dispatch(resetOption({ path: "lighting.directional.color" }))
            }
            notifyOnReset={{
              type: "success",
              message:
                "Directional Lighting color has been reset to default value",
            }}
          />
          <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
          <NumberInput
            label="Intensity"
            value={config.lighting.directional.intensity}
            onChange={(value) =>
              dispatch(updateDirectionalLight({ intensity: value }))
            }
            onReset={() =>
              dispatch(resetOption({ path: "lighting.directional.intensity" }))
            }
            min={0}
            max={10}
            step={0.1}
            notifyOnReset={{
              type: "success",
              message:
                "Direcional lighting intensity has been reset to default value",
            }}
          />
          <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
          <Vector3Input
            label="Position"
            value={config.lighting.directional.position}
            onChange={(axis, value) =>
              dispatch(updateDirectionalLight({ position: { [axis]: value } }))
            }
            path="lighting.directional.position"
          />
        </div>
      </SettingsCard>
      {/* Animation Settings */}
      <SettingsCard label="Animation" Icon={Play}>
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <NumberInput
          label="Total Frames"
          value={config.animation.totalFrames}
          onChange={(value) =>
            dispatch(updateAnimation({ totalFrames: value }))
          }
          onReset={() =>
            dispatch(resetOption({ path: "animation.totalFrames" }))
          }
          min={1}
          notifyOnReset={{
            type: "success",
            message: "Animation Frames has been reset to default value",
          }}
        />
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />

        <NumberInput
          label="FPS"
          value={config.animation.fps}
          onChange={(value) => dispatch(updateAnimation({ fps: value }))}
          onReset={() => dispatch(resetOption({ path: "animation.fps" }))}
          min={1}
          notifyOnReset={{
            type: "success",
            message: "Animation FPS has been reset to default value",
          }}
        />
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />

        <div className="space-y-2">
          <SelectMenu
            label="Rotation Axis"
            options={["x", "y", "z"]}
            value={config.animation.rotationAxis}
            onChange={(newValue) =>
              dispatch(
                updateAnimation({
                  rotationAxis: newValue,
                })
              )
            }
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Auto Rotate</h4>
          <input
            type="checkbox"
            checked={config.animation.autoRotate}
            onChange={() =>
              dispatch(
                updateAnimation({
                  autoRotate: !config.animation.autoRotate,
                })
              )
            }
            className="h-4 w-4"
          />
        </div>
      </SettingsCard>
      {/* Model Settings */}
      <SettingsCard label="Model" Icon={Box}>
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <Vector3Input
          label="Scale"
          value={config.model.scale}
          onChange={(axis, value) =>
            dispatch(updateModelScale({ [axis]: value }))
          }
          path="model.scale"
        />
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />

        <Vector3Input
          label="Position"
          value={config.model.position}
          onChange={(axis, value) =>
            dispatch(updateModelPosition({ [axis]: value }))
          }
          path="model.position"
        />
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />

        <NumberInput
          label="Default Size"
          value={config.model.defaultSize}
          onChange={(value) => dispatch(updateModelSize(value))}
          onReset={() => dispatch(resetOption({ path: "model.defaultSize" }))}
          min={1}
          notifyOnReset={{
            type: "success",
            message: "Model default size has been reset to default value",
          }}
        />
      </SettingsCard>
      {/* Output Settings */}
      <SettingsCard label="Output" Icon={Download}>
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <NumberInput
          label="Width"
          value={config.output.width}
          onChange={(value) => dispatch(updateOutput({ width: value }))}
          onReset={() => dispatch(resetOption({ path: "output.width" }))}
          min={1}
          notifyOnReset={{
            type: "success",
            message: "Output width has been reset to default value",
          }}
        />
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />

        <NumberInput
          label="Height"
          value={config.output.height}
          onChange={(value) => dispatch(updateOutput({ height: value }))}
          onReset={() => dispatch(resetOption({ path: "output.height" }))}
          min={1}
          notifyOnReset={{
            type: "success",
            message: "Output Height has been reset to default value",
          }}
        />
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />

        <div className="space-y-2">
          <SelectMenu
            label="Format"
            options={["gif", "png"]}
            value={config.output.format}
            onChange={(newValue) =>
              dispatch(
                updateOutput({
                  format: newValue,
                })
              )
            }
          />
        </div>
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />

        <NumberInput
          label="Quality"
          value={config.output.quality}
          onChange={(value) => dispatch(updateOutput({ quality: value }))}
          onReset={() => dispatch(resetOption({ path: "output.quality" }))}
          min={1}
          max={100}
          notifyOnReset={{
            type: "success",
            message: "Output quality has been reset to default value",
          }}
        />
      </SettingsCard>
      {/* Preview Settings */}
      <SettingsCard label="Preview" Icon={Image}>
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <NumberInput
          label="Width"
          value={config.preview.width}
          onChange={(value) => dispatch(updatePreview({ width: value }))}
          onReset={() => dispatch(resetOption({ path: "preview.width" }))}
          min={1}
          notifyOnReset={{
            type: "success",
            message: "Preview width has been reset to default value",
          }}
        />
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <NumberInput
          label="Height"
          value={config.preview.height}
          onChange={(value) => dispatch(updatePreview({ height: value }))}
          onReset={() => dispatch(resetOption({ path: "preview.height" }))}
          min={1}
          notifyOnReset={{
            type: "success",
            message: "Preview Height has been reset to default value",
          }}
        />
        <div className="w-[80%] h-[1px] bg-white/10 my-2 mx-4" />
        <NumberInput
          label="Quality"
          value={config.preview.quality}
          onChange={(value) => dispatch(updatePreview({ quality: value }))}
          onReset={() => dispatch(resetOption({ path: "preview.quality" }))}
          min={1}
          max={100}
          notifyOnReset={{
            type: "success",
            message: "Output quality has been reset to default value",
          }}
        />
      </SettingsCard>
    </Masonry>
  );
};

export default Settings;
