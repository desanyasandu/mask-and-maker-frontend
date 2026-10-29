/**
 * Materials variants extension
 *
 * Specification:
 * https://github.com/takahirox/three-gltf-extensions/tree/main/loaders/KHR_materials_variants
 */
/**
 * The code in this file is based on
 * https://github.com/takahirox/three-gltf-extensions/tree/main/exporters/KHR_materials_variants
 */
import { Material, Mesh, Object3D } from 'three';
import { GLTFExporterPlugin, GLTFWriter } from 'three/examples/jsm/exporters/GLTFExporter.js';
declare module 'three/examples/jsm/exporters/GLTFExporter.js' {
    interface GLTFWriter {
        json: any;
        processMaterialAsync(material: Material): Promise<number>;
    }
}
export default class GLTFExporterMaterialsVariantsExtension implements GLTFExporterPlugin {
    writer: GLTFWriter;
    name: string;
    variantNames: string[];
    constructor(writer: GLTFWriter);
    beforeParse(objects: Object3D | Object3D[]): void;
    writeMesh(mesh: Mesh, meshDef: any): Promise<void>;
    afterParse(): void;
}
