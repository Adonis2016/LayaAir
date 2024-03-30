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

Resource.DEBUG = true;
// LayaGL.renderOBJCreate = new WebGLRenderEngineFactory();
// Physics2D.I._factory = new physics2DJSFactory();
// Laya3D.PhysicsCreateUtil = new pxPhysicsCreateUtil();
// new PhysicsWorld_BaseCollider();
// new SceneLoad1();
// new WebGPUTest();
//new WebGPUTest_PBR2();
new WebGPUTest_Empty();
//new Particle_EternalLight_WebGPU();