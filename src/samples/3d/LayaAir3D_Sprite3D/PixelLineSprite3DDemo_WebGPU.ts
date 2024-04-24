import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { PixelLineSprite3D } from "laya/d3/core/pixelLine/PixelLineSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stage } from "laya/display/Stage";
import { Color } from "laya/maths/Color";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Vector3 } from "laya/maths/Vector3";
import { Stat } from "laya/utils/Stat";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { Tool } from "../common/Tool";
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

export class PixelLineSprite3DDemo_WebGPU {
    private sprite3D: Sprite3D;
    private lineSprite3D: Sprite3D;

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
            //Stat.show();

            var scene: Scene3D = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            var camera: Camera = (<Camera>scene.addChild(new Camera(0, 0.1, 100)));
            camera.transform.translate(new Vector3(0, 2, 5));
            camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
            camera.addComponent(CameraMoveScript);
            camera.clearColor = new Color(0.2, 0.2, 0.2, 1.0);
            //初始化平行光
            let directlightSprite = new Sprite3D();
            let dircom = directlightSprite.addComponent(DirectionLightCom);
            scene.addChild(directlightSprite);
            //设置平行光的方向
            var mat: Matrix4x4 = directlightSprite.transform.worldMatrix;
            mat.setForward(new Vector3(-1.0, -1.0, -1.0));
            directlightSprite.transform.worldMatrix = mat;

            this.sprite3D = (<Sprite3D>scene.addChild(new Sprite3D()));
            this.lineSprite3D = (<Sprite3D>scene.addChild(new Sprite3D()));

            //球体
            var sphere: MeshSprite3D = (<MeshSprite3D>this.sprite3D.addChild(new MeshSprite3D(PrimitiveMesh.createSphere(0.25, 20, 20))));
            sphere.transform.position = new Vector3(0.0, 0.75, 2);
            var sphereLineSprite3D: PixelLineSprite3D = (<PixelLineSprite3D>this.lineSprite3D.addChild(new PixelLineSprite3D(3500)));
            Tool.linearModel(sphere, sphereLineSprite3D, Color.GREEN);
            this.sprite3D.active = false;
            this.lineSprite3D.active = true;
        });
    }
}