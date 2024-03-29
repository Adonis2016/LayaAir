import { WebGPURenderBundle } from "../RenderDevice/WebGPUBundle/WebGPURenderBundle";
import { WebGPURenderCommandEncoder } from "../RenderDevice/WebGPURenderCommandEncoder";
import { WebGPURenderContext3D } from "./WebGPURenderContext3D";
import { WebGPURenderElement3D } from "./WebGPURenderElement3D";

export class WebGPUSkinRenderElement3D extends WebGPURenderElement3D {
    skinnedData: Float32Array[];

    globalId: number;
    objectName: string = 'WebGPUSkinRenderElement3D';

    constructor() {
        super();
        //this.globalId = WebGPUGlobal.getId(this);
        this.bundleId = WebGPUSkinRenderElement3D.bundleIdCounter++;
    }

    /**
     * 渲染
     * @param context 
     * @param command 
     * @param bundle 
     */
    _render(context: WebGPURenderContext3D, command: WebGPURenderCommandEncoder, bundle: WebGPURenderBundle) {
        if (this.geometry && !this.geometry.skinIndicesDone) {
            this.geometry.skinIndicesDone = true;
            console.log('skinIndicesDone');
            const bufferState = this.geometry.bufferState;
            console.log(this.geometry);
        }
        super._render(context, command, bundle);
    }
}