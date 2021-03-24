// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class Loading extends cc.Component {


    private iconAnimation: cc.Animation;
    private label: cc.Label;


    onLoad() {
        this.iconAnimation = cc.find("icon", this.node).getComponent(cc.Animation)
        this.label = cc.find("label", this.node).getComponent(cc.Label)
    }

    show(title: string = "计算中…") {
        const animState = this.iconAnimation.play();
        animState.wrapMode = cc.WrapMode.Loop;
        animState.speed = 0.5;
        this.label.string = title
        this.node.scale = 1
    }

    hide() {
        this.node.scale = 0
        this.iconAnimation.stop()
    }
}
