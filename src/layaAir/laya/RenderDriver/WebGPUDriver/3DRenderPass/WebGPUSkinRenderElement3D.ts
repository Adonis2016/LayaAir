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
    renderShaderDatas: WebGPUShaderData[];

    globalId: number;
    objectName: string = 'WebGPUSkinRenderElement3D';

    constructor() {
        super();
        this.globalId = WebGPUGlobal.getId(this);
        this.bundleId = WebGPUSkinRenderElement3D.bundleIdCounter++;
    }

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
            const n = this.skinnedData ? this.skinnedData.length : 0;
            if (n > 1) { //蒙皮数据分组大于1时，需要创建相应的多个材质数据
                this.renderShaderDatas = [];
                for (let i = 0; i < n; i++) {
                    this.renderShaderDatas[i] = new WebGPUShaderData();
                    this.renderShaderDatas[i].createUniformBuffer(shaderInstance.uniformInfo[2]);
                    this.renderShaderData.cloneTo(this.renderShaderDatas[i]);
                }
                this.renderShaderData.coShaderData = this.renderShaderDatas; //共享材质数据
            }
        }

        //重编译着色器后，清理绑定组缓存
        if (this.renderShaderData) {
            this.renderShaderData.clearBindGroup();
            this.renderShaderData._name = 'skin-sprite3D';
        }
        if (this.materialShaderData) {
            this.materialShaderData.clearBindGroup();
            this.materialShaderData._name = 'skin-materal';
        }

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
        if (this.renderShaderDatas[sn])
            this.renderShaderDatas[sn].bindGroup(2, 'sprite3D', uniformSetMap[2], command, bundle);
        if (this.materialShaderData)
            this.materialShaderData.bindGroup(3, 'material', uniformSetMap[3], command, bundle);
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
        if (this.renderShaderDatas[sn])
            this.renderShaderDatas[sn].uploadUniform();
        if (this.materialShaderData)
            this.materialShaderData.uploadUniform();
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
            const strideOld = vs.arrayStride;
            const strideNew = strideOld + 12;
            const attrOld = [], attrNew = [];
            const attributes = vs.attributes as [];
            const attrLen = attributes.length;
            for (let j = 0; j < attrLen; j++) {
                const attr = attributes[j] as GPUVertexAttribute;
                attrOld.push({
                    offset: attr.offset,
                    format: attr.format,
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
                        });
                    }
                    const vertexCount = vb.buffer.byteLength / vs.arrayStride;
                    vs.arrayStride += 12;
                    bufferState.updateBufferLayoutFlag++;
                    const buffer = vb.buffer;
                    vb.buffer = new ArrayBuffer(vs.arrayStride * vertexCount);
                    const src_ui8 = new Uint8Array(buffer);
                    const src_f32 = new Float32Array(buffer);
                    const dst_f32 = new Float32Array(vb.buffer);
                    let src_ui8_off1 = 0;
                    let src_f32_off1 = 0;
                    let dst_f32_off1 = 0;
                    let src_ui8_off2 = 0;
                    let src_f32_off2 = 0;
                    let dst_f32_off2 = 0;
                    //拷贝数据（按照新的数据布局）
                    for (let k = 0; k < vertexCount; k++) {
                        src_ui8_off1 = k * strideOld;
                        src_f32_off1 = k * strideOld / 4;
                        dst_f32_off1 = k * strideNew / 4;
                        for (let l = 0; l < attrLen; l++) {
                            if (attrOld[l].format == 'uint8x4') {
                                src_ui8_off2 = src_ui8_off1 + attrOld[l].offset;
                                dst_f32_off2 = dst_f32_off1 + attrNew[l].offset / 4;
                                for (let m = 0; m < 4; m++)
                                    dst_f32[dst_f32_off2 + m] = src_ui8[src_ui8_off2 + m];
                            } else {
                                src_f32_off2 = src_f32_off1 + attrOld[l].offset / 4;
                                dst_f32_off2 = dst_f32_off1 + attrNew[l].offset / 4;
                                for (let m = 0; m < 4; m++)
                                    dst_f32[dst_f32_off2 + m] = src_f32[src_f32_off2 + m];
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
        if (this.isRender && this.skinnedData) {
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
                    if (this.skinnedData.length == 1) {
                        if (this.renderShaderData)
                            this.renderShaderData.setBuffer(SkinnedMeshSprite3D.BONES, this.skinnedData[0]);
                        if (command || bundle)
                            this._bindGroup(shaderInstance, command, bundle); //绑定资源组
                        this._uploadUniform(); //上传uniform数据
                        this._uploadGeometry(command, bundle); //上传几何数据
                    } else {
                        for (let j = 0, len = this.skinnedData.length; j < len; j++) {
                            const renderShaderData = this.renderShaderDatas[j];
                            if (renderShaderData)
                                renderShaderData.setBuffer(SkinnedMeshSprite3D.BONES, this.skinnedData[j]);
                            if (command || bundle)
                                this._bindGroupEx(shaderInstance, command, bundle, j); //绑定资源组
                            this._uploadUniformEx(j); //上传uniform数据
                            this._uploadGeometryEx(command, bundle, j); //上传几何数据
                        }
                    }
                }
            }
            this._stateKeyCounter++;
        }
    }
}