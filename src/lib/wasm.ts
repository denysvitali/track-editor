import type { JsActivityStats, JsTrackpoint } from '../types/tcx';

// Dynamic import for WASM module
let wasmModule: typeof import('../../pkg/tcx_parser') | null = null;
let initPromise: Promise<typeof import('../../pkg/tcx_parser')> | null = null;

export async function initWasm(): Promise<typeof import('../../pkg/tcx_parser')> {
  if (wasmModule) {
    return wasmModule;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const module = await import('../../pkg/tcx_parser');
    await module.default();
    wasmModule = module;
    return module;
  })();

  return initPromise;
}

export class TcxEditorWrapper {
  private editor: import('../../pkg/tcx_parser').TcxEditor;
  private originalContent: string;

  private constructor(
    editor: import('../../pkg/tcx_parser').TcxEditor,
    content: string
  ) {
    this.editor = editor;
    this.originalContent = content;
  }

  static async fromContent(content: string): Promise<TcxEditorWrapper> {
    const wasm = await initWasm();
    const editor = new wasm.TcxEditor(content);
    return new TcxEditorWrapper(editor, content);
  }

  getTrackpoints(): JsTrackpoint[] {
    return this.editor.getTrackpoints() as JsTrackpoint[];
  }

  getStats(): JsActivityStats {
    return this.editor.getStats() as JsActivityStats;
  }

  getTrackpointCount(): number {
    return this.editor.getTrackpointCount();
  }

  trimByIndices(startIdx: number, endIdx: number): void {
    this.editor.trimByIndices(startIdx, endIdx);
  }

  toXml(): string {
    return this.editor.toXml();
  }

  reset(): void {
    this.editor.reset();
  }

  getOriginalContent(): string {
    return this.originalContent;
  }
}
