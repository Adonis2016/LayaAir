import { Laya } from "Laya";
import { Camera, CameraClearFlags } from "laya/d3/core/Camera";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Stage } from "laya/display/Stage";
import { Handler } from "laya/utils/Handler";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { Laya3DRender } from "laya/d3/RenderObjs/Laya3DRender";
import { WebUnitRenderModuleDataFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/WebUnitRenderModuleDataFactory"
import { Web3DRenderModuleFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/3D/Web3DRenderModuleFactory"
import { WebGLRenderEngineFactory } from "laya/RenderDriver/WebGLDriver/RenderDevice/WebGLRenderEngineFactory";
import { WebGL3DRenderPassFactory } from "laya/RenderDriver/WebGLDriver/3DRenderPass/WebGL3DRenderPassFactory"
import { WebGLRenderDeviceFactory } from "laya/RenderDriver/WebGLDriver/RenderDevice/WebGLRenderDeviceFactory"
import { LengencyRenderEngine3DFactory } from "laya/RenderDriver/DriverDesign/3DRenderPass/LengencyRenderEngine3DFactory"
import { LayaGL } from "laya/layagl/LayaGL";
import { WebGPURenderDeviceFactory } from "laya/RenderDriver/WebGPUDriver/RenderDevice/WebGPURenderDeviceFactory";
import { WebGPU3DRenderPassFactory } from "laya/RenderDriver/WebGPUDriver/3DRenderPass/WebGPU3DRenderPassFactory";
import { WebGPURenderEngineFactory } from "laya/RenderDriver/WebGPUDriver/RenderDevice/WebGPURenderEngineFactory";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { Vector3 } from "laya/maths/Vector3";
import { Color } from "laya/maths/Color";
import { Config3D } from "Config3D";
import { WebGPURenderEngine } from "laya/RenderDriver/WebGPUDriver/RenderDevice/WebGPURenderEngine";
import { WebGLRender2DProcess } from "laya/RenderDriver/WebGLDriver/2DRenderPass/WebGLRender2DProcess";
import { WebGPURender2DProcess } from "laya/RenderDriver/WebGPUDriver/2DRenderPass/WebGPURender2DProcess";
import { PostProcess } from "laya/d3/component/PostProcess";
import { BloomEffect } from "laya/d3/core/render/PostEffect/BloomEffect";
import { SkyDome } from "laya/d3/resource/models/SkyDome";
import { RenderTargetFormat } from "laya/RenderEngine/RenderEnum/RenderTargetFormat";
import { Material } from "laya/resource/Material";
import { SkyBoxMaterial } from "laya/d3/core/material/SkyBoxMaterial";
import { URL } from "laya/net/URL";
import { Quaternion } from "laya/maths/Quaternion";
import { ShadowMode } from "laya/d3/core/light/ShadowMode";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { ShadowCascadesMode } from "laya/d3/core/light/ShadowCascadesMode";

export class WebGPUTest_Dude {
    useWebGPU: boolean = true;
    private _rotation: Vector3 = new Vector3(0, 0.01, 0);
    private _temp_position: Vector3 = new Vector3();
    private _temp_quaternion: Quaternion = new Quaternion();

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

        Laya.init(0, 0).then(async () => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            Config3D.enableDynamicBatch = false;
            URL.basePath = "sample-resource/";
            //Stat.show();

            const scene = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            // //初始化天空渲染器
            // const skyRenderer = scene.skyRenderer;
            // //创建天空盒mesh
            // skyRenderer.mesh = SkyDome.instance;
            // //使用程序化天空盒
            // skyRenderer.material = new SkyProceduralMaterial();

            //天空盒
            Material.load("res/threeDimen/skyBox/DawnDusk/SkyBox.lmat", Handler.create(this, (mat: SkyBoxMaterial) => {
                //获取相机的天空渲染器
                const skyRenderer = scene.skyRenderer;
                //创建天空盒的mesh
                skyRenderer.mesh = SkyDome.instance;
                // 设置曝光值
                mat.exposure = 1;
                //设置天空盒材质
                skyRenderer.material = mat;
            }));

            const camera = (<Camera>(scene.addChild(new Camera(0, 0.1, 300))));
            camera.transform.translate(new Vector3(0, 0.5, 5));
            camera.transform.rotate(new Vector3(-5, 0, 0), true, false);
            camera.clearFlag = CameraClearFlags.Sky;
            camera.msaa = true;
            if (this.useWebGPU) {
                WebGPURenderEngine._instance._config.msaa = camera.msaa;
                camera.depthTextureFormat = RenderTargetFormat.DEPTHSTENCIL_24_8;
            }
            const move = camera.addComponent(CameraMoveScript);
            move.speed = 0.005;

            //创建线性光源
            const directLight = new Sprite3D();
            const dirCom = directLight.addComponent(DirectionLightCom);
            scene.addChild(directLight);
            dirCom.color.setValue(0.85, 0.85, 0.85, 1);
            directLight.transform.rotate(new Vector3(-Math.PI / 3, 0, 0));

            // Use soft shadow.
            dirCom.shadowMode = ShadowMode.SoftHigh;
            // Set shadow max distance from camera.
            dirCom.shadowDistance = 10;
            // Set shadow resolution.
            dirCom.shadowResolution = 1024;
            // Set shadow cascade mode.
            dirCom.shadowCascadesMode = ShadowCascadesMode.FourCascades;
            // Set shadow normal bias.
            dirCom.shadowNormalBias = 4;

            //打开后处理
            if (true) {
                const postProcess = new PostProcess();
                const bloom = new BloomEffect();
                postProcess.addEffect(bloom);
                camera.postProcess = postProcess;
                camera.enableHDR = true;

                //设置泛光参数
                bloom.intensity = 7;
                bloom.threshold = 0.8;
                bloom.softKnee = 0.5;
                bloom.clamp = 65472;
                bloom.diffusion = 7;
                bloom.anamorphicRatio = 0.0;
                bloom.color = new Color(1, 1, 1, 1);
                bloom.fastMode = true;
            }

            //地面
            Sprite3D.load("res/threeDimen/staticModel/grid/plane.lh", Handler.create(this, (node: Sprite3D) => {
                scene.addChild(node);
                (<MeshSprite3D>node.getChildAt(0)).meshRenderer.receiveShadow = true;
            }));

            //dude骨骼动画
            Sprite3D.load("res/threeDimen/skinModel/dude/dude.lh", Handler.create(this, (node: Sprite3D) => {
                scene.addChild(node);
                node.transform.localRotationY = 180;
            }));
        });
    }
}