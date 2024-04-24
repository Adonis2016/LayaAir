import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { SkinnedMeshRenderer } from "laya/d3/core/SkinnedMeshRenderer";
import { SkinnedMeshSprite3D } from "laya/d3/core/SkinnedMeshSprite3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Stage } from "laya/display/Stage";
import { Vector3 } from "laya/maths/Vector3";
import { Texture2D } from "laya/resource/Texture2D";
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
export class BlinnPhong_SpecularMap_WebGPU {
	private scene: Scene3D;
	private rotation: Vector3 = new Vector3(0, 0.01, 0);
	private specularMapUrl: any[] = ["res/threeDimen/skinModel/dude/Assets/dude/headS.png", "res/threeDimen/skinModel/dude/Assets/dude/jacketS.png", "res/threeDimen/skinModel/dude/Assets/dude/pantsS.png", "res/threeDimen/skinModel/dude/Assets/dude/upBodyS.png", "res/threeDimen/skinModel/dude/Assets/dude/upBodyS.png"];

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

			this.scene = (<Scene3D>Laya.stage.addChild(new Scene3D()));

			var camera: Camera = (<Camera>(this.scene.addChild(new Camera(0, 0.1, 1000))));
			camera.transform.translate(new Vector3(0, 3, 5));
			camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
			camera.addComponent(CameraMoveScript);

			let directionLight = new Sprite3D();
			let dircom = directionLight.addComponent(DirectionLightCom);
			this.scene.addChild(directionLight);
			dircom.color.setValue(1, 1, 1, 1);

			Laya.loader.load("res/threeDimen/skinModel/dude/dude.lh", Handler.create(this, this.onComplete));
		});
	}

	onComplete(): void {
		Sprite3D.load("res/threeDimen/skinModel/dude/dude.lh", Handler.create(this, (sprite: Sprite3D) => {
			var dude1: Sprite3D = (<Sprite3D>this.scene.addChild(sprite));
			dude1.transform.position = new Vector3(-1.5, 0, 0);

			var dude2: Sprite3D = Sprite3D.instantiate(dude1, this.scene, false, new Vector3(1.5, 0, 0));
			var skinnedMeshSprite3d: SkinnedMeshSprite3D = (<SkinnedMeshSprite3D>dude2.getChildAt(0).getChildAt(0));

			for (var i: number = 0; i < skinnedMeshSprite3d.getComponent(SkinnedMeshRenderer).materials.length; i++) {
				var material: BlinnPhongMaterial = (<BlinnPhongMaterial>skinnedMeshSprite3d.getComponent(SkinnedMeshRenderer).materials[i]);
				Texture2D.load(this.specularMapUrl[i], Handler.create(this, function (mat: BlinnPhongMaterial, tex: Texture2D): void {
                    mat.specularTexture = tex; //高光贴图
				}, [material]));
			}

			Laya.timer.frameLoop(1, this, function (): void {
				dude1.transform.rotate(this.rotation);
				dude2.transform.rotate(this.rotation);
			});
		}));
	}
}