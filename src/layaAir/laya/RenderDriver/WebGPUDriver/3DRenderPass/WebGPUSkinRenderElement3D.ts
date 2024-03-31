import { SkinnedMeshSprite3D } from "../../../d3/core/SkinnedMeshSprite3D";
import { WebGPUBuffer } from "../RenderDevice/WebGPUBuffer";
import { WebGPURenderBundle } from "../RenderDevice/WebGPUBundle/WebGPURenderBundle";
import { WebGPURenderCommandEncoder } from "../RenderDevice/WebGPURenderCommandEncoder";
import { WebGPUShaderData } from "../RenderDevice/WebGPUShaderData";
import { WebGPUShaderInstance } from "../RenderDevice/WebGPUShaderInstance";
import { WebGPUGlobal } from "../RenderDevice/WebGPUStatis/WebGPUGlobal";
import { WebGPUContext } from "./WebGPUContext";
import { WebGPURenderContext3D } from "./WebGPURenderContext3D";
import { WebGPURenderElement3D } from "./WebGPURenderElement3D";

/**
 * 用于WebGPU的骨骼渲染元素
 */
export class WebGPUSkinRenderElement3D extends WebGPURenderElement3D {
    skinnedData: Float32Array[];
    materialShaderDatas: WebGPUShaderData[] = [];

    globalId: number;
    objectName: string = 'WebGPUSkinRenderElement3D';

    constructor() {
        super();
        //this.globalId = WebGPUGlobal.getId(this);
        this.bundleId = WebGPUSkinRenderElement3D.bundleIdCounter++;
        for (let i = 0; i < 4; i++)
            this.materialShaderDatas[i] = new WebGPUShaderData();
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
     * 编译着色器
     * @param context 
     */
    protected _compileShader(context: WebGPURenderContext3D) {
        const passes = this.subShader._passes;

        const comDef = WebGPURenderElement3D._compileDefine;
        //将场景或全局配置的定义一次性准备好
        if (context.sceneData)
            context.sceneData._defineDatas.cloneTo(comDef);
        else context.globalConfigShaderData.cloneTo(comDef);

        //添加相机数据定义
        if (context.cameraData)
            comDef.addDefineDatas(context.cameraData._defineDatas);

        this._shaderInstances.length = 0;
        for (let i = 0, m = passes.length; i < m; i++) {
            const pass = passes[i];
            if (pass.pipelineMode !== context.pipelineMode) continue;

            if (this.renderShaderData)
                comDef.addDefineDatas(this.renderShaderData.getDefineData());
            comDef.addDefineDatas(this.materialShaderData._defineDatas);

            //获取shaderInstance，会先查找缓存，如果没有则创建
            const shaderInstance = pass.withCompile(comDef) as WebGPUShaderInstance;
            this._shaderInstances[i] = shaderInstance;

            context.sceneData?.createUniformBuffer(shaderInstance.uniformInfo[0], true);
            context.cameraData?.createUniformBuffer(shaderInstance.uniformInfo[1], true);
            this.renderShaderData?.createUniformBuffer(shaderInstance.uniformInfo[2]);
            this.materialShaderData.createUniformBuffer(shaderInstance.uniformInfo[3]);
            const n = this.skinnedData ? this.skinnedData.length : 1;
            for (let i = 0; i < n; i++) {
                this.materialShaderDatas[i].createUniformBuffer(shaderInstance.uniformInfo[3]);
                this.materialShaderData.cloneTo(this.materialShaderDatas[i]);
            }
            this.materialShaderData.coShaderData = this.materialShaderDatas; //共享材质数据
        }

        //重编译着色器后，清理绑定组缓存
        if (this.renderShaderData)
            this.renderShaderData.clearBindGroup();
        if (this.materialShaderData)
            this.materialShaderData.clearBindGroup();

        //强制stateKey重新计算
        this._stateKeyCounter = 0;
    }

    /**
     * 绑定资源组
     * @param shaderInstance 
     * @param command 
     * @param bundle 
     * @param sn 
     */
    protected _bindGroupEx(shaderInstance: WebGPUShaderInstance, command: WebGPURenderCommandEncoder, bundle: WebGPURenderBundle, sn: number) {
        const uniformSetMap = shaderInstance.uniformSetMap;
        if (this._sceneData)
            this._sceneData.bindGroup(0, 'scene3D', uniformSetMap[0], command, bundle);
        if (this._cameraData)
            this._cameraData.bindGroup(1, 'camera', uniformSetMap[1], command, bundle);
        if (this.renderShaderData)
            this.renderShaderData.bindGroup(2, 'sprite3D', uniformSetMap[2], command, bundle);
        if (this.materialShaderDatas[sn])
            this.materialShaderDatas[sn].bindGroup(3, 'material', uniformSetMap[3], command, bundle);
    }

    /**
     * 上传uniform数据
     * @param sn 
     */
    protected _uploadUniformEx(sn: number) {
        if (this._sceneData)
            this._sceneData.uploadUniform();
        if (this._cameraData)
            this._cameraData.uploadUniform();
        if (this.renderShaderData)
            this.renderShaderData.uploadUniform();
        if (this.materialShaderDatas[sn])
            this.materialShaderDatas[sn].uploadUniform();
    }

    /**
     * 上传几何数据
     * @param command 
     * @param bundle 
     * @param sn 
     */
    protected _uploadGeometryEx(command: WebGPURenderCommandEncoder, bundle: WebGPURenderBundle, sn: number) {
        if (command) {
            if (WebGPUGlobal.useGlobalContext)
                WebGPUContext.applyCommandGeometryPart(command, this.geometry, sn);
            else command.applyGeometryPart(this.geometry, sn);
        }
        if (bundle) {
            if (WebGPUGlobal.useGlobalContext)
                WebGPUContext.applyBundleGeometryPart(bundle, this.geometry, sn);
            else bundle.applyGeometryPart(this.geometry, sn);
        }
    }

    /**
     * 转换数据格式
     */
    private _changeDataFormat() {
        const bufferState = this.geometry.bufferState;
        for (let i = 0; i < bufferState._vertexBuffers.length; i++) {
            const vb = bufferState._vertexBuffers[i];
            const vs = bufferState.vertexState[i];
            const oldStride = vs.arrayStride;
            const newStride = oldStride + 12;
            const attrOld = [], attrNew = [];
            const attributes = vs.attributes as [];
            const attrLen = attributes.length;
            for (let j = 0; j < attrLen; j++) {
                const attr = attributes[j] as GPUVertexAttribute;
                attrOld.push({
                    offset: attr.offset,
                    format: attr.format,
                    element: this._formatToElement(attr.format),
                });
            }
            for (let j = 0; j < attrLen; j++) {
                const attr = attributes[j] as GPUVertexAttribute;
                if (attr.format === 'uint8x4') {
                    attr.format = 'float32x4';
                    for (let k = 0; k < attrLen; k++) {
                        const attr2 = attributes[k] as GPUVertexAttribute;
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
                        for (let l = 0; l < attrLen; l++) {
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
    }

    /**
     * 渲染
     * @param context 
     * @param command 
     * @param bundle 
     */
    _render(context: WebGPURenderContext3D, command: WebGPURenderCommandEncoder, bundle: WebGPURenderBundle) {
        if (!this.geometry.skinIndicesDone) {
            this._changeDataFormat(); //转换数据格式
            this.geometry.skinIndicesDone = true;
        }
        //如果command和bundle都是null，则只上传shaderData数据，不执行bindGroup操作
        if (this.isRender) {
            let stateKey;
            for (let i = 0, len = this._shaderInstances.length; i < len; i++) {
                const shaderInstance = this._shaderInstances[i];
                if (shaderInstance.complete) {
                    if (this.useCache) { //启用缓存机制
                        if (this._stateKeyCounter % 10 == 0)
                            stateKey = this._calcStateKey(shaderInstance, context.destRT, context);
                        else stateKey = this._stateKey[i];
                        if (stateKey != this._stateKey[i] || !this._pipelineCache[i]) //缓存未命中
                            this._createPipeline(i, context, shaderInstance, command, bundle, stateKey); //新建渲染管线
                        else { //缓存命中
                            if (command) {
                                if (WebGPUGlobal.useGlobalContext)
                                    WebGPUContext.setCommandPipeline(command, this._pipelineCache[i]);
                                else command.setPipeline(this._pipelineCache[i]);
                            }
                            if (bundle) {
                                if (WebGPUGlobal.useGlobalContext)
                                    WebGPUContext.setBundlePipeline(bundle, this._pipelineCache[i]);
                                else bundle.setPipeline(this._pipelineCache[i]);
                            }
                        }
                    } else this._createPipeline(i, context, shaderInstance, command, bundle); //不启用缓存机制
                    for (let j = 0, len = this.skinnedData.length; j < len; j++) {
                        const materialShaderData = this.materialShaderDatas[j];
                        if (materialShaderData && this.skinnedData)
                            materialShaderData.setBuffer(SkinnedMeshSprite3D.BONES, this.skinnedData[j]);
                        if (command || bundle)
                            this._bindGroupEx(shaderInstance, command, bundle, j); //绑定资源组
                        this._uploadUniformEx(j); //上传uniform数据
                        this._uploadGeometryEx(command, bundle, j); //上传几何数据
                    }
                }
            }
            this._stateKeyCounter++;
        }
    }
}