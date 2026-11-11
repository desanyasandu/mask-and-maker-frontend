import { readFile, writeFile } from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { USDZExporter } from "three/addons/exporters/USDZExporter.js";

const slugs = JSON.parse(await readFile(new URL("../src/lib/refined-scans.json", import.meta.url), "utf8"));
const modelDir = new URL("../dist/models/", import.meta.url);
const loader = new GLTFLoader();
const exporter = new USDZExporter();

for (const slug of slugs) {
  const glb = await readFile(new URL(`${slug}.glb`, modelDir));
  const data = glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength);
  const { scene } = await loader.parseAsync(data, "");
  // Leave plane selection to Quick Look so the mask can be moved to a wall.
  const usdz = await exporter.parseAsync(scene, { includeAnchoringProperties: false });
  await writeFile(new URL(`${slug}.usdz`, modelDir), usdz);
  console.log(`Quick Look: ${slug}.usdz (${Math.round(usdz.byteLength / 1024)} KiB)`);
}
