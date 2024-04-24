import { Laya } from "Laya";
import { PostProcess } from "laya/d3/component/PostProcess";
import { Camera, CameraClearFlags } from "laya/d3/core/Camera";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Stage } from "laya/display/Stage";
import { Event } from "laya/events/Event";
import { Button } from "laya/ui/Button";
import { Browser } from "laya/utils/Browser";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { Laya3D } from "Laya3D";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { BlurEffect } from "./BlurShader/BlurEffect";
import Client from "../../Client";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { URL } from "laya/net/URL";
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

export class PostProcess_Blur_WebGPU {
    /**实例类型*/
    private btype: any = "PostProcess_Blur";
    /**场景内按钮类型*/
    private stype: any = 0;
    private button: Button;
    private camera: Camera;
    private postProcess: PostProcess;
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

        //初始化引擎
        Laya.init(0, 0).then(() => {
            //Stat.show();
            URL.basePath = "sample-resource/";
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            Shader3D.debugMode = true;
            BlurEffect.init();
            //加载场景
            Scene3D.load("res/threeDimen/LayaScene_zhuandibanben/Conventional/zhuandibanben.ls", Handler.create(this, function (scene: Scene3D): void {
                Laya.stage.addChild(scene);

                //获取场景中的相机
                this.camera = (scene.getChildByName("MainCamera") as Camera);
                //加入摄像机移动控制脚本
                this.camera.addComponent(CameraMoveScript);
                (this.camera as Camera).clearFlag = CameraClearFlags.Sky;
                (this.camera as Camera).cullingMask ^= 2;
                (this.camera as Camera).enableHDR = false;
                var mainCamera: Camera = (scene.getChildByName("BlurCamera") as Camera);// MainCamera//(this.camera as Camera).getChildAt(0) as Camera;
                mainCamera.clearFlag = CameraClearFlags.DepthOnly;//微信平台有bug这里得换成DepthOnly
                mainCamera.cullingMask = 2;
                mainCamera.renderingOrder = 1;
                mainCamera.enableHDR = false;
                (this.camera as Camera).addChild(mainCamera);
                mainCamera.transform.localMatrix = new Matrix4x4();

                //增加后期处理
                this.postProcess = new PostProcess();

                var blurEffect: BlurEffect = new BlurEffect();
                this.postProcess.addEffect(blurEffect);
                this.camera.postProcess = this.postProcess;

                //设置模糊参数
                blurEffect.downSampleNum = 6;
                blurEffect.blurSpreadSize = 1;
                blurEffect.blurIterations = 1;

                //加载UI
                this.loadUI();
            }));
        });
    }

    /**
     *@private
     */
    loadUI(): void {
        Laya.loader.load(["res/threeDimen/ui/button.png"], Handler.create(this, function (): void {
            this.button = Laya.stage.addChild(new Button("res/threeDimen/ui/button.png", "关闭高斯模糊"));
            this.button.size(200, 40);
            this.button.labelBold = true;
            this.button.labelSize = 30;
            this.button.sizeGrid = "4,4,4,4";
            this.button.scale(Browser.pixelRatio, Browser.pixelRatio);
            this.button.pos(Laya.stage.width / 2 - this.button.width * Browser.pixelRatio / 2, Laya.stage.height - 60 * Browser.pixelRatio);
            this.button.on(Event.CLICK, this, this.stypeFun0);

        }));
    }

    stypeFun0(label: string = "关闭高斯模糊"): void {
        var enableHDR: boolean = !!this.camera.postProcess;
        if (enableHDR) {
            this.button.label = "开启高斯模糊";
            this.camera.postProcess = null;

        }
        else {
            this.button.label = "关闭高斯模糊";
            this.camera.postProcess = this.postProcess;
        }
        label = this.button.label;
        Client.instance.send({ type: "next", btype: this.btype, stype: 0, value: label });
    }
}