import { Chess, Direction, Grids, Step, ALL_DIRS } from "./types";


export class GameState {
    public levelName: string;
    public chesses: Chess[];
    public steps: Step[];
    public isWin: boolean = false;
    public lookSolve: boolean = false;

    constructor(
        chesses: Chess[],
        steps: Step[],
        levelName: string = "",
        lookSolve: boolean = false,
        isWin: boolean = false,
    ) {
        this.chesses = chesses;
        this.steps = steps;
        this.levelName = levelName;
        this.lookSolve = lookSolve;
        this.isWin = isWin;
    }
    /**
     * 转换局面到网格
     * @returns
     */
    public toGrids() {
        const { chesses } = this
        //新建网格
        const grids: Grids = [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
        ];
        // 向网格里面填东西
        for (let ci = 0; ci < chesses.length; ci++) {
            for (let i = 0; i < chesses[ci].w; i++) {
                for (let j = 0; j < chesses[ci].h; j++) {
                    grids[j + chesses[ci].y][i + chesses[ci].x] = ci
                }
            }
        }
        return grids;
    }

    /**
     * 生成相似局面key，用于比较两个局面是否相似
     * @returns {string} 局面key
     */
    public toSimilarKey() {
        return this.chesses.map(c => (c.w * 2 + c.h) * 100 + c.x * 10 + c.y).sort((a, b) => b - a).join('')
    }

    /**
     * 撤回移动步数
     * @param stepsLength 步数
     */
    public backStep(stepsLength) {
        const sl = Math.min(this.steps.length, stepsLength)
        this.isWin = false;
        if(stepsLength === this.steps.length) {
            this.lookSolve = false;
        }
        for (let i = 0; i < sl; i++) {
            const { ci, dx, dy } = this.steps.pop();
            this.chesses[ci].x -= dx;
            this.chesses[ci].y -= dy;
        }
    }

    /**
     * 通过局面key生成游戏
     * @param key 
     * @returns 
     */
    public static fromSimilarKey(key: string) {
        const chesses = [];
        const chesseSize = {
            '3': { w: 1, h: 1 },
            '4': { w: 1, h: 2 },
            '5': { w: 2, h: 1 },
            '6': { w: 2, h: 2 },
        };
        for (let i = 0; i < key.length; i++) {
            if (i % 3 == 0) {
                chesses.push({ ...chesseSize[key[i]], x: Number(key[i + 1]), y: Number(key[i + 2]) })
            }
        }
        return new GameState(chesses, []);
    }

    /**
     * 打印网格
     * @param returnStr 是否不打印，直接返回字符串
     */
    public logGrides(returnStr = false) {
        const grids = this.toGrids();
        let logStr = this.toSimilarKey() + '\n=========\n|' + grids.map(l => l.map(g => g !== null ? '' + g : ' ').join('|')).join('|\n|') + '|\n===   ===';
        if (returnStr) {
            return logStr;
        } else {
            cc.log(logStr)
        }
    }

    /**
     * 检查棋子在指定方向是否可移动
     * @param chessIndex 棋子索引
     * @param dir 方向
     * @returns 是否可移动
     */
    public checkChessCanMove(chessIndex: number, dir: Direction) {
        const chess = this.chesses[chessIndex];
        const grids = this.toGrids()
        for (let xi = 0; xi < chess.w; xi++) {
            for (let yi = 0; yi < chess.h; yi++) {
                let gridX = chess.x + xi + dir[0];
                let gridY = chess.y + yi + dir[1];
                if (gridX < 0 || gridX > 3 || gridY < 0 || gridY > 4) {
                    return false;
                }
                if (grids[gridY][gridX] !== null && grids[gridY][gridX] !== chessIndex) {
                    return false;
                }
            }
        }
        return true
    }

    /**
     * 向指定方向移动棋子
     * @param chessIndex 
     * @param dir 
     * @returns 
     */
    public chessMove(chessIndex: number, dir: Direction) {
        const check = this.checkChessCanMove(chessIndex, dir);
        if (check) {
            this.chesses[chessIndex].x += dir[0];
            this.chesses[chessIndex].y += dir[1];
            if (this.chesses[chessIndex].w === 2 &&
                this.chesses[chessIndex].h === 2 &&
                this.chesses[chessIndex].x === 1 &&
                this.chesses[chessIndex].y === 3) {
                this.isWin = true
            }
            this.steps.push({ ci: chessIndex, dx: dir[0], dy: dir[1] });
            return true;
        } else {
            return false;
        }

    }

    /**
     * 随机生成游戏，有可能无解
     * @returns 
     */
    private static _randomGame() {
        const put_chess = (chess: Chess, chesses: Chess[], grids: Grids) => {
            let x: number, y: number;
            do {
                x = Math.round(Math.random() * 3);
                y = Math.round(Math.random() * 4);
            } while (grids[y][x] !== null);

            if (chess.w == 2 && chess.h == 2 && y !== 0) {
                return false;
            }
            const index = chesses.push({ ...chess, x, y }) - 1;
            for (let c = x; c < x + chess.w; c++) {
                for (let r = y; r < y + chess.h; r++) {
                    if (c < 4 && r < 5 && grids[r][c] === null) {
                        grids[r][c] = index;
                    } else {
                        return false;
                    }
                }
            }
            return true;
        }

        const randCount = Math.round(Math.random() * 3 + 1); // 横着的棋子数
        const chessesWithoutPosition = [
            { w: 2, h: 2, x: -1, y: -1 },
            ...Array.from({ length: randCount }, () => ({ w: 2, h: 1, x: -1, y: -1 })),
            ...Array.from({ length: 5 - randCount }, () => ({ w: 1, h: 2, x: -1, y: -1 })),
            ...Array.from({ length: 4 }, () => ({ w: 1, h: 1, x: -1, y: -1 })),
        ];

        let chesses = [];

        while (true) {
            const grids = [
                [null, null, null, null],
                [null, null, null, null],
                [null, null, null, null],
                [null, null, null, null],
                [null, null, null, null],
            ];
            chesses = [];
            let success = true;
            for (const chess of chessesWithoutPosition) {
                if (!put_chess(chess, chesses, grids)) {
                    success = false;
                }
            }
            if (!success) {
                continue;
            }

            break;
        }
        return new GameState(chesses, []);
    }


    /**
     * 克隆
     * @returns 
     */
    public clone() {
        let chesses = [];
        for (let i = 0; i < this.chesses.length; i++) {
            chesses.push(Object.assign({}, this.chesses[i]));
        }
        return new GameState(chesses, [...this.steps], this.levelName, this.lookSolve, this.isWin);
    }

    /**
     * 下一步的各种可能
     * @param luckyWin 下一步如果就能赢，那就准备赢吧
     * @returns 
     */
    public nextStates = (luckyWin: (steps: Step[]) => any) => {
        let nextStates: GameState[] = [];
        const grids = this.toGrids();
        // 循环格子，找出空位，进而推导出可以移动的格子
        for (let row = 0; row < grids.length; row++) {
            for (let col = 0; col < grids.length; col++) {
                if (grids[row][col] === null) { // 判断这里是个空位
                    // console.log(row, col)
                    for (let di = 0; di < ALL_DIRS.length; di += 2) {
                        // 首先查出方向半边的格子内容
                        let d = ALL_DIRS[di];
                        let c0 = grids[d[1] + row]?.[d[0] + col]
                        if (c0 === null || c0 === undefined) { // 对应方向上没有棋子，pass
                            continue;
                        }
                        d = ALL_DIRS[(di + 1) % ALL_DIRS.length];
                        let c45 = grids[d[1] + row]?.[d[0] + col]
                        d = ALL_DIRS[(di + 2) % ALL_DIRS.length];
                        let c90 = grids[d[1] + row]?.[d[0] + col]
                        d = ALL_DIRS[(di + 6) % ALL_DIRS.length];
                        let c_90 = grids[d[1] + row]?.[d[0] + col]
                        d = ALL_DIRS[(di + 7) % ALL_DIRS.length];
                        let c_45 = grids[d[1] + row]?.[d[0] + col]

                        if ((c0 !== c45 && c0 !== c_45) ||  // 正对方向的棋子和邻居不一样
                            (c45 === c0 && c90 === null) || (c_45 === c0 && c_90 === null)) { // 正对方向的棋子和邻居一样，但该侧也有一个多余的空位
                            // console.log("可以移动", c0, dirs[di]);
                            let newState = this.clone();
                            newState.chesses[c0].x -= ALL_DIRS[di][0];
                            newState.chesses[c0].y -= ALL_DIRS[di][1];
                            newState.steps.push({ ci: c0, dx: -ALL_DIRS[di][0], dy: -ALL_DIRS[di][1] })
                            // console.log(newState)
                            if (newState.chesses[c0].x === 1 &&
                                newState.chesses[c0].y === 3 &&
                                newState.chesses[c0].w === 2 &&
                                newState.chesses[c0].h === 2) {
                                // console.log("win", newState.steps)
                                luckyWin(newState.steps)
                                return [];
                            } else {
                                nextStates.push(newState)
                            }
                        }
                    }
                }
            }
        }

        return nextStates;
    }

    /**
     * 解答
     * @returns 
     */
    public solve(): Step[] | null {
        const stateQueue: GameState[] = [this]
        const stateKeys = new Set()
        stateKeys.add(this.toSimilarKey())
        const startStepsLength = this.steps.length
        while (stateQueue.length > 0) {
            let winSteps = null;
            const state = stateQueue.shift();
            const nextStates = state.nextStates((steps) => {
                winSteps = steps;
            })
            if (winSteps) {
                return winSteps.slice(startStepsLength)
            }
            for (let ni = 0; ni < nextStates.length; ni++) {
                const key = nextStates[ni].toSimilarKey();
                if (!stateKeys.has(key)) { // 假如局面没有出现过
                    // console.log(key)
                    stateKeys.add(key)
                    stateQueue.push(nextStates[ni])
                }
            }
        }
        return null
    }

}