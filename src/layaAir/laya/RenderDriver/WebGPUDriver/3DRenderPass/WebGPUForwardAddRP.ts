import { CommandBuffer } from "../../../d3/core/render/command/CommandBuffer";
import { WebGPUForwardAddClusterRP } from "./WebGPUForwardAddClusterRP";
import { WebGPUDirectLightShadowRP } from "./WebGPUDirectLightShadowRP";
//import { WebGLSpotLightShadowRP } from "./WebGLSpotLightShadowRP";

export class WebGPUForwardAddRP {
    /**是否开启阴影 */
    shadowCastPass: boolean = false;

    /**@internal */
    _afterAllRenderCMDS: Array<CommandBuffer>;
    /**@internal */
    _beforeImageEffectCMDS: Array<CommandBuffer>;

    enablePostProcess: boolean = true;
    /**@internal */
    postProcess: CommandBuffer;
    /**main pass */
    renderPass: WebGPUForwardAddClusterRP;

    /**directlight shadow */
    directLightShadowPass: WebGPUDirectLightShadowRP;

    /**enable directlight */
    enableDirectLightShadow: boolean = false;

    /**spot shadow */
    //spotLightShadowPass: WebGLSpotLightShadowRP;

    /**enable spot */
    enableSpotLightShadowPass: boolean = false;

    constructor() {
        this.directLightShadowPass = new WebGPUDirectLightShadowRP();
        //this.spotLightShadowPass = new WebGLSpotLightShadowRP();
        this.renderPass = new WebGPUForwardAddClusterRP();
    }

    /**
     * 设置后处理之前绘制的渲染命令
     * @param value 
     */
    setBeforeImageEffect(value: CommandBuffer[]): void {
        if (value && value.length > 0) {
            this._beforeImageEffectCMDS = value;
            value.forEach(element => element._apply(false));
        }
    }

    /**
     * 设置所有渲染都结束后绘制的渲染命令
     * @param value 
     */
    setAfterEventCmd(value: CommandBuffer[]): void {
        if (value && value.length > 0) {
            this._afterAllRenderCMDS = value;
            value.forEach(element => element._apply(false));
        }
    }
}