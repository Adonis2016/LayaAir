import { Event } from "../events/Event"
import { Texture } from "../resource/Texture"
import { Clip } from "./Clip"

/**
 * 字体切片，简化版的位图字体，只需设置一个切片图片和文字内容即可使用，效果同位图字体
 * 使用方式：设置位图字体皮肤skin，设置皮肤对应的字体内容sheet（如果多行，可以使用空格换行），示例：
 * fontClip.skin = "font1.png";//设置皮肤
 * fontClip.sheet = "abc123 456";//设置皮肤对应的内容，空格换行。此皮肤为2行5列（显示时skin会被等分为2行5列），第一行对应的文字为"abc123"，第二行为"456"
 * fontClip.value = "a1326";//显示"a1326"文字
 */
export class FontClip extends Clip {
    /**@internal 数值*/
    protected _valueArr: string = '';
    /**@internal 文字内容数组**/
    protected _indexMap: Record<string, number> = null;
    /**@internal 位图字体内容**/
    protected _sheet: string = null;
    /**@internal */
    protected _direction: string = "horizontal";
    /**@internal X方向间隙*/
    protected _spaceX: number = 0;
    /**@internal Y方向间隙*/
    protected _spaceY: number = 0;
    /**@internal 水平对齐方式*/
    private _align: string = "left";
    /**@internal 显示文字宽*/
    private _wordsW: number = 0;
    /**@internal 显示文字高*/
    private _wordsH: number = 0;

    get index(): number {
        return this._index;
    }

    set index(value: number) {
        this._index = value;
        ////屏蔽Clip类操作
    }

    /**
     * 设置位图字体内容，空格代表换行。比如"abc123 456"，代表第一行对应的文字为"abc123"，第二行为"456"
     */
    get sheet(): string {
        return this._sheet;
    }

    set sheet(value: string) {
        value += "";
        this._sheet = value;
        //根据空格换行
        var arr: any[] = value.split(" ");
        this._clipX = String(arr[0]).length;
        this.clipY = arr.length;

        this._indexMap = {};
        for (var i: number = 0; i < this._clipY; i++) {
            var line: any[] = arr[i].split("");
            for (var j: number = 0, n: number = line.length; j < n; j++) {
                this._indexMap[line[j]] = i * this._clipX + j;
            }
        }
    }

    /**
     * 设置位图字体的显示内容
     */
    get value(): string {
        if (!this._valueArr) return "";
        return this._valueArr;
    }

    set value(value: string) {
        value += "";
        this._valueArr = value;
        this.callLater(this.changeValue);
    }

    /**
     * 布局方向。
     * <p>默认值为"horizontal"。</p>
     * <p><b>取值：</b>
     * <li>"horizontal"：表示水平布局。</li>
     * <li>"vertical"：表示垂直布局。</li>
     * </p>
     */
    get direction(): string {
        return this._direction;
    }

    set direction(value: string) {
        this._direction = value;
        this.callLater(this.changeValue);
    }

    /**X方向文字间隙*/
    get spaceX(): number {
        return this._spaceX;
    }

    set spaceX(value: number) {
        this._spaceX = value;
        if (this._direction === "horizontal") this.callLater(this.changeValue);
    }

    /**Y方向文字间隙*/
    get spaceY(): number {
        return this._spaceY;
    }

    set spaceY(value: number) {
        this._spaceY = value;
        if (!(this._direction === "horizontal")) this.callLater(this.changeValue);
    }


    set align(v: string) {
        this._align = v;
        this.callLater(this.changeValue);
    }

    /**水平对齐方式*/
    get align(): string {
        return this._align;
    }


    /**
     * @param skin 位图字体皮肤
     * @param sheet 位图字体内容，空格代表换行
     */
    constructor(skin: string = null, sheet: string = null) {
        super();
        if (skin) this.skin = skin;
        if (sheet) this.sheet = sheet;
    }

    /**
     * @internal
     * @inheritDoc 
     * @override
     */
    _setWidth(value: number) {
        super._setWidth(value);
        this.callLater(this.changeValue);
    }

    /**
     * @internal
     * @inheritDoc 
     * @override
     */
    _setHeight(value: number) {
        super._setHeight(value);
        this.callLater(this.changeValue);
    }

    /**
     * @internal
     * 资源加载完毕
     */
    protected loadComplete(url: string, img: Texture): void {
        super.loadComplete(url, img);
        this.callLater(this.changeValue);
    }

    /**@internal 渲染数值*/
    protected changeValue(): void {
        if (!this._sources) return;
        if (!this._valueArr) return;
        this.graphics.clear(true);
        let texture: Texture;
        texture = this._sources[0];
        if (!texture) return;
        var isHorizontal: boolean = (this._direction === "horizontal");
        if (isHorizontal) {
            this._wordsW = this._valueArr.length * (texture.sourceWidth + this.spaceX);
            this._wordsH = texture.sourceHeight;
        } else {
            this._wordsW = texture.sourceWidth;
            this._wordsH = (texture.sourceHeight + this.spaceY) * this._valueArr.length;
        }
        let dX: number = 0;
        if (this._isWidthSet) {
            switch (this._align) {
                case "center":
                    dX = 0.5 * (this._width - this._wordsW);
                    break;
                case "right":
                    dX = this._width - this._wordsW;
                    break;
                default:
                    dX = 0;
            }
        }

        for (let i = 0, sz = this._valueArr.length; i < sz; i++) {
            let index = this._indexMap[this._valueArr.charAt(i)];
            texture = this._sources[index];
            if (!texture)
                continue;

            if (isHorizontal)
                this.graphics.drawImage(texture, dX + i * (texture.sourceWidth + this.spaceX), 0, texture.sourceWidth, texture.sourceHeight);
            else
                this.graphics.drawImage(texture, 0 + dX, i * (texture.sourceHeight + this.spaceY), texture.sourceWidth, texture.sourceHeight);
        }

        if (!this._isWidthSet) {
            this._widget.resetLayoutX();
            this.callLater(this._sizeChanged);
        }
        if (!this._isHeightSet) {
            this._widget.resetLayoutY();
            this.callLater(this._sizeChanged);
        }
    }

    /**
     * @internal
     * @override
     */
    protected measureWidth(): number {
        return this._wordsW;
    }
    /**
     * @internal
     * @override
     */
    protected measureHeight(): number {
        return this._wordsH;
    }
    /**
     * 
     * @param destroyChild 
     * @override
     */
    destroy(destroyChild: boolean = true): void {
        this._valueArr = null;
        this._indexMap = null;
        this.graphics.clear(true);

        super.destroy(destroyChild);
    }
}