import { Sprite3D } from "../Sprite3D"
import { BaseRender } from "../render/BaseRender"
import { TrailFilter } from "./TrailFilter";
import { FloatKeyframe } from "../FloatKeyframe";
import { Gradient } from "../Gradient";
import { Component } from "../../../components/Component";
import { Bounds } from "../../math/Bounds";
import { TrailTextureMode } from "../TrailTextureMode"
import { TrailAlignment } from "./TrailAlignment"
import { Matrix4x4 } from "../../../maths/Matrix4x4";
import { RenderContext3D } from "../render/RenderContext3D";
import { Laya3DRender } from "../../RenderObjs/Laya3DRender";
import { IBaseRenderNode } from "../../../RenderDriver/RenderModuleData/Design/3D/I3DRenderModuleData";

/**
 * <code>TrailRenderer</code> 类用于创建拖尾渲染器。
 */
export class TrailRenderer extends BaseRender {

    /**@internal */
    _trailFilter: TrailFilter;

    /**@internal @protected */
    protected _projectionViewWorldMatrix: Matrix4x4 = new Matrix4x4();

    /**
     * 实例化一个拖尾渲染器
     */
    constructor() {
        super();
    }

    protected _getcommonUniformMap(): Array<string> {
        return ["Sprite3D", "TrailRender"];
    }


    protected _createBaseRenderNode(): IBaseRenderNode {
        return Laya3DRender.Render3DModuleDataFactory.createMeshRenderNode();
    }

    /**
     * @internal
     * @protected 
     */
    protected _onAdded(): void {
        super._onAdded();
        this._trailFilter = new TrailFilter(this);
        this._setRenderElements();
    }

    /**
     * 获取淡出时间。单位s
     * @return  淡出时间。
     */
    get time(): number {
        return this._trailFilter.time;
    }

    /**
     * 设置淡出时间。单位s
     * @param value 淡出时间。
     */
    set time(value: number) {
        this._trailFilter.time = value;
    }

    /**
     * 获取新旧顶点之间最小距离。
     * @return  新旧顶点之间最小距离。
     */
    get minVertexDistance(): number {
        return this._trailFilter.minVertexDistance;
    }

    /**
     * 设置新旧顶点之间最小距离。
     * @param value 新旧顶点之间最小距离。
     */
    set minVertexDistance(value: number) {
        this._trailFilter.minVertexDistance = value;
    }

    /**
     * 获取宽度倍数。
     * @return  宽度倍数。
     */
    get widthMultiplier(): number {
        return this._trailFilter.widthMultiplier;
    }

    /**
     * 设置宽度倍数。
     * @param value 宽度倍数。
     */
    set widthMultiplier(value: number) {
        this._trailFilter.widthMultiplier = value;
    }

    /**
     * 获取宽度曲线。
     * @return  宽度曲线。
     */
    get widthCurve(): FloatKeyframe[] {
        return this._trailFilter.widthCurve;
    }

    /**
     * 设置宽度曲线。最多10个
     * @param value 宽度曲线。
     */
    set widthCurve(value: FloatKeyframe[]) {
        this._trailFilter.widthCurve = value;
    }

    /**
     * 获取颜色梯度。
     * @return  颜色梯度。
     */
    get colorGradient(): Gradient {
        return this._trailFilter.colorGradient;
    }

    /**
     * 设置颜色梯度。
     * @param value 颜色梯度。
     */
    set colorGradient(value: Gradient) {
        this._trailFilter.colorGradient = value;
    }

    /**
     * 获取纹理模式。
     * @return  纹理模式。
     */
    get textureMode(): TrailTextureMode {
        return this._trailFilter.textureMode;
    }

    /**
     * 设置纹理模式。
     * @param value 纹理模式。
     */
    set textureMode(value: TrailTextureMode) {
        this._trailFilter.textureMode = value;
    }

    /**
     * 拖尾轨迹准线
     */
    get alignment(): TrailAlignment {
        return this._trailFilter.alignment;
    }

    set alignment(value: TrailAlignment) {
        this._trailFilter.alignment = value;
    }

    /**
     * @internal
     * @protected
     */
    protected _onEnable(): void {
        super._onEnable();

        (this.owner as Sprite3D)._transform.position.cloneTo(this._trailFilter._lastPosition);//激活时需要重置上次位置
    }

    renderUpdate(context: RenderContext3D) {
        this._calculateBoundingBox();

        this._renderElements.forEach(element => {
            let geometry = element._geometry;
            element._renderElementOBJ.isRender = geometry._prepareRender(context);
            geometry._updateRenderParams(context);
        })

    }



    /**
     * 包围盒,只读,不允许修改其值。
     */
    get bounds(): Bounds {
        return this._bounds;
    }

    /**
     * @inheritDoc
     * @internal
     * @override
     */
    _calculateBoundingBox(): void {
        let context = RenderContext3D._instance;
        this.boundsChange = false;
        this._trailFilter._update(context);
    }

    /**
     * 清除拖尾
     */
    clear(): void {
        this._trailFilter.clear();
    }

    /**
     * @internal
     */
    protected _onDestroy() {
        this._trailFilter.destroy();
        super._onDestroy();
    }

    /**
     * @internal
     * @param dest 
     */
    _cloneTo(dest: Component): void {
        super._cloneTo(dest);
        let render = dest as TrailRenderer;
        render.time = this.time;
        render.minVertexDistance = this.minVertexDistance;
        //render.widthCurve = this.widthCurve;
        var widthCurve: FloatKeyframe[] = [];
        var widthCurveData: any[] = this.widthCurve;
        for (let i = 0, n = this.widthCurve.length; i < n; i++) {
            widthCurve.push(widthCurveData[i].clone());
        }
        render.widthCurve = widthCurve;
        render.colorGradient = this.colorGradient.clone();
        render.textureMode = this.textureMode;
        render.alignment = this.alignment;
    }

}

