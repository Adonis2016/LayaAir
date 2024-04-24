import { RenderClearFlag } from "../../../RenderEngine/RenderEnum/RenderClearFlag";
import { RenderTargetFormat } from "../../../RenderEngine/RenderEnum/RenderTargetFormat";
import { Camera, CameraClearFlags, CameraEventFlags } from "../../../d3/core/Camera";
import { ShadowMode } from "../../../d3/core/light/ShadowMode";
import { RenderContext3D } from "../../../d3/core/render/RenderContext3D";
import { Scene3D } from "../../../d3/core/scene/Scene3D";
import { Scene3DShaderDeclaration } from "../../../d3/core/scene/Scene3DShaderDeclaration";
import { DepthPass } from "../../../d3/depthMap/DepthPass";
import { Viewport } from "../../../d3/math/Viewport";
import { ShadowCasterPass } from "../../../d3/shadowMap/ShadowCasterPass";
import { Vector4 } from "../../../maths/Vector4";
import { DepthTextureMode, RenderTexture } from "../../../resource/RenderTexture";
import { Stat } from "../../../utils/Stat";
import { IRender3DProcess } from "../../DriverDesign/3DRenderPass/I3DRenderPass";
import { RTCameraNodeData } from "../../RenderModuleData/RuntimeModuleData/3D/RT3DRenderModuleData";
import { RTBaseRenderNode } from "../../RenderModuleData/RuntimeModuleData/3D/RTBaseRenderNode";
import { RTDirectLight } from "../../RenderModuleData/RuntimeModuleData/3D/RTDirectLight";
import { GLESForwardAddRP } from "./GLESForwardAddRP";
import { GLESRenderContext3D } from "./GLESRenderContext3D";
const viewport = new Viewport(0, 0, 0, 0);

export class GLESRender3DProcess implements IRender3DProcess {
    private _nativeObj: any;
    private _tempList: any = [];
    private renderpass: GLESForwardAddRP = new GLESForwardAddRP();
    constructor() {
        this._nativeObj = new (window as any).conchGLESRender3DProcess();
    }

    initRenderpass(camera: Camera, context: GLESRenderContext3D) {
        let renderpass = this.renderpass.renderpass;

        let renderRT = camera._getRenderTexture();
      

        // clear
        let clearConst = 0;
        let clearFlag = camera.clearFlag;

        if (clearFlag == CameraClearFlags.Sky && !camera.scene.skyRenderer._isAvailable()) {
            clearFlag = CameraClearFlags.SolidColor;
        }

        let hasStencil = renderRT.depthStencilFormat == RenderTargetFormat.DEPTHSTENCIL_24_8;
        let stencilFlag = hasStencil ? RenderClearFlag.Stencil : 0;

        switch (clearFlag) {
            case CameraClearFlags.DepthOnly:
            case CameraClearFlags.Sky:
                clearConst = RenderClearFlag.Depth | stencilFlag;
                break;
            case CameraClearFlags.Nothing:
                clearConst = 0;
                break;
            case CameraClearFlags.ColorOnly:
                clearConst = RenderClearFlag.Color;
                break;
            case CameraClearFlags.SolidColor:
            default:
                clearConst = RenderClearFlag.Color | RenderClearFlag.Depth | stencilFlag;
                break;
        }

        let clearValue = camera._linearClearColor;
        clearValue = renderRT.gammaCorrection != 1 ? camera.clearColor : camera._linearClearColor;

        renderpass.camera = <RTCameraNodeData>camera._renderDataModule;

        renderpass.destTarget = renderRT._renderTarget;
        renderpass.clearFlag = clearConst;
        renderpass.clearColor = clearValue;

        viewport.set(0, 0, renderRT.width, renderRT.height);

        renderpass.setViewPort(viewport);
        let scissor = Vector4.tempVec4;
        scissor.setValue(viewport.x, viewport.y, viewport.width, viewport.height);
        // todo
        renderpass.setScissor(scissor);

        renderpass.enableOpaque = Stat.enableOpaque;
        renderpass.enableTransparent = Stat.enableTransparent;
        renderpass.enableCMD = Stat.enableCameraCMD;
        renderpass.setBeforeSkyboxCmds(camera._cameraEventCommandBuffer[CameraEventFlags.BeforeSkyBox]);
        renderpass.setBeforeForwardCmds(camera._cameraEventCommandBuffer[CameraEventFlags.BeforeForwardOpaque]);
        renderpass.setBeforeTransparentCmds(camera._cameraEventCommandBuffer[CameraEventFlags.BeforeTransparent]);
        this.renderpass.setBeforeImageEffect(camera._cameraEventCommandBuffer[CameraEventFlags.BeforeImageEffect]);
        this.renderpass.setAfterEventCmd(camera._cameraEventCommandBuffer[CameraEventFlags.AfterEveryThing]);

        renderpass.setCameraCullInfo(camera);

        if (clearFlag == CameraClearFlags.Sky) {
            renderpass.skyRenderNode = <RTBaseRenderNode>camera.scene.skyRenderer._baseRenderNode;
        }
        else {
            renderpass.skyRenderNode = null;
        }

        // todo 
        renderpass.pipelineMode = RenderContext3D._instance.configPipeLineMode;

        let enableShadow = Scene3D._updateMark % camera.scene._ShadowMapupdateFrequency == 0 && Stat.enableShadow;
        this.renderpass.shadowCastPass = enableShadow;

        if (enableShadow) {
            // direction light shadow
            let mainDirectionLight = camera.scene._mainDirectionLight;
            let needDirectionShadow = mainDirectionLight && mainDirectionLight.shadowMode != ShadowMode.None;
            if (needDirectionShadow) {
                camera.scene._shaderValues.addDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW);
            }
            else {
                camera.scene._shaderValues.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW);
            }

            this.renderpass.enableDirectLightShadow = needDirectionShadow;
            if (needDirectionShadow) {
                this.renderpass.directLightShadowPass.camera = <RTCameraNodeData>camera._renderDataModule;
                this.renderpass.directLightShadowPass.light = <RTDirectLight>mainDirectionLight._dataModule;
                let directionShadowMap = Scene3D._shadowCasterPass.getDirectLightShadowMap(mainDirectionLight);
                this.renderpass.directLightShadowPass.destTarget = directionShadowMap._renderTarget;

                camera.scene._shaderValues.setTexture(ShadowCasterPass.SHADOW_MAP, directionShadowMap);
            }

            // spot light shadow
            let mainSpotLight = camera.scene._mainSpotLight;
            let needSpotShadow = mainSpotLight && mainSpotLight.shadowMode != ShadowMode.None;
            if (needSpotShadow) {
                camera.scene._shaderValues.addDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_SPOT);
            }
            else {
                camera.scene._shaderValues.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_SPOT);
            }
            this.renderpass.enableSpotLightShadowPass = needSpotShadow;
            if (needSpotShadow) {
                this.renderpass.spotLightShadowPass.light = mainSpotLight;
                let spotShadowMap = Scene3D._shadowCasterPass.getSpotLightShadowPassData(mainSpotLight);
                this.renderpass.spotLightShadowPass.destTarget = spotShadowMap._renderTarget;

                camera.scene._shaderValues.setTexture(ShadowCasterPass.SHADOW_SPOTMAP, spotShadowMap);
            }

            if (Stat.enablePostprocess && camera.postProcess && camera.postProcess.enable) {
                this.renderpass.enablePostProcess = camera.postProcess.enable;
                camera.postProcess._render(camera);
                this.renderpass.postProcess = camera.postProcess._context.command;
            } else {
                this.renderpass.enablePostProcess = false;
            }
        }
    }

    renderDepth(camera: Camera) {

        let depthMode = camera.depthTextureMode;
        if (camera.postProcess && camera.postProcess.enable) {
            depthMode |= camera.postProcess.cameraDepthTextureMode;
        }
        if ((depthMode & DepthTextureMode.Depth) != 0) {
            let needDepthTex = camera.canblitDepth && camera._internalRenderTexture.depthStencilTexture;
            if (needDepthTex) {
                camera.depthTexture = camera._cacheDepthTexture.depthStencilTexture;
                // @ts-ignore
                Camera.depthPass._depthTexture = camera.depthTexture;
                camera._shaderValues.setTexture(DepthPass.DEPTHTEXTURE, camera.depthTexture);
                Camera.depthPass._setupDepthModeShaderValue(DepthTextureMode.Depth, camera);
                depthMode &= ~DepthTextureMode.Depth;
            }
            else {
                Camera.depthPass.getTarget(camera, DepthTextureMode.Depth, camera.depthTextureFormat);
                this.renderpass.renderpass.depthTarget = (<RenderTexture>camera.depthTexture)._renderTarget;
                camera._shaderValues.setTexture(DepthPass.DEPTHTEXTURE, camera.depthTexture);
            }
        }
        if ((depthMode & DepthTextureMode.DepthNormals) != 0) {
            Camera.depthPass.getTarget(camera, DepthTextureMode.DepthNormals, camera.depthTextureFormat);
            this.renderpass.renderpass.depthNormalTarget = (<RenderTexture>camera.depthNormalTexture)._renderTarget;
            camera._shaderValues.setTexture(DepthPass.DEPTHNORMALSTEXTURE, camera.depthNormalTexture);
        }

        this.renderpass.renderpass.depthTextureMode = depthMode;
    }

    fowardRender(context: GLESRenderContext3D, camera: Camera): void {
        this.initRenderpass(camera, context);

        this.renderDepth(camera);

        let renderList = camera.scene.sceneRenderableManager.renderBaselist;

        this.renderFowarAddCameraPass(context, this.renderpass, <RTBaseRenderNode[]>renderList.elements, renderList.length);
        Camera.depthPass.cleanUp();
    }

    renderFowarAddCameraPass(context: GLESRenderContext3D, renderpass: GLESForwardAddRP, list: RTBaseRenderNode[], count: number): void {
        this._tempList.length = 0;
        list.forEach((element) => {
            this._tempList.push((element as any)._nativeObj);
        });
        this._nativeObj.renderFowarAddCameraPass(context._nativeObj, renderpass._nativeObj, this._tempList, count);
    }

}