import { Laya } from "Laya";
import { Stage } from "laya/display/Stage";
import { Camera } from "laya/d3/core/Camera";
import { LightSprite } from "laya/d3/core/light/LightSprite";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Transform3D } from "laya/d3/core/Transform3D";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { Script } from "laya/components/Script";
import { Vector3 } from "laya/maths/Vector3";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { PointLightCom } from "laya/d3/core/light/PointLightCom";
import { SpotLightCom } from "laya/d3/core/light/SpotLightCom";
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

class LightMoveScript extends Script {
    forward: Vector3 = new Vector3();
    lights: Sprite3D[] = [];
    offsets: Vector3[] = [];
    moveRanges: Vector3[] = [];

    onUpdate(): void {
        var seed: number = Laya.timer.currTimer * 0.002;
        for (var i: number = 0, n: number = this.lights.length; i < n; i++) {
            var transform: Transform3D = this.lights[i].transform;
            var pos: Vector3 = transform.localPosition;
            var off: Vector3 = this.offsets[i];
            var ran: Vector3 = this.moveRanges[i];
            pos.x = off.x + Math.sin(seed) * ran.x;
            pos.y = off.y + Math.sin(seed) * ran.y;
            pos.z = off.z + Math.sin(seed) * ran.z;
            transform.localPosition = pos;
        }
    }
}

export class MultiLight_WebGPU {
    useWebGPU: boolean = false;

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

            Scene3D.load("sample-resource/res/threeDimen/scene/MultiLightScene/InventoryScene_Forest.ls", Handler.create(this, function (scene: Scene3D): void {
                Laya.stage.addChild(scene);

                var camera: Camera = <Camera>scene.getChildByName("Main Camera");
                camera.addComponent(CameraMoveScript);
                camera.transform.localPosition = new Vector3(8.937199060699333, 61.364798067809126, -66.77836086472654);

                var moveScript: LightMoveScript = camera.addComponent(LightMoveScript);
                var moverLights: Sprite3D[] = moveScript.lights;
                var offsets: Vector3[] = moveScript.offsets;
                var moveRanges: Vector3[] = moveScript.moveRanges;
                moverLights.length = 15;
                for (var i: number = 0; i < 15; i++) {
                    let pointlightSprite = new Sprite3D();
                    let pointcom = pointlightSprite.addComponent(PointLightCom);
                    scene.addChild(pointlightSprite);

                    pointcom.range = 2.0 + Math.random() * 8.0;
                    pointcom.color.setValue(Math.random(), Math.random(), Math.random(), 1);
                    pointcom.intensity = 6.0 + Math.random() * 8;
                    moverLights[i] = pointlightSprite;
                    offsets[i] = new Vector3((Math.random() - 0.5) * 10, pointcom.range * 0.75, (Math.random() - 0.5) * 10);
                    moveRanges[i] = new Vector3((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
                }
                let spotLight = new Sprite3D();
                let spotCom = spotLight.addComponent(SpotLightCom);
                scene.addChild(spotLight);

                spotLight.transform.localPosition = new Vector3(0.0, 9.0, -35.0);
                spotLight.transform.localRotationEuler = new Vector3(-15.0, 180.0, 0.0);
                spotCom.color.setValue(Math.random(), Math.random(), Math.random(), 1);
                spotCom.range = 50;
                spotCom.intensity = 15;
                spotCom.spotAngle = 60;
            }));
        });
    }
}