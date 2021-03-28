import CustomGame from "./CustomGame";
import { GameState } from "./game";
import Levels from "./Levels";
import Loading from "./Loading";
import Options from "./Options";
import { Difficulty, Direction, Step } from "./types";
import gameData from './gameData';

const { ccclass, property } = cc._decorator;

@ccclass
export default class HuaRongDao extends cc.Component {

    private menus: cc.Node; // 游戏菜单
    private newGameModal: cc.Node; // 新游戏弹窗
    private levelsModal: cc.Node; // 关卡弹窗
    private levelsComponent: Levels; // 关卡自定义组件
    private customGameModal: cc.Node; // 自定义游戏弹窗
    private solveModal: cc.Node; // 解答界面
    private gameState: GameState; // 游戏局面
    private solvedGameState: GameState; // 暂存被解答的游戏局面
    private solvedSteps: Step[]; // 被
    private solvedStepIndex: number; // 被
    private board: cc.Node; // 游戏局面
    private chessNodesUesd: { [key: string]: number } = {}; // 棋子被使用情况，多色主题下有用
    private audioTimeout: number = 0; //播放声音的timeout，防止重复叠加播放
    private options: Options;
    private optionsModal: cc.Node;
    private helpModal: cc.Node;
    private loading: Loading;
    private nextLevel: GameState;
    private nextLevelBtn: cc.Node;

    @property(cc.AudioClip)
    private stepAudio = null;

    start() {
        this.render();
        cc.find("menus/startBtn", this.node).on("click", this.showNewGameModal);
        cc.find("newGameModal/backGameBtn", this.node).on('click', () => this.controlModal(this.newGameModal, false));
        cc.find("newGameModal/easyBtn", this.node).on('click', () => this.showLevelsModal(Difficulty.easy));
        cc.find("newGameModal/simpleBtn", this.node).on('click', () => this.showLevelsModal(Difficulty.simple));
        cc.find("newGameModal/hardBtn", this.node).on('click', () => this.showLevelsModal(Difficulty.hard));
        cc.find("newGameModal/customBtn", this.node).on('click', () => this.controlModal(this.customGameModal, true));
        cc.find("customGameModal/cancelBtn", this.node).on('click', () => this.controlModal(this.customGameModal, false));
        cc.find("customGameModal/submitBtn", this.node).on('click', this.newCustomGame);

        cc.find("menus/backBtn", this.node).on('click', () => this.backStep(1));
        cc.find("menus/restartBtn", this.node).on('click', () => this.backStep(this.gameState.steps.length));
        cc.find("menus/solveBtn", this.node).on('click', this.onClickSolve);
        cc.find("menus/optionsBtn", this.node).on('click', () => this.controlModal(this.optionsModal, true));
        cc.find("menus/nextLevelBtn", this.node).on('click', this.startNextLevel);
        cc.find("optionsModal/closeBtn", this.node).on('click', () => this.controlModal(this.optionsModal, false));
        cc.find("solveModal/closeBtn", this.node).on('click', this.onCloseSolve);
        cc.find("solveModal/prevBtn", this.node).on('click', () => this.renderSolveStep(false));
        cc.find("solveModal/nextBtn", this.node).on('click', () => this.renderSolveStep());

        cc.find("menus/helpBtn", this.node).on('click', () => this.controlModal(this.helpModal, true));
        cc.find("helpModal/closeBtn", this.node).on('click', () => this.controlModal(this.helpModal, false));

        cc.find("levelsModal/closeBtn", this.node).on('click', () => this.controlModal(this.levelsModal, false));
    }

    render = () => {
        this.menus = cc.find("menus", this.node);
        this.newGameModal = cc.find("newGameModal", this.node);
        this.levelsModal = cc.find("levelsModal", this.node);
        this.levelsComponent = this.levelsModal.getComponent("Levels");

        this.customGameModal = cc.find("customGameModal", this.node);
        this.solveModal = cc.find("solveModal", this.node);
        this.optionsModal = cc.find("optionsModal", this.node);
        this.helpModal = cc.find("helpModal", this.node);
        this.options = this.optionsModal.getComponent("Options");
        this.loading = cc.find("loading", this.node).getComponent("Loading");
        this.board = cc.find("board", this.node);

        this.board.children.forEach(chessNode => {
            this.chessNodesUesd[chessNode.name] = -1;
        })
        // 更新位置，防止节点因为Widget位置取不对
        this.board.getComponent(cc.Widget).updateAlignment();
        // 隐藏其他modal
        cc.find("newGameModal/backGameBtn", this.node).scale = 0
        this.nextLevelBtn = cc.find("menus/nextLevelBtn", this.node);
        this.nextLevelBtn.scale = 0;
        this.solveModal.scale = 0;
        this.customGameModal.scale = 0;
        this.optionsModal.scale = 0;

        
    }

    /**
     * 显示新游戏选择弹窗
     */
    showNewGameModal = () => {
        // 如果是游戏中，显示返回游戏按钮
        cc.find("newGameModal/backGameBtn", this.node).scale = this.gameState && !this.gameState.isWin ? 1 : 0;
        this.controlModal(this.newGameModal, true)
    }

    /**
     * 隐藏新游戏选择弹窗
     */
    hideNewGameModal = () => {
        this.loading.hide()
        if (this.newGameModal.scale === 1) {
            cc.tween(this.newGameModal).to(0.2, {
                scale: 0
            }).start()
        }
    }

    /**
     * 弹出关卡选择
     */
    showLevelsModal = (difficulty: Difficulty) => {
        this.levelsComponent.difficulty = difficulty;
        this.levelsComponent.showPage(0);
        this.controlModal(this.levelsModal, true);
    }


    /**
     * 渲染新游戏
     * @param gameState 
     */
    renderNewGameState = (gameState: GameState) => {
        cc.find("/Canvas/menus/levelName").getComponent(cc.Label).string = gameState.levelName
        for (const nodeName in this.chessNodesUesd) {
            this.chessNodesUesd[nodeName] = -1;
            cc.find(nodeName, this.board).setPosition(cc.v3(0, 2400, 0))
        }
        this.gameState = gameState;
        this.nextLevel = null;
        this.nextLevelBtn.scale = 0;
        this.renderGameState();
    }

    /**
     * 渲染游戏局面
     */
    renderGameState = () => {
        if (this.gameState) {
            const boardZero = this.board.convertToWorldSpaceAR(cc.v3(0, 0, 0));
            const boardScale = this.board.getScale(cc.v2());
            const startPoint = cc.v3(boardZero.x - 421 * boardScale.x, boardZero.y + 521 * boardScale.y, 0);
            for (let i = 0; i < this.gameState.chesses.length; i++) {
                const chess = this.gameState.chesses[i];
                const x = startPoint.x + (chess.x + chess.w / 2) * 210 * boardScale.x;
                const y = startPoint.y - (chess.y + chess.h / 2) * 210 * boardScale.y;
                const chessPoint = this.board.convertToNodeSpaceAR(cc.v3(x, y, 0))
                if (!chess.node) {
                    const chessType = (chess.w - 1) * 2 + (chess.h - 1)
                    const nodeName = Object.keys(this.chessNodesUesd).find(item => {
                        return this.chessNodesUesd[item] === -1 && item[0] === '' + chessType;
                    })
                    this.chessNodesUesd[nodeName] = i;
                    chess.node = cc.find(nodeName, this.board);
                    chess.node.on(cc.Node.EventType.TOUCH_END, this.onChessMoved)
                    chess.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onChessMoved)

                }
                chess.node.setPosition(chessPoint);
            }

        }
    }

    /**
     * 撤回步数
     * @param stepsLength 步数
     */
    backStep = (stepsLength) => {
        this.gameState.backStep(stepsLength);
        this.renderGameState();
    }


    /**
     * 
     * @param event 
     * @returns 
     */
    onChessMoved = (event: any) => {
        if (this.gameState.isWin || this.solvedGameState) {
            return;
        }
        const { _startPoint, _point }: { _startPoint: cc.Vec2, _point: cc.Vec2 } = event.touch
        const diffX = _point.x - _startPoint.x;
        const diffY = _point.y - _startPoint.y;
        let dir: Direction; // 移动方向
        if (Math.abs(diffX) > Math.abs(diffY)) {
            dir = diffX > 0 ? [1, 0] : [-1, 0];
        } else {
            dir = diffY > 0 ? [0, -1] : [0, 1];
        }
        const chessIndex = this.chessNodesUesd[event.target.name];
        const success = this.gameState.chessMove(chessIndex, dir);
        if (success) {
            this.renderGameState();
            if (this.options.audioValue) {
                clearTimeout(this.audioTimeout)
                this.audioTimeout = setTimeout(() => {
                    cc.audioEngine.play(this.stepAudio, false, 0.4);
                }, 100);
            }

        }
        if (this.gameState.isWin) {
            this.alert(this.gameState.lookSolve ? "成功！试试不看答案重来一次！" : "恭喜成功!");
            if (!this.gameState.lookSolve) {
                this.levelsComponent.addWinLevel(this.gameState.levelName)
                const nextLevel = this.getNextLevel();
                if (nextLevel) {
                    this.nextLevel = nextLevel;
                    this.nextLevelBtn.scale = 1;
                }
            }
        }
    }

    alert = (str: string) => {
        const alertNode = cc.find("alert", this.node);
        alertNode.getComponentInChildren(cc.Label).string = str
        alertNode.scale = 1
        setTimeout(() => {
            alertNode.scale = 0
        }, 2000)
    }

    // 解答并进入解答界面
    onClickSolve = () => {
        if (this.gameState.isWin) {
            this.alert("已经成功!");
            return;
        }
        this.gameState.lookSolve = true; // 标记看过答案
        this.loading.show("计算答案…");
        setTimeout(() => {
            const steps = this.gameState.solve();
            this.loading.hide();
            if (!steps) {
                this.alert("无解!");
                return;
            }
            cc.tween(this.board).to(0.2, {
                scale: 0.8,
                position: cc.v3(0, 0, 0),
            }).start()
            this.solvedGameState = this.gameState.clone();
            this.solvedSteps = steps;
            this.solvedStepIndex = -2;
            this.menus.scale = 0;
            this.solveModal.scale = 1;
            this.renderSolveStep();
        }, 100);
    }

    /**
     * 渲染当前解答步骤
     */
    renderSolveStep = (isNext = true) => {
        const prevBtn = cc.find('solveModal/prevBtn', this.node)
        const nextBtn = cc.find('solveModal/nextBtn', this.node)
        prevBtn.scale = 1;
        nextBtn.scale = 1;
        if (isNext) {
            if (this.solvedStepIndex === this.solvedSteps.length) {
                return;
            }
            if (this.solvedStepIndex < -1) {
                prevBtn.scale = 0;
                this.solvedStepIndex = -1;
            } else {
                if (this.solvedStepIndex + 2 === this.solvedSteps.length) {
                    nextBtn.scale = 0;
                }
                const step = this.solvedSteps[this.solvedStepIndex + 1];
                this.gameState.chesses[step.ci].x += step.dx;
                this.gameState.chesses[step.ci].y += step.dy;
                this.solvedStepIndex++;
            }

        } else {
            if (this.solvedStepIndex === -1) {
                return;
            }
            if (this.solvedStepIndex === 0) {
                prevBtn.scale = 0;
            }
            const step = this.solvedSteps[this.solvedStepIndex];
            this.gameState.chesses[step.ci].x -= step.dx;
            this.gameState.chesses[step.ci].y -= step.dy;
            this.solvedStepIndex--;
        }
        cc.find('solveModal/info', this.node).getComponent(cc.Label).string = `第${this.solvedStepIndex + 1}步 · 剩${this.solvedSteps.length - this.solvedStepIndex - 1}步`;
        this.renderGameState()

    }


    /**
     * 关闭解答界面
     */
    onCloseSolve = () => {
        cc.tween(this.board).to(0.2, {
            scale: 1.1,
            position: cc.v3(0, -200, 0),
        }).start()

        this.gameState = this.solvedGameState.clone()
        this.solvedGameState = null;
        this.renderGameState()
        this.menus.scale = 1;
        this.solveModal.scale = 0;
    }

    /**
     * 
     * @returns 完成新建
     */
    newCustomGame = () => {
        const customGame: CustomGame = this.customGameModal.getComponent("CustomGame")
        const gameState = customGame.getGameState()
        this.loading.show("计算是否有解…")
        setTimeout(() => {
            const steps = gameState.solve()
            this.loading.hide()
            if (steps === null) {
                this.alert("当前布局无解")
                return
            }
            this.renderNewGameState(gameState);
            this.newGameModal.scale = 0;
            cc.find("menus/levelName", this.node).getComponent(cc.Label).string = "自定义关卡"
            this.controlModal(this.customGameModal, false)
            customGame.clear()
        }, 100)
    }

    /**
     * 设置各个modal的显示隐藏
     * @param modal 
     * @param isShow 
     */
    controlModal = (modal: cc.Node, isShow: boolean) => {
        if (modal) {
            cc.tween(modal).to(0.2, {
                scale: isShow ? 1 : 0
            }).start()
        }
    }

    /**
     * 下一关
     */
    getNextLevel = () => {
        try {
            const diff = { 'E': 'easy', 'S': 'simple', 'H': 'hard' }[this.gameState.levelName[0]];
            const index = Number(this.gameState.levelName.slice(1));
            const gameKey = gameData[diff][index];
            const gameState = GameState.fromSimilarKey(gameKey);
            gameState.levelName = `${this.gameState.levelName[0]}${index + 1}`;
            return gameState;
        } catch (e) {
            return null
        }
    }

    startNextLevel = () => {
        if (this.nextLevel) {
            this.renderNewGameState(this.nextLevel);
        }
    }


}
