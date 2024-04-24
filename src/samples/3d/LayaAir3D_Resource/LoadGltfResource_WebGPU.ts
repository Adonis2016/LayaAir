import { Laya } from "Laya";
import { Stage } from "laya/display/Stage";
import { Stat } from "laya/utils/Stat";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Handler } from "laya/utils/Handler";
import { Camera } from "laya/d3/core/Camera";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { Loader } from "laya/net/Loader";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { Color } from "laya/maths/Color";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Vector3 } from "laya/maths/Vector3";
import { TextureCube } from "laya/resource/TextureCube";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
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

export class LoadGltfResource_WebGPU {
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

            //Shader3D.debugMode = true;

            this.scene = <Scene3D>Laya.stage.addChild(new Scene3D);
            this.camera = <Camera>this.scene.addChild(new Camera);
            this.camera.addComponent(CameraMoveScript);
            this.scene.ambientColor = Color.WHITE;
            this.camera.transform.position = new Vector3(0, 1, 7);

            //light
            let directlightSprite = new Sprite3D();
            let dircom = directlightSprite.addComponent(DirectionLightCom);
            this.scene.addChild(directlightSprite);
            dircom.color = new Color(0.6, 0.6, 0.6, 1);
            //设置平行光的方向
            var mat: Matrix4x4 = directlightSprite.transform.worldMatrix;
            mat.setForward(new Vector3(-1.0, -1.0, -1.0));
            directlightSprite.transform.worldMatrix = mat;

            // 配置环境反射贴图
            Laya.loader.load("res/threeDimen/LayaScene_depthNormalScene/Conventional/Assets/Scenes/depthNormalSceneGIReflection.ltcb.ls", Handler.create(this, function () {
                this.scene.ambientColor = new Color(0.858, 0.858, 0.858, 1.0);
                this.scene.reflection = Loader.getRes("res/threeDimen/LayaScene_depthNormalScene/Conventional/Assets/Scenes/depthNormalSceneGIReflection.ltcb.ls") as TextureCube;
                this.scene.reflectionDecodingFormat = 1;
                this.scene.reflectionIntensity = 1;
            }));

            var gltfResource: any[] = [
                "res/threeDimen/gltf/RiggedFigure/RiggedFigure.gltf",
                "res/threeDimen/gltf/Duck/Duck.gltf",
                "res/threeDimen/gltf/AnimatedCube/AnimatedCube.gltf"
            ];

            Laya.loader.load(gltfResource, Handler.create(this, this.onGLTFComplate));
        });
    }

    onGLTFComplate(success: boolean): void {
        if (!success) {
            // 加载失败
            console.log("gltf load failed");
            return;
        }
        var RiggedFigure: Sprite3D = Loader.createNodes("res/threeDimen/gltf/RiggedFigure/RiggedFigure.gltf");
        this.scene.addChild(RiggedFigure);
        RiggedFigure.transform.position = new Vector3(-2, 0, 0);
        console.log("RiggedFigure: This model is licensed under a Creative Commons Attribution 4.0 International License.");

        var duck: Sprite3D = Loader.createNodes("res/threeDimen/gltf/Duck/Duck.gltf");
        this.scene.addChild(duck);

        var cube: Sprite3D = Loader.createNodes("res/threeDimen/gltf/AnimatedCube/AnimatedCube.gltf");
        this.scene.addChild(cube);
        cube.transform.position = new Vector3(2.5, 0.6, 0);
        cube.transform.setWorldLossyScale(new Vector3(0.6, 0.6, 0.6));
    }
}