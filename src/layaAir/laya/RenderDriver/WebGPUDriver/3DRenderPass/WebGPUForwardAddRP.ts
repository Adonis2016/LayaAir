import { CommandBuffer } from "../../../d3/core/render/command/CommandBuffer";
import { WebGPUForwardAddClusterRP } from "./WebGPUForwardAddClusterRP";
//import { WebGLDirectLightShadowRP } from "./WebGLDirectLightShadowRP";
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
    //directLightShadowPass: WebGLDirectLightShadowRP;

    /**enable directlight */
    enableDirectLightShadow: boolean = false;

    /**spot shadow */
    //spotLightShadowPass: WebGLSpotLightShadowRP;

    /**enable spot */
    enableSpotLightShadowPass: boolean = false;

    constructor() {
        //this.directLightShadowPass = new WebGLDirectLightShadowRP();
        //this.spotLightShadowPass = new WebGLSpotLightShadowRP();
        this.renderPass = new WebGPUForwardAddClusterRP();
    }

    setBeforeImageEffect(value: CommandBuffer[]): void {
        if (value && value.length > 0) {
            this._beforeImageEffectCMDS = value;
            value.forEach(element => {
                element._apply(false);
            });
        }
    }

    setAfterEventCmd(value: CommandBuffer[]): void {
        if (value && value.length > 0) {
            this._afterAllRenderCMDS = value;
            value.forEach(element => {
                element._apply(false);
            });
        }
    }
}