import * as THREE from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { customConfig } from "~/config/customConfig";
import type { ModelInfo } from "../types/models";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls | null = null;
  private currentObject: THREE.Object3D | null = null;
  private config: customConfig;
  private isDisposed: boolean = false;

  constructor(canvas: HTMLCanvasElement, config: customConfig, isPreview: boolean) {
    this.config = config;
    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();
    this.renderer = this.setupRenderer(canvas, isPreview);

    this.setupLights();
    this.setupEnvironment();
  }

  private setupCamera(): THREE.PerspectiveCamera {
    const { fov, position } = this.config.camera;
    const camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(position.x, position.y, position.z);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    return camera;
  }

  private setupRenderer(canvas: HTMLCanvasElement, isPreview?: boolean): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });

    

    const { width, height, backgroundColor } = isPreview ? this.config.preview : this.config.output ;
    renderer.setSize(width, height);
    renderer.setClearColor(backgroundColor, 0);
    
    //renderer.shadowMap.enabled = true;
    //renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    return renderer;
  }

  private setupLights(): void {
    const { ambient, directional } = this.config.lighting;

    const ambientLight = new THREE.AmbientLight(
      ambient.color,
      ambient.intensity
    );
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(
      directional.color,
      directional.intensity
    );
    const { position } = directional;
    dirLight.position.set(position.x, position.y, position.z);

    //dirLight.castShadow = true;
    //dirLight.shadow.mapSize.width = 2048;
    //dirLight.shadow.mapSize.height = 2048;
    //dirLight.shadow.camera.near = 0.5;
    //dirLight.shadow.camera.far = 500;

    this.scene.add(dirLight);
  }

  private setupEnvironment(): void {
    if (this.config.scene?.background) {
      //this.scene.background = new THREE.Color(this.config.scene.background);
    }

    //if (this.config.scene?.fog) {
    //  this.scene.fog = new THREE.Fog(
    //    this.config.scene.fog.color,
    //    this.config.scene.fog.near,
    //    this.config.scene.fog.far
    //  );
    //}
  }
  updateControls(): void {
    if (this.controls && !this.isDisposed) {
      this.controls.update();
    }
  }
  render(): void {
    if (!this.isDisposed) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  async loadModel(modelInfo: ModelInfo): Promise<void> {
    if (this.isDisposed) {
      throw new Error("SceneManager has been disposed");
    }

    if (this.currentObject) {
      this.scene.remove(this.currentObject);
      this.currentObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.currentObject = null;
    }

    try {
      let object: THREE.Object3D;

      if (modelInfo.mtlPath) {
        const mtlLoader = new MTLLoader();
        const materials = await mtlLoader.loadAsync(modelInfo.mtlPath);
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        object = await objLoader.loadAsync(modelInfo.objPath);
      } else {
        const objLoader = new OBJLoader();
        object = await objLoader.loadAsync(modelInfo.objPath);
      }
      this.prepareModel(object);
      this.currentObject = object;
      this.scene.add(object);
    } catch (error) {
      console.error("Error loading model:", error);
      throw error;
    }
  }

  private prepareModel(object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    if (this.config.debug === "normal") {
      console.log("Model size:", size);
      console.log("Model center:", center);
    }
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = this.config.model.defaultSize / maxDim;

    object.scale.set(1, 1, 1);

    if (this.config.debug === "normal") {
      console.log("Applied scale factor:", scale);
    }

    object.position.sub(center.multiplyScalar(scale));
    this.adjustCamera(box);

    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.side = THREE.DoubleSide;
        //child.castShadow = true;
        //child.receiveShadow = true;
      }
    });
  }

  private adjustCamera(box: THREE.Box3): void {
    const { fov } = this.config.camera;

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fovInRadians = fov * (Math.PI / 180);
    const distance = Math.abs(maxDim / (2 * Math.tan(fovInRadians / 2)));

    const center = box.getCenter(new THREE.Vector3());
    this.camera.position.set(center.x, center.y, distance * 2);
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();
  }

  async captureFrames(): Promise<string[]> {
    if (!this.currentObject || this.isDisposed) {
      throw new Error("No model loaded or SceneManager has been disposed");
    }

    const frames: string[] = [];
    const { totalFrames, rotationAxis } = this.config.animation;

    for (let i = 0; i < totalFrames; i++) {
      const rotation = (i * Math.PI * 2) / totalFrames;

      switch (rotationAxis) {
        case "x":
          this.currentObject.rotation.x = rotation;
          break;
        case "y":
          this.currentObject.rotation.y = rotation;
          break;
        case "z":
          this.currentObject.rotation.z = rotation;
          break;
      }


      this.renderer.render(this.scene, this.camera);
      const frame = this.renderer.domElement.toDataURL("image/png");
      frames.push(frame);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return frames;
  }

  async captureFrame(): Promise<string> {
    if (!this.currentObject || this.isDisposed) {
      throw new Error("No model loaded or SceneManager has been disposed");
    }
  

    this.renderer.render(this.scene, this.camera);
    const frame = this.renderer.domElement.toDataURL("image/png");
  

    await new Promise((resolve) => setTimeout(resolve, 0));
  
    return frame;
  }

  dispose(): void {
    if (this.isDisposed) return;

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.scene.clear();

    this.isDisposed = true;
  }


  updateConfig(newConfig: Partial<customConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.camera) {
      this.updateCamera();
    }
    if (newConfig.lighting) {
      this.updateLights();
    }
    if (newConfig.output) {
      this.updateRenderer();
    }
  }

  private updateCamera(): void {
    const { fov, position, aspect } = this.config.camera;
    this.camera.fov = fov;
    this.camera.aspect = aspect;
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.updateProjectionMatrix();
  }

  private updateLights(): void {

    this.scene.children
      .filter((child) => child instanceof THREE.Light)
      .forEach((light) => this.scene.remove(light));


    this.setupLights();
  }

  private updateRenderer(): void {
    const { width, height, backgroundColor } = this.config.output;
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(backgroundColor, 0);
  }
}
