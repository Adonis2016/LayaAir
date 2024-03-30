import { IRenderContext3D } from "../../../RenderDriver/DriverDesign/3DRenderPass/I3DRenderPass";
import { Laya3DRender } from "../../RenderObjs/Laya3DRender";
import { RenderElement } from "./RenderElement";

/**
 * @internal
 */
export class SkinRenderElement extends RenderElement {
    /**
     * 可提交底层的渲染节点
     */
    _renderElementOBJ: any;

    setSkinData(value: Float32Array[]) {
        this._renderElementOBJ.skinnedData = value;
    }

    constructor() {
        super();
    }

    protected _createRenderElementOBJ() {
        this._renderElementOBJ = Laya3DRender.Render3DPassFactory.createSkinRenderElement();
    }

    _render(context: IRenderContext3D): void {
        //this._renderElementOBJ._render(context);
    }
}