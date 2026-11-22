import GIF from "gif.js";
import Worker from "gif.js/dist/gif.worker.js?url";
import { customConfig } from "~/config/customConfig";

type GIFEncoder = InstanceType<typeof GIF> & {
  on(event: "error", listener: (error: unknown) => void): InstanceType<typeof GIF>;
};

export class IMGGenerator {
  private img: GIFEncoder;
  private config: customConfig;
  

  constructor(config: customConfig) {
    this.config = config;
    this.img = new GIF({
      workers: 2,
      quality: config.output.quality,
      width: config.output.width,
      height: config.output.height,
      transparent: "true",
      workerScript: Worker,
    }) as GIFEncoder;
  }

  async createGIF(frames: string[]): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (this.config.debug === 'normal'){
       console.log("Starting GIF creation...");}


      let framesAdded = 0;


      frames.forEach((frame, index) => {
        const img = new Image();
        img.src = frame;

        img.onload = () => {
          //console.log(`Frame ${index + 1} loaded and added to GIF.`);
          this.img.addFrame(img, { delay: 1000 / this.config.animation.fps });


          framesAdded++;
          if (framesAdded === frames.length) {
            if (this.config.debug === 'normal')
            {console.log("All frames added, starting render...");}
            this.img.render();
          }
        };

        img.onerror = (err) => {
          console.error(`Error loading frame ${index + 1}:`, err);
          reject(err);
        };
      });

      this.img.on("finished", (blob: Blob) => {
        if (this.config.debug === 'normal')
        {console.log("GIF creation finished.");}
        resolve(blob);
      });

      this.img.on("error", (error: unknown) => {
        console.error("Error during GIF creation:", error);
        reject(error);
      });
    });
  }

  async createPNG(frame: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (this.config.debug === 'normal')
      {console.log("Creating PNG...");}

      const img = new Image();
      img.src = frame;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              if (this.config.debug === 'normal')
              {console.log("PNG creation finished.");}
              resolve(blob);
            } else {
              reject(new Error("Failed to convert to PNG"));
            }
          }, "image/png");
        } else {
          reject(new Error("Failed to get canvas context"));
        }
      };

      img.onerror = (err) => {
        console.error("Error creating PNG:", err);
        reject(err);
      };
    });
  }
  async createPreview(frame: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (this.config.debug === 'normal')
      {console.log("Creating PNG...");}

      const img = new Image();
      img.src = frame;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (ctx) {
          canvas.width = this.config.preview.width;
          canvas.height = this.config.preview.height;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              if (this.config.debug === 'normal')
              {console.log("PNG creation finished.");}
              resolve(blob);
            } else {
              reject(new Error("Failed to convert to PNG"));
            }
          }, "image/png");
        } else {
          reject(new Error("Failed to get canvas context"));
        }
      };

      img.onerror = (err) => {
        console.error("Error creating PNG:", err);
        reject(err);
      };
    });
  }
  
}
