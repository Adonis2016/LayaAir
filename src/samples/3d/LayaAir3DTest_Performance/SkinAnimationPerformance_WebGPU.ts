import { Laya } from "Laya";
import { Animator } from "laya/d3/component/Animator/Animator";
import { Camera } from "laya/d3/core/Camera";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Stage } from "laya/display/Stage";
import { Color } from "laya/maths/Color";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Vector3 } from "laya/maths/Vector3";
import { Button } from "laya/ui/Button";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { Laya3D } from "Laya3D";
import { CameraMoveScript } from "../common/CameraMoveScript";
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

/**
 * ...
 * @author
 */
export class SkinAnimationPerformance_WebGPU {
    private changeActionButton: Button;
    private nodeAnimator: Animator;
    private curStateIndex: number = 0;
    private clipName: any[] = ["idle", "fallingback", "idle", "walk", "Take 001"];

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

        //Config3D.debugFrustumCulling = true;
        Laya.init(0, 0).then(() => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            URL.basePath = "sample-resource/";
            //Stat.show();

            var scene: Scene3D = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            var camera: Camera = (<Camera>(scene.addChild(new Camera(0, 0.1, 1000))));
            camera.transform.translate(new Vector3(0, 1.5, 4));
            camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
            camera.addComponent(CameraMoveScript);

            let directlightSprite = new Sprite3D();
            let dircom = directlightSprite.addComponent(DirectionLightCom);
            scene.addChild(directlightSprite);
            var mat: Matrix4x4 = directlightSprite.transform.worldMatrix;
            mat.setForward(new Vector3(-1.0, -1.0, -1.0));
            directlightSprite.transform.worldMatrix = mat;
            dircom.color = new Color(1, 1, 1, 1);

            Sprite3D.load("res/threeDimen/skinModel/Zombie/Plane.lh", Handler.create(null, (plane: Sprite3D) => {
                scene.addChild(plane);
            }));

            //Sprite3D.load("test/Conventional/monkey.lh", Handler.create(null, (zombie: Sprite3D) => {
            //Sprite3D.load("test/monkey.lh", Handler.create(null, (zombie: Sprite3D) => {
            Sprite3D.load("res/threeDimen/skinModel/LayaMonkey/LayaMonkey.lh", Handler.create(null, (node: Sprite3D) => {
                for (let i = 0; i < 30; i++) {
                    for (let j = 0; j < 30; j++) {
                        node = <Sprite3D>node.clone();
                        node.transform.localPosition = new Vector3(i * 0.3 - 4.5, 0, j * 0.3 - 4.5);
                        scene.addChild(node);
                        this.nodeAnimator = (<Animator>((<Sprite3D>node.getChildAt(0))).getComponent(Animator)); //获取Animator动画组件
                    }
                }
            }));
        });
    }
}