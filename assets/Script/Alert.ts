
const {ccclass, property} = cc._decorator;

@ccclass
export default class Alert extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    @property(cc.Color)
    fillColor: cc.Color = cc.Color.BLACK;

    @property(cc.Color)
    strokeColor: cc.Color = cc.Color.WHITE;

    onLoad () {
        this.node.setPosition(0, 0);
        const g = this.node.addComponent(cc.Graphics);
        g.fillColor = this.fillColor;
        g.strokeColor = this.strokeColor;
        g.stroke()
        g.fillRect(-500, -100, 1000, 200);
    }

}
