import { Buffer } from "node:buffer";
import { validateSchema } from "@nuxt/ui/utils/form";
import { compileScript, parse } from "@vue/compiler-sfc";
import { expect, test } from "bun:test";
import { injectNumberFieldRootContext, NumberFieldRoot } from "reka-ui";
import { createSSRApp, defineComponent, h, reactive } from "vue";
import { renderToString } from "vue/server-renderer";

const build = await Bun.build({
  entrypoints: ["./app/features/margin/model.ts", "./app/features/margin/components/ModalMargin.vue"],
  target: "bun",
  plugins: [{
    name: "nuxt-app-alias",
    setup(builder) {
      builder.onResolve({ filter: /^vue$/ }, () => ({ path: import.meta.resolve("vue"), external: true }));
      builder.onResolve({ filter: /^~\/composables\/toast$/ }, () => ({ path: "toast", namespace: "margin-test" }));
      builder.onLoad({ filter: /.*/, namespace: "margin-test" }, () => ({
        contents: "export const extractErrorMessage = () => ''; export const useToastError = () => {}; export const useToastSuccess = () => {};",
        loader: "js",
      }));
      builder.onResolve({ filter: /^~\// }, ({ path }) => ({ path: `${process.cwd()}/app/${path.slice(2)}.ts` }));
      builder.onLoad({ filter: /ModalMargin\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await Bun.file(path).text());
        const script = compileScript(descriptor, { id: "margin-test", inlineTemplate: true });
        return {
          contents: `import { computed, reactive, ref, useTemplateRef } from 'vue';\n${script.content}`,
          loader: "ts",
        };
      });
    },
  }],
});
if (!build.success)
  throw new AggregateError(build.logs, "Failed to load the margin model");
async function loadOutput(filename) {
  const output = build.outputs.find(output => output.path.endsWith(filename));
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(await output.text()).toString("base64")}`;
  return import(moduleUrl);
}
const { initMarginFormdata, marginSchema } = await loadOutput("model.js");
const { default: ModalMargin } = await loadOutput("ModalMargin.js");

function createMarginState(maxNominal = null) {
  return reactive({
    ...initMarginFormdata,
    minNominal: 1000000,
    maxNominal,
    persenMarginTahun: 10,
    biayaAkad: 0,
  });
}

async function applyMaximumInput(state, value) {
  let input;
  const probe = defineComponent({
    setup() {
      input = injectNumberFieldRootContext();
      return () => null;
    },
  });
  const app = createSSRApp({
    render() {
      return h(NumberFieldRoot, {
        "modelValue": state.maxNominal,
        "min": 0,
        "step": 1,
        "onUpdate:modelValue": (value) => {
          state.maxNominal = value;
        },
      }, { default: () => h(probe) });
    },
  });
  await renderToString(app);
  input.applyInputValue(value);
}

async function renderMarginForm(margin) {
  let state;
  let checkbox;
  const app = createSSRApp(ModalMargin, { margin, refresh: async () => {} });
  const container = defineComponent({
    setup(_, { slots }) {
      return () => h("div", [slots.default?.(), slots.body?.(), slots.footer?.()]);
    },
  });
  for (const name of ["UModal", "UFormField"])
    app.component(name, container);
  app.component("UForm", defineComponent({
    props: ["state"],
    setup(props, { slots, expose }) {
      state = props.state;
      expose({ clear: () => {} });
      return () => h("form", slots.default?.());
    },
  }));
  app.component("UCheckbox", defineComponent({
    props: ["modelValue", "onUpdate:modelValue"],
    setup(props) {
      checkbox = props;
      return () => null;
    },
  }));
  for (const name of ["UInputNumber", "USelect", "UButton"])
    app.component(name, () => null);
  await renderToString(app);
  expect(checkbox).toBeDefined();
  return { state, checkbox };
}

test("checking unlimited after clearing the input validates and submits null", async () => {
  const { state, checkbox } = await renderMarginForm(createMarginState(5000000));
  await applyMaximumInput(state, "");
  expect(state.maxNominal).toBeUndefined();
  checkbox["onUpdate:modelValue"](true);

  const { errors, result } = await validateSchema(state, marginSchema);
  expect(errors).toBeNull();
  expect(result.maxNominal).toBeNull();
  expect(JSON.parse(JSON.stringify(result)).maxNominal).toBeNull();
});

test("editing an unlimited margin starts with the checkbox checked", async () => {
  const { state, checkbox } = await renderMarginForm(createMarginState(null));
  expect(checkbox.modelValue).toBe(true);
  const { errors, result } = await validateSchema(state, marginSchema);
  expect(errors).toBeNull();
  expect(result.maxNominal).toBeNull();
});

test("toggling unlimited off restores the previous numeric maximum", async () => {
  const { state, checkbox } = await renderMarginForm(createMarginState(5000000));
  checkbox["onUpdate:modelValue"](true);
  expect(state.maxNominal).toBeNull();
  checkbox["onUpdate:modelValue"](false);
  expect(state.maxNominal).toBe(5000000);
});

test("an unchecked empty maximum still requires an amount", async () => {
  const { state, checkbox } = await renderMarginForm(createMarginState(null));
  checkbox["onUpdate:modelValue"](false);
  const { errors } = await validateSchema(state, marginSchema);
  expect(errors).toContainEqual({ name: "maxNominal", message: "Nominal maksimum harus berupa angka" });
});

test("bounded amounts retain minimum validation and zero is not unlimited", async () => {
  const tooSmall = createMarginState(999999);
  const { errors } = await validateSchema(tooSmall, marginSchema);
  expect(errors).toContainEqual({ name: "maxNominal", message: "Nominal maksimum harus lebih besar atau sama dengan nominal minimum" });

  const { state, checkbox } = await renderMarginForm({ ...createMarginState(0), minNominal: 0 });
  expect(checkbox.modelValue).toBe(false);
  const valid = await validateSchema(state, marginSchema);
  expect(valid.errors).toBeNull();
  expect(valid.result.maxNominal).toBe(0);
});
