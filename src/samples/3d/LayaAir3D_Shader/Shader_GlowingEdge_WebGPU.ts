import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { SkinnedMeshSprite3D } from "laya/d3/core/SkinnedMeshSprite3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stage } from "laya/display/Stage";
import { Texture2D } from "laya/resource/Texture2D";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { Laya3D } from "Laya3D";
import { CameraMoveScript } from "../common/CameraMoveScript";
import GlowingEdgeShaderFS from "./customShader/glowingEdgeShader.fs";
import GlowingEdgeShaderVS from "./customShader/glowingEdgeShader.vs";
import { GlowingEdgeMaterial } from "./customMaterials/GlowingEdgeMaterial";
import { Material } from "laya/resource/Material";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
import { ShaderPass } from "laya/RenderEngine/RenderShader/ShaderPass";
import { SubShader } from "laya/RenderEngine/RenderShader/SubShader";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { Laya3DRender } from "laya/d3/RenderObjs/Laya3DRender";
import { LayaGL } from "laya/layagl/LayaGL";
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
import { URL } from "laya/net/URL";

/**
 * ...
 * @author
 */
export class Shader_GlowingEdge_WebGPU {
    private rotation: Vector3 = new Vector3(0, 0.01, 0);
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
            //Stat.show();
            //初始化shader
            this.initShader();

            //创建场景
            var scene: Scene3D = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            //创建相机
            var camera: Camera = (<Camera>(scene.addChild(new Camera(0, 0.1, 1000))));
            camera.transform.translate(new Vector3(0, 0.85, 1.7));
            camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
            camera.addComponent(CameraMoveScript);

            //创建平行光
            let directlightSprite = new Sprite3D();
            let dircom = directlightSprite.addComponent(DirectionLightCom);
            scene.addChild(directlightSprite);
            dircom.color = new Color(1, 1, 1, 1);
            scene.ambientColor = new Color(1.0, 0.0, 0.0);

            //加载精灵
            Sprite3D.load("res/threeDimen/skinModel/dude/dude.lh", Handler.create(this, function (dude: Sprite3D): void {
                scene.addChild(dude);

                //使用自定义的材质
                var glowingEdgeMaterial1: GlowingEdgeMaterial = new GlowingEdgeMaterial();
                //加载纹理
                Texture2D.load("res/threeDimen/skinModel/dude/Assets/dude/head.png", Handler.create(this, function (tex: Texture2D): void {
                    glowingEdgeMaterial1.diffuseTexture = tex;
                }));
                //设置边缘颜色
                glowingEdgeMaterial1.marginalColor = new Vector3(1, 0.7, 0);

                var glowingEdgeMaterial2: GlowingEdgeMaterial = new GlowingEdgeMaterial();
                Texture2D.load("res/threeDimen/skinModel/dude/Assets/dude/jacket.png", Handler.create(this, function (tex: Texture2D): void {
                    glowingEdgeMaterial2.diffuseTexture = tex;
                }));
                glowingEdgeMaterial2.marginalColor = new Vector3(1, 0.7, 0);

                var glowingEdgeMaterial3: GlowingEdgeMaterial = new GlowingEdgeMaterial();
                Texture2D.load("res/threeDimen/skinModel/dude/Assets/dude/pants.png", Handler.create(this, function (tex: Texture2D): void {
                    glowingEdgeMaterial3.diffuseTexture = tex;
                }));
                glowingEdgeMaterial3.marginalColor = new Vector3(1, 0.7, 0);

                var glowingEdgeMaterial4: GlowingEdgeMaterial = new GlowingEdgeMaterial();
                Texture2D.load("res/threeDimen/skinModel/dude/Assets/dude/upBodyC.png", Handler.create(this, function (tex: Texture2D): void {
                    glowingEdgeMaterial4.diffuseTexture = tex;
                }))
                glowingEdgeMaterial4.marginalColor = new Vector3(1, 0.7, 0);

                var baseMaterials: Material[] = [];
                baseMaterials[0] = glowingEdgeMaterial1;
                baseMaterials[1] = glowingEdgeMaterial2;
                baseMaterials[2] = glowingEdgeMaterial3;
                baseMaterials[3] = glowingEdgeMaterial4;
                baseMaterials[4] = glowingEdgeMaterial4;
                (<SkinnedMeshSprite3D>dude.getChildAt(0).getChildAt(0)).skinnedMeshRenderer.materials = baseMaterials;
                dude.transform.position = new Vector3(0, 0.5, 0);
                dude.transform.setWorldLossyScale(new Vector3(0.2, 0.2, 0.2));
                dude.transform.rotate(new Vector3(0, 180, 0), false, false);
            }));

            //加载地球精灵
            var earth: MeshSprite3D = (<MeshSprite3D>scene.addChild(new MeshSprite3D(PrimitiveMesh.createSphere(0.5, 128, 128))));

            var glowingEdgeMaterial: GlowingEdgeMaterial = new GlowingEdgeMaterial();
            Texture2D.load("res/threeDimen/texture/earth.png", Handler.create(this, function (tex: Texture2D): void {
                glowingEdgeMaterial.diffuseTexture = tex;
            }));
            glowingEdgeMaterial.marginalColor = new Vector3(0.0, 0.3, 1.0);
            earth.meshRenderer.sharedMaterial = glowingEdgeMaterial;

            Laya.timer.frameLoop(1, this, function (): void {
                earth.transform.rotate(this.rotation, true);
            });
        });
    }

    //初始化shader
    private initShader(): void {
        //创建自定义shader
        var glowingEdgeShader: Shader3D = Shader3D.add("GlowingEdgeMaterial", true, true);
        //为当前自定义的shader添加SubShader
        var subShader: SubShader = new SubShader();
        glowingEdgeShader.addSubShader(subShader);
        //SubShader添加ShaderPass
        (<ShaderPass>subShader.addShaderPass(GlowingEdgeShaderVS, GlowingEdgeShaderFS));
    }
}