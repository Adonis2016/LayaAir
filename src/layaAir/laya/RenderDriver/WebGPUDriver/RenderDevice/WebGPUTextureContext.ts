import { DDSTextureInfo } from "../../../RenderEngine/DDSTextureInfo";
import { HDRTextureInfo } from "../../../RenderEngine/HDRTextureInfo";
import { KTXTextureInfo } from "../../../RenderEngine/KTXTextureInfo";
import { RenderTargetFormat } from "../../../RenderEngine/RenderEnum/RenderTargetFormat";
import { TextureCompareMode } from "../../../RenderEngine/RenderEnum/TextureCompareMode";
import { TextureDimension } from "../../../RenderEngine/RenderEnum/TextureDimension";
import { TextureFormat } from "../../../RenderEngine/RenderEnum/TextureFormat";
import { ITextureContext } from "../../DriverDesign/RenderDevice/ITextureContext";
import { InternalRenderTarget } from "../../DriverDesign/RenderDevice/InternalRenderTarget";
import { InternalTexture } from "../../DriverDesign/RenderDevice/InternalTexture";
import { genMipmap } from "./Utils/Mipmap";
import { WebGPUInternalRT } from "./WebGPUInternalRT";
import { WebGPUInternalTex } from "./WebGPUInternalTex";
import { WebGPURenderEngine } from "./WebGPURenderEngine";
import { WebGPURenderPassHelper } from "./WebGPURenderPassHelper";
import { WebGPUGlobal } from "./WebGPUStatis/WebGPUGlobal";

const WebGPUCubeMap = [4, 5, 0, 1, 2, 3];

enum WebGPUTextureDimension {
    D1D = "1d",
    D2D = "2d",
    D3D = "3d"
};

export enum WebGPUTextureFormat {
    // 8-bit formats
    r8unorm = "r8unorm",
    r8snorm = "r8snorm",
    r8uint = "r8uint",
    r8sint = "r8sint",

    // 16-bit formats
    r16uint = "r16uint",
    r16sint = "r16sint",
    r16float = "r16float",
    rg8unorm = "rg8unorm",
    rg8snorm = "rg8snorm",
    rg8uint = "rg8uint",
    rg8sint = "rg8sint",

    // 32-bit formats
    r32uint = "r32uint",
    r32sint = "r32sint",
    r32float = "r32float",
    rg16uint = "rg16uint",
    rg16sint = "rg16sint",
    rg16float = "rg16float",
    rgba8unorm = "rgba8unorm",
    rgba8unorm_srgb = "rgba8unorm-srgb",
    rgba8snorm = "rgba8snorm",
    rgba8uint = "rgba8uint",
    rgba8sint = "rgba8sint",
    bgra8unorm = "bgra8unorm",
    bgra8unorm_srgb = "bgra8unorm-srgb",

    // Packed 32-bit formats
    rgb9e5ufloat = "rgb9e5ufloat",
    rgb10a2unorm = "rgb10a2unorm",
    rg11b10ufloat = "rg11b10ufloat",

    // 64-bit formats
    rg32uint = "rg32uint",
    rg32sint = "rg32sint",
    rg32float = "rg32float",
    rgba16uint = "rgba16uint",
    rgba16sint = "rgba16sint",
    rgba16float = "rgba16float",

    // 128-bit formats
    rgba32uint = "rgba32uint",
    rgba32sint = "rgba32sint",
    rgba32float = "rgba32float",

    // Depth/stencil formats
    stencil8 = "stencil8",
    depth16unorm = "depth16unorm",
    depth24plus = "depth24plus",
    depth24plus_stencil8 = "depth24plus-stencil8",
    depth32float = "depth32float",

    // "depth32float-stencil8" feature
    depth32float_stencil8 = "depth32float-stencil8",

    // BC compressed formats usable if "texture-compression-bc" is both
    // supported by the device/user agent and enabled in requestDevice.
    bc1_rgba_unorm = "bc1-rgba-unorm",
    bc1_rgba_unorm_srgb = "bc1-rgba-unorm-srgb",
    bc2_rgba_unorm = "bc2-rgba-unorm",
    bc2_rgba_unorm_srgb = "bc2-rgba-unorm-srgb",
    bc3_rgba_unorm = "bc3-rgba-unorm",
    bc3_rgba_unorm_srgb = "bc3-rgba-unorm-srgb",
    bc4_r_unorm = "bc4-r-unorm",
    bc4_r_snorm = "bc4-r-snorm",
    bc5_rg_unorm = "bc5-rg-unorm",
    bc5_rg_snorm = "bc5-rg-snorm",
    bc6h_rgb_ufloat = "bc6h-rgb-ufloat",
    bc6h_rgb_float = "bc6h-rgb-float",
    bc7_rgba_unorm = "bc7-rgba-unorm",
    bc7_rgba_unorm_srgb = "bc7-rgba-unorm-srgb",

    // ETC2 compressed formats usable if "texture-compression-etc2" is both
    // supported by the device/user agent and enabled in requestDevice.
    etc2_rgb8unorm = "etc2-rgb8unorm",
    etc2_rgb8unorm_srgb = "etc2-rgb8unorm-srgb",
    etc2_rgb8a1unorm = "etc2-rgb8a1unorm",
    etc2_rgb8a1unorm_srgb = "etc2-rgb8a1unorm-srgb",
    etc2_rgba8unorm = "etc2-rgba8unorm",
    etc2_rgba8unorm_srgb = "etc2-rgba8unorm-srgb",
    //etc2_rgba8unormal
    // "eac-r11unorm",
    // "eac-r11snorm",
    // "eac-rg11unorm",
    // "eac-rg11snorm",

    // ASTC compressed formats usable if "texture-compression-astc" is both
    // supported by the device/user agent and enabled in requestDevice.
    astc_4x4_unorm = "astc-4x4-unorm",
    astc_4x4_unorm_srgb = "astc-4x4-unorm-srgb",
    astc_5x4_unorm = "astc-5x4-unorm",
    astc_5x4_unorm_srgb = "astc-5x4-unorm-srgb",
    astc_5x5_unorm = "astc-5x5-unorm",
    astc_5x5_unorm_srgb = "astc-5x5-unorm-srgb",
    astc_6x5_unorm = "astc-6x5-unorm",
    astc_6x5_unorm_srgb = "astc-6x5-unorm-srgb",
    astc_6x6_unorm = "astc-6x6-unorm",
    astc_6x6_unorm_srgb = "astc-6x6-unorm-srgb",
    astc_8x5_unorm = "astc-8x5-unorm",
    astc_8x5_unorm_srgb = "astc-8x5-unorm-srgb",
    astc_8x6_unorm = "astc-8x6-unorm",
    astc_8x6_unorm_srgb = "astc-8x6-unorm-srgb",
    astc_8x8_unorm = "astc-8x8-unorm",
    astc_8x8_unorm_srgb = "astc-8x8-unorm-srgb",
    astc_10x5_unorm = "astc-10x5-unorm",
    astc_10x5_unorm_srgb = "astc-10x5-unorm-srgb",
    astc_10x6_unorm = "astc-10x6-unorm",
    astc_10x6_unorm_srgb = "astc-10x6-unorm-srgb",
    astc_10x8_unorm = "astc-10x8-unorm",
    astc_10x8_unorm_srgb = "astc-10x8-unorm-srgb",
    astc_10x10_unorm = "astc-10x10-unorm",
    astc_10x10_unorm_srgb = "astc-10x10-unorm-srgb",
    astc_12x10_unorm = "astc-12x10-unorm",
    astc_12x10_unorm_srgb = "astc-12x10-unorm-srgb",
    astc_12x12_unorm = "astc-12x12-unorm",
    astc_12x12_unorm_srgb = "astc-12x12-unorm-srgb"
};

export class WebGPUTextureContext implements ITextureContext {
    private _engine: WebGPURenderEngine;
    constructor(engine: WebGPURenderEngine) {
        this._engine = engine;
    }
    needBitmap: boolean;

    private _getGPUTexturePixelByteSize(format: TextureFormat) {
        switch (format) {
            case TextureFormat.R5G6B5:
                return 2;
            case TextureFormat.R8G8B8:
                return 3;
            case TextureFormat.R8G8B8A8:
                return 4;
            case TextureFormat.R32G32B32:
                return 12;
            case TextureFormat.R32G32B32A32:
                return 16;
            case TextureFormat.R16G16B16:
                return 6;
            case TextureFormat.R16G16B16A16:
                return 8;
            default:
                return 4;
        }
    }

    private _getGPURenderTexturePixelByteSize(format: RenderTargetFormat) {
        switch (format) {
            case RenderTargetFormat.R8G8B8:
                return 3;
            case RenderTargetFormat.R8G8B8A8:
                return 4;
            case RenderTargetFormat.R32G32B32:
                return 12;
            case RenderTargetFormat.R32G32B32A32:
                return 16;
            case RenderTargetFormat.R16G16B16:
                return 6;
            case RenderTargetFormat.R16G16B16A16:
                return 8;
            case RenderTargetFormat.DEPTH_16:
                return 2;
            case RenderTargetFormat.DEPTH_32:
                return 4;
            case RenderTargetFormat.DEPTHSTENCIL_24_8:
                return 4;
            case RenderTargetFormat.DEPTHSTENCIL_24_Plus:
                return 4;
            case RenderTargetFormat.STENCIL_8:
                return 1;
            default:
                return 4;
        }
    }

    private _getGPUTextureFormat(format: TextureFormat, useSRGB: boolean): WebGPUTextureFormat {
        let webgpuTextureFormat = WebGPUTextureFormat.rgba8uint;
        switch (format) {
            case TextureFormat.R5G6B5:
                return null;
            case TextureFormat.R8G8B8://TODO
            case TextureFormat.R8G8B8A8:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.rgba8unorm : WebGPUTextureFormat.rgba8unorm_srgb;
                break;
            case TextureFormat.R32G32B32://TODO
            case TextureFormat.R32G32B32A32:
                webgpuTextureFormat = WebGPUTextureFormat.rgba32float;
                break;
            case TextureFormat.R16G16B16://TODO
            case TextureFormat.R16G16B16A16:
                webgpuTextureFormat = WebGPUTextureFormat.rgba16float;
                break;
            case TextureFormat.DXT1:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.bc1_rgba_unorm : WebGPUTextureFormat.bc1_rgba_unorm_srgb;
                break;
            case TextureFormat.DXT3:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.bc2_rgba_unorm : WebGPUTextureFormat.bc2_rgba_unorm_srgb;
                break;
            case TextureFormat.DXT5:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.bc3_rgba_unorm : WebGPUTextureFormat.bc3_rgba_unorm_srgb;
                break;
            case TextureFormat.ETC2RGBA:
            case TextureFormat.ETC1RGB:
            case TextureFormat.ETC2RGB:
            case TextureFormat.ETC2SRGB:
            case TextureFormat.ETC2SRGB_Alpha8:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.etc2_rgba8unorm : WebGPUTextureFormat.etc2_rgba8unorm_srgb;
                break;
            case TextureFormat.ASTC4x4:
            case TextureFormat.ASTC4x4SRGB:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.astc_4x4_unorm : WebGPUTextureFormat.astc_4x4_unorm_srgb;
                break;
            case TextureFormat.ASTC6x6:
            case TextureFormat.ASTC6x6SRGB:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.astc_6x6_unorm : WebGPUTextureFormat.astc_6x6_unorm_srgb;
                break
            case TextureFormat.ASTC8x8:
            case TextureFormat.ASTC8x8SRGB:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.astc_8x8_unorm : WebGPUTextureFormat.astc_8x8_unorm_srgb;
                break
            case TextureFormat.ASTC10x10:
            case TextureFormat.ASTC10x10SRGB:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.astc_10x10_unorm : WebGPUTextureFormat.astc_10x10_unorm_srgb;
                break
            case TextureFormat.ASTC12x12:
            case TextureFormat.ASTC12x12SRGB:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.astc_12x12_unorm : WebGPUTextureFormat.astc_12x12_unorm_srgb;
                break
            default:
                throw "unknow TextureFormat"
        }
        return webgpuTextureFormat;
    }

    private _getGPURenderTargetFormat(format: RenderTargetFormat, useSRGB: boolean): WebGPUTextureFormat {
        let webgpuTextureFormat = WebGPUTextureFormat.rgba8uint;
        switch (format) {
            case RenderTargetFormat.R8G8B8://TODO
            case RenderTargetFormat.R8G8B8A8:
                webgpuTextureFormat = !useSRGB ? WebGPUTextureFormat.bgra8unorm : WebGPUTextureFormat.bgra8unorm_srgb;
                break;
            case RenderTargetFormat.R32G32B32://TODO
            case RenderTargetFormat.R32G32B32A32:
                webgpuTextureFormat = WebGPUTextureFormat.rgba32float;
                break;
            case RenderTargetFormat.R16G16B16://TODO
            case RenderTargetFormat.R16G16B16A16:
                webgpuTextureFormat = WebGPUTextureFormat.rgba16float;
                break;
            case RenderTargetFormat.DEPTH_16:
                webgpuTextureFormat = WebGPUTextureFormat.depth16unorm;
                break;
            case RenderTargetFormat.DEPTH_32:
                webgpuTextureFormat = WebGPUTextureFormat.depth32float;
                break;
            case RenderTargetFormat.DEPTHSTENCIL_24_8:
                webgpuTextureFormat = WebGPUTextureFormat.depth24plus_stencil8;
                break;
            case RenderTargetFormat.DEPTHSTENCIL_24_Plus:
                webgpuTextureFormat = WebGPUTextureFormat.depth24plus;
                break;
            case RenderTargetFormat.STENCIL_8:
                webgpuTextureFormat = WebGPUTextureFormat.stencil8;
                break;
            default:
                throw "unknow TextureFormat";
        }
        return webgpuTextureFormat;
    }

    private isCompressTexture(format: TextureFormat) {
        switch (format) {
            case TextureFormat.DXT1:
            case TextureFormat.DXT3:
            case TextureFormat.DXT5:
            case TextureFormat.ETC2RGBA:
            case TextureFormat.ETC1RGB:
            case TextureFormat.ETC2RGB:
            case TextureFormat.ETC2SRGB:
            case TextureFormat.ETC2SRGB_Alpha8:
            case TextureFormat.ASTC4x4:
            case TextureFormat.ASTC4x4SRGB:
            case TextureFormat.ASTC6x6:
            case TextureFormat.ASTC6x6SRGB:
            case TextureFormat.ASTC8x8:
            case TextureFormat.ASTC8x8SRGB:
            case TextureFormat.ASTC10x10:
            case TextureFormat.ASTC10x10SRGB:
            case TextureFormat.ASTC12x12:
            case TextureFormat.ASTC12x12SRGB:
                return true
            default:
                return false;
        }
    }

    private _getGPUTextureDescriptor(dimension: TextureDimension, width: number, height: number,
        gpuFormat: WebGPUTextureFormat, layerCount: number, generateMipmap: boolean, multiSamples: number, isCompressTexture: boolean): GPUTextureDescriptor {
        const textureSize = {
            width: width,
            height: height,
            depthOrArrayLayers: layerCount,
        };
        const canCopy = !isCompressTexture;
        let usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT;
        const mipLevelCount = generateMipmap ? Math.max(Math.ceil(Math.log2(width)) + 1, Math.ceil(Math.log2(height)) + 1) : 1;
        if (canCopy)
            usage |= GPUTextureUsage.COPY_DST;
        let dimensionType: WebGPUTextureDimension;
        switch (dimension) {
            case TextureDimension.Tex2D:
            case TextureDimension.Cube:
            case TextureDimension.Texture2DArray:
                dimensionType = WebGPUTextureDimension.D2D;
                break;
            case TextureDimension.Tex3D:
                dimensionType = WebGPUTextureDimension.D3D;
                break;
            default:
                throw "DimensionType Unknown format";
        }
        const textureDescriptor: GPUTextureDescriptor = {
            size: textureSize,
            mipLevelCount,
            sampleCount: multiSamples,
            dimension: dimensionType,
            format: gpuFormat,
            usage,
        }
        return textureDescriptor;
    }

    createTextureInternal(dimension: TextureDimension, width: number, height: number, format: TextureFormat, generateMipmap: boolean, sRGB: boolean, premultipliedAlpha: boolean): InternalTexture {
        let layerCount;
        switch (dimension) {
            case TextureDimension.Tex2D:
                layerCount = 1;
                break;
            case TextureDimension.Cube:
                layerCount = 6;
                break;
        }
        if (dimension === TextureDimension.Tex3D) {
            throw "error";
        }
        //TODO
        // let useSRGBExt = this.isSRGBFormat(format) || (sRGB && this.supportSRGB(format, generateMipmap));
        // if (premultipliedAlpha) {//预乘法和SRGB同时开启，会有颜色白边问题
        //     useSRGBExt = false;
        // }
        // let gammaCorrection = 1.0;
        // if (!useSRGBExt && sRGB) {
        //     gammaCorrection = 2.2;
        // }

        const pixelByteSize = this._getGPUTexturePixelByteSize(format);
        const gpuTextureFormat = this._getGPUTextureFormat(format, sRGB);
        const textureDescriptor = this._getGPUTextureDescriptor(dimension, width, height, gpuTextureFormat, layerCount, generateMipmap, 1, this.isCompressTexture(format));
        if (generateMipmap)
            textureDescriptor.mipLevelCount = 1 + Math.log2(Math.max(width, height)) | 0;
        const gpuTexture = this._engine.getDevice().createTexture(textureDescriptor);
        const internalTex = new WebGPUInternalTex(width, height, 1, dimension, generateMipmap, 1, false, 1);
        internalTex.resource = gpuTexture;
        internalTex._webGPUFormat = gpuTextureFormat;
        WebGPUGlobal.action(internalTex, 'allocMemory | texture', (width * height * pixelByteSize * (generateMipmap ? 1.33333 : 1)) | 0);

        return internalTex;
    }

    async setTextureImageData(texture: InternalTexture, source: HTMLCanvasElement | HTMLImageElement | ImageBitmap, premultiplyAlpha: boolean, invertY: boolean) {
        if (!source) return;
        const imageBitmapSource = await createImageBitmap(source);
        const image: GPUImageCopyExternalImage = { source: imageBitmapSource as ImageBitmap, flipY: invertY, origin: [0, 0] };

        const textureCopyView: GPUImageCopyTextureTagged = {
            texture: texture.resource,
            origin: {
                x: 0,
                y: 0,
            },
            mipLevel: 0,
            premultipliedAlpha: premultiplyAlpha,
            colorSpace: texture.useSRGBLoad ? "srgb" : undefined,
        };
        const copySize: GPUExtent3DStrict = { width: source.width, height: source.height };
        const device = WebGPURenderEngine._instance.getDevice();
        device.queue.copyExternalImageToTexture(image, textureCopyView, copySize);
        //Generate mipmap TODO
        if (texture.mipmap)
            genMipmap(device, texture.resource);
    }

    setTextureSubImageData(texture: InternalTexture, source: HTMLCanvasElement | HTMLImageElement | ImageBitmap, x: number, y: number, premultiplyAlpha: boolean, invertY: boolean): void {
        if (!source) return;
        const image: GPUImageCopyExternalImage = { source: source as any, flipY: invertY, origin: { x: 0, y: 0 } };
        const textureCopyView: GPUImageCopyTextureTagged = {
            texture: texture.resource,
            origin: {
                x: x,
                y: y,
            },
            mipLevel: 0,
            premultipliedAlpha: premultiplyAlpha,
            colorSpace: texture.useSRGBLoad ? "srgb" : undefined

        };
        const copySize: GPUExtent3DStrict = { width: source.width, height: source.height };
        WebGPURenderEngine._instance.getDevice().queue.copyExternalImageToTexture(image, textureCopyView, copySize);
    }

    /**@internal */
    private _getBlockInformationFromFormat(format: WebGPUTextureFormat): { width: number; height: number; length: number } {
        switch (format) {
            // 8 bits formats
            case WebGPUTextureFormat.r8unorm:
            case WebGPUTextureFormat.r8snorm:
            case WebGPUTextureFormat.r8uint:
            case WebGPUTextureFormat.r8sint:
                return { width: 1, height: 1, length: 1 };
            // 16 bits formats
            case WebGPUTextureFormat.r16uint:
            case WebGPUTextureFormat.r16sint:
            case WebGPUTextureFormat.r16float:
            case WebGPUTextureFormat.rg8unorm:
            case WebGPUTextureFormat.rg8snorm:
            case WebGPUTextureFormat.rg8uint:
            case WebGPUTextureFormat.rg8sint:
                return { width: 1, height: 1, length: 2 };
            // 32 bits formats
            case WebGPUTextureFormat.r32uint:
            case WebGPUTextureFormat.r32sint:
            case WebGPUTextureFormat.r32float:
            case WebGPUTextureFormat.rg16uint:
            case WebGPUTextureFormat.rg16sint:
            case WebGPUTextureFormat.rg16float:
            case WebGPUTextureFormat.rgba8unorm:
            case WebGPUTextureFormat.rgba8unorm_srgb:
            case WebGPUTextureFormat.rgba8snorm:
            case WebGPUTextureFormat.rgba8uint:
            case WebGPUTextureFormat.rgba8sint:
            case WebGPUTextureFormat.bgra8unorm:
            case WebGPUTextureFormat.bgra8unorm_srgb:
            case WebGPUTextureFormat.rgb9e5ufloat:
            case WebGPUTextureFormat.rgb10a2unorm:
            case WebGPUTextureFormat.rg11b10ufloat:
                return { width: 1, height: 1, length: 4 };
            // 64 bits formats
            case WebGPUTextureFormat.rg32uint:
            case WebGPUTextureFormat.rg32sint:
            case WebGPUTextureFormat.rg32float:
            case WebGPUTextureFormat.rgba16uint:
            case WebGPUTextureFormat.rgba16sint:
            case WebGPUTextureFormat.rgba16float:
                return { width: 1, height: 1, length: 8 };
            // 128 bits formats
            case WebGPUTextureFormat.rgba32uint:
            case WebGPUTextureFormat.rgba32sint:
            case WebGPUTextureFormat.rgba32float:
                return { width: 1, height: 1, length: 16 };

            // Depth and stencil formats
            case WebGPUTextureFormat.stencil8:
                throw "No fixed size for Stencil8 format!";
            case WebGPUTextureFormat.depth16unorm:
                return { width: 1, height: 1, length: 2 };
            case WebGPUTextureFormat.depth24plus:
                throw "No fixed size for Depth24Plus format!";
            case WebGPUTextureFormat.depth24plus_stencil8:
                throw "No fixed size for Depth24PlusStencil8 format!";
            case WebGPUTextureFormat.depth32float:
                return { width: 1, height: 1, length: 4 };
            // case GPUTextureFormat.Depth24UnormStencil8:
            //     return { width: 1, height: 1, length: 4 };
            case WebGPUTextureFormat.depth32float_stencil8:
                return { width: 1, height: 1, length: 5 };

            // BC compressed formats usable if "texture-compression-bc" is both
            // supported by the device/user agent and enabled in requestDevice.
            case WebGPUTextureFormat.bc7_rgba_unorm:
            case WebGPUTextureFormat.bc7_rgba_unorm_srgb:
            case WebGPUTextureFormat.bc6h_rgb_float:
            case WebGPUTextureFormat.bc6h_rgb_ufloat:
            case WebGPUTextureFormat.bc5_rg_unorm:
            case WebGPUTextureFormat.bc5_rg_snorm:
            case WebGPUTextureFormat.bc3_rgba_unorm:
            case WebGPUTextureFormat.bc3_rgba_unorm_srgb:
            case WebGPUTextureFormat.bc2_rgba_unorm:
            case WebGPUTextureFormat.bc2_rgba_unorm_srgb:
                return { width: 4, height: 4, length: 16 };
            case WebGPUTextureFormat.bc4_r_unorm:
            case WebGPUTextureFormat.bc4_r_snorm:
            case WebGPUTextureFormat.bc1_rgba_unorm:
            case WebGPUTextureFormat.bc1_rgba_unorm_srgb:
                return { width: 4, height: 4, length: 8 };

            // ETC2 compressed formats usable if "texture-compression-etc2" is both
            // supported by the device/user agent and enabled in requestDevice.
            case WebGPUTextureFormat.etc2_rgb8unorm:
            case WebGPUTextureFormat.etc2_rgb8unorm_srgb:
            case WebGPUTextureFormat.etc2_rgb8a1unorm:
            case WebGPUTextureFormat.etc2_rgb8a1unorm_srgb:
                //case GPUTextureFormat.EACR11Unorm:
                //case GPUTextureFormat.EACR11Snorm:
                return { width: 4, height: 4, length: 8 };
            case WebGPUTextureFormat.etc2_rgb8unorm:
            case WebGPUTextureFormat.etc2_rgba8unorm_srgb:
                //case GPUTextureFormat.EACRG11Unorm:
                //case GPUTextureFormat.EACRG11Snorm:
                return { width: 4, height: 4, length: 16 };

            // ASTC compressed formats usable if "texture-compression-astc" is both
            // supported by the device/user agent and enabled in requestDevice.
            case WebGPUTextureFormat.astc_4x4_unorm:
            case WebGPUTextureFormat.astc_4x4_unorm_srgb:
                return { width: 4, height: 4, length: 16 };
            case WebGPUTextureFormat.astc_5x4_unorm:
            case WebGPUTextureFormat.astc_5x4_unorm_srgb:
                return { width: 5, height: 4, length: 16 };
            case WebGPUTextureFormat.astc_5x5_unorm:
            case WebGPUTextureFormat.astc_5x5_unorm_srgb:
                return { width: 5, height: 5, length: 16 };
            case WebGPUTextureFormat.astc_6x5_unorm:
            case WebGPUTextureFormat.astc_6x5_unorm_srgb:
                return { width: 6, height: 5, length: 16 };
            case WebGPUTextureFormat.astc_6x6_unorm:
            case WebGPUTextureFormat.astc_6x6_unorm_srgb:
                return { width: 6, height: 6, length: 16 };
            case WebGPUTextureFormat.astc_8x5_unorm:
            case WebGPUTextureFormat.astc_8x5_unorm_srgb:
                return { width: 8, height: 5, length: 16 };
            case WebGPUTextureFormat.astc_8x6_unorm:
            case WebGPUTextureFormat.astc_8x6_unorm_srgb:
                return { width: 8, height: 6, length: 16 };
            case WebGPUTextureFormat.astc_8x8_unorm:
            case WebGPUTextureFormat.astc_8x8_unorm_srgb:
                return { width: 8, height: 8, length: 16 };
            case WebGPUTextureFormat.astc_10x5_unorm:
            case WebGPUTextureFormat.astc_10x5_unorm_srgb:
                return { width: 10, height: 5, length: 16 };
            case WebGPUTextureFormat.astc_10x6_unorm:
            case WebGPUTextureFormat.astc_10x6_unorm_srgb:
                return { width: 10, height: 6, length: 16 };
            case WebGPUTextureFormat.astc_10x8_unorm:
            case WebGPUTextureFormat.astc_10x8_unorm_srgb:
                return { width: 10, height: 8, length: 16 };
            case WebGPUTextureFormat.astc_10x10_unorm:
            case WebGPUTextureFormat.astc_10x10_unorm_srgb:
                return { width: 10, height: 10, length: 16 };
            case WebGPUTextureFormat.astc_12x10_unorm:
            case WebGPUTextureFormat.astc_12x10_unorm_srgb:
                return { width: 12, height: 10, length: 16 };
            case WebGPUTextureFormat.astc_12x12_unorm:
            case WebGPUTextureFormat.astc_12x12_unorm_srgb:
                return { width: 12, height: 12, length: 16 };
        }

        return { width: 1, height: 1, length: 4 };
    }

    setTexturePixelsData(texture: WebGPUInternalTex, source: ArrayBufferView, premultiplyAlpha: boolean, invertY: boolean): void {
        if (!source) return;
        const imageCopy: GPUImageCopyTextureTagged = {
            texture: texture.resource,
            mipLevel: 0,
            premultipliedAlpha: premultiplyAlpha
        }
        const block = this._getBlockInformationFromFormat(texture._webGPUFormat);
        const bytesPerRow = Math.ceil(texture.width / block.width) * block.length;
        const height = texture.height;
        const dataLayout: GPUImageDataLayout = {
            offset: 0,
            bytesPerRow: bytesPerRow,
            rowsPerImage: height
        }
        const size = {
            width: Math.ceil(texture.width / block.width) * block.width,
            height: Math.ceil(height / block.height) * block.height,
        }

        const device = WebGPURenderEngine._instance.getDevice();
        device.queue.writeTexture(imageCopy, source.buffer, dataLayout, size);
        //Generate mipmap
        if (texture.mipmap)
            genMipmap(device, texture.resource);
    }

    setTextureSubPixelsData(texture: WebGPUInternalTex, source: ArrayBufferView, mipmapLevel: number, generateMipmap: boolean, xOffset: number, yOffset: number, width: number, height: number, premultiplyAlpha: boolean, invertY: boolean): void {
        if (!source) return;
        const imageCopy: GPUImageCopyTextureTagged = {
            texture: texture.resource,
            mipLevel: mipmapLevel,
            premultipliedAlpha: premultiplyAlpha,
            origin: {
                x: xOffset,
                y: yOffset,
            },
        }
        const block = this._getBlockInformationFromFormat(texture._webGPUFormat);
        const bytesPerRow = Math.ceil(width / block.width) * block.length;
        const dataLayout: GPUImageDataLayout = {
            offset: 0,
            bytesPerRow: bytesPerRow,
            rowsPerImage: height
        }
        const size = {
            width: Math.ceil(width / block.width) * block.width,
            height: Math.ceil(height / block.height) * block.height,
        }

        const device = WebGPURenderEngine._instance.getDevice();
        device.queue.writeTexture(imageCopy, source.buffer, dataLayout, size);
        //Generate mipmap
        if (generateMipmap)
            genMipmap(device, texture.resource);
    }

    initVideoTextureData(texture: InternalTexture): void {
        throw new Error("Method not implemented.");
    }
    setTextureDDSData(texture: InternalTexture, ddsInfo: DDSTextureInfo): void {
        throw new Error("Method not implemented.");
    }
    setTextureKTXData(texture: InternalTexture, ktxInfo: KTXTextureInfo): void {
        throw new Error("Method not implemented.");
    }
    setTextureHDRData(texture: WebGPUInternalTex, hdrInfo: HDRTextureInfo): void {
        const hdrPixelData = hdrInfo.readScanLine();
        this.setTexturePixelsData(texture, hdrPixelData, false, false);
    }
    setCubeImageData(texture: InternalTexture, source: (HTMLCanvasElement | HTMLImageElement | ImageBitmap)[], premultiplyAlpha: boolean, invertY: boolean): void {
        if (!source) return;
        for (let index = 0; index < 6; index++) {
            const sourceData = source[index];
            if (sourceData) {
                const image: GPUImageCopyExternalImage = { source: sourceData as any, flipY: invertY, origin: { x: 0, y: 0 } };
                const textureCopyView: GPUImageCopyTextureTagged = {
                    texture: texture.resource,
                    origin: {
                        x: 0,
                        y: 0,
                        z: WebGPUCubeMap[index]
                    },
                    mipLevel: 0,
                    premultipliedAlpha: premultiplyAlpha,
                    colorSpace: texture.useSRGBLoad ? "srgb" : undefined
                };
                const copySize: GPUExtent3DStrict = { width: sourceData.width, height: sourceData.height };
                WebGPURenderEngine._instance.getDevice().queue.copyExternalImageToTexture(image, textureCopyView, copySize);
            }
        }
        //Generate mipmap
        if (texture.mipmap)
            genMipmap(WebGPURenderEngine._instance.getDevice(), texture.resource);
    }
    setCubePixelsData(texture: WebGPUInternalTex, source: ArrayBufferView[], premultiplyAlpha: boolean, invertY: boolean): void {
        if (!source) return;
        for (let index = 0; index < 6; index++) {
            const sourceData = source[index];
            if (sourceData) {
                const imageCopy: GPUImageCopyTextureTagged = {
                    texture: texture.resource,
                    mipLevel: 0,
                    premultipliedAlpha: premultiplyAlpha,
                    origin: {
                        x: 0,
                        y: 0,
                        z: WebGPUCubeMap[index]
                    }
                }
                const width = texture.width;
                const height = texture.height;
                const block = this._getBlockInformationFromFormat(texture._webGPUFormat);
                const bytesPerRow = Math.ceil(width / block.width) * block.length;
                const dataLayout: GPUImageDataLayout = {
                    offset: 0,
                    bytesPerRow: bytesPerRow,
                    rowsPerImage: height
                }
                const size = {
                    width: Math.ceil(width / block.width) * block.width,
                    height: Math.ceil(height / block.height) * block.height,
                    depthOrArrayLayers: 1
                }
                WebGPURenderEngine._instance.getDevice().queue.writeTexture(imageCopy, sourceData.buffer, dataLayout, size);
            }
        }
        //Generate mipmap
        if (texture.mipmap)
            genMipmap(WebGPURenderEngine._instance.getDevice(), texture.resource);
    }
    setCubeSubPixelData(texture: WebGPUInternalTex, source: ArrayBufferView[], mipmapLevel: number, generateMipmap: boolean, xOffset: number, yOffset: number, width: number, height: number, premultiplyAlpha: boolean, invertY: boolean): void {
        if (!source) return;
        generateMipmap = generateMipmap && mipmapLevel === 0;
        for (let index = 0; index < 6; index++) {
            const sourceData = source[index];
            if (sourceData) {
                const imageCopy: GPUImageCopyTextureTagged = {
                    texture: texture.resource,
                    mipLevel: mipmapLevel,
                    premultipliedAlpha: premultiplyAlpha,
                    origin: {
                        x: xOffset,
                        y: yOffset,
                        z: WebGPUCubeMap[index]
                    }
                }
                const block = this._getBlockInformationFromFormat(texture._webGPUFormat);
                const bytesPerRow = Math.ceil(width / block.width) * block.length;
                const dataLayout: GPUImageDataLayout = {
                    offset: 0,
                    bytesPerRow: bytesPerRow,
                    rowsPerImage: height
                }
                const size = {
                    width: Math.ceil(width / block.width) * block.width,
                    height: Math.ceil(height / block.height) * block.height,
                    depthOrArrayLayers: 1
                }
                WebGPURenderEngine._instance.getDevice().queue.writeTexture(imageCopy, sourceData.buffer, dataLayout, size);
            }
        }
        if (texture.mipmap && generateMipmap)
            genMipmap(WebGPURenderEngine._instance.getDevice(), texture.resource);
    }
    setCubeDDSData(texture: InternalTexture, ddsInfo: DDSTextureInfo): void {
        throw new Error("Method not implemented.");
    }
    setCubeKTXData(texture: InternalTexture, ktxInfo: KTXTextureInfo): void {
        throw new Error("Method not implemented.");
    }
    setTextureCompareMode(texture: InternalTexture, compareMode: TextureCompareMode): TextureCompareMode {
        //throw new Error("Method not implemented.");
        switch (compareMode) {
            case TextureCompareMode.LEQUAL:
                break;
            case TextureCompareMode.GEQUAL:
                break;
            case TextureCompareMode.LESS:
                break;
            case TextureCompareMode.GREATER:
                break;
            case TextureCompareMode.EQUAL:
                break;
            case TextureCompareMode.NOTEQUAL:
                break;
            case TextureCompareMode.ALWAYS:
                break;
            case TextureCompareMode.NEVER:
                break;
            case TextureCompareMode.None:
            default:
                break;
        }
        return compareMode;
    }
    createRenderTextureInternal(dimension: TextureDimension, width: number, height: number, format: RenderTargetFormat, generateMipmap: boolean, sRGB: boolean): InternalTexture {
        throw new Error("Method not implemented.");
    }
    createRenderTargetInternal(width: number, height: number, colorFormat: RenderTargetFormat, depthStencilFormat: RenderTargetFormat, generateMipmap: boolean, sRGB: boolean, multiSamples: number): InternalRenderTarget {
        generateMipmap = false; //渲染目标不需要mipmap
        const pixelByteSize = this._getGPURenderTexturePixelByteSize(colorFormat);
        const gpuColorFormat = this._getGPURenderTargetFormat(colorFormat, sRGB);
        const gpuColorDescriptor = this._getGPUTextureDescriptor(TextureDimension.Tex2D, width, height, gpuColorFormat, 1, generateMipmap, multiSamples, false);
        const gpuColorTexture = this._engine.getDevice().createTexture(gpuColorDescriptor);
        const internalRT = new WebGPUInternalRT(colorFormat, depthStencilFormat, false, generateMipmap, multiSamples);
        internalRT._textures.push(new WebGPUInternalTex(width, height, 1, TextureDimension.Tex2D, generateMipmap, multiSamples, false, 1));
        internalRT._textures[0].resource = gpuColorTexture;
        internalRT._textures[0]._webGPUFormat = gpuColorFormat;
        WebGPUGlobal.action(internalRT._textures[0], 'allocMemory | texture', (width * height * multiSamples * pixelByteSize * (generateMipmap ? 1.33333 : 1)) | 0);
        if (multiSamples > 1) {
            const gpuColorDescriptor = this._getGPUTextureDescriptor(TextureDimension.Tex2D, width, height, gpuColorFormat, 1, generateMipmap, 1, false);
            const gpuColorTexture = this._engine.getDevice().createTexture(gpuColorDescriptor);
            internalRT._texturesResolve.push(new WebGPUInternalTex(width, height, 1, TextureDimension.Tex2D, generateMipmap, 1, false, 1));
            internalRT._texturesResolve[0].resource = gpuColorTexture;
            internalRT._texturesResolve[0]._webGPUFormat = gpuColorFormat;
            WebGPUGlobal.action(internalRT._texturesResolve[0], 'allocMemory | texture', (width * height * pixelByteSize * (generateMipmap ? 1.33333 : 1)) | 0);
        }

        if (colorFormat === RenderTargetFormat.DEPTH_16
            || colorFormat === RenderTargetFormat.DEPTH_32
            || colorFormat === RenderTargetFormat.DEPTHSTENCIL_24_Plus) {
            depthStencilFormat = RenderTargetFormat.R8G8B8A8;
            const array = new Uint16Array(width * height);
            for (let j = 0; j < height; j++)
                for (let i = 0; i < width; i++)
                    array[j * width + i] = 65535;
            this.setTexturePixelsData(internalRT._textures[0], array, false, false);
        }
        if (depthStencilFormat !== RenderTargetFormat.None) {
            const pixelByteSize = this._getGPURenderTexturePixelByteSize(depthStencilFormat);
            const gpuDepthFormat = this._getGPURenderTargetFormat(depthStencilFormat, false);
            const gpuDepthDescriptor = this._getGPUTextureDescriptor(TextureDimension.Tex2D, width, height, gpuDepthFormat, 1, generateMipmap, multiSamples, false);
            const gpuDepthTexture = this._engine.getDevice().createTexture(gpuDepthDescriptor);
            internalRT._depthTexture = new WebGPUInternalTex(width, height, 1, TextureDimension.Tex2D, false, multiSamples, false, 1);
            internalRT._depthTexture.resource = gpuDepthTexture;
            internalRT._depthTexture._webGPUFormat = gpuDepthFormat;
            WebGPUGlobal.action(internalRT._depthTexture, 'allocMemory | texture_depth', width * height * multiSamples * pixelByteSize);
        }

        WebGPURenderPassHelper.setColorAttachments(internalRT._renderPassDescriptor, internalRT, true);
        WebGPURenderPassHelper.setDepthAttachments(internalRT._renderPassDescriptor, internalRT, true);
        return internalRT;
    }
    createRenderTargetCubeInternal(size: number, colorFormat: RenderTargetFormat, depthStencilFormat: RenderTargetFormat, generateMipmap: boolean, sRGB: boolean, multiSamples: number): InternalRenderTarget {
        throw new Error("Method not implemented.");
    }
    setupRendertargetTextureAttachment(renderTarget: InternalRenderTarget, texture: InternalTexture): void {
        throw new Error("Method not implemented.");
    }
    bindRenderTarget(renderTarget: InternalRenderTarget, faceIndex?: number): void {
        throw new Error("Method not implemented.");
    }
    bindoutScreenTarget(): void {
        throw new Error("Method not implemented.");
    }
    unbindRenderTarget(renderTarget: InternalRenderTarget): void {
        throw new Error("Method not implemented.");
    }
    readRenderTargetPixelData(renderTarget: InternalRenderTarget, xOffset: number, yOffset: number, width: number, height: number, out: ArrayBufferView): ArrayBufferView {
        throw new Error("Method not implemented.");
    }
    updateVideoTexture(texture: InternalTexture, video: HTMLVideoElement, premultiplyAlpha: boolean, invertY: boolean): void {
        throw new Error("Method not implemented.");
    }
    getRenderTextureData(internalTex: InternalRenderTarget, x: number, y: number, width: number, height: number): ArrayBufferView {
        throw new Error("Method not implemented.");
    }
}