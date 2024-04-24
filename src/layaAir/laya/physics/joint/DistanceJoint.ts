import { JointBase } from "./JointBase";
import { Physics2D } from "../Physics2D"
import { RigidBody } from "../RigidBody"
import { physics2D_DistancJointDef } from "./JointDefStructInfo";
import { Sprite } from "../../display/Sprite";

/**
 * 距离关节：两个物体上面各自有一点，两点之间的距离固定不变
 */
export class DistanceJoint extends JointBase {
    /**@private */
    private static _temp: physics2D_DistancJointDef;
    /**[首次设置有效]关节的自身刚体*/
    selfBody: RigidBody;
    /**[首次设置有效]关节的连接刚体，可不设置，默认为左上角空刚体*/
    otherBody: RigidBody;
    /**[首次设置有效]自身刚体链接点，是相对于自身刚体的左上角位置偏移*/
    selfAnchor: any[] = [0, 0];
    /**[首次设置有效]链接刚体链接点，是相对于otherBody的左上角位置偏移*/
    otherAnchor: any[] = [0, 0];
    /**[首次设置有效]两个刚体是否可以发生碰撞，默认为false*/
    collideConnected: boolean = false;

    /**约束的目标静止长度*/
    private _length: number = 0;
    /**约束的最小长度，-1表示使用默认值*/
    private _maxLength: number = -1;
    /**约束的最大长度，-1表示使用默认值*/
    private _minLength: number = -1;

    /**弹簧系统的震动频率，可以视为弹簧的弹性系数，通常频率应该小于时间步长频率的一半*/
    private _frequency: number = 1;
    /**刚体在回归到节点过程中受到的阻尼比，建议取值0~1*/
    private _dampingRatio: number = 0;

    /**
     * @override
     */
    protected _createJoint(): void {
        if (!this._joint) {
            let node = <Sprite>this.owner;
            this.selfBody = this.selfBody || node.getComponent(RigidBody);
            if (!this.selfBody) throw "selfBody can not be empty";
            let point = this.getBodyAnchor(this.selfBody, this.selfAnchor[0], this.selfAnchor[1]);
            var def = DistanceJoint._temp || (DistanceJoint._temp = new physics2D_DistancJointDef());
            def.bodyB = this.selfBody.getBody();
            def.localAnchorB.setValue(point.x, point.y);
            this.selfBody.owner.on("shapeChange", this, this._refeahJoint);
            if (this.otherBody) {
                def.bodyA = this.otherBody.getBody();
                point = this.getBodyAnchor(this.otherBody, this.otherAnchor[0], this.otherAnchor[1]);
                def.localAnchorA.setValue(point.x, point.y);
                this.otherBody.owner.on("shapeChange", this, this._refeahJoint);
            } else {
                def.bodyA = Physics2D.I._emptyBody;
                def.localAnchorA.setValue(this.otherAnchor[0], this.otherAnchor[1]);
            }

            def.dampingRatio = this._dampingRatio;
            def.frequency = this._frequency;
            def.collideConnected = this.collideConnected;
            def.length = this._length;
            def.maxLength = this._maxLength;
            def.minLength = this._minLength;
            this._joint = this._factory.createDistanceJoint(def);

        }
    }

    /**@internal */
    _refeahJoint(): void {
        if (this._joint) {
            this._factory.set_DistanceJointStiffnessDamping(this._joint, this._frequency, this._dampingRatio);
        }
    }

    onDestroy(): void {
        super.onDestroy();
        this.selfBody.owner.off("shapeChange", this._refeahJoint);
        if (this.otherBody) this.otherBody.owner.off("shapeChange", this._refeahJoint);
    }

    /**约束的目标静止长度*/
    get length(): number {
        return this._length;
    }

    set length(value: number) {
        this._length = value;
        if (this._joint) this._factory.set_DistanceJoint_length(this._joint, value);
    }

    /**约束的最小长度*/
    get minLength(): number {
        return this._minLength;
    }

    set minLength(value: number) {
        this._minLength = value;
        if (this._joint) this._factory.set_DistanceJoint_MinLength(this._joint, value);
    }

    /**约束的最大长度*/
    get maxLength(): number {
        return this._maxLength;
    }

    set maxLength(value: number) {
        this._maxLength = value;
        if (this._joint) this._factory.set_DistanceJoint_MaxLength(this._joint, value);
    }

    /**弹簧系统的震动频率，可以视为弹簧的弹性系数，通常频率应该小于时间步长频率的一半*/
    get frequency(): number {
        return this._frequency;
    }

    set frequency(value: number) {
        this._frequency = value;
        if (this._joint) {
            this._factory.set_DistanceJointStiffnessDamping(this._joint, this._frequency, this._dampingRatio);
        }
    }

    /**刚体在回归到节点过程中受到的阻尼比，建议取值0~1*/
    get damping(): number {
        return this._dampingRatio;
    }

    set damping(value: number) {
        this._dampingRatio = value;
        if (this._joint) {
            this._factory.set_DistanceJointStiffnessDamping(this._joint, this._frequency, this._dampingRatio);
        }
    }

    /**刚体当前长度*/
    get jointLength(): number {
        if (this._joint) {
            return this._factory.phyToLayaValue(this.joint.GetLength())
        } else {
            return 0;
        }

    }
}
