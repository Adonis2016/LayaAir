import { ShaderPass } from "../../../../RenderEngine/RenderShader/ShaderPass";
import { Matrix4x4 } from "../../../../maths/Matrix4x4";
import { IShaderInstance } from "../../../DriverDesign/RenderDevice/IShaderInstance";
import { GLESRenderElement3D } from "../../../OpenGLESDriver/3DRenderPass/GLESRenderElement3D";
import { GLESShaderInstance } from "../../../OpenGLESDriver/RenderDevice/GLESShaderInstance";
import { ICameraNodeData, ISceneNodeData, IShaderPassData, ISubshaderData } from "../../Design/3D/I3DRenderModuleData";
import { IDefineDatas } from "../../Design/IDefineDatas";
import { RenderState } from "../../Design/RenderState";
import { RTDefineDatas } from "../RTDefineDatas";
import { RTRenderState } from "../RTRenderState";
import { NativeTransform3D } from "./NativeTransform3D";

export class RTCameraNodeData implements ICameraNodeData {
    private _transform: NativeTransform3D;
    public get transform(): NativeTransform3D {
        return this._transform;
    }
    public set transform(value: NativeTransform3D) {
        this._transform = value;
        this._nativeObj.setTransform(value._nativeObj);
    }
    public get farplane(): number {
        return this._nativeObj._farplane;
    }
    public set farplane(value: number) {
        this._nativeObj._farplane = value;
    }

    public get nearplane(): number {
        return this._nativeObj._nearplane;
    }
    public set nearplane(value: number) {
        this._nativeObj._nearplane = value;
    }

    public get fieldOfView(): number {
        return this._nativeObj._fieldOfView;
    }
    public set fieldOfView(value: number) {
        this._nativeObj._fieldOfView = value;
    }

    public get aspectRatio(): number {
        return this._nativeObj._aspectRatio;
    }
    public set aspectRatio(value: number) {
        this._nativeObj._aspectRatio = value;
    }

    _nativeObj: any;
    constructor() {
        this._nativeObj = new (window as any).conchRTCameraNodeData();
    }

    setProjectionViewMatrix(value: Matrix4x4): void {
        value && this._nativeObj.setProjectionViewMatrix(value.elements);
    }
}

export class RTSceneNodeData implements ISceneNodeData {
    public get lightmapDirtyFlag(): number {
        return this._nativeObj._lightmapDirtyFlag;
    }
    public set lightmapDirtyFlag(value: number) {
        this._nativeObj._lightmapDirtyFlag = value;
    }

    _nativeObj: any;
    constructor() {
        this._nativeObj = new (window as any).conchRTSceneNodeData();
    }
}

export class RTSubShader implements ISubshaderData {

    _nativeObj: any;
    constructor() {
        this._nativeObj = new (window as any).conchRTSubShader();
    }
    get enableInstance() {
        return this._nativeObj.enableInstance;
    }
    set enableInstance(value: boolean) {
        this._nativeObj.enableInstance = value;
    }
    destroy(): void {
        this._nativeObj.destroy();
    }
    addShaderPass(pass: RTShaderPass): void {
        this._nativeObj.addShaderPass(pass._nativeObj);
    }
}

export class RTShaderPass implements IShaderPassData {
    private _validDefine: RTDefineDatas = new RTDefineDatas();
    private _createShaderInstanceFun: any;
    _nativeObj: any;
    is2D: boolean = false;
    private _pass: ShaderPass;
    constructor(pass: ShaderPass) {
        this._nativeObj = new (window as any).conchRTShaderPass();
        this._createShaderInstanceFun = this.nativeCreateShaderInstance.bind(this);
        this._nativeObj.setCreateShaderInstanceFunction(this._createShaderInstanceFun);
        this.renderState = new RTRenderState();
        this.renderState.setNull();
        this._pass = pass;
    }
    public get statefirst(): boolean {
        return this._nativeObj._statefirst;
    }
    public set statefirst(value: boolean) {
        this._nativeObj._statefirst = value;
    }
    private _renderState: RenderState;
    public get renderState(): RenderState {
        return this._renderState;
    }
    public set renderState(value: RenderState) {
        this._renderState = value;
        this._nativeObj.setRenderState((value as any)._nativeObj);
    }
    public get pipelineMode(): string {
        return this._nativeObj._pipelineMode;
    }
    public set pipelineMode(value: string) {
        this._nativeObj._pipelineMode = value;
    }
    public get validDefine(): RTDefineDatas {
        return this._validDefine;
    }
    public set validDefine(value: RTDefineDatas) {
        this._validDefine = value;
        this._nativeObj.setValidDefine(value._nativeObj);
    }
    nativeCreateShaderInstance() {
        var shaderIns = this._pass.withCompile(GLESRenderElement3D.getCompileDefine(), this._nativeObj.is2D) as GLESShaderInstance;
        return shaderIns._nativeObj;
    }
    destroy(): void {
        this._nativeObj.destroy();
    }

    setCacheShader(defines: IDefineDatas, shaderInstance: IShaderInstance): void {
        //@ts-ignore
        this._nativeObj.setCacheShader(defines._nativeObj, shaderInstance._nativeObj, shaderInstance);
    }

    getCacheShader(defines: IDefineDatas): IShaderInstance {
        //@ts-ignore
        return this._nativeObj.getCacheShader(defines._nativeObj);
    }
}

