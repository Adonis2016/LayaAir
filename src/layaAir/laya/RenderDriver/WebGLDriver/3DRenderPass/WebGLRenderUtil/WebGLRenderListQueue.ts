import { WebGLInstanceRenderBatch } from "../../../../d3/graphics/Batch/WebGLInstanceRenderBatch";
import { SingletonList } from "../../../../utils/SingletonList";
import { WebGLRenderContext3D } from "../WebGLRenderContext3D";
import { WebGLRenderElement3D } from "../WebGLRenderElement3D";
import { WebGLQuickSort } from "./WebGLQuickSort";

export class WebGLRenderListQueue {
    /** @internal */
    _elements: SingletonList<WebGLRenderElement3D> = new SingletonList<WebGLRenderElement3D>();
    private quickSort: WebGLQuickSort;
    private _isTransparent: boolean;

    _batch: WebGLInstanceRenderBatch;

    constructor(isTransParent: boolean) {
        this._isTransparent = isTransParent;
        this.quickSort = new WebGLQuickSort();
        this._batch = new WebGLInstanceRenderBatch();
    }

    addRenderElement(renderelement: WebGLRenderElement3D) {
        this._elements.add(renderelement);
    }

    _batchQueue() {
        if (!this._isTransparent) {
            this._batch.batch(this._elements);
        }
    }

    renderQueue(context: WebGLRenderContext3D) {
        this._batchQueue();//合并的地方
        var count: number = this._elements.length;
        this.quickSort.sort(this._elements, this._isTransparent, 0, count - 1);
        context.drawRenderElementList(this._elements);

        this._batch.clearRenderData();
    }

    clear(): void {
        this._elements.length = 0;
    }
}