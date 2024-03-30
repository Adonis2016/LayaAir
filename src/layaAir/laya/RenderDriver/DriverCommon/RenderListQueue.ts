import { SingletonList } from "../../utils/SingletonList";
import { IRenderContext3D, IRenderElement3D } from "../DriverDesign/3DRenderPass/I3DRenderPass";
import { InstanceRenderBatch } from "./InstanceRenderBatch";
import { RenderQuickSort } from "./RenderQuickSort";

/**
 * 渲染节点队列
 */
export class RenderListQueue {
    private _elements: SingletonList<IRenderElement3D> = new SingletonList<IRenderElement3D>();
    private quickSort: RenderQuickSort;
    private _isTransparent: boolean;
    private _batch: InstanceRenderBatch;

    constructor(isTransParent: boolean) {
        this._isTransparent = isTransParent;
        this.quickSort = new RenderQuickSort();
        this._batch = new InstanceRenderBatch();
    }

    addRenderElement(renderelement: IRenderElement3D) {
        this._elements.add(renderelement);
    }

    private _batchQueue() {
        if (!this._isTransparent)
            this._batch.batch(this._elements);
    }

    renderQueue(context: IRenderContext3D) {
        this._batchQueue(); //合并的地方
        const count = this._elements.length;
        this.quickSort.sort(this._elements, this._isTransparent, 0, count - 1);
        context.drawRenderElementList(this._elements);
    }

    clear(): void {
        this._elements.length = 0;
    }
}