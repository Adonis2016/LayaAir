import "laya/d3/core/scene/Scene3D";
import "laya/ModuleDef";
import "laya/d3/ModuleDef";
import "laya/d3/physics/ModuleDef";
import "laya/ui/ModuleDef";
import "laya/ani/ModuleDef";
import "laya/spine/ModuleDef";
import "laya/gltf/glTFLoader";

import { Resource } from "laya/resource/Resource";
import { Main } from "./Main";
import { LayaGL } from "laya/layagl/LayaGL";
import { MeshLoad } from "./3d/LayaAir3D_Mesh/MeshLoad";
import { SceneLoad1 } from "./3d/LayaAir3D_Scene3D/SceneLoad1";
import { WebGLRenderEngineFactory } from "laya/RenderDriver/WebGLDriver/RenderDevice/WebGLRenderEngineFactory"
import { WebGPUTest } from "./3d/LayaAir3D_Scene3D/WebGPUTest";
import { WebGPUTest_PBR } from "./3d/LayaAir3D_Scene3D/WebGPUTest_PBR";
import { WebGPUTest_PBR2 } from "./3d/LayaAir3D_Scene3D/WebGPUTest_PBR2";
import { Particle_EternalLight_WebGPU } from "./3d/LayaAir3D_Particle3D/Particle_EternalLight_WebGPU";
import { WebGPUTest_Empty } from "./3d/LayaAir3D_Scene3D/WebGPUTest_Empty";
import { EnvironmentalReflection } from "./3d/LayaAir3D_Scene3D/EnvironmentalReflection";
import { EnvironmentalReflection_WebGPU } from "./3d/LayaAir3D_Scene3D/EnvironmentalReflection_WebGPU";
import { RealTimeShadow_WebGPU } from "./3d/LayaAir3D_Lighting/RealTimeShadow_WebGPU";
import { SpotLightDemo_WebGPU } from "./3d/LayaAir3D_Lighting/SpotLightDemo_WebGPU";
import { PointLightDemo_WebGPU } from "./3d/LayaAir3D_Lighting/PointLightDemo_WebGPU";
import { Particle_BurningGround_WebGPU } from "./3d/LayaAir3D_Particle3D/Particle_BurningGround_WebGPU";
import { TrailDemo_WebGPU } from "./3d/LayaAir3D_Trail/TrailDemo_WebGPU";
import { Shader_MultiplePassOutline_WebGPU } from "./3d/LayaAir3D_Shader/Shader_MultiplePassOutline_WebGPU";
import { Shader_Terrain_WebGPU } from "./3d/LayaAir3D_Shader/Shader_Terrain_WebGPU";
import { Shader_GlowingEdge_WebGPU } from "./3d/LayaAir3D_Shader/Shader_GlowingEdge_WebGPU";
import { WebGPUTest_Dude } from "./3d/LayaAir3D_Scene3D/WebGPUTest_Dude";
import { PixelLineSprite3DDemo_WebGPU } from "./3d/LayaAir3D_Sprite3D/PixelLineSprite3DDemo_WebGPU";
import { SkinAnimationPerformance_WebGPU } from "./3d/LayaAir3DTest_Performance/SkinAnimationPerformance_WebGPU";
import { TrailRender_WebGPU } from "./3d/LayaAir3D_Trail/TrailRender_WebGPU";
import { HalfFloatTexture_WebGPU } from "./3d/LayaAir3D_Texture/HalfFloatTexture_WebGPU";
import { LightmapScene_WebGPU } from "./3d/LayaAir3D_Scene3D/LightmapScene_WebGPU";
import { LoadResourceDemo_WebGPU } from "./3d/LayaAir3D_Resource/LoadResourceDemo_WebGPU";
import { LoadGltfResource_WebGPU } from "./3d/LayaAir3D_Resource/LoadGltfResource_WebGPU";
import { CustomPostProcess_VolumeticLIghtScattering_WebGPU } from "./3d/LayaAir3D_PostProcess/CustomPostProcess_VolumeticLIghtScattering_WebGPU";
import { PostProcess_LensFlare_WebGPU } from "./3d/LayaAir3D_PostProcess/PostPorcess_LensFlare_WebGPU";
import { PostProcessDoF_WebGPU } from "./3d/LayaAir3D_PostProcess/PostProcess_DoF_WebGPU";
import { PostProcess_Blur_WebGPU } from "./3d/LayaAir3D_PostProcess/PostProcess_Blur_WebGPU";
import { StencilDemo_WebGPU } from "./3d/LayaAir3D_Material/StencilDemo_WebGPU";
import { WaterPrimaryMaterialDemo_WebGPU } from "./3d/LayaAir3D_Material/WaterPrimaryMaterialDemo_WebGPU";
import { BlinnPhong_SpecularMap_WebGPU } from "./3d/LayaAir3D_Material/BlinnPhong_SpecularMap_WebGPU";
import { MouseInteraction_WebGPU } from "./3d/LayaAir3D_MouseInteraction/MouseInteraction_WebGPU";
import { ChangeMesh_WebGPU } from "./3d/LayaAir3D_Mesh/ChangeMesh_WebGPU";
import { MultiLight_WebGPU } from "./3d/LayaAir3D_Lighting/MultiLight_WebGPU";

Resource.DEBUG = true;
// LayaGL.renderOBJCreate = new WebGLRenderEngineFactory();
// Physics2D.I._factory = new physics2DJSFactory();
// Laya3D.PhysicsCreateUtil = new pxPhysicsCreateUtil();
// new PhysicsWorld_BaseCollider();
//new SceneLoad1();
//new WebGPUTest(); //OK
//new WebGPUTest_PBR(); //OK
//new WebGPUTest_PBR2(); //OK
//new WebGPUTest_Dude(); //OK
//new WebGPUTest_Empty(); //OK
//new RealTimeShadow_WebGPU(); //OK
//new SpotLightDemo_WebGPU(); //OK
//new PointLightDemo_WebGPU(); //OK
//new Particle_EternalLight_WebGPU(); //OK
//new Particle_BurningGround_WebGPU(); //OK
//new Shader_MultiplePassOutline_WebGPU(); //OK
//new Shader_Terrain_WebGPU(); //OK
new Shader_GlowingEdge_WebGPU(); //OK
//new SkinAnimationPerformance_WebGPU(); //OK
//new HalfFloatTexture_WebGPU(); //OK
//new LightmapScene_WebGPU(); //OK（Without KTX）
//new LoadGltfResource_WebGPU(); //OK
//new PixelLineSprite3DDemo_WebGPU(); //OK
//new BlinnPhong_SpecularMap_WebGPU(); //OK?
//new PostProcess_LensFlare_WebGPU(); //OK?
//new EnvironmentalReflection_WebGPU(); //OK, WebGL?
//new MultiLight_WebGPU(); //No, WebGL
//new ChangeMesh_WebGPU(); //No, WebGL
//new StencilDemo_WebGPU(); //No, WebGL
//new PostProcess_Blur_WebGPU(); //No, WebGL
//new PostProcessDoF_WebGPU(); //No, WebGL
//new TrailDemo_WebGPU(); //No, WebGL
//new TrailRender_WebGPU(); //No, WebGL
//new MouseInteraction_WebGPU(); //No, WebGL
//new WaterPrimaryMaterialDemo_WebGPU(); //No, WebGL
//new LoadResourceDemo_WebGPU(); //No, WebGL
//new CustomPostProcess_VolumeticLIghtScattering_WebGPU(); //No, WebGL