export type Chess = {
  w: number,
  h: number,
  x: number,
  y: number,
  node?: cc.Node,
}

export type Step = {
  ci: number, // chess index,
  dx: number, // different x,
  dy: number, // different y,
}

export type Direction = [1 | 0 | -1, 1 | 0 | -1];

/**
 * 所有方向
 */
export const ALL_DIRS: Direction[] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

export type Grids = (null | number)[][];

export enum Difficulty {
  easy,
  simple,
  hard,
}