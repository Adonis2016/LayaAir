import { Config3D } from "../../../../Config3D";
import { RenderParams } from "../../../RenderEngine/RenderEnum/RenderParams";
import { Shader3D } from "../../../RenderEngine/RenderShader/Shader3D";
import { UniformMapType } from "../../../RenderEngine/RenderShader/SubShader";
import { SkinnedMeshSprite3D } from "../../../d3/core/SkinnedMeshSprite3D";
import { LayaGL } from "../../../layagl/LayaGL";
import { ShaderNode } from "../../../webgl/utils/ShaderNode";
import { ShaderDataType } from "../../DriverDesign/RenderDevice/ShaderData";
import { WebGLCommandUniformMap } from "../../WebGLDriver/RenderDevice/WebGLCommandUniformMap";
import { TypeOutData } from "../ShaderCompile/WebGPUShaderCompileCode";
import { WebGPUShaderCompileDef } from "../ShaderCompile/WebGPUShaderCompileDef";
import { WebGPUShaderCompileUtil } from "../ShaderCompile/WebGPUShaderCompileUtil";
import { WebGPU_GLSLFunction } from "./GLSLParse/WebGPU_GLSLFunction";
import { NagaWASM } from "./Naga/NagaWASM";
import { NameAndType, NameNumberMap, NameStringMap, roundUp } from "./WebGPUCommon";
import { WebGPUGlobal } from "./WebGPUStatis/WebGPUGlobal";
import { WebGPUUniformBlockInfo } from "./WebGPUUniform/WebGPUUniformBlockInfo";

type UniformItemType = {
    name: string; //名称，可能是带数组的名称
    type: ShaderDataType; //类型
};
type UniformMapTypeEx = { [key: string]: UniformItemType };

export enum WebGPUBindingInfoType {
    buffer,
    texture,
    sampler,
};

export interface WebGPUUniformPropertyBindingInfo {
    id: number;
    set: number;
    binding: number;
    name: string;
    propertyId: number;
    visibility: GPUShaderStageFlags;
    type: WebGPUBindingInfoType;
    uniform?: WebGPUUniformBlockInfo;
    buffer?: GPUBufferBindingLayout;
    texture?: GPUTextureBindingLayout;
    sampler?: GPUSamplerBindingLayout;
};

/**
 * WGSL代码转译
 */
export class WebGPUCodeGenerator {
    static naga: NagaWASM;
    static inited: boolean = false; //是否已经初始化
    static forNaga: boolean = true; //生成的GLSL4.5代码是否需要符合naga转译的要求

    /**
     * 初始化nageWASM库
     * @param next 
     */
    static async init(next?: Function) {
        if (this.inited) {
            if (next) next();
            return;
        }

        this.naga = new NagaWASM();
        await this.naga.init();
        this.inited = true;
        console.log("naga inited");
        if (next) next();
    }

    /**
     * 生成attribute字符串
     * @param attributeMap 
     */
    static attributeString(attributeMap: { [name: string]: [number, ShaderDataType] }) {
        let res = '';
        for (const key in attributeMap) {
            let loc = attributeMap[key][0];
            const type = this.getAttributeT2S(attributeMap[key][1]);
            if (type === "mat3") {
                res = `${res}layout(location = ${loc++}) in vec3 ${key}_0;\n`;
                res = `${res}layout(location = ${loc++}) in vec3 ${key}_1;\n`;
                res = `${res}layout(location = ${loc++}) in vec3 ${key}_2;\n`;
            } else if (type === "mat4") {
                res = `${res}layout(location = ${loc++}) in vec4 ${key}_0;\n`;
                res = `${res}layout(location = ${loc++}) in vec4 ${key}_1;\n`;
                res = `${res}layout(location = ${loc++}) in vec4 ${key}_2;\n`;
                res = `${res}layout(location = ${loc++}) in vec4 ${key}_3;\n`;
            } else res = `${res}layout(location = ${loc}) in ${type} ${key};\n`;
        }
        return res;
    }

    /**
     * 生成varying字符串
     * @param varyingMap 
     * @param io "in" or "out"
     */
    static varyingString(varyingMap: NameStringMap, io: string = "out") {
        let res = '';
        let count = 0;
        for (const key in varyingMap) {
            const type = varyingMap[key];
            res = `${res}layout(location = ${count++}) ${io} ${type} ${key};\n`;
        }
        return res;
    }

    /**
     * 生成uniform字符串
     * @param uniformMap 
     * @param arrayMap 
     */
    static uniformString(uniformMap: UniformMapTypeEx, arrayMap: NameNumberMap) {
        const globalUniformMap = LayaGL.renderDeviceFactory.createGlobalUniformMap;
        const scene3DUniformMap = globalUniformMap("Scene3D") as WebGLCommandUniformMap;
        const cameraUniformMap = globalUniformMap("BaseCamera") as WebGLCommandUniformMap;
        const sprite3DUniformMap = globalUniformMap("Sprite3D") as WebGLCommandUniformMap;
        const simpleSkinnedMeshUniformMap = globalUniformMap("SimpleSkinnedMesh") as WebGLCommandUniformMap;
        const shurikenSprite3DUniformMap = globalUniformMap("ShurikenSprite3D") as WebGLCommandUniformMap;
        const trailRenderUniformMap = globalUniformMap("TrailRender") as WebGLCommandUniformMap;
        const skyRendererUniformMap = globalUniformMap("SkyRenderer") as WebGLCommandUniformMap;
        const scene3DUniforms: NameAndType[] = [];
        const cameraUniforms: NameAndType[] = [];
        const sprite3DUniforms: NameAndType[] = [];
        const materialUniforms: NameAndType[] = [];
        const textureUniforms: NameAndType[] = [];

        sprite3DUniformMap.addShaderUniform(SkinnedMeshSprite3D.BONES, 'u_Bones', ShaderDataType.Matrix4x4);
        const uniformInfo: WebGPUUniformPropertyBindingInfo[] = [];

        const _have = (group: NameAndType[], name: string) => {
            for (let i = group.length - 1; i > -1; i--)
                if (group[i].name === name)
                    return true;
            return false;
        }

        const regex = /\[(.*?)\]/g;
        const _catalog = (key: string, name: string, type: string) => {
            const id = Shader3D.propertyNameToID(key.replace(regex, '_'));
            if (scene3DUniformMap.hasPtrID(id)) {
                if (!_have(scene3DUniforms, name))
                    scene3DUniforms.push({ name, type, set: 0 });
            }
            else if (cameraUniformMap.hasPtrID(id)) {
                if (!_have(cameraUniforms, name))
                    cameraUniforms.push({ name, type, set: 1 });
            }
            else if (sprite3DUniformMap.hasPtrID(id)) {
                if (!_have(sprite3DUniforms, name))
                    sprite3DUniforms.push({ name, type, set: 2 });
            }
            else if (simpleSkinnedMeshUniformMap.hasPtrID(id)) {
                if (!_have(sprite3DUniforms, name))
                    sprite3DUniforms.push({ name, type, set: 2 });
            }
            else if (shurikenSprite3DUniformMap.hasPtrID(id)) {
                if (!_have(sprite3DUniforms, name))
                    sprite3DUniforms.push({ name, type, set: 2 });
            }
            else if (trailRenderUniformMap.hasPtrID(id)) {
                if (!_have(sprite3DUniforms, name))
                    sprite3DUniforms.push({ name, type, set: 2 });
            }
            else if (skyRendererUniformMap.hasPtrID(id)) {
                if (!_have(sprite3DUniforms, name))
                    sprite3DUniforms.push({ name, type, set: 2 });
            }
            else if (type === "sampler2D" || type === "samplerCube") {
                if (!_have(textureUniforms, name))
                    textureUniforms.push({ name, type, set: 3 });
            }
            else if (!_have(materialUniforms, name))
                materialUniforms.push({ name, type, set: 3 });
        }

        for (const key in uniformMap) {
            const dataType = this.getAttributeT2S(<ShaderDataType>uniformMap[key].type);
            _catalog(key, uniformMap[key].name, dataType);
        }

        if (sprite3DUniforms.length === 0)
            sprite3DUniforms.push({ name: 'u_WorldMat', type: 'mat4', set: 2 });
        if (materialUniforms.length === 0)
            materialUniforms.push({ name: 'u_AlbedoColor', type: 'vec4', set: 3 });

        let uniformGLSL = '';
        const typeNum = 10;
        const visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
        const _procUniforms = (set: number, binding: number,
            name: string, uniformMap?: WebGLCommandUniformMap, uniforms?: NameAndType[]) => {
            const sortedUniforms: NameAndType[][] = [];
            for (let i = 0; i < typeNum; i++)
                sortedUniforms[i] = [];
            uniformGLSL = `${uniformGLSL}layout(set = ${set}, binding = ${binding}) uniform ${name} {\n`;
            if (uniforms) {
                for (let i = 0, len = uniforms.length; i < len; i++) {
                    const nameStr = uniforms[i].name;
                    const typeStr = uniforms[i].type;
                    if (typeStr === 'sampler2D' || typeStr === 'samplerCube')
                        textureUniforms.push({ name: nameStr, type: typeStr, set });
                    sortedUniforms[this.getAttributeS2N(typeStr)].push({ name: nameStr, type: typeStr, set });
                }
            } else if (uniformMap) {
                const data = uniformMap._idata;
                for (const key in data) {
                    const nameStr = data[key].propertyName;
                    const typeStr = this.getAttributeT2S(data[key].uniformtype);
                    if (data[key].propertyName.indexOf('.') !== -1) continue;
                    if (typeStr === '') continue;
                    else if (typeStr === 'sampler2D' || typeStr === 'samplerCube')
                        textureUniforms.push({ name: nameStr, type: typeStr, set });
                    else sortedUniforms[this.getAttributeS2N(typeStr)].push({ name: nameStr, type: typeStr, set });
                }
            }
            for (let i = 1; i < typeNum; i++)
                sortedUniforms[0].push(...sortedUniforms[i]);
            for (let i = 0, len = sortedUniforms[0].length; i < len; i++)
                uniformGLSL = `${uniformGLSL}    ${sortedUniforms[0][i].type} ${sortedUniforms[0][i].name};\n`;
            uniformGLSL = `${uniformGLSL}};\n\n`;
            uniformInfo.push({
                id: WebGPUGlobal.getUniformInfoId(),
                set,
                binding,
                visibility,
                type: WebGPUBindingInfoType.buffer,
                name,
                propertyId: Shader3D.propertyNameToID(name),
                uniform: this._genUniformBlockInfo(name, sortedUniforms[0], arrayMap),
                buffer: { type: 'uniform', hasDynamicOffset: false, minBindingSize: 0 },
            } as WebGPUUniformPropertyBindingInfo);
            return sortedUniforms[0];
        };

        _procUniforms(0, 0, "scene3D", scene3DUniformMap);
        _procUniforms(1, 0, "camera", cameraUniformMap);
        _procUniforms(2, 0, "sprite3D", null, sprite3DUniforms);
        _procUniforms(3, 0, "material", null, materialUniforms);

        return {
            uniformGLSL,
            uniformInfo,
            textureUniforms,
        };
    }

    /**
     * 生成sampler和texuture字符串
     * @param textureUniforms 
     * @param uniformInfo 
     * @param visibility 
     */
    static textureString(textureUniforms: NameAndType[], uniformInfo: WebGPUUniformPropertyBindingInfo[], visibility: GPUShaderStageFlags) {
        let res = '';
        let binding = [1, 1, 1, 1];
        if (textureUniforms.length > 0) {
            for (let i = 0, len = textureUniforms.length; i < len; i++) {
                const tu = textureUniforms[i];
                if (tu.type === "sampler2D") {
                    res = `${res}layout(set = ${tu.set}, binding = ${binding[tu.set]++}) uniform sampler ${tu.name}Sampler;\n`;
                    res = `${res}layout(set = ${tu.set}, binding = ${binding[tu.set]++}) uniform texture2D ${tu.name}Texture;\n`;
                    res = `${res}#define ${tu.name} sampler2D(${tu.name}Texture, ${tu.name}Sampler)\n\n`;
                    uniformInfo.push({
                        id: WebGPUGlobal.getUniformInfoId(),
                        set: tu.set,
                        binding: binding[tu.set] - 2,
                        visibility,
                        type: WebGPUBindingInfoType.sampler,
                        name: `${tu.name}Sampler`,
                        propertyId: Shader3D.propertyNameToID(tu.name),
                        sampler: { type: 'filtering' },
                    } as WebGPUUniformPropertyBindingInfo);
                    uniformInfo.push({
                        id: WebGPUGlobal.getUniformInfoId(),
                        set: tu.set,
                        binding: binding[tu.set] - 1,
                        visibility,
                        type: WebGPUBindingInfoType.texture,
                        name: `${tu.name}Texture`,
                        propertyId: Shader3D.propertyNameToID(tu.name),
                        texture: { sampleType: 'float', viewDimension: '2d', multisampled: false },
                    } as WebGPUUniformPropertyBindingInfo);
                }
                if (tu.type === "samplerCube") {
                    res = `${res}layout(set = ${tu.set}, binding = ${binding[tu.set]++}) uniform sampler ${tu.name}Sampler;\n`;
                    res = `${res}layout(set = ${tu.set}, binding = ${binding[tu.set]++}) uniform textureCube ${tu.name}Texture;\n`;
                    res = `${res}#define ${tu.name} samplerCube(${tu.name}Texture, ${tu.name}Sampler)\n\n`;
                    uniformInfo.push({
                        id: WebGPUGlobal.getUniformInfoId(),
                        set: tu.set,
                        binding: binding[tu.set] - 2,
                        visibility,
                        type: WebGPUBindingInfoType.sampler,
                        name: `${tu.name}Sampler`,
                        propertyId: Shader3D.propertyNameToID(tu.name),
                        sampler: { type: 'filtering' },
                    } as WebGPUUniformPropertyBindingInfo);
                    uniformInfo.push({
                        id: WebGPUGlobal.getUniformInfoId(),
                        set: tu.set,
                        binding: binding[tu.set] - 1,
                        visibility,
                        type: WebGPUBindingInfoType.texture,
                        name: `${tu.name}Texture`,
                        propertyId: Shader3D.propertyNameToID(tu.name),
                        texture: { sampleType: 'float', viewDimension: 'cube', multisampled: false },
                    } as WebGPUUniformPropertyBindingInfo);
                }
            }
        }
        return res;
    }

    /**
     * 去除naga转译报错的代码
     * @param code 
     */
    static changeUnfitCode(code: string) {
        const regex1 = /const\s+(?:in|highp|mediump|lowp)\s+/g;
        code = code.replace(regex1, 'in ');
        const regex2 = /(?:texture2D|textureCube)\s*\(\s*/g;
        return code.replace(regex2, 'texture(');
    }

    /**
     * 生成a_WorldMat拼合代码
     */
    static genAWorldMat() {
        return "#define a_WorldMat mat4(a_WorldMat_0, a_WorldMat_1, a_WorldMat_2, a_WorldMat_3)";
    }

    /**
     * 生成inverse函数（因为WGSL缺乏内置的inverse函数）
     */
    static genInverseFunc() {
        const func =
            `mat2 inverse(mat2 m)
{
    return mat2(m[1][1], -m[0][1], -m[1][0], m[0][0]) / (m[0][0] * m[1][1] - m[0][1] * m[1][0]);
}
mat3 inverse(mat3 m)
{
    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];
    float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];
    float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];
    float b01 = a22 * a11 - a12 * a21;
    float b11 = -a22 * a10 + a12 * a20;
    float b21 = a21 * a10 - a11 * a20;
    float det = a00 * b01 + a01 * b11 + a02 * b21;
    return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11), b11, (a22 * a00 - a02 * a20),
	       (-a12 * a00 + a02 * a10), b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;
}
mat4 inverse(mat4 m)
{
    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3], a10 = m[1][0], a11 = m[1][1], a12 = m[1][2],
	  a13 = m[1][3], a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3], a30 = m[3][0], a31 = m[3][1],
	  a32 = m[3][2], a33 = m[3][3],
	  b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10,
	  b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12,
	  b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30,
	  b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32,
	  det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    return mat4(a11 * b11 - a12 * b10 + a13 * b09, a02 * b10 - a01 * b11 - a03 * b09, a31 * b05 - a32 * b04 + a33 * b03,
	       a22 * b04 - a21 * b05 - a23 * b03, a12 * b08 - a10 * b11 - a13 * b07, a00 * b11 - a02 * b08 + a03 * b07,
	       a32 * b02 - a30 * b05 - a33 * b01, a20 * b05 - a22 * b02 + a23 * b01, a10 * b10 - a11 * b08 + a13 * b06,
	       a01 * b08 - a00 * b10 - a03 * b06, a30 * b04 - a31 * b02 + a33 * b00, a21 * b02 - a20 * b04 - a23 * b00,
	       a11 * b07 - a10 * b09 - a12 * b06, a00 * b09 - a01 * b07 + a02 * b06, a31 * b01 - a30 * b03 - a32 * b00,
	       a20 * b03 - a21 * b01 + a22 * b00) / det;
}`;
        return `${func}\n\n`;
    }

    /**
     * 生成Uniform数据块信息
     * @param name 
     * @param binding 
     * @param uniforms 
     * @param arrayMap 
     */
    private static _genUniformBlockInfo(name: string, uniforms: NameAndType[], arrayMap: NameNumberMap) {
        if (uniforms.length === 0) return undefined;
        const _getUniformAlign = (type: string) => {
            switch (type) {
                case 'int':
                case 'float':
                    return 4;
                case 'vec2':
                    return 8;
                case 'vec3':
                case 'vec4':
                case 'mat3':
                case 'mat4':
                    return 16;
                default:
                    return 4;
            }
        };
        const _getUniformElements = (type: string) => {
            switch (type) {
                case 'int':
                case 'float':
                    return 1;
                case 'vec2':
                    return 2;
                case 'vec3':
                    return 3;
                case 'vec4':
                    return 4;
                case 'mat3':
                    return 12;
                case 'mat4':
                    return 16;
                default:
                    return 1;
            }
        };
        const _getUniformSize = (type: string, count: number = 1) => {
            if (count <= 1) {
                switch (type) {
                    case 'int':
                    case 'float':
                        return 4;
                    case 'vec2':
                        return 8;
                    case 'vec3':
                        return 12;
                    case 'vec4':
                        return 16;
                    case 'mat3':
                        return 48;
                    case 'mat4':
                        return 64;
                    default:
                        return 4;
                }
            } else {
                switch (type) {
                    case 'int':
                    case 'float':
                        return 4 * count;
                    case 'vec2':
                        return 8 * count;
                    case 'vec3':
                        return 16 * count;
                    case 'vec4':
                        return 16 * count;
                    case 'mat3':
                        return 48 * count;
                    case 'mat4':
                        return 64 * count;
                    default:
                        return 4 * count;
                }
            }
        };

        const _calcUniformBufferSize = (uniforms: NameAndType[], arrayMap: NameNumberMap) => {
            let byteLength = 0;
            let maxAlign = 0;
            const regex = /\[(.*?)\]/g;
            const layout: { name: string, type: string, offset: number, align: number, size: number, elements: number, count: number }[] = [];
            for (let i = 0, len = uniforms.length; i < len; i++) {
                const uniform = uniforms[i];
                const count = arrayMap[uniform.name] || 1;
                const align = _getUniformAlign(uniform.type);
                const size = _getUniformSize(uniform.type, count);
                const elements = _getUniformElements(uniform.type);
                const name = uniform.name.replace(regex, '');
                if (align > maxAlign)
                    maxAlign = align;
                byteLength = roundUp(byteLength, align);
                byteLength += size;
                layout.push({ name, type: uniform.type, offset: byteLength - size, align, size, elements, count });
            }
            byteLength = roundUp(byteLength, maxAlign);
            return { byteLength, layout };
        };

        const size = _calcUniformBufferSize(uniforms, arrayMap);
        const uniformBlockInfo = new WebGPUUniformBlockInfo(name, size.byteLength);
        for (let i = 0, len = size.layout.length; i < len; i++) {
            const uniform = size.layout[i];
            uniformBlockInfo.addUniform(uniform.name, uniform.type, uniform.offset, uniform.align, uniform.size, uniform.elements, uniform.count);
        }
        return uniformBlockInfo;
    }

    /**
     * 转译Attribute类型（Type到String）
     * @param type 
     */
    static getAttributeT2S(type: ShaderDataType) {
        switch (type) {
            case ShaderDataType.Int:
                return "int";
            case ShaderDataType.Bool:
                return "bool";
            case ShaderDataType.Float:
                return "float";
            case ShaderDataType.Vector2:
                return "vec2";
            case ShaderDataType.Vector3:
                return "vec3";
            case ShaderDataType.Vector4:
            case ShaderDataType.Color:
                return "vec4";
            case ShaderDataType.Matrix3x3:
                return "mat3";
            case ShaderDataType.Matrix4x4:
                return "mat4";
            case ShaderDataType.Texture2D:
                return "sampler2D";
            case ShaderDataType.TextureCube:
                return "samplerCube";
            default:
                return "";
        }
    }

    /**
     * 转译Attribute类型（String到Type）
     * @param name 
     */
    static getAttributeS2T(name: string) {
        switch (name) {
            case "int":
                return ShaderDataType.Int;
            case "bool":
                return ShaderDataType.Bool;
            case "float":
                return ShaderDataType.Float;
            case "vec2":
                return ShaderDataType.Vector2;
            case "vec3":
                return ShaderDataType.Vector3;
            case "vec4":
                return ShaderDataType.Vector4;
            case "mat3":
                return ShaderDataType.Matrix3x3;
            case "mat4":
                return ShaderDataType.Matrix4x4;
            case "sampler2D":
                return ShaderDataType.Texture2D;
            case "samplerCube":
                return ShaderDataType.TextureCube;
            default:
                return "";
        }
    }

    /**
     * 转译Attribute类型（String到Number），用于分组
     * @param name 
     */
    static getAttributeS2N(name: string) {
        switch (name) {
            case "mat4":
                return 0;
            case "mat3":
                return 1;
            case "vec4":
                return 2;
            case "vec3":
                return 3;
            case "vec2":
                return 4;
            case "float":
                return 5;
            case "bool":
                return 6;
            case "int":
                return 7;
            default:
                return 8;
        }
    }

    /**
     * 执行WGSL转译
     * @param defineString 
     * @param attributeMap 
     * @param uniformMap 
     * @param VS 
     * @param FS 
     */
    static shaderLanguageProcess(defineString: string[],
        attributeMap: { [name: string]: [number, ShaderDataType] },
        uniformMap: UniformMapType, VS: ShaderNode, FS: ShaderNode) {

        if (defineString.indexOf('UPDOWN_NDC_Y') === -1)
            defineString.push('UPDOWN_NDC_Y');

        const arrayMap: NameNumberMap = {}; //uniform中的数组
        const varyingMap: NameStringMap = {};
        const varyingMapVS: NameStringMap = {};
        const varyingMapFS: NameStringMap = {};

        const clusterSlices = Config3D.lightClusterCount;
        const defMap: any = {};

        //将uniformMap转换为uniformMapEx
        const uniformMapEx: UniformMapTypeEx = {};
        for (const key in uniformMap) {
            if (typeof uniformMap[key] === "object") {
                const blockUniform = <{ [name: string]: ShaderDataType }>uniformMap[key];
                for (const uniformName in blockUniform) {
                    const dataType = blockUniform[uniformName];
                    uniformMapEx[uniformName] = { name: uniformName, type: dataType };
                }
            } else uniformMapEx[key] = { name: key, type: uniformMap[key] as ShaderDataType };
        }

        let defineStr: string = "";
        defineStr += "#define MAX_LIGHT_COUNT " + Config3D.maxLightCount + "\n";
        defineStr += "#define MAX_LIGHT_COUNT_PER_CLUSTER " + Config3D._maxAreaLightCountPerClusterAverage + "\n";
        defineStr += "#define CLUSTER_X_COUNT " + clusterSlices.x + "\n";
        defineStr += "#define CLUSTER_Y_COUNT " + clusterSlices.y + "\n";
        defineStr += "#define CLUSTER_Z_COUNT " + clusterSlices.z + "\n";
        defineStr += "#define MORPH_MAX_COUNT " + Config3D.maxMorphTargetCount + "\n";
        defineStr += "#define SHADER_CAPAILITY_LEVEL " + LayaGL.renderEngine.getParams(RenderParams.SHADER_CAPAILITY_LEVEL) + "\n";

        for (let i = 0, len = defineString.length; i < len; i++) {
            const def = defineString[i];
            defineStr += "#define " + def + "\n";
            defMap[def] = true;
        }

        const vs = VS.toscript(defMap, []);
        if (vs[0].indexOf('#version') === 0)
            vs.shift();

        const fs = FS.toscript(defMap, []);
        if (fs[0].indexOf('#version') === 0)
            fs.shift();

        let vsOut = "", fsOut = "";
        let vsNeedInverseFunc = false;
        let fsNeedInverseFunc = false;
        const vsTod: TypeOutData = {};
        const fsTod: TypeOutData = {};
        //提取VertexShader的uniform和varying参数
        {
            const defs: Set<string> = new Set();
            const ret = WebGPUShaderCompileDef.compile(vs.join('\n'), defs);
            if (!defs.has('Math_lib'))
                vsNeedInverseFunc = true;
            const defMap: { [name: string]: boolean } = {};
            defineString.forEach(def => { defMap[def] = true; });
            defMap['GL_FRAGMENT_PRECISION_HIGH'] = true;
            vsOut = WebGPUShaderCompileUtil.toScript(ret, defMap, vsTod);
            if (vsOut.indexOf('inverse') === -1)
                vsNeedInverseFunc = false;
            if (vsTod.uniform) {
                let keyWithArray: string;
                for (const key in vsTod.uniform)
                    if (!uniformMapEx[key]) {
                        if (vsTod.uniform[key].length && vsTod.uniform[key].length[0]) {
                            keyWithArray = `${key}[${vsTod.uniform[key].length[0]}]`;
                            uniformMapEx[key] = {
                                name: keyWithArray,
                                type: this.getAttributeS2T(vsTod.uniform[key].type) as ShaderDataType
                            };
                            arrayMap[keyWithArray] = vsTod.uniform[key].length[0];
                        } else uniformMapEx[key] = {
                            name: key,
                            type: this.getAttributeS2T(vsTod.uniform[key].type) as ShaderDataType
                        }
                    }
            }
            if (vsTod.varying)
                for (const key in vsTod.varying)
                    if (!varyingMapVS[key])
                        varyingMapVS[key] = vsTod.varying[key].type;
            if (vsTod.variable) {
                const attributeMap2: { [name: string]: [number, ShaderDataType] } = {};
                for (const k in attributeMap)
                    if (vsTod.variable.has(k))
                        attributeMap2[k] = attributeMap[k];
                attributeMap = attributeMap2;
            }
        }
        //提取FragmentShader的uniform和varying参数
        {
            const defs: Set<string> = new Set();
            const fsOrg = fs.join('\n');
            const ret = WebGPUShaderCompileDef.compile(fsOrg, defs);
            if (!defs.has('Math_lib'))
                fsNeedInverseFunc = true;
            const defMap: { [name: string]: boolean } = {};
            defineString.forEach(def => { defMap[def] = true; });
            defMap['GL_FRAGMENT_PRECISION_HIGH'] = true;
            fsOut = WebGPUShaderCompileUtil.toScript(ret, defMap, fsTod);
            if (fsOut.indexOf('inverse') === -1)
                fsNeedInverseFunc = false;
            if (fsTod.uniform) {
                let keyWithArray: string;
                for (const key in fsTod.uniform)
                    if (!uniformMapEx[key]) {
                        if (fsTod.uniform[key].length && fsTod.uniform[key].length[0]) {
                            keyWithArray = `${key}[${vsTod.uniform[key].length[0]}]`;
                            uniformMapEx[key] = {
                                name: keyWithArray,
                                type: this.getAttributeS2T(vsTod.uniform[key].type) as ShaderDataType
                            };
                            arrayMap[keyWithArray] = vsTod.uniform[key].length[0];
                        } else uniformMapEx[key] = {
                            name: key,
                            type: this.getAttributeS2T(fsTod.uniform[key].type) as ShaderDataType
                        }
                    }
            }
            if (fsTod.varying)
                for (const key in fsTod.varying)
                    if (!varyingMapFS[key])
                        varyingMapFS[key] = fsTod.varying[key].type;
        }

        //匹配Varying参数
        for (const key in varyingMapVS)
            if (varyingMapFS[key])
                varyingMap[key] = varyingMapVS[key];

        //生成各类GLSL4.5代码
        const attributeGLSL = this.attributeString(attributeMap);
        const varyingGLSL_vs = this.varyingString(varyingMap, 'out');
        const varyingGLSL_fs = this.varyingString(varyingMap, 'in');
        const {
            uniformGLSL,
            uniformInfo,
            textureUniforms } = this.uniformString(uniformMapEx, arrayMap);
        const inverseFunc = this.genInverseFunc();
        const aWorldMat = this.genAWorldMat();

        const textureUniforms_vs: NameAndType[] = [];
        const textureUniforms_fs: NameAndType[] = [];
        if (vsTod.variable) {
            for (let i = 0, len = textureUniforms.length; i < len; i++)
                if (vsTod.variable.has(textureUniforms[i].name))
                    textureUniforms_vs.push(textureUniforms[i]);
        }
        if (fsTod.variable) {
            for (let i = 0, len = textureUniforms.length; i < len; i++)
                if (fsTod.variable.has(textureUniforms[i].name))
                    textureUniforms_fs.push(textureUniforms[i]);
        }

        const textureGLSL_vs = this.textureString(textureUniforms_vs, uniformInfo, GPUShaderStage.VERTEX);
        const textureGLSL_fs = this.textureString(textureUniforms_fs, uniformInfo, GPUShaderStage.FRAGMENT);

        const vertexHead =
            `#version 450 core
#if defined(GL_FRAGMENT_PRECISION_HIGH)
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif
${attributeGLSL}
${varyingGLSL_vs}
${uniformGLSL}
${textureGLSL_vs}${aWorldMat}
`;
        const fragmentHead =
            `#version 450 core
#if defined(GL_FRAGMENT_PRECISION_HIGH)
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif
layout(location = 0) out vec4 gl_FragColor;
${varyingGLSL_fs}
${uniformGLSL}
${textureGLSL_fs}
`;
        //合并成完整的GLSL4.5代码
        let dstVS = vertexHead + defineStr + (vsNeedInverseFunc ? inverseFunc : '') + vsOut;
        let dstFS = fragmentHead + defineStr + (fsNeedInverseFunc ? inverseFunc : '') + fsOut;
        if (this.forNaga) {
            dstVS = this.changeUnfitCode(dstVS);
            dstFS = this.changeUnfitCode(dstFS);
        }
        //console.log(dstVS);
        //console.log(dstFS);

        const glslFunc = new WebGPU_GLSLFunction();
        glslFunc.extractFunctions(dstVS);
        glslFunc.debugInfo();

        //转译成WGSL代码
        const wgsl_vs = this.naga.compileGLSL2WGSL(dstVS, 'vertex');
        const wgsl_fs = this.naga.compileGLSL2WGSL(dstFS, 'fragment');
        //console.log(wgsl_vs);
        //console.log(wgsl_fs);

        return { vs: wgsl_vs, fs: wgsl_fs, uniformInfo };
    }
}