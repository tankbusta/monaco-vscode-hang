import { createIndexedDBProviders } from "@codingame/monaco-vscode-files-service-override";
import type { IEditorOverrideServices } from "vscode/services";
import { initialize as initializeMonacoService } from "vscode/services";
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override";
import getThemeServiceOverride from "@codingame/monaco-vscode-theme-service-override";
import getTextmateServiceOverride from "@codingame/monaco-vscode-textmate-service-override";
import getModelServiceOverride from "@codingame/monaco-vscode-model-service-override";
import getLanguageServiceOverride from "@codingame/monaco-vscode-languages-service-override";
import getExtensionServiceOverride from "@codingame/monaco-vscode-extensions-service-override";
import getLanguageDetectionServiceOverride from "@codingame/monaco-vscode-language-detection-worker-service-override"
import getEditorServiceOverride from "@codingame/monaco-vscode-editor-service-override"

import "@codingame/monaco-vscode-theme-defaults-default-extension";
import "@codingame/monaco-vscode-lua-default-extension";
import "@codingame/monaco-vscode-python-default-extension";
import "@codingame/monaco-vscode-yaml-default-extension";
import "@codingame/monaco-vscode-markdown-basics-default-extension";
import "@codingame/monaco-vscode-markdown-language-features-default-extension";

import { workerConfig } from './tools/extHostWorker'
import 'vscode/localExtensionHost'

export const userDataProvider = await createIndexedDBProviders();

// Workers
export type WorkerLoader = () => Worker;
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
  editorWorkerService: () =>
    new Worker(
      new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url),
      { type: "module" },
    ),
  textMateWorker: () =>
    new Worker(
      new URL(
        "@codingame/monaco-vscode-textmate-service-override/worker",
        import.meta.url,
      ),
      { type: "module" },
    ),
  yaml: () => {
    console.debug("Requesting yaml worker")
    return new Worker(new URL("./yaml.worker.js?worker", import.meta.url), {
      type: "module",
    });
  },
  // outputLinkComputer: () => new Worker(new URL('@codingame/monaco-vscode-output-service-override/worker', import.meta.url), { type: 'module' }),
  // localFileSearchWorker: () => new Worker(new URL('@codingame/monaco-vscode-search-service-override/worker', import.meta.url), { type: 'module' })
};

window.MonacoEnvironment = {
  getWorker: function (moduleId, label) {
    console.log(`getWorker called for ${label}`);
    const workerFactory = workerLoaders[label];
    if (workerFactory != null) {
      return workerFactory();
    }

    throw new Error(`Unimplemented worker ${label} (${moduleId})`);
  },
};


export const commonServices: IEditorOverrideServices = {
  ...getExtensionServiceOverride(workerConfig),
  ...getModelServiceOverride(),
  ...getLanguageServiceOverride(),
  ...getTextmateServiceOverride(),
  ...getThemeServiceOverride(),
  ...getKeybindingsServiceOverride(),
  ...getLanguageDetectionServiceOverride(),
  ...getEditorServiceOverride((model, input, sideBySide) => {
    console.log('NEW EDITOR CALLED', model, input, sideBySide)
  })
};

export const initVSCode = async () => {
  try {
    await initializeMonacoService(
      {
        ...commonServices,
      },
      document.body,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("already initialized")
    ) {
      throw error;
    }
  }
};
