import { Laya } from "Laya";
import { Camera, CameraClearFlags } from "laya/d3/core/Camera";
import { Material } from "laya/resource/Material";
import { PBRStandardMaterial } from "laya/d3/core/material/PBRStandardMaterial";
import { SkyBoxMaterial } from "laya/d3/core/material/SkyBoxMaterial";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { AmbientMode } from "laya/d3/core/scene/AmbientMode";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { SkyBox } from "laya/d3/resource/models/SkyBox";
import { SkyRenderer } from "laya/d3/resource/models/SkyRenderer";
import { Stage } from "laya/display/Stage";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
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

export class EnvironmentalReflection_WebGPU {
    useWebGPU: boolean = false; //加载CubeKTX没有实现
    private rotation: Vector3 = new Vector3(0, 0.01, 0);
    private sprite3D: Sprite3D;
    private scene: Scene3D = null;
    private teapot: MeshSprite3D = null;

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

            //创建场景
            var scene: Scene3D = new Scene3D();
            Laya.stage.addChild(scene);

            //设置场景的反射模式(全局有效)
            scene.sceneReflectionProb.reflectionIntensity = 1.0;
            scene.sceneReflectionProb.ambientMode = AmbientMode.SphericalHarmonics;
            scene.ambientSH = new Float32Array(
                [
                    0.12385793775320053, 0.10619205236434937, 0.08616825193166733, 0.04508036747574806, 0.045333947986364365, 0.033974453806877136, -0.06488952040672302, -0.040771741420030594, -0.017472300678491592,
                    -0.03556367754936218, -0.022215088829398155, -0.009243164211511612, -0.014421734027564526, -0.010046920739114285, -0.004614028614014387, -0.03045407310128212, -0.0210751760751009, -0.009959095157682896,
                    0.008590752258896828, 0.00588414678350091, 0.002829564269632101, 0.03831017017364502, 0.02638474479317665, 0.01317161601036787, 0.006225926335901022, 0.0029086272697895765, -0.00009956751455320045
                ]
            );

            //初始化照相机
            var camera: Camera = <Camera>scene.addChild(new Camera(0, 0.1, 100));
            camera.transform.translate(new Vector3(0, 2, 3));
            camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
            //为相机添加视角控制组件(脚本)
            camera.addComponent(CameraMoveScript);
            //设置相机的清除标识为天空盒
            camera.clearFlag = CameraClearFlags.Sky;

            //天空盒
            Material.load("res/threeDimen/skyBox/DawnDusk/SkyBox.lmat", Handler.create(this, function (mat: SkyBoxMaterial): void {
                //获取相机的天空盒渲染体
                var skyRenderer: SkyRenderer = camera.scene.skyRenderer;
                //设置天空盒mesh
                skyRenderer.mesh = SkyBox.instance;
                //设置天空盒材质
                skyRenderer.material = mat;
                //设置曝光强度
                mat.exposure = 0.6 + 1;
                // 加载ibl反射贴图
                Laya.loader.load("res/threeDimen/skyBox/DawnDusk/EnvironmentalReflection.ktx").then((res) => {
                    scene.sceneReflectionProb.iblTex = res;
                });
            }));

            //创建平行光
            let directlightSprite = new Sprite3D();
            let dircom = directlightSprite.addComponent(DirectionLightCom);
            scene.addChild(directlightSprite);
            dircom.color = new Color(0.6, 0.6, 0.6, 1);

            //加载Mesh
            Mesh.load("res/threeDimen/staticModel/teapot/teapot-Teapot001.lm", Handler.create(this, (mesh: Mesh) => {
                this.teapot = <MeshSprite3D>scene.addChild(new MeshSprite3D(mesh));
                this.teapot.transform.position = new Vector3(0, 1.75, 2);
                this.teapot.transform.rotate(new Vector3(-90, 0, 0), false, false);
                //实例PBR材质
                var pbrMat: PBRStandardMaterial = new PBRStandardMaterial();
                //设置材质的金属度，尽量高点，反射效果更明显
                pbrMat.metallic = 1;
                this.teapot.meshRenderer.material = pbrMat;
            }));
        });
    }
}