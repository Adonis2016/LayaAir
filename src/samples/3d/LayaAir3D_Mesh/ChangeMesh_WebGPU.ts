import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stage } from "laya/display/Stage";
import { Event } from "laya/events/Event";
import { Loader } from "laya/net/Loader";
import { Button } from "laya/ui/Button";
import { Browser } from "laya/utils/Browser";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { Laya3D } from "Laya3D";
import Client from "../../Client";
import { CameraMoveScript } from "../common/CameraMoveScript";
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
 * @author ...
 */
export class ChangeMesh_WebGPU {
    private sphere: MeshSprite3D;
    private changeActionButton: Button;
    private index: number = 0;
    private sphereMesh: Mesh;
    private box: Mesh;
    private capsule: Mesh;
    private cylinder: Mesh;
    private cone: Mesh;

    /**实例类型*/
    private btype: any = "ChangeMesh";
    /**场景内按钮类型*/
    private stype: any = 0;

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

        //初始化引擎
        Laya.init(0, 0).then(() => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            URL.basePath = "sample-resource/";
            //显示性能面板
            //Stat.show();
            //预加载所有资源
            var resource: any[] = ["res/threeDimen/scene/ChangeMaterialDemo/Conventional/scene.ls"];
            Laya.loader.load(resource, Handler.create(this, this.onPreLoadFinish));
        });
    }

    onPreLoadFinish() {
        //初始化3D场景
        var scene: Scene3D = (<Scene3D>Laya.stage.addChild(Loader.createNodes("res/threeDimen/scene/ChangeMaterialDemo/Conventional/scene.ls")));
        //获取相机
        var camera: Camera = (<Camera>scene.getChildByName("Main Camera"));
        //为相机添加视角控制组件(脚本)
        camera.addComponent(CameraMoveScript);
        //获取球型精灵
        this.sphere = (<MeshSprite3D>scene.getChildByName("Sphere"));
        //获取精灵的mesh
        this.sphereMesh = this.sphere.meshFilter.sharedMesh;
        //新建四个mesh
        console.log("创建mesh");
        this.box = this.createBox();
        this.capsule = this.createCapsule();
        this.cylinder = this.createCylinder();
        this.cone = this.createCone();
        //加载UI
        this.loadUI();
    }

    createBox(): Mesh {
        return PrimitiveMesh.createBox(0.5, 0.5, 0.5);
    }

    createCapsule(): Mesh {
        return PrimitiveMesh.createCapsule(0.25, 1, 10, 20);
    }

    createCylinder(): Mesh {
        return PrimitiveMesh.createCylinder(0.25, 1, 20);
    }

    createCone(): Mesh {
        return PrimitiveMesh.createCone(0.25, 0.75);
    }

    private loadUI(): void {
        Laya.loader.load(["res/threeDimen/ui/button.png"], Handler.create(this, function (): void {

            this.changeActionButton = (<Button>Laya.stage.addChild(new Button("res/threeDimen/ui/button.png", "切换Mesh")));
            this.changeActionButton.size(160, 40);
            this.changeActionButton.labelBold = true;
            this.changeActionButton.labelSize = 30;
            this.changeActionButton.sizeGrid = "4,4,4,4";
            this.changeActionButton.scale(Browser.pixelRatio, Browser.pixelRatio);
            this.changeActionButton.pos(Laya.stage.width / 2 - this.changeActionButton.width * Browser.pixelRatio / 2, Laya.stage.height - 100 * Browser.pixelRatio);

            this.changeActionButton.on(Event.CLICK, this, this.stypeFun0);
        }));
    }

    stypeFun0(index: number = 0): void {
        this.index++;
        if (this.index % 5 === 1) {
            //切换mesh
            this.sphere.meshFilter.sharedMesh = this.createBox();
        } else if (this.index % 5 === 2) {
            //切换mesh
            this.sphere.meshFilter.sharedMesh = this.createCapsule();
        } else if (this.index % 5 === 3) {
            //切换mesh
            this.sphere.meshFilter.sharedMesh = this.createCylinder();
        } else if (this.index % 5 === 4) {
            //切换mesh
            this.sphere.meshFilter.sharedMesh = this.createCone();
        } else {
            //切换mesh
            this.sphere.meshFilter.sharedMesh = this.sphereMesh;
        }
        index = this.index;
        Client.instance.send({ type: "next", btype: this.btype, stype: 0, value: index });
    }
}