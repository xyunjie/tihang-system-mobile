declare module 'html-to-image' {
  export const toPng: (node: HTMLElement, options?: any) => Promise<string>
  export const toJpeg: (node: HTMLElement, options?: any) => Promise<string>
  export const toSvg: (node: HTMLElement, options?: any) => Promise<string>
}
