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
import { Material } from "laya/resource/Material";
import { SkyRenderer } from "laya/d3/resource/models/SkyRenderer";
import { SkyBoxMaterial } from "laya/d3/core/material/SkyBoxMaterial";
import { Script } from "laya/components/Script";
import { Event } from "laya/events/Event";
import { AmbientMode } from "laya/d3/core/scene/AmbientMode";
import { Animator } from "laya/d3/component/Animator/Animator";
import { URL } from "laya/net/URL";
import { EffectMaterial } from "laya/d3/core/material/EffectMaterial";
import { Texture2D } from "laya/resource/Texture2D";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { Quaternion } from "laya/maths/Quaternion";
import { Transform3D } from "laya/d3/core/Transform3D";
import { PointLightCom } from "laya/d3/core/light/PointLightCom";
import { SpotLightCom } from "laya/d3/core/light/SpotLightCom";
import { ShadowMode } from "laya/d3/core/light/ShadowMode";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { ShadowCascadesMode } from "laya/d3/core/light/ShadowCascadesMode";
import { SkinnedMeshRenderer } from "laya/d3/core/SkinnedMeshRenderer";

class LightMoveScript extends Script {
    lights: Sprite3D[] = [];
    offsets: Vector3[] = [];
    moveRanges: Vector3[] = [];

    onUpdate(): void {
        const seed = Laya.timer.currTimer * 0.002;
        for (let i = 0, n = this.lights.length; i < n; i++) {
            const transform = this.lights[i].transform;
            const pos = transform.localPosition;
            const off = this.offsets[i];
            const ran = this.moveRanges[i];
            pos.x = off.x + Math.sin(seed) * ran.x;
            pos.y = off.y + Math.sin(seed) * ran.y;
            pos.z = off.z + Math.sin(seed) * ran.z;
            transform.localPosition = pos;
        }
    }
}

class RotationScript extends Script {
    model: Sprite3D;
    private _lastMouseX: number;
    private _mouseDown: boolean = false;
    private _rotate: Vector3 = new Vector3();
    private _autoRotateSpeed: Vector3 = new Vector3(0, 0.25, 0);

    constructor() {
        super();
        Laya.stage.on(Event.MOUSE_DOWN, this, () => {
            this._mouseDown = true;
            this._lastMouseX = Laya.stage.mouseX;
        });
        Laya.stage.on(Event.MOUSE_UP, this, () => {
            this._mouseDown = false;
        });

    }

    onUpdate(): void {
        if (this._mouseDown) {
            const deltaX = Laya.stage.mouseX - this._lastMouseX;
            this._rotate.y = deltaX * 0.2;
            this.model.transform.rotate(this._rotate, false, false);
            this._lastMouseX = Laya.stage.mouseX;
        }
        else this.model.transform.rotate(this._autoRotateSpeed, false, false);
    }
}

export class WebGPUTest_Empty {
    useWebGPU: boolean = true;
    usePBR: boolean = true;
    private _rotation: Vector3 = new Vector3(0, 0.01, 0);
    private _temp_position: Vector3 = new Vector3();
    private _temp_quaternion: Quaternion = new Quaternion();

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
            URL.basePath = "sample-resource/";
            //Stat.show();

            const scene = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            // //初始化天空渲染器
            // const skyRenderer = scene.skyRenderer;
            // //创建天空盒mesh
            // skyRenderer.mesh = SkyDome.instance;
            // //使用程序化天空盒
            // skyRenderer.material = new SkyProceduralMaterial();

            //天空盒
            Material.load("res/threeDimen/skyBox/DawnDusk/SkyBox.lmat", Handler.create(this, (mat: SkyBoxMaterial) => {
                //获取相机的天空渲染器
                const skyRenderer = scene.skyRenderer;
                //创建天空盒的mesh
                skyRenderer.mesh = SkyDome.instance;
                // 设置曝光值
                mat.exposure = 1;
                //设置天空盒材质
                skyRenderer.material = mat;
            }));

            const camera = (<Camera>(scene.addChild(new Camera(0, 0.1, 300))));
            camera.transform.translate(new Vector3(0, 0.5, 5));
            camera.transform.rotate(new Vector3(-5, 0, 0), true, false);
            camera.clearFlag = CameraClearFlags.Sky;
            camera.msaa = true;
            if (this.useWebGPU) {
                WebGPURenderEngine._instance._config.msaa = camera.msaa;
                camera.depthTextureFormat = RenderTargetFormat.DEPTHSTENCIL_24_8;
            }
            const move = camera.addComponent(CameraMoveScript);
            move.speed = 0.005;

            //创建线性光源
            const directLight = new Sprite3D();
            const dirCom = directLight.addComponent(DirectionLightCom);
            scene.addChild(directLight);
            dirCom.color.setValue(0.85, 0.85, 0.85, 1);
            directLight.transform.rotate(new Vector3(-Math.PI / 3, 0, 0));

            // Use soft shadow.
            dirCom.shadowMode = ShadowMode.SoftHigh;
            // Set shadow max distance from camera.
            dirCom.shadowDistance = 5;
            // Set shadow resolution.
            dirCom.shadowResolution = 1024;
            // Set shadow cascade mode.
            dirCom.shadowCascadesMode = ShadowCascadesMode.FourCascades;
            // Set shadow normal bias.
            dirCom.shadowNormalBias = 4;

            //创建点光源
            const pointLight = new Sprite3D();
            const pointCom = pointLight.addComponent(PointLightCom);
            scene.addChild(pointLight);
            pointCom.color = new Color(0, 1, 0, 1);
            pointCom.range = 3;
            pointCom.intensity = 3;
            pointLight.transform.position = new Vector3(0.5, 1, 0);

            //创建点光源2
            {
                const pointLight = new Sprite3D();
                const pointCom = pointLight.addComponent(PointLightCom);
                scene.addChild(pointLight);
                pointCom.color = new Color(1, 0, 1, 1);
                pointCom.range = 2;
                pointCom.intensity = 2;
                pointLight.transform.position = new Vector3(1, 0.5, 1);
            }

            //创建聚光灯
            const spotlightSprite = new Sprite3D();
            const spotCom = spotlightSprite.addComponent(SpotLightCom);
            scene.addChild(spotlightSprite);

            //设置聚光灯颜色
            spotCom.color = new Color(1, 0, 0, 1);
            spotlightSprite.transform.position = new Vector3(0.0, 1.5, 0.0);
            //设置聚光灯的方向
            const mat = spotlightSprite.transform.worldMatrix;
            mat.setForward(new Vector3(0.15, -1.0, 0.0));
            spotlightSprite.transform.worldMatrix = mat;
            //设置聚光灯范围
            spotCom.range = 2;
            spotCom.intensity = 10;
            //设置聚光灯锥形角度
            spotCom.spotAngle = 45;

            // Use soft shadow.
            spotCom.shadowMode = ShadowMode.SoftHigh;
            // Set shadow max distance from camera.
            spotCom.shadowDistance = 3;
            // Set shadow resolution.
            spotCom.shadowResolution = 1024;
            // Set shadow normal bias.
            spotCom.shadowNormalBias = 4;

            //打开后处理
            if (true) {
                const postProcess = new PostProcess();
                const bloom = new BloomEffect();
                postProcess.addEffect(bloom);
                camera.postProcess = postProcess;
                camera.enableHDR = true;

                //设置泛光参数
                bloom.intensity = 7;
                bloom.threshold = 0.8;
                bloom.softKnee = 0.5;
                bloom.clamp = 65472;
                bloom.diffusion = 7;
                bloom.anamorphicRatio = 0.0;
                bloom.color = new Color(1, 1, 1, 1);
                bloom.fastMode = true;
            }

            // 演示头盔模型
            // Scene3D.load("res/threeDimen/scene/LayaScene_DamagedHelmetScene/Conventional/DamagedHelmetScene.ls", Handler.create(this, (scene: Scene3D) => {
            //     Laya.stage.addChild(scene);
            //     const damagedHelmet = <Sprite3D>scene.getChildAt(1).getChildAt(0);
            //     const rotationScript: RotationScript = damagedHelmet.addComponent(RotationScript);
            //     rotationScript.model = damagedHelmet;
            // }));

            // 演示枪模型
            // Scene3D.load("res/threeDimen/scene/LayaScene_CerberusScene/Conventional/CerberusScene.ls", Handler.create(this, (scene: Scene3D) => {
            // 	Laya.stage.addChild(scene);
            // 	scene.ambientMode = AmbientMode.SphericalHarmonics;
            // 	const model = <Sprite3D>scene.getChildByName("Cerberus_LP");
            // 	const rotationScript: RotationScript = model.addComponent(RotationScript);
            // 	rotationScript.model = model;
            // }));

            // 演示城市模型（WebGL也报错）
            // Scene3D.load("res/threeDimen/scene/LayaScene_city01/Conventional/city01.ls", Handler.create(null, (scene: Scene3D) => {
            // 	Laya.stage.addChild(scene);
            // 	const camera = <Camera>scene.getChildByName("Camera");
            // 	camera.addComponent(CameraMoveScript);
            // }));

            // 演示胖子骨骼动画模型
            Sprite3D.load("res/threeDimen/skinModel/BoneLinkScene/PangZi.lh", Handler.create(this, (node: Sprite3D) => {
                scene.addChild(node);
                node.transform.localPositionZ = -2;
                const node2 = node.clone() as Sprite3D;
                scene.addChild(node2);
                node2.transform.localPositionX = 2;
                node2.transform.localPositionZ = -2;
            }));

            // 演示dude骨骼动画模型
            // Sprite3D.load("res/threeDimen/skinModel/dude/dude.lh", Handler.create(this, (node: Sprite3D) => {
            //     scene.addChild(node);
            // }));

            // 演示僵尸骨骼动画模型（WebGL也没有显示模型）
            // Sprite3D.load("res/threeDimen/skinModel/Zombie/Zombie.lh", Handler.create(this, (node: Sprite3D) => {
            //     scene.addChild(node);
            // }));

            // 演示Effect材质
            // const earth = (<Sprite3D>scene.addChild(new Sprite3D()));
            // earth.addComponent(MeshFilter).sharedMesh = PrimitiveMesh.createSphere();
            // const meshRenderer = earth.addComponent(MeshRenderer);
            // const material = new EffectMaterial();
            // meshRenderer.material = material;
            // material.color = new Color(0.8, 0.8, 0.8, 1);
            // Texture2D.load("res/threeDimen/texture/earth.png", Handler.create(this, (texture: Texture2D) => {
            //     material.texture = texture; //设置纹理
            // }));
            // Laya.timer.frameLoop(1, this, () => {
            //     earth.transform.rotate(this._rotation, false);
            // });

            // 水面颜色（没有成功）
            // Scene3D.load("res/threeDimen/scene/LayaScene_water/Conventional/Default.ls", Handler.create(this, (scene: Scene3D) => {
            //     Laya.stage.addChild(scene);
            //     const camera = (<Camera>scene.getChildByName("Main Camera"));
            //     camera.addComponent(CameraMoveScript);
            // }));

            // 加载Laya猴子模型
            // Mesh.load("res/threeDimen/skinModel/LayaMonkey/Assets/LayaMonkey/LayaMonkey-LayaMonkey.lm", Handler.create(this, (mesh: Mesh) => {
            //     const layaMonkey = (<Sprite3D>scene.addChild(new Sprite3D()));
            //     const meshRenderer = layaMonkey.addComponent(MeshRenderer);
            //     layaMonkey.addComponent(MeshFilter).sharedMesh = mesh;
            //     layaMonkey.transform.localScale = new Vector3(0.3, 0.3, 0.3);
            //     layaMonkey.transform.rotation = new Quaternion(0.7071, 0, 0, -0.7071);
            //     Material.load("res/threeDimen/skinModel/LayaMonkey/Assets/LayaMonkey/Materials/T_Diffuse.lmat", Handler.create(this, (mat: Material) => {
            //         meshRenderer.material = mat;
            //     }));
            //     Laya.timer.frameLoop(1, this, () => {
            //         layaMonkey.transform.rotate(this._rotation, false);
            //     });
            // }));

            // 演示多灯光效果（没有成功）
            // Scene3D.load("res/threeDimen/scene/MultiLightScene/InventoryScene_Forest.ls", Handler.create(this, (scene: Scene3D) => {
            //     Laya.stage.addChild(scene);

            //     var camera: Camera = <Camera>scene.getChildByName("Main Camera");
            //     camera.addComponent(CameraMoveScript);
            //     camera.transform.localPosition = new Vector3(8.9371, 61.3647, -66.7783);

            //     var moveScript: LightMoveScript = camera.addComponent(LightMoveScript);
            //     var moverLights: Sprite3D[] = moveScript.lights;
            //     var offsets: Vector3[] = moveScript.offsets;
            //     var moveRanges: Vector3[] = moveScript.moveRanges;
            //     moverLights.length = 15;
            //     for (var i: number = 0; i < 15; i++) {
            //         let pointlightSprite = new Sprite3D();
            //         let pointcom = pointlightSprite.addComponent(PointLightCom);
            //         scene.addChild(pointlightSprite);

            //         pointcom.range = 2.0 + Math.random() * 8.0;
            //         pointcom.color.setValue(Math.random(), Math.random(), Math.random(), 1);
            //         pointcom.intensity = 6.0 + Math.random() * 8;
            //         moverLights[i] = pointlightSprite;
            //         offsets[i] = new Vector3((Math.random() - 0.5) * 10, pointcom.range * 0.75, (Math.random() - 0.5) * 10);
            //         moveRanges[i] = new Vector3((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
            //     }
            //     let spotLight = new Sprite3D();
            //     let spotCom = spotLight.addComponent(SpotLightCom);
            //     scene.addChild(spotLight);

            //     spotLight.transform.localPosition = new Vector3(0.0, 9.0, -35.0);
            //     spotLight.transform.localRotationEuler = new Vector3(-15.0, 180.0, 0.0);
            //     spotCom.color.setValue(Math.random(), Math.random(), Math.random(), 1);
            //     spotCom.range = 50;
            //     spotCom.intensity = 15;
            //     spotCom.spotAngle = 60;
            // }));

            // 演示猴子骨骼动画
            Sprite3D.load("res/threeDimen/staticModel/grid/plane.lh", Handler.create(this, (sprite: Sprite3D) => {
                //地面
                scene.addChild(sprite);
                (<MeshSprite3D>sprite.getChildAt(0)).meshRenderer.receiveShadow = true;
                //猴子
                Sprite3D.load("res/threeDimen/skinModel/LayaMonkey/LayaMonkey.lh", Handler.create(this, (layaMonkey: Sprite3D) => {
                    scene.addChild(layaMonkey);
                    layaMonkey.transform.setWorldLossyScale(new Vector3(3, 3, 3)); //@ts-ignore
                    const monkey2 = layaMonkey.clone() as Sprite3D;
                    scene.addChild(monkey2);
                    monkey2.transform.localPositionX = 2;
                    //设置时钟定时执行
                    Laya.timer.frameLoop(1, this, () => {
                        //从欧拉角生成四元数（顺序为Yaw、Pitch、Roll）
                        Quaternion.createFromYawPitchRoll(0.025, 0, 0, this._temp_quaternion);
                        Vector3.transformQuat(monkey2.transform.position, this._temp_quaternion, this._temp_position);
                        monkey2.transform.position = this._temp_position;
                        //根据四元数旋转三维向量
                        Vector3.transformQuat(pointLight.transform.position, this._temp_quaternion, this._temp_position);
                        pointLight.transform.position = this._temp_position;
                    });
                }));
            }));

            //猴子
            Sprite3D.load("res/threeDimen/skinModel/LayaMonkey/LayaMonkey.lh", Handler.create(this, (layaMonkey: Sprite3D) => {
                scene.addChild(layaMonkey);
                layaMonkey.transform.setWorldLossyScale(new Vector3(3, 3, 3));
                layaMonkey.transform.localPositionZ = 2;
            }));
        });
    }
}