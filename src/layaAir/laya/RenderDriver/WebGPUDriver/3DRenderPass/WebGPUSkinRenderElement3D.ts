import { SkinnedMeshSprite3D } from "../../../d3/core/SkinnedMeshSprite3D";
import { WebGPUBuffer } from "../RenderDevice/WebGPUBuffer";
import { WebGPURenderBundle } from "../RenderDevice/WebGPUBundle/WebGPURenderBundle";
import { WebGPURenderCommandEncoder } from "../RenderDevice/WebGPURenderCommandEncoder";
import { WebGPUShaderInstance } from "../RenderDevice/WebGPUShaderInstance";
import { WebGPUGlobal } from "../RenderDevice/WebGPUStatis/WebGPUGlobal";
import { WebGPUContext } from "./WebGPUContext";
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

    private _formatToElement = (format: string) => {
        switch (format) {
            case 'float32':
                return 1;
            case 'float32x2':
                return 2;
            case 'float32x3':
                return 3;
            case 'float32x4':
                return 4;
            case 'uint8x4':
                return 4;
            default:
                return 4;
        }
    };

    /**
     * 用于创建渲染管线的函数
     * @param sn 
     * @param context 
     * @param shaderInstance 
     * @param command 
     * @param bundle 
     * @param stateKey 
     */
    protected _createPipeline(sn: number, context: WebGPURenderContext3D, shaderInstance: WebGPUShaderInstance,
        command: WebGPURenderCommandEncoder, bundle: WebGPURenderBundle, stateKey?: string) {
        let complete = true;
        let entries: GPUBindGroupLayoutEntry[];
        const bindGroupLayout = [];
        const sceneData = this._sceneData;
        const cameraData = this._cameraData;
        const renderShaderData = this.renderShaderData;
        const materialShaderData = this.materialShaderData;
        const uniformSetMap = shaderInstance.uniformSetMap;

        if (sceneData) {
            entries = sceneData.bindGroup(0, 'scene3D', uniformSetMap[0], command, bundle);
            if (!entries)
                complete = false;
            else {
                sceneData.uploadUniform();
                bindGroupLayout.push(entries);
            }
        }
        if (cameraData) {
            entries = cameraData.bindGroup(1, 'camera', uniformSetMap[1], command, bundle);
            if (!entries)
                complete = false;
            else {
                cameraData.uploadUniform();
                bindGroupLayout.push(entries);
            }
        }
        if (renderShaderData) {
            renderShaderData.isShare = false;
            entries = renderShaderData.bindGroup(2, 'sprite3D', uniformSetMap[2], command, bundle);
            if (!entries)
                complete = false;
            else {
                renderShaderData.uploadUniform();
                bindGroupLayout.push(entries);
            }
        }
        if (materialShaderData) {
            materialShaderData.isShare = false;
            if (this.skinnedData) {
                const subSkinnedDatas = this.skinnedData[0];
                materialShaderData.setBuffer(SkinnedMeshSprite3D.BONES, subSkinnedDatas);
            }
            entries = materialShaderData.bindGroup(3, 'material', uniformSetMap[3], command, bundle);
            if (!entries)
                complete = false;
            else {
                materialShaderData.uploadUniform();
                bindGroupLayout.push(entries);
            }
        }

        if (complete) {
            const pipeline = this._getWebGPURenderPipeline(shaderInstance, context.destRT, context, bindGroupLayout);
            if (command) {
                if (WebGPUGlobal.useGlobalContext) {
                    WebGPUContext.setCommandPipeline(command, pipeline);
                    WebGPUContext.applyCommandGeometryPart(command, this.geometry, 0);
                } else {
                    command.setPipeline(pipeline);
                    command.applyGeometryPart(this.geometry, 0);
                }
            }
            if (bundle) {
                if (WebGPUGlobal.useGlobalContext) {
                    WebGPUContext.setBundlePipeline(bundle, pipeline);
                    WebGPUContext.applyBundleGeometryPart(bundle, this.geometry, 0);
                } else {
                    bundle.setPipeline(pipeline);
                    bundle.applyGeometryPart(this.geometry, 0);
                }
            }
            if (this.useCache) {
                this._pipelineCache[sn] = pipeline;
                this._stateKey[sn] = stateKey;
            }
        }
    };

    /**
     * 渲染
     * @param context 
     * @param command 
     * @param bundle 
     */
    _render(context: WebGPURenderContext3D, command: WebGPURenderCommandEncoder, bundle: WebGPURenderBundle) {
        if (!this.geometry.skinIndicesDone) {
            const bufferState = this.geometry.bufferState;
            for (let i = 0; i < bufferState._vertexBuffers.length; i++) {
                const vb = bufferState._vertexBuffers[i];
                const vs = bufferState.vertexState[i];
                const oldStride = vs.arrayStride;
                const newStride = oldStride + 12;
                const attrOld = [], attrNew = [];
                for (let j = 0; j < (vs.attributes as []).length; j++) {
                    const attr = (vs.attributes as [])[j] as GPUVertexAttribute;
                    attrOld.push({
                        offset: attr.offset,
                        format: attr.format,
                        element: this._formatToElement(attr.format),
                    });
                }
                for (let j = 0; j < (vs.attributes as []).length; j++) {
                    const attr = (vs.attributes as [])[j] as GPUVertexAttribute;
                    if (attr.format == 'uint8x4') {
                        attr.format = 'float32x4';
                        for (let k = 0; k < (vs.attributes as []).length; k++) {
                            const attr2 = (vs.attributes as [])[k] as GPUVertexAttribute;
                            if (attr2.offset > attr.offset)
                                attr2.offset += 12;
                            attrNew.push({
                                offset: attr2.offset,
                                format: attr2.format,
                                element: this._formatToElement(attr2.format),
                            });
                        }
                        const vertexCount = vb.buffer.byteLength / vs.arrayStride;
                        vs.arrayStride += 12;
                        bufferState.updateBufferLayoutFlag++;
                        const buffer = vb.buffer;
                        vb.buffer = new ArrayBuffer(vs.arrayStride * vertexCount);
                        //拷贝数据（按照新的数据布局）
                        for (let k = 0; k < vertexCount; k++) {
                            for (let l = 0; l < attrOld.length; l++) {
                                if (attrOld[l].format == 'uint8x4') {
                                    const src = new Uint8Array(buffer, k * oldStride + attrOld[l].offset, attrOld[l].element);
                                    const dst = new Float32Array(vb.buffer, k * newStride + attrNew[l].offset, attrNew[l].element);
                                    dst.set(src);
                                } else {
                                    const src = new Float32Array(buffer, k * oldStride + attrOld[l].offset, attrOld[l].element);
                                    const dst = new Float32Array(vb.buffer, k * newStride + attrNew[l].offset, attrNew[l].element);
                                    dst.set(src);
                                }
                            }
                        }
                        vb.source = new WebGPUBuffer(vb.source._usage, vs.arrayStride * vertexCount);
                        vb.source.setData(vb.buffer, 0);
                        break; //只有一个'uint8x4'属性
                    }
                }
                vb.buffer = null;
            }
            this.geometry.skinIndicesDone = true;
        }

        //如果command和bundle都是null，则只上传shaderData数据，不执行bindGroup操作
        if (this.isRender) {
            let stateKey;
            for (let i = 0, len = this._shaderInstances.length; i < len; i++) {
                const shaderInstance = this._shaderInstances[i];
                if (shaderInstance.complete) {
                    if (this.useCache) { //启用缓存机制
                        const sceneData = this._sceneData;
                        const cameraData = this._cameraData;
                        const renderShaderData = this.renderShaderData;
                        const materialShaderData = this.materialShaderData;
                        if (this._stateKeyCounter % 10 == 0)
                            stateKey = this._calcStateKey(shaderInstance, context.destRT, context);
                        else stateKey = this._stateKey[i];
                        if (stateKey != this._stateKey[i] || !this._pipelineCache[i])
                            this._createPipeline(i, context, shaderInstance, command, bundle, stateKey); //新建渲染管线
                        else { //使用缓存
                            let complete = true;
                            const uniformSetMap = shaderInstance.uniformSetMap;
                            if (sceneData) {
                                if (command || bundle) {
                                    if (!sceneData.bindGroup(0, 'scene3D', uniformSetMap[0], command, bundle))
                                        complete = false;
                                    else sceneData.uploadUniform();
                                } else sceneData.uploadUniform();
                            }
                            if (cameraData) {
                                if (command || bundle) {
                                    if (!cameraData.bindGroup(1, 'camera', uniformSetMap[1], command, bundle))
                                        complete = false;
                                    else cameraData.uploadUniform();
                                } else cameraData.uploadUniform();
                            }
                            if (renderShaderData) {
                                if (command || bundle) {
                                    if (!renderShaderData.bindGroup(2, 'sprite3D', uniformSetMap[2], command, bundle))
                                        complete = false;
                                    else renderShaderData.uploadUniform();
                                } else renderShaderData.uploadUniform();
                            }
                            if (materialShaderData) {
                                if (this.skinnedData) {
                                    const subSkinnedDatas = this.skinnedData[0];
                                    materialShaderData.setBuffer(SkinnedMeshSprite3D.BONES, subSkinnedDatas);
                                }
                                if (command || bundle) {
                                    if (!materialShaderData.bindGroup(3, 'material', uniformSetMap[3], command, bundle))
                                        complete = false;
                                    else materialShaderData.uploadUniform();
                                } else materialShaderData.uploadUniform();
                            }
                            if (complete) {
                                if (command) {
                                    if (WebGPUGlobal.useGlobalContext) {
                                        WebGPUContext.setCommandPipeline(command, this._pipelineCache[i]);
                                        WebGPUContext.applyCommandGeometryPart(command, this.geometry, 0);
                                    } else {
                                        command.setPipeline(this._pipelineCache[i]);
                                        command.applyGeometryPart(this.geometry, 0);
                                    }
                                }
                                if (bundle) {
                                    if (WebGPUGlobal.useGlobalContext) {
                                        WebGPUContext.setBundlePipeline(bundle, this._pipelineCache[i]);
                                        WebGPUContext.applyBundleGeometryPart(bundle, this.geometry, 0);
                                    } else {
                                        bundle.setPipeline(this._pipelineCache[i]);
                                        bundle.applyGeometryPart(this.geometry, 0);
                                    }
                                }
                            }
                        }
                    } else this._createPipeline(i, context, shaderInstance, command, bundle); //不启用缓存机制
                }
            }
            this._stateKeyCounter++;
        }
    }
}