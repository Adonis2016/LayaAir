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
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Vector3 } from "laya/maths/Vector3";
import { Stat } from "laya/utils/Stat";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { Color } from "laya/maths/Color";
import { WebGPUStatis } from "laya/RenderDriver/WebGPUDriver/RenderDevice/WebGPUStatis/WebGPUStatis";
import { Config3D } from "Config3D";
import { WebGPURenderEngine } from "laya/RenderDriver/WebGPUDriver/RenderDevice/WebGPURenderEngine";
import { Loader } from "laya/net/Loader";
import { WebGLRender2DProcess } from "laya/RenderDriver/WebGLDriver/2DRenderPass/WebGLRender2DProcess";
import { WebGPURender2DProcess } from "laya/RenderDriver/WebGPUDriver/2DRenderPass/WebGPURender2DProcess";
import { PBRStandardMaterial } from "laya/d3/core/material/PBRStandardMaterial";
import { PostProcess } from "laya/d3/component/PostProcess";
import { BloomEffect } from "laya/d3/core/render/PostEffect/BloomEffect";
import { SkyProceduralMaterial } from "laya/d3/core/material/SkyProceduralMaterial";
import { SkyDome } from "laya/d3/resource/models/SkyDome";
import { MeshAddTangent } from "laya/RenderDriver/WebGPUDriver/RenderDevice/Utils/MeshEditor";
import { RenderTargetFormat } from "laya/RenderEngine/RenderEnum/RenderTargetFormat";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";

export class WebGPUTest_PBR2 {
    useWebGPU: boolean = true;
    usePBR: boolean = true;

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
            //Stat.show();

            const scene: Scene3D = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            //初始化天空渲染器
            const skyRenderer = scene.skyRenderer;
            //创建天空盒mesh
            skyRenderer.mesh = SkyDome.instance;
            //使用程序化天空盒
            skyRenderer.material = new SkyProceduralMaterial();

            const camera = (<Camera>(scene.addChild(new Camera(0, 0.1, 300))));
            camera.transform.translate(new Vector3(0, 0, 5));
            camera.transform.rotate(new Vector3(0, 0, 0), true, false);
            camera.clearFlag = CameraClearFlags.Sky;
            camera.msaa = true;
            if (this.useWebGPU) {
                WebGPURenderEngine._instance._config.msaa = camera.msaa;
                camera.depthTextureFormat = RenderTargetFormat.DEPTHSTENCIL_24_8;
            }
            const move = camera.addComponent(CameraMoveScript);
            move.speed = 0.005;

            const directLight = new Sprite3D();
            const dirCom = directLight.addComponent(DirectionLightCom);
            scene.addChild(directLight);
            dirCom.color.setValue(1.2, 1.2, 1.2, 1);

            //打开后处理
            // if (true) {
            //     const postProcess = new PostProcess();
            //     const bloom = new BloomEffect();
            //     postProcess.addEffect(bloom);
            //     camera.postProcess = postProcess;
            //     camera.enableHDR = true;

            //     //设置泛光参数
            //     bloom.intensity = 5;
            //     bloom.threshold = 0.9;
            //     bloom.softKnee = 0.5;
            //     bloom.clamp = 65472;
            //     bloom.diffusion = 5;
            //     bloom.anamorphicRatio = 0.0;
            //     bloom.color = new Color(1, 1, 1, 1);
            //     bloom.fastMode = true;
            // }

            const boxMesh1 = PrimitiveMesh.createBox(0.4, 0.4, 0.4);
            const coneMesh1 = PrimitiveMesh.createCone(0.2, 0.5, 64);
            const sphereMesh1 = PrimitiveMesh.createSphere(0.3, 64, 64);
            const cylinderMesh1 = PrimitiveMesh.createCylinder(0.2, 0.5, 64);
            const capsuleMesh1 = PrimitiveMesh.createCapsule(0.25, 0.75, 64, 64);
            MeshAddTangent(boxMesh1);
            MeshAddTangent(coneMesh1);
            MeshAddTangent(sphereMesh1);
            MeshAddTangent(cylinderMesh1);
            MeshAddTangent(capsuleMesh1);

            let materials = [];
            if (this.usePBR) {
                for (let i = 0; i < 5; i++)
                    materials.push(new PBRStandardMaterial());
            } else {
                for (let i = 0; i < 5; i++) {
                    const mat = new BlinnPhongMaterial();
                    mat.shininess = 1;
                    mat.specularColor = new Color(0.7, 0.7, 0.7, 1);
                    materials.push(mat);
                }
            }

            const boxS3D = [];
            const sphereS3D = [];
            const coneS3D = [];
            const cylinderS3D = [];
            const capsuleS3D = [];

            const res = [
                { url: "res/threeDimen/pbr/metal022/albedo.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/metal022/normal.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/metal022/metallicRoughness.png", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/diamondPlate008C/albedo.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/diamondPlate008C/normal.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/diamondPlate008C/metallic.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/metal042B/albedo.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/metal042B/normal.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/metal042B/metallic.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/carpet016/albedo.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/carpet016/normal.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/tiles073/albedo.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/tiles073/normal.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/rock042S/albedo.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/rock042S/normal.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/leather033B/albedo.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/leather033B/normal.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/travertine003/albedo.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/travertine003/normal.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/wood030/albedo.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/pbr/wood030/normal.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/texture/normal2.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/texture/earthMap.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/texture/九宫格512.jpg", type: Loader.TEXTURE2D },
            ];
            Laya.loader.load(res, Handler.create(this, () => {
                materials[0].albedoTexture = Laya.loader.getRes("res/threeDimen/pbr/metal022/albedo.jpg", Loader.TEXTURE2D);
                if (this.usePBR) {
                    materials[0].normalTexture = Laya.loader.getRes("res/threeDimen/pbr/metal022/normal.jpg", Loader.TEXTURE2D);
                    materials[0].metallicGlossTexture = Laya.loader.getRes("res/threeDimen/pbr/metal022/metallicRoughness.png", Loader.TEXTURE2D);
                    materials[0].normalTextureScale = 1.2;
                    materials[0].smoothnessTextureScale = 1.2;
                }
                materials[1].albedoTexture = Laya.loader.getRes("res/threeDimen/pbr/wood030/albedo.jpg", Loader.TEXTURE2D);
                if (this.usePBR) {
                    materials[1].normalTexture = Laya.loader.getRes("res/threeDimen/pbr/wood030/normal.jpg", Loader.TEXTURE2D);
                    materials[2].metallic = 0;
                    materials[1].normalTextureScale = 1;
                    materials[1].smoothnessTextureScale = 1;
                }
                materials[2].albedoTexture = Laya.loader.getRes("res/threeDimen/pbr/carpet016/albedo.jpg", Loader.TEXTURE2D);
                if (this.usePBR) {
                    materials[2].normalTexture = Laya.loader.getRes("res/threeDimen/pbr/carpet016/normal.jpg", Loader.TEXTURE2D);
                    materials[2].metallic = 0;
                    materials[2].normalTextureScale = 1;
                    materials[2].smoothnessTextureScale = 1;
                }
                materials[3].albedoTexture = Laya.loader.getRes("res/threeDimen/pbr/leather033B/albedo.jpg", Loader.TEXTURE2D);
                if (this.usePBR) {
                    materials[3].normalTexture = Laya.loader.getRes("res/threeDimen/pbr/leather033B/normal.jpg", Loader.TEXTURE2D);
                    materials[3].metallic = 0;
                    materials[3].normalTextureScale = 1;
                    materials[3].smoothnessTextureScale = 1;
                }
                materials[4].albedoTexture = Laya.loader.getRes("res/threeDimen/pbr/tiles073/albedo.jpg", Loader.TEXTURE2D);
                if (this.usePBR) {
                    materials[4].normalTexture = Laya.loader.getRes("res/threeDimen/pbr/tiles073/normal.jpg", Loader.TEXTURE2D);
                    materials[4].metallic = 0;
                    materials[4].normalTextureScale = 1;
                    materials[4].smoothnessTextureScale = 1;
                }
            }));

            const n = 5;
            for (let i = 0; i < n; i++) {
                const bs3d = scene.addChild(new Sprite3D('box'));
                boxS3D.push(bs3d);
                bs3d.transform.position = new Vector3(i - n * 0.5, -2, 0);
                bs3d.addComponent(MeshFilter).sharedMesh = boxMesh1;
                bs3d.addComponent(MeshRenderer).material = materials[i];
                //@ts-ignore
                bs3d.rotate = new Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
            }
            for (let i = 0; i < n; i++) {
                const sp3d = scene.addChild(new Sprite3D('sphere'));
                sphereS3D.push(sp3d);
                sp3d.transform.position = new Vector3(i - n * 0.5, -1, 0);
                sp3d.addComponent(MeshFilter).sharedMesh = sphereMesh1;
                sp3d.addComponent(MeshRenderer).material = materials[i];
                //@ts-ignore
                sp3d.rotate = new Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
            }
            for (let i = 0; i < n; i++) {
                const co3d = scene.addChild(new Sprite3D('cone'));
                coneS3D.push(co3d);
                co3d.transform.position = new Vector3(i - n * 0.5, 0, 0);
                co3d.addComponent(MeshFilter).sharedMesh = coneMesh1;
                co3d.addComponent(MeshRenderer).material = materials[i];
                //@ts-ignore
                co3d.rotate = new Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
            }
            for (let i = 0; i < n; i++) {
                const cy3d = scene.addChild(new Sprite3D('cylinder'));
                cylinderS3D.push(cy3d);
                cy3d.transform.position = new Vector3(i - n * 0.5, 1, 0);
                cy3d.addComponent(MeshFilter).sharedMesh = cylinderMesh1;
                cy3d.addComponent(MeshRenderer).material = materials[i];
                //@ts-ignore
                cy3d.rotate = new Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
            }
            for (let i = 0; i < n; i++) {
                const ca3d = scene.addChild(new Sprite3D('capsule'));
                capsuleS3D.push(ca3d);
                ca3d.transform.position = new Vector3(i - n * 0.5, 2, 0);
                ca3d.addComponent(MeshFilter).sharedMesh = capsuleMesh1;
                ca3d.addComponent(MeshRenderer).material = materials[i];
                //@ts-ignore
                ca3d.rotate = new Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
            }

            Laya.timer.frameLoop(1, this, () => {
                for (let i = boxS3D.length - 1; i > -1; i--)
                    boxS3D[i].transform.rotate(boxS3D[i].rotate, false);
                for (let i = sphereS3D.length - 1; i > -1; i--) {
                    sphereS3D[i].transform.rotate(sphereS3D[i].rotate, false);
                    //sphereS3D[i].transform.localPositionX += Math.cos(Laya.timer.currTimer * 0.001 + i * 0.1) * 0.1;
                    //sphereS3D[i].transform.localPositionY += Math.sin(Laya.timer.currTimer * 0.001 + i * 0.1) * 0.1;
                }
                for (let i = coneS3D.length - 1; i > -1; i--)
                    coneS3D[i].transform.rotate(coneS3D[i].rotate, false);
                for (let i = cylinderS3D.length - 1; i > -1; i--)
                    cylinderS3D[i].transform.rotate(cylinderS3D[i].rotate, false);
                for (let i = capsuleS3D.length - 1; i > -1; i--)
                    capsuleS3D[i].transform.rotate(capsuleS3D[i].rotate, false);
            });

            Laya.timer.loop(100, this, () => {
                //if (Math.random() < 0.5)
                //    material1.metallicGlossTexture = Laya.loader.getRes("res/threeDimen/pbr/metal022/metallicRoughness.png", Loader.TEXTURE2D);
                //else material1.metallicGlossTexture = null;
                //material1.emissionColor = new Color(Math.random(), Math.random(), Math.random(), 1);
                //material1.emissionIntensity = Math.sin(Laya.timer.currTimer * 0.001) * 0.25 + 0.25;
                //material1.enableEmission = true;
            });

            // if (this.useWebGPU) {
            //     Laya.timer.loop(3000, this, () => { WebGPUStatis.printFrameStatis(); });
            //     Laya.timer.once(5000, this, () => {
            //         WebGPUStatis.printStatisticsAsTable();
            //         WebGPUStatis.printTotalStatis();
            //         WebGPUStatis.printTextureStatis();
            //         console.log(WebGPURenderEngine._instance.gpuBufferMgr.namedBuffers.get('scene3D'));
            //         console.log(WebGPURenderEngine._instance.gpuBufferMgr.namedBuffers.get('camera'));
            //         console.log(WebGPURenderEngine._instance.gpuBufferMgr.namedBuffers.get('material'));
            //         console.log(WebGPURenderEngine._instance.gpuBufferMgr.namedBuffers.get('sprite3D'));
            //         console.log(WebGPURenderEngine._instance.gpuBufferMgr.namedBuffers.get('sprite3D_static'));
            //     });
            // }
        });
    }
}