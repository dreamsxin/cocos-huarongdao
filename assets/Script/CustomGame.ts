import { GameState } from "./game";
import { Grids } from "./types";

const { ccclass, property } = cc._decorator;


@ccclass
export default class CustomGame extends cc.Component {

    @property(cc.SpriteFrame)
    private gridSF: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    private gridSFActived: cc.SpriteFrame = null;

    private board: cc.Node;
    private chesses: cc.Node;

    private moveingChess: cc.Node;

    // 记录棋子们最开始的位置，添加失败或移除时好回到原位
    private chessesStartPotition: { [key: string]: cc.Vec3 } = {};

    // 网格们的激活状态
    private gridsActived: { [key: string]: number } = {};

    // 被移动的棋子覆盖的网格
    private gridsCoverd: string[] = [];

    // 网格信息
    private grids: {
        [key: string]: {
            node: cc.Node, // 节点
            center: cc.Vec3, // 
            chess: string, // 
        }
    } = {};


    private _mc: {
        left: number,
        top: number,
        right: number,
        bottom: number,
        gridsNum: number,
    }; // 辅助计算chess顶点位置的参数


    onLoad() {
        this.board = cc.find("board", this.node);
        this.chesses = cc.find("board/chesses", this.node);
        this.renderGrids();

        for (const chess of this.chesses.children) {
            this.chessesStartPotition[chess.name] = chess.position
            chess.on(cc.Node.EventType.TOUCH_START, this.onChessTouchStart);
            chess.on(cc.Node.EventType.TOUCH_MOVE, this.onChessTouchMove);
            chess.on(cc.Node.EventType.TOUCH_END, this.onChessTouchEnd)
            chess.on(cc.Node.EventType.TOUCH_CANCEL, this.onChessTouchEnd)
        }
    }

    /**
     * 渲染棋盘上面的格子
     */
    renderGrids = () => {
        const startPoint = cc.v3(-421, 521, 0);
        for (let ri = 0; ri < 5; ri++) {
            for (let ci = 0; ci < 4; ci++) {
                const grid = new cc.Node(`${ci}${ri}`);
                const sp = grid.addComponent(cc.Sprite);
                sp.spriteFrame = this.gridSF;
                grid.parent = this.board;
                grid.anchorX = 0;
                grid.anchorY = 1;
                const x = startPoint.x + ci * 210;
                const y = startPoint.y - ri * 210;
                grid.position = cc.v3(x, y, 0)
                this.grids[grid.name] = {
                    node: grid,
                    center: cc.v3(x + 101, y - 101, 0),
                    chess: null,
                };
                this.gridsActived[grid.name] = 0;
            }
        }
    }




    onChessTouchStart = (e: cc.Event.EventTouch) => {
        this.moveingChess = e.target;
        // 清除表格里面的棋子绑定，清除网格激活状态
        for (const gName in this.grids) {
            if (this.grids[gName].chess === this.moveingChess.name) {
                this.grids[gName].chess = null
                this.gridsActived[gName] = 0
            }
        }
        this._mc = {
            left: this.moveingChess.name[0] === "0" || this.moveingChess.name[0] === "1" ? -101 : -206,
            top: this.moveingChess.name[0] === "0" || this.moveingChess.name[0] === "2" ? 101 : 206,
            right: this.moveingChess.name[0] === "0" || this.moveingChess.name[0] === "1" ? 101 : 206,
            bottom: this.moveingChess.name[0] === "0" || this.moveingChess.name[0] === "2" ? -101 : -206,
            gridsNum: this.moveingChess.name[0] === "0" ? 1 : (this.moveingChess.name[0] === "3" ? 4 : 2),
        }
    }

    onChessTouchMove = (e: cc.Event.EventTouch) => {
        const delta = e.touch.getDelta()
        const position = this.moveingChess.getPosition()

        const center = cc.v2(
            position.x + delta.x / this.board.scale,
            position.y + delta.y / this.board.scale,
        )

        this.moveingChess.setPosition(center);

        const left = center.x + this._mc.left;
        const right = center.x + this._mc.right;
        const top = center.y + this._mc.top;
        const bottom = center.y + this._mc.bottom;

        this.gridsCoverd = [] // 覆盖到的网格
        for (const gName in this.grids) {
            if (this.grids[gName].chess === null &&
                this.grids[gName].center.x > left &&
                this.grids[gName].center.x < right &&
                this.grids[gName].center.y < top &&
                this.grids[gName].center.y > bottom
            ) {
                this.gridsCoverd.push(gName);
            }
        }
        if (this.gridsCoverd.length !== this._mc.gridsNum) { // 如果覆盖到的网格不够棋子放下，清空覆盖到的网格
            this.gridsCoverd = []
        }
        for (const gName in this.gridsActived) {
            // shouldActived，一个网格被激活的条件是(空格被覆盖)或(格子已经和棋子绑定)
            const shouldActived = this.gridsCoverd.includes(gName) || this.grids[gName].chess !== null
            if (this.gridsActived[gName] === 0 && shouldActived) { // 主动激活
                this.grids[gName].node.getComponent(cc.Sprite).spriteFrame = this.gridSFActived
            } else if (this.gridsActived[gName] === 1 && !shouldActived) {// 主动隐藏
                this.grids[gName].node.getComponent(cc.Sprite).spriteFrame = this.gridSF
            }
            this.gridsActived[gName] = shouldActived ? 1 : 0
        }
    }



    onChessTouchEnd = () => {
        if (this.gridsCoverd.length > 0) {
            let sumX = 0;
            let sumY = 0;
            for (const gName of this.gridsCoverd) {
                sumX += this.grids[gName].center.x;
                sumY += this.grids[gName].center.y;
                this.grids[gName].chess = this.moveingChess.name;
            }
            // 自动贴合匹配网格的中心
            cc.tween(this.moveingChess).to(0.2, {
                position: cc.v3(sumX / this.gridsCoverd.length, sumY / this.gridsCoverd.length, 0)
            }).start()
            this.getGameState()
        } else {
            // 清除表格里面的棋子绑定，主动清除网格激活状态
            for (const gName in this.grids) {
                if (this.grids[gName].chess === this.moveingChess.name) {
                    this.grids[gName].chess = null
                    this.gridsActived[gName] = 0
                    this.grids[gName].node.getComponent(cc.Sprite).spriteFrame = this.gridSF
                }
            }
            // 回到原位
            cc.tween(this.moveingChess).to(0.2, {
                position: this.chessesStartPotition[this.moveingChess.name]
            }).start()
        }

        this.moveingChess = null;

    }

    getGameState = () => {
        const chesses = []
        //新建网格
        const grids: Grids = [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
        ];
        const chessSizes = {
            "0": { w: 1, h: 1 },
            "1": { w: 1, h: 2 },
            "2": { w: 2, h: 1 },
            "3": { w: 2, h: 2 },
        }
        for (let ri = 0; ri < 5; ri++) {
            for (let ci = 0; ci < 4; ci++) {
                if (grids[ri][ci] !== null) {
                    continue
                }
                const chessName = this.grids[`${ci}${ri}`].chess
                if (chessName) {
                    const chess = { ...chessSizes[chessName[0]], x: ci, y: ri }
                    const chessIndex = chesses.push(chess) - 1
                    for (let x = 0; x < chess.w; x++) {
                        for (let y = 0; y < chess.h; y++) {
                            grids[ri + y][ci + x] = chessIndex;
                        }
                    }
                }
            }
        }
        return new GameState(chesses, [])
    }

    clear = () => {
        this.moveingChess = null;
        this.gridsCoverd = [];
        for (const gName in this.gridsActived) {
            this.gridsActived[gName] = 0;
            this.grids[gName].chess = null;
            this.grids[gName].node.getComponent(cc.Sprite).spriteFrame = this.gridSF
        }
        for (const chess of this.chesses.children) {
            chess.setPosition(this.chessesStartPotition[chess.name])
        }
    }
}
