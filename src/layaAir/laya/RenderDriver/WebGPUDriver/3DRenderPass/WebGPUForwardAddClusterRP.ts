import { RenderClearFlag } from "../../../RenderEngine/RenderEnum/RenderClearFlag";
import { ForwardAddClusterRP } from "../../DriverCommon/ForwardAddClusterRP";
import { IRenderContext3D, IRenderElement3D } from "../../DriverDesign/3DRenderPass/I3DRenderPass";

export class WebGPUForwardAddClusterRP extends ForwardAddClusterRP {
    constructor() {
        super();
    }

    /**
     * 主渲染流程
     * @param context 
     */
    protected _mainPass(context: IRenderContext3D): void {
        context.pipelineMode = this.pipelineMode;
        this._renderCmd(this.beforeForwardCmds, context);
        this._recoverRenderContext3D(context);

        this._renderCmd(this.beforeSkyboxCmds, context);
        this._recoverRenderContext3D(context);

        if (this.skyRenderNode) {
            context.setClearData(RenderClearFlag.Depth, this.clearColor, 1, 0);
            const skyRenderElement = this.skyRenderNode.renderelements[0] as IRenderElement3D;
            if (skyRenderElement.subShader) {
                context.drawRenderElementOne(skyRenderElement);
                this.clearFlag = RenderClearFlag.Depth | RenderClearFlag.Stencil;
            } else this.clearFlag = RenderClearFlag.Color | RenderClearFlag.Depth | RenderClearFlag.Stencil;
        } else this.clearFlag = RenderClearFlag.Color | RenderClearFlag.Depth | RenderClearFlag.Stencil;

        context.setClearData(this.clearFlag, this.clearColor, 1, 0);
        this.enableOpaque && this._opaqueList.renderQueue(context);

        if (this.enableOpaque)
            this._opaqueTexturePass();
        this._renderCmd(this.beforeTransparentCmds, context);
        this._recoverRenderContext3D(context);
        this._transparent && this._transparent.renderQueue(context);
    }
}