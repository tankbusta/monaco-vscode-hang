<template>
  <div class="h-dvh w-dvh">
    <select v-model="language">
      <option value="plaintext">Plain</option>
      <option value="lua">Lua</option>
      <option value="python">Python</option>
      <option value="markdown">Markdown</option>
    </select>
    <span class="pl-2">{{ language }}</span>

    <div ref="codeEditor" v-bind="$attrs" class="h-screen"></div>
  </div>
</template>

<script async setup lang="ts">
import { onMounted, ref, watch, unref } from "vue";
import * as monaco from "monaco-editor";
import {
  RegisteredFileSystemProvider,
  registerFileSystemOverlay,
  RegisteredMemoryFile,
} from "@codingame/monaco-vscode-files-service-override";

import { initVSCode } from "./vscode";

const props = defineProps<{
  modelValue?: string;
  monacoOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
  disabled?: boolean;
  filename?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "load", editor: monaco.editor.IStandaloneCodeEditor): void;
}>();

const language = ref<string>('plaintext');
const codeEditor = ref<HTMLDivElement>();
const editorRef = ref<monaco.editor.IStandaloneCodeEditor>();

await initVSCode();

console.log("Monaco Service Inited");

onMounted(async () => {
  const fileSystemProvider = new RegisteredFileSystemProvider(false);
  let filename =
    props.filename ?? `/tmp/Unknown-${Math.floor(Math.random() * 200)}`;
  if (!filename.startsWith("/")) {
    filename = `/tmp/${filename}`;
  }
  const fileUri = monaco.Uri.file(filename);

  console.debug(`Code Editor creating model under ${filename}`);
  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(fileUri, props.modelValue ?? ""),
  );

  registerFileSystemOverlay(1, fileSystemProvider);

  const modelRef = await monaco.editor.createModelReference(fileUri);

  const opts = {
    automaticLayout: true,
    model: modelRef.object.textEditorModel,
    readOnly: props.disabled,
    ...props.monacoOptions,
  };

  console.debug("Creating code editor", opts);

  let editor = monaco.editor.create(codeEditor.value!, opts);

  const editorModel = editor.getModel();
  if (editorModel) {
    editorModel.setValue(props.modelValue ?? "");
  }


  editorRef.value = editor;
  editor.onDidChangeModelContent(() => {
    emit("update:modelValue", editor.getValue());
  });

  emit("load", editor);
});

watch(language, (language) => {
  const editor = unref(editorRef);
  if (language && editor) {
    let model = editor.getModel();
    if (model) {
      console.log(`Attempting to change language ${language}`);
      monaco.editor.setModelLanguage(model, language);
      console.log(`Done changing language ${language}`);
    }
  }
});
</script>
