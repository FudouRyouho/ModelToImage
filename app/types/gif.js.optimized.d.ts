declare module 'gif.js.optimized' {
  class GIF {
    setOptions(options: Record<string, unknown>): void;
    addFrame(frame: unknown, options: Record<string, unknown>): void;
    on(event: string, callback: (data: unknown) => void): void;
    render(): void;
  }
  export = GIF;
}
