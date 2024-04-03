interface ParameterDetail {
    name: string;
    type: string;
    inout?: 'in' | 'out' | 'inout';
    precision?: 'lowp' | 'mediump' | 'highp';
    isArray: boolean;
    arrayLength?: number; // 如果是数组，表示数组的长度
    isStruct: boolean;
}

interface FunctionCall {
    name: string;
    returnType?: string; // 可能无法总是解析出返回类型
    parameters: string[]; // 参数类型列表
}

class GLSLFunction {
    name: string;
    return: string;
    funcString: string;
    parameters: ParameterDetail[] = [];
    calls: FunctionCall[] = [];

    constructor(funcString: string) {
        this.funcString = funcString;
        this._parse();
    }

    /**
     * 解析函数定义
     */
    private _parse() {
        const funcStr = this.funcString;
        // 基本的函数正则表达式
        const headerRegex = /(\w+)\s+(\w+)\s*\((.*?)\)\s*\n*\{/;
        const paramRegex = /\s*(in|out|inout)?\s*(lowp|mediump|highp)?\s*([\w]+)(\[\d*\])?\s+([\w]+)/g;
        const callRegex = /(\w+)\s*\((.*?)\)/g;

        const headerMatch = funcStr.match(headerRegex);
        if (headerMatch) {
            this.return = headerMatch[1].trim();
            this.name = headerMatch[2].trim();

            const paramsStr = headerMatch[3];
            let paramMatch;
            while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
                const [, inout, precision, type, array, name] = paramMatch;
                const isStruct = !['float', 'int', 'void', 'bool', 'vec2', 'vec3', 'vec4', 'mat2', 'mat3', 'mat4'].includes(type);
                const isArray = array != null;
                let arrayLength = undefined;
                if (isArray)
                    arrayLength = parseInt(array.replace(/\D/g, '')); // 简单提取数组长度

                this.parameters.push({
                    name,
                    type,
                    inout: inout as any,
                    precision: precision as any,
                    isArray,
                    arrayLength,
                    isStruct
                });
            }
        }

        // 提取函数内的调用
        let callMatch;
        while ((callMatch = callRegex.exec(funcStr)) !== null) {
            this.calls.push({
                name: callMatch[1].trim(),
                parameters: callMatch[2].split(',').map(p => p.trim()) // 简单处理
            });
        }
    }
}

export class WebGPU_GLSLFunction {
    functions: GLSLFunction[] = [];

    /**
     * 提取函数定义
     * @param glslCode 
     */
    extractFunctions(glslCode: string) {
        const functions = this.functions;
        let depth = 0; // 当前大括号的深度
        let startIndices: number[] = []; // 函数定义开始索引
        let commentMode: '' | '//' | '/*' = ''; // 当前注释模式

        for (let i = 0, len = glslCode.length; i < len; i++) {
            const char = glslCode[i];
            const nextChar = glslCode[i + 1];

            // 处理注释开始
            if (commentMode === '') {
                if (char === '/' && nextChar === '/') {
                    commentMode = '//';
                    i++;
                    continue;
                } else if (char === '/' && nextChar === '*') {
                    commentMode = '/*';
                    i++;
                    continue;
                }
            }

            // 处理注释结束
            if (commentMode === '//') {
                if (char === '\n')
                    commentMode = '';
                continue;
            } else if (commentMode === '/*') {
                if (char === '*' && nextChar === '/') {
                    commentMode = '';
                    i++;
                }
                continue;
            }

            // 如果处于注释模式中，忽略其他所有字符
            if (commentMode !== '') continue;

            // 标记函数开始
            if (char === '{' && depth === 0) {
                // 向前寻找至上一个非空白符的字符，检查是否有函数参数的结束括号`)`
                let j = i - 1;
                while (j >= 0 && /\s/.test(glslCode[j])) j--;

                if (glslCode[j] === ')') {
                    while (j >= 0 && glslCode[j] !== '(') j--; // 继续向前寻找到对应的开始括号`(`
                    while (j >= 0 && /\s/.test(glslCode[j])) j--; // 向前寻找函数返回类型的最后一个字符
                    let k = j;
                    while (k >= 0 && !/\s/.test(glslCode[k])) k--; // 继续向前寻找到函数名称的开始位置

                    let returnTypeStart = k; // 记录可能的函数返回类型开始位置
                    while (returnTypeStart >= 0 && /\s/.test(glslCode[returnTypeStart])) returnTypeStart--; // 过滤掉名称之前的空白符
                    let returnTypeEnd = returnTypeStart;
                    while (returnTypeEnd >= 0 && !/\s/.test(glslCode[returnTypeEnd])) returnTypeEnd--; // 继续寻找返回类型开始位置

                    // 记录函数定义的起始位置（包括函数返回类型）
                    startIndices.push(returnTypeEnd + 1);
                }
            }

            if (char === '{') {
                depth++; // 进入一个新的层级
            } else if (char === '}' && depth > 0) {
                depth--; // 离开一个层级
                if (depth === 0 && startIndices.length > 0)
                    // 此时完成了一个函数定义的提取
                    functions.push(new GLSLFunction(glslCode.substring(startIndices.pop()!, i + 1).trim()));
            }
        }
    }

    /**
     * 打印调试信息
     */
    debugInfo() {
        for (let i = 0, len = this.functions.length; i < len; i++)
            console.log(this.functions[i]);
    }
}