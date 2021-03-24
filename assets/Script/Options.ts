// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class Options extends cc.Component {

    private audioSwitch: cc.Node;
    private audioLabel: cc.Node;
    public audioValue: boolean = true; // 声音开关状态
    // public theme: boolean = true; // 是否浅色主体

    onLoad() {
        const audioValue = cc.sys.localStorage.getItem("options_audioValue");
        this.audioValue = audioValue === "false" ? false : true;

    }

    start() {
        this.audioSwitch = cc.find("audioSwitch", this.node)
        this.audioLabel = cc.find("audioLabel", this.node)
        this.audioSwitch.on(cc.Node.EventType.TOUCH_START, () => {
            this.audioValue = !this.audioValue
            this.audioSwitch.angle = this.audioValue ? 0 : 180;
            this.audioLabel.getComponent(cc.Label).string = this.audioValue ? "滑动音效：开" : "滑动音效：关";
            cc.sys.localStorage.setItem("options_audioValue", this.audioValue ? "true" : "false");
        })
    }

}
