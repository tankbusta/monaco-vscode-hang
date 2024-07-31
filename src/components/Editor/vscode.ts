import getFileServiceOverride, { createIndexedDBProviders } from "@codingame/monaco-vscode-files-service-override";
import type { IEditorOverrideServices } from "vscode/services";
import { initialize as initializeMonacoService } from "vscode/services";

import getThemeServiceOverride from "@codingame/monaco-vscode-theme-service-override";
import getTextmateServiceOverride from "@codingame/monaco-vscode-textmate-service-override";
import getModelServiceOverride from "@codingame/monaco-vscode-model-service-override";
import getLanguagesServiceOverride from "@codingame/monaco-vscode-languages-service-override";
import getExtensionServiceOverride from "@codingame/monaco-vscode-extensions-service-override";
import getConfigurationServiceOverride from "@codingame/monaco-vscode-configuration-service-override";
import getLanguageDetectionWorkerServiceOverride from "@codingame/monaco-vscode-language-detection-worker-service-override";
import getTaskServiceOverride from "@codingame/monaco-vscode-task-service-override"
import getExplorerServiceOverride from "@codingame/monaco-vscode-explorer-service-override"
import getDebugServiceOverride from "@codingame/monaco-vscode-debug-service-override"
import getStorageServiceOverride from "@codingame/monaco-vscode-storage-service-override"
import getSearchServiceOverride from "@codingame/monaco-vscode-search-service-override";
import getViewsServiceOverride from "@codingame/monaco-vscode-views-service-override";
import getStatusBarServiceOverride from "@codingame/monaco-vscode-view-status-bar-service-override"
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override"

import "@codingame/monaco-vscode-theme-defaults-default-extension";
import "@codingame/monaco-vscode-lua-default-extension";
import "@codingame/monaco-vscode-python-default-extension";
import "@codingame/monaco-vscode-yaml-default-extension";
import "@codingame/monaco-vscode-markdown-basics-default-extension";
import "@codingame/monaco-vscode-markdown-language-features-default-extension";

import { workerConfig } from './tools/extHostWorker'
import { Worker } from "./tools/crossOriginWorker"

import 'vscode/localExtensionHost'

export const userDataProvider = await createIndexedDBProviders();

// Workers
export type WorkerLoader = () => Worker;
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
  editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
  textMateWorker: () => new Worker(new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url), { type: 'module' }),
  languageDetectionWorkerService: () => new Worker(new URL('@codingame/monaco-vscode-language-detection-worker-service-override/worker', import.meta.url), { type: 'module' }),
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
  ...getKeybindingsServiceOverride(),
  ...getThemeServiceOverride(),
  ...getLanguagesServiceOverride(),
  ...getTextmateServiceOverride(),
  ...getViewsServiceOverride(),
  ...getFileServiceOverride(),
  ...getSearchServiceOverride(),
  ...getConfigurationServiceOverride(),
  ...getExplorerServiceOverride(),
  ...getDebugServiceOverride(),
  ...getStorageServiceOverride(),
  ...getLanguageDetectionWorkerServiceOverride(),
  ...getTaskServiceOverride(),
  ...getStatusBarServiceOverride(),
};

export const initVSCode = async () => {
  try {
    await initializeMonacoService(
      {
        ...commonServices,
      },
      undefined,
      {
        remoteAuthority: "localhost:8080",
      }
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
