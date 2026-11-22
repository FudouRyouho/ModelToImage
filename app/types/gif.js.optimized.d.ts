declare module 'gif.js.optimized' {
    class GIF {
      setOptions(options: any): void;
      addFrame(frame: any, options: any): void;
      on(event: string, callback: (data: any) => void): void;
      render(): void;
    }
    export = GIF;
  }
  