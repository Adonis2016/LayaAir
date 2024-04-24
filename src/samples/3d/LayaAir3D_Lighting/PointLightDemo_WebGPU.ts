import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Stage } from "laya/display/Stage";
import { Color } from "laya/maths/Color";
import { Quaternion } from "laya/maths/Quaternion";
import { Vector3 } from "laya/maths/Vector3";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { PointLightCom } from "laya/d3/core/light/PointLightCom";
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
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { ShadowMode } from "laya/d3/core/light/ShadowMode";

/**
 * ...
 * @author ...
 */
export class PointLightDemo_WebGPU {
    private _temp_position: Vector3 = new Vector3();
    private _temp_quaternion: Quaternion = new Quaternion();

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

            //创建场景
            var scene: Scene3D = (<Scene3D>Laya.stage.addChild(new Scene3D()));
            //设置场景环境光颜色
            scene.ambientColor = new Color(0.1, 0.1, 0.1);

            //创建相机
            var camera: Camera = (<Camera>(scene.addChild(new Camera(0, 0.1, 1000))));
            camera.transform.translate(new Vector3(0, 0.7, 1.3));
            camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
            camera.addComponent(CameraMoveScript);

            //创建点光源
            let pointLight = new Sprite3D();
            let pointCom = pointLight.addComponent(PointLightCom);
            scene.addChild(pointLight);
            //点光源的颜色
            pointCom.color = new Color(1, 1, 1, 1);
            //设置点光源的范围
            pointCom.range = 2;
            pointCom.intensity = 3;
            pointLight.transform.position = new Vector3(0.5, 1, 0);

            // Use soft shadow.
            pointCom.shadowMode = ShadowMode.Hard;
            // Set shadow max distance from camera.
            pointCom.shadowDistance = 3;
            // Set shadow resolution.
            pointCom.shadowResolution = 1024;
            // Set shadow normal bias.
            pointCom.shadowNormalBias = 4;

            //加载地面
            Sprite3D.load("res/threeDimen/staticModel/grid/plane.lh", Handler.create(this, function (sprite: Sprite3D): void {
                var grid: Sprite3D = (<Sprite3D>scene.addChild(sprite));
                (<MeshSprite3D>sprite.getChildAt(0)).meshRenderer.receiveShadow = true;
                //加载猴子精灵
                Sprite3D.load("res/threeDimen/skinModel/LayaMonkey/LayaMonkey.lh", Handler.create(this, function (layaMonkey: Sprite3D): void {
                    scene.addChild(layaMonkey);
                    //设置时钟定时执行
                    Laya.timer.frameLoop(1, this, function (): void {
                        //从欧拉角生成四元数（顺序为Yaw、Pitch、Roll）
                        Quaternion.createFromYawPitchRoll(0.025, 0, 0, this._temp_quaternion);
                        //根据四元数旋转三维向量
                        Vector3.transformQuat(pointLight.transform.position, this._temp_quaternion, this._temp_position);
                        pointLight.transform.position = this._temp_position;
                    });
                }));
            }));
        });
    }
}