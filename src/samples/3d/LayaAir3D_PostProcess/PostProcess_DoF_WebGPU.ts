import { Laya } from "Laya";
import { Stage } from "laya/display/Stage";
import { Stat } from "laya/utils/Stat";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Camera } from "laya/d3/core/Camera";
import { CameraMoveScript } from "../../3d/common/CameraMoveScript";
import { PostProcess } from "laya/d3/component/PostProcess";
import { Handler } from "laya/utils/Handler";
import { Loader } from "laya/net/Loader";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { GaussianDoF } from "laya/d3/core/render/PostEffect/GaussianDoF";
import { DepthTextureMode } from "laya/resource/RenderTexture";
import { LengencyRenderEngine3DFactory } from "laya/RenderDriver/DriverDesign/3DRenderPass/LengencyRenderEngine3DFactory";
import { Web3DRenderModuleFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/3D/Web3DRenderModuleFactory";
import { WebUnitRenderModuleDataFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/WebUnitRenderModuleDataFactory";
import { WebGLRender2DProcess } from "laya/RenderDriver/WebGLDriver/2DRenderPass/WebGLRender2DProcess";
import { WebGL3DRenderPassFactory } from "laya/RenderDriver/WebGLDriver/3DRenderPass/WebGL3DRenderPassFactory";
import { WebGLRenderDeviceFactory } from "laya/RenderDriver/WebGLDriver/RenderDevice/WebGLRenderDeviceFactory";
import { WebGLRenderEngineFactory } from "laya/RenderDriver/WebGLDriver/RenderDevice/WebGLRenderEngineFactory";
import { WebGPURender2DProcess } from "laya/RenderDriver/WebGPUDriver/2DRenderPass/WebGPURender2DProcess";
import { WebGPU3DRenderPassFactory } from "laya/RenderDriver/WebGPUDriver/3DRenderPass/WebGPU3DRenderPassFactory";
import { WebGPURenderDeviceFactory } from "laya/RenderDriver/WebGPUDriver/RenderDevice/WebGPURenderDeviceFactory";
import { WebGPURenderEngineFactory } from "laya/RenderDriver/WebGPUDriver/RenderDevice/WebGPURenderEngineFactory";
import { Laya3DRender } from "laya/d3/RenderObjs/Laya3DRender";
import { LayaGL } from "laya/layagl/LayaGL";
import { URL } from "laya/net/URL";

export class PostProcessDoF_WebGPU {
    scene: Scene3D;
    camera: Camera;

    useWebGPU: boolean = true;

    constructor() {
        LayaGL.unitRenderModuleDataFactory = new WebUnitRenderModuleDataFactory();
        Laya3DRender.renderOBJCreate = new LengencyRenderEngine3DFactory();
        Laya3DRender.Render3DModuleDataFactory = new Web3DRenderModuleFactory();

        if (this.useWebGPU) {
            LayaGL.renderOBJCreate = new WebGPURenderEngineFactory();
            LayaGL.renderDeviceFactory = new WebGPURenderDeviceFactory();
            LayaGL.render2DRenderPassFactory = new WebGPURender2DProcess();
            Laya3DRender.Render3DPassFactory = new WebGPU3DRenderPassFactory();
        } else {
            LayaGL.renderOBJCreate = new WebGLRenderEngineFactory();
            LayaGL.renderDeviceFactory = new WebGLRenderDeviceFactory();
            LayaGL.render2DRenderPassFactory = new WebGLRender2DProcess();
            Laya3DRender.Render3DPassFactory = new WebGL3DRenderPassFactory();
        }

        Laya.init(0, 0).then(() => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            URL.basePath = "sample-resource/";
            //Stat.show();

            Shader3D.debugMode = true;

            Laya.loader.load("res/threeDimen/LayaScene_zhuandibanben/Conventional/zhuandibanben.ls", Handler.create(this, this.onComplate));
        });
    }

    onComplate(): void {
        let scene: Scene3D = this.scene = Loader.createNodes("res/threeDimen/LayaScene_zhuandibanben/Conventional/zhuandibanben.ls");
        Laya.stage.addChild(scene);
        let camera: Camera = this.camera = <Camera>scene.getChildByName("MainCamera");
        camera.addComponent(CameraMoveScript);
        let mainCamera = scene.getChildByName("BlurCamera");
        mainCamera.removeSelf();
        camera.depthTextureMode |= DepthTextureMode.Depth;

        let postProcess: PostProcess = new PostProcess();
        camera.postProcess = postProcess;

        let gaussianDoF: GaussianDoF = new GaussianDoF();
        console.log(gaussianDoF);

        postProcess.addEffect(gaussianDoF);
        gaussianDoF.farStart = 1;
        gaussianDoF.farEnd = 5;
        gaussianDoF.maxRadius = 1.0;
    }
}
