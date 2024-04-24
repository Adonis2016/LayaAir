import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { ShadowCascadesMode } from "laya/d3/core/light/ShadowCascadesMode";
import { ShadowMode } from "laya/d3/core/light/ShadowMode";
import { PBRStandardMaterial } from "laya/d3/core/material/PBRStandardMaterial";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { SkinnedMeshSprite3D } from "laya/d3/core/SkinnedMeshSprite3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Transform3D } from "laya/d3/core/Transform3D";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stage } from "laya/display/Stage";
import { Event } from "laya/events/Event";
import { Loader } from "laya/net/Loader";
import { Button } from "laya/ui/Button";
import { Browser } from "laya/utils/Browser";
import { Handler } from "laya/utils/Handler";
import { Laya3D } from "Laya3D";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { Stat } from "laya/utils/Stat";
import Client from "../../Client";
import { SkinnedMeshRenderer } from "laya/d3/core/SkinnedMeshRenderer";
import { Script } from "laya/components/Script";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
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
 * Light rotation script.
 */
class RotationScript extends Script {
    /** Roation speed. */
    autoRotateSpeed: Vector3 = new Vector3(0, 0.05, 0);
    /** If roation. */
    rotation: boolean = true;

    onUpdate(): void {
        if (this.rotation)
            (this.owner as Sprite3D).transform.rotate(this.autoRotateSpeed, false);
    }
}

/**
 * Realtime shadow sample. 
 */
export class RealTimeShadow_WebGPU {
    /**实例类型*/
    private btype: any = "RealTimeShadow";
    private rotationButton: Button;
    private rotationScript: RotationScript;

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

            Laya.loader.load([
                "res/threeDimen/staticModel/grid/plane.lh",
                "res/threeDimen/skinModel/LayaMonkey/LayaMonkey_noShadow.lh"
            ], Handler.create(this, this.onComplete));
        });
    }

    private onComplete(): void {
        var scene: Scene3D = <Scene3D>Laya.stage.addChild(new Scene3D());

        var camera: Camera = <Camera>(scene.addChild(new Camera(0, 0.1, 100)));
        camera.transform.translate(new Vector3(0, 1.2, 1.6));
        camera.transform.rotate(new Vector3(-35, 0, 0), true, false);
        const script = camera.addComponent(CameraMoveScript);
        script.speed = 0.001;

        //创建方向光
        let directlightSprite = new Sprite3D();
        let dircom = directlightSprite.addComponent(DirectionLightCom);
        scene.addChild(directlightSprite);
        dircom.color = new Color(0.85, 0.85, 0.85, 1);
        directlightSprite.transform.rotate(new Vector3(-Math.PI / 3, 0, 0));

        // Use soft shadow.
        dircom.shadowMode = ShadowMode.SoftLow;
        // Set shadow max distance from camera.
        dircom.shadowDistance = 3;
        // Set shadow resolution.
        dircom.shadowResolution = 1024;
        // Set shadow cascade mode.
        dircom.shadowCascadesMode = ShadowCascadesMode.FourCascades;
        // Set shadow normal bias.
        dircom.shadowNormalBias = 4;

        // Add rotation script to light.
        //this.rotationScript = directlightSprite.addComponent(RotationScript);

        // A plane receive shadow.
        var grid: Sprite3D = <Sprite3D>scene.addChild(Loader.createNodes("res/threeDimen/staticModel/grid/plane.lh"));
        (<MeshSprite3D>grid.getChildAt(0)).meshRenderer.receiveShadow = true;

        // A monkey cast shadow.
        var layaMonkey: Sprite3D = <Sprite3D>scene.addChild(Loader.createNodes("res/threeDimen/skinModel/LayaMonkey/LayaMonkey_noShadow.lh"));
        layaMonkey.transform.localScale = new Vector3(2, 2, 2);
        (<SkinnedMeshSprite3D>layaMonkey.getChildAt(0).getChildAt(1)).getComponent(SkinnedMeshRenderer).castShadow = true;

        // A sphere cast/receive shadow.
        var sphereSprite: MeshSprite3D = this.addPBRSphere(PrimitiveMesh.createSphere(0.1), new Vector3(0, 0.5, 0.5), scene);
        sphereSprite.meshRenderer.castShadow = true;

        // Add Light controll UI.
        //this.loadUI();
    }

    /**
     * Add one with smoothness and metallic sphere.
     */
    addPBRSphere(sphereMesh: Mesh, position: Vector3, scene: Scene3D): MeshSprite3D {
        var mat: PBRStandardMaterial = new PBRStandardMaterial();
        mat.smoothness = 0.2;

        var meshSprite: MeshSprite3D = new MeshSprite3D(sphereMesh);
        meshSprite.meshRenderer.sharedMaterial = mat;
        var transform: Transform3D = meshSprite.transform;
        transform.localPosition = position;
        scene.addChild(meshSprite);
        return meshSprite;
    }

    /**
     * Add Button control light rotation.
     */
    loadUI(): void {
        Laya.loader.load(["res/threeDimen/ui/button.png"], Handler.create(this, function (): void {
            this.rotationButton = <Button>Laya.stage.addChild(new Button("res/threeDimen/ui/button.png", "Stop Rotation"));
            this.rotationButton.size(150, 30);
            this.rotationButton.labelSize = 20;
            this.rotationButton.sizeGrid = "4,4,4,4";
            this.rotationButton.scale(Browser.pixelRatio, Browser.pixelRatio);
            this.rotationButton.pos(Laya.stage.width / 2 - this.rotationButton.width * Browser.pixelRatio / 2, Laya.stage.height - 40 * Browser.pixelRatio);
            this.rotationButton.on(Event.CLICK, this, this.stypeFun0);
        }));
    }

    stypeFun0(label: string = "Stop Rotation"): void {
        if (this.rotationScript.rotation) {
            this.rotationButton.label = "Start Rotation";
            this.rotationScript.rotation = false;
        } else {
            this.rotationButton.label = "Stop Rotation";
            this.rotationScript.rotation = true;
        }
        label = this.rotationButton.label;
        Client.instance.send({ type: "next", btype: this.btype, stype: 0, value: label });
    }
}
