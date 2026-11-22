import type { ColorRepresentation } from "three";
export interface customConfig {

  camera: {
    fov: number;
    position: { x: number; y: number; z: number };
    aspect: number;
  };
  scene: {
    background: ColorRepresentation;
    fog: {
      color: ColorRepresentation;
      near: number;
      far: number;
      density?: number;
    };
    orbitControls: {
      enableRotate: boolean;
      enableZoom: boolean;
      enablePan: boolean;
      autoRotate: boolean;
      autoRotateSpeed: number;
      minDistance: number;
      maxDistance: number;
      minPolarAngle: number;
      maxPolarAngle: number;
      minAzimuthAngle: number;
      maxAzimuthAngle: number;
      dampingFactor: number;
      zoomSpeed: number;
      rotateSpeed: number;
      panSpeed: number;
    };
  };

  lighting: {
    ambient: {
      color: ColorRepresentation;
      intensity: number;
    };
    directional: {
      color: ColorRepresentation;
      intensity: number;
      position: { x: number; y: number; z: number };
    };
  };

  animation: {
    totalFrames: number;
    fps: number;
    rotationAxis: "x" | "y" | "z";
    autoRotate: boolean;
  };

  model: {
    scale: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
    defaultSize: number;
  };

  output: {
    width: number;
    height: number;
    format: "gif" | "png";
    quality: number;
    backgroundColor: number;
  };
  preview: {
    width: number;
    height: number;
    quality: number;
    backgroundColor: number;
  }
  debug: "none" | "normal" | "complete";
}

export const defaultConfig: customConfig = {
  camera: {
    fov: 75,
    position: { x: 0, y: 45, z: 0 },
    aspect: 1000,
  },
  scene: {
    background: 0x112233,
    fog: {
      color: 0xcccccc,
      near: 50,
      far: 15,
    },
    orbitControls: {
      enableRotate: true,
      enableZoom: true,
      enablePan: true,
      autoRotate: true,
      autoRotateSpeed: 2,
      minDistance: 2,
      maxDistance: 10,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
      dampingFactor: 0.05,
      zoomSpeed: 1.0,
      rotateSpeed: 1.0,
      panSpeed: 1,
    }
  },
  lighting: {
    ambient: {
      color: 0xffffff,
      intensity: 1,
    },
    directional: {
      color: 0xffffff,
      intensity: 1,
      position: { x: 5, y: 5, z: 5 },
    },
  },
  animation: {
    totalFrames: 90,
    fps: 30,
    rotationAxis: "y",
    autoRotate: true,
  },
  model: {
    scale: { x: 1, y: 1, z: 1 },
    position: { x: 0, y: 0, z: 0 },
    defaultSize: 1,
  },
  output: {
    width: 512,
    height: 512,
    format: "gif",
    quality: 10,
    backgroundColor: 0x000000,
  },
  preview: {
    width: 128,
    height: 128,
    quality: 10,
    backgroundColor: 0x000000,
  },
  debug: "none",
};
