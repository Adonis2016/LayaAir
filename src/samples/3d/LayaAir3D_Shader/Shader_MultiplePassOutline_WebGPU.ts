import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { Stage } from "laya/display/Stage";
import { Color } from "laya/maths/Color";
import { Quaternion } from "laya/maths/Quaternion";
import { Vector3 } from "laya/maths/Vector3";
import { Texture2D } from "laya/resource/Texture2D";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { Laya3D } from "Laya3D";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { MultiplePassOutlineMaterial } from "./customMaterials/MultiplePassOutlineMaterial";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { LayaGL } from "laya/layagl/LayaGL";
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
import { URL } from "laya/net/URL";

export class Shader_MultiplePassOutline_WebGPU {
    private rotation: Vector3 = new Vector3(0, 0.01, 0);
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
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            URL.basePath = "sample-resource/";
            //显示性能面板
            //Stat.show();

            //初始化Shader
            MultiplePassOutlineMaterial.initShader();
            //创建场景
            var scene: Scene3D = (<Scene3D>Laya.stage.addChild(new Scene3D()));
            //创建相机
            var camera: Camera = (<Camera>(scene.addChild(new Camera(0, 0.1, 1000))));
            camera.transform.translate(new Vector3(0, 0.85, 1.7));
            camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
            camera.addComponent(CameraMoveScript);

            //创建平行光
            let directlightSprite = new Sprite3D();
            let dircom = directlightSprite.addComponent(DirectionLightCom);
            scene.addChild(directlightSprite);
            dircom.color = new Color(1, 1, 1, 1);
            Mesh.load("res/threeDimen/skinModel/LayaMonkey/Assets/LayaMonkey/LayaMonkey-LayaMonkey.lm", Handler.create(this, function (mesh: Mesh): void {
                var layaMonkey: MeshSprite3D = (<MeshSprite3D>scene.addChild(new MeshSprite3D(mesh)));
                layaMonkey.transform.localScale = new Vector3(0.3, 0.3, 0.3);
                layaMonkey.transform.rotation = new Quaternion(0.7071068, 0, 0, -0.7071067);
                var customMaterial: MultiplePassOutlineMaterial = new MultiplePassOutlineMaterial();
                //漫反射贴图
                Texture2D.load("res/threeDimen/skinModel/LayaMonkey/Assets/LayaMonkey/diffuse.png", Handler.create(this, function (texture: Texture2D): void {
                    customMaterial.albedoTexture = texture;
                }));
                layaMonkey.meshRenderer.sharedMaterial = customMaterial;

                Laya.timer.frameLoop(1, this, function (): void {
                    layaMonkey.transform.rotate(this.rotation, false);
                });
            }));
        });
    }
}