import { GameState } from './game';
import gameData from './gameData';
import HuaRongDao from './HuaRongDao';
import { Difficulty } from './types';

const { ccclass, property } = cc._decorator;

@ccclass
export default class Levels extends cc.Component {

    private currentPage: number = 0;
    private pageSize: number = 9;
    private pageInfoLabel: cc.Label;
    private rate: number = 1;
    private levels: cc.Node;

    // @property(Function)
    // private onClickLevel = () => {};

    // 难度
    public difficulty: Difficulty = Difficulty.simple;

    public winLevels: string[] = [];

    onLoad() {
        try {
            const winLevels = JSON.parse(cc.sys.localStorage.getItem("winLevels"));
            if(winLevels) {
                this.winLevels = winLevels;
            }
            // cc.log(JSON.parse(cc.sys.localStorage.getItem("successLevels")))
            // this.successLevels = JSON.parse(cc.sys.localStorage.getItem("successLevels"))
        } catch (e) {

        }
        this.rate = Math.min(cc.view.getVisibleSize().width / 1200, 1);
        this.levels = cc.find("levels", this.node);
        this.pageInfoLabel = cc.find("pageInfo", this.node).getComponent(cc.Label);
        cc.find("nextBtn", this.node).on(cc.Node.EventType.TOUCH_START, () => this.showPage(this.currentPage + 1))
        cc.find("prevBtn", this.node).on(cc.Node.EventType.TOUCH_START, () => this.showPage(this.currentPage - 1))
    }

    showPage = (page: number) => {
        const games = gameData[Difficulty[this.difficulty]];
        const maxPage = Math.ceil(games.length / this.pageSize)
        if (page < 0 || page >= maxPage) {
            return;
        }

        this.levels.destroyAllChildren()
        this.currentPage = page;
        const start = Math.min(this.currentPage * this.pageSize, games.length);
        const end = Math.min((this.currentPage + 1) * this.pageSize, games.length);
        this.pageInfoLabel.string = `第${this.currentPage + 1}页 共${maxPage}页`;
        const levels = games.slice(start, end);

        for (let i = 0; i < end - start; i++) {
            // const level = levels[i];
            const levelName = `${Difficulty[this.difficulty][0].toUpperCase()}${start + i + 1}`;
            const levelNode = this.renderLevel(levels[i], levelName);
            levelNode.x = (-357 + (i % 3) * 360) * this.rate
            levelNode.y = 700 - Math.floor(i / 3) * 500
        }
    }



    renderLevel = (levelKey: string, levelName: string) => {
        const levelNode = new cc.Node("level")
        levelNode.parent = this.levels;
        const chesses = new cc.Node("chesses")
        // GameState.fromSimilarKey(key).logGrides()
        const chesseSize = {
            '3': { w: 202, h: 202 },
            '4': { w: 202, h: 412 },
            '5': { w: 412, h: 202 },
            '6': { w: 412, h: 412 },
        };
        const startX = -416; //(412+412+8)/2
        const startY = -521; //(412+412+202+16)/2

        for (let i = 0; i < levelKey.length; i++) {
            if (i % 3 == 0) {
                const chess = new cc.Node()
                const g = chess.addComponent(cc.Graphics);
                const w = chesseSize[levelKey[i]].w;
                const h = chesseSize[levelKey[i]].h;
                const x = startX + Number(levelKey[i + 1]) * 210;
                const y = -startY - Number(levelKey[i + 2]) * 210 - h;
                g.rect(x, y, w, h)
                g.fillColor = new cc.Color(0, 0, 0, 0 + (Number(levelKey[i]) - 2) * 60)
                g.fill()
                chess.parent = chesses
            }
        }

        // 边框
        const g = chesses.addComponent(cc.Graphics);
        g.rect(startX - 8, startY - 8, 848, 1058)
        g.lineWidth = 10;
        g.strokeColor = new cc.Color(0, 0, 0, 255)
        g.stroke()

        chesses.setContentSize(848, 1058)
        chesses.scale = 0.3 * this.rate;
        chesses.parent = levelNode;

        chesses.on(cc.Node.EventType.TOUCH_START, () => this.startGame(levelKey, levelName))


        // 文字
        const title = new cc.Node("title")
        const titleLabel = title.addComponent(cc.Label)
        titleLabel.string = `第 ${levelName}关 ${this.winLevels.includes(levelName) ? ' ✔' : ''}`;
        title.color = new cc.Color(0, 0, 0, 255)
        title.parent = levelNode;
        title.position = cc.v3(0, -200 * this.rate, 0);

        return levelNode;
    }

    // 开始游戏
    startGame = (levelKey: string, levelName: string) => {
        const gameState = GameState.fromSimilarKey(levelKey);
        // gameState.logGrides()
        gameState.levelName = levelName;
        const gameCtrl: HuaRongDao = cc.find("/Canvas").getComponent("HuaRongDao")
        gameCtrl.renderNewGameState(gameState)
        cc.find("/Canvas/newGameModal").scale = 0;
        gameCtrl.controlModal(this.node, false);
    }

    addWinLevel = (levelName: string) => {
        if(levelName && !this.winLevels.includes(levelName)) {
            this.winLevels.push(levelName);
            cc.sys.localStorage.setItem("winLevels", JSON.stringify(this.winLevels))
        }
    }


}
