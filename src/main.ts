/** @license
 * shogi-graph-ts
 * Copyright (c) Mizar <https://github.com/mizar>
 */

import { doWrite, SvgScoreGraphProp, YAxis } from "./rendergraph";
import { getTags } from "./castle";
import { JKFPlayer } from "json-kifu-format";
import { ITimeFormat } from "json-kifu-format/dist/src/Formats";
import { select, BaseType, Selection } from "d3-selection";
import copySvg from "tabler-icons/icons/file-text.svg";
import linkSvg from "tabler-icons/icons/link.svg";
import photoSvg from "tabler-icons/icons/photo.svg";
import rotateSvg from "tabler-icons/icons/rotate.svg";
import refreshSvg from "tabler-icons/icons/refresh.svg";
import tweetSvg from "tabler-icons/icons/brand-twitter.svg";
import { mobx } from "kifu-for-js/bundle/src/index";
import KifuStore from "kifu-for-js/bundle/src/stores/KifuStore";
import url from "url";
import { threadId } from "worker_threads";

interface GameObj {
    gameId: string;
    gameName: string;
}
interface TimeMan {
    base: number;
    increment: number;
    byoyomi: number;
}

declare const gameBoardProp: {
    mode?: string;
    multiViewSpan?: number;
    url: (gameid: string) => string;
    urlOrg?: (gameid: string) => string;
    urlList: string;
    logParser: (log: string) => GameObj[];
    kifuVisible?: boolean;
    svgPropFn?: (args: {
        movesLength: number;
        lastIsSpecial: boolean;
        gameId: string;
        tesuu: number;
    }) => Partial<SvgScoreGraphProp>;
    tweetPropFn?: (args: {
        gameId: string;
        gameName: string;
        tesuu: number;
        move: string;
    }) => {
        text: string;
        url?: string;
        hashtags?: string;
        via?: string;
    };
    gameId?: string;
    gameName?: string;
    tesuu?: string | number;
    mobxEnable?: boolean;
};

declare const KifuForJS: {
    loadString: (kifu: string, id?: string) => Promise<KifuStore>;
    load(filePath: string, id?: string): Promise<KifuStore>;
    mobx: typeof mobx;
};

const colorSet: { [c: string]: Partial<SvgScoreGraphProp> | undefined } = {
    default: {},
    white: {
        colorBackground: { r: 255, g: 255, b: 255, a: 1 },
        colorGridNml: { r: 170, g: 170, b: 170, a: 1 },
        colorGridBld: { r: 136, g: 136, b: 136, a: 1 },
        colorGridEBld: { r: 68, g: 68, b: 68, a: 1 },
        colorGridBorder: { r: 0, g: 0, b: 0, a: 1 },
        colorPly: { r: 0, g: 0, b: 0, a: 1 },
        colorPlayer0: { r: 0, g: 0, b: 0, a: 1 },
        colorPlayer1: { r: 255, g: 51, b: 0, a: 1 },
        colorPlayer2: { r: 0, g: 51, b: 255, a: 1 },
        colorCap: { r: 0, g: 0, b: 0, a: 1 },
        colorTimeLineB: { r: 255, g: 128, b: 128, a: 1 },
        colorTimeFillB: { r: 255, g: 128, b: 128, a: 0.25 },
        colorTimeLineW: { r: 128, g: 128, b: 255, a: 1 },
        colorTimeFillW: { r: 128, g: 128, b: 255, a: 0.25 },
    },
    black: {
        colorBackground: { r: 0, g: 0, b: 0, a: 1 },
        colorGridNml: { r: 136, g: 136, b: 136, a: 1 },
        colorGridBld: { r: 153, g: 153, b: 153, a: 1 },
        colorGridEBld: { r: 170, g: 170, b: 170, a: 1 },
        colorGridBorder: { r: 255, g: 255, b: 255, a: 1 },
        colorPly: { r: 255, g: 255, b: 255, a: 1 },
        colorPlayer0: { r: 255, g: 255, b: 255, a: 1 },
        colorPlayer1: { r: 255, g: 136, b: 0, a: 1 },
        colorPlayer2: { r: 0, g: 136, b: 255, a: 1 },
        colorCap: { r: 255, g: 255, b: 255, a: 1 },
        colorTimeLineB: { r: 255, g: 128, b: 128, a: 1 },
        colorTimeFillB: { r: 255, g: 128, b: 128, a: 0.25 },
        colorTimeLineW: { r: 128, g: 128, b: 255, a: 1 },
        colorTimeFillW: { r: 128, g: 128, b: 255, a: 0.25 },
    },
    aqua: {
        colorBackground: { r: 0, g: 191, b: 255, a: 1 },
        colorGridNml: { r: 136, g: 136, b: 136, a: 1 },
        colorGridBld: { r: 102, g: 102, b: 102, a: 1 },
        colorGridEBld: { r: 68, g: 68, b: 68, a: 1 },
        colorGridBorder: { r: 0, g: 0, b: 0, a: 1 },
        colorPly: { r: 0, g: 0, b: 0, a: 1 },
        colorPlayer0: { r: 0, g: 0, b: 0, a: 1 },
        colorPlayer1: { r: 255, g: 0, b: 0, a: 1 },
        colorPlayer2: { r: 0, g: 0, b: 255, a: 1 },
        colorCap: { r: 0, g: 0, b: 0, a: 1 },
        colorTimeLineB: { r: 255, g: 128, b: 128, a: 1 },
        colorTimeFillB: { r: 255, g: 128, b: 128, a: 0.25 },
        colorTimeLineW: { r: 128, g: 128, b: 255, a: 1 },
        colorTimeFillW: { r: 128, g: 128, b: 255, a: 0.25 },
    },
};

const yaxisSet: { [c: string]: Partial<SvgScoreGraphProp> | undefined } = {
    default: {},
    pseudoSigmoid: {
        plotYAxisType: YAxis.PseudoSigmoid,
    },
    atan: {
        plotYAxisType: YAxis.Atan,
    },
    tanh: {
        plotYAxisType: YAxis.Tanh,
    },
    linear1000: {
        plotYAxisType: YAxis.Linear1000,
    },
    linear1200: {
        plotYAxisType: YAxis.Linear1200,
    },
    linear2000: {
        plotYAxisType: YAxis.Linear2000,
    },
    linear3000: {
        plotYAxisType: YAxis.Linear3000,
    },
};

function getGameIdHash(): string {
    const found = window.location.hash.match(
        /^#(?:.*\/)?((?:[\w.-]+\+){4}\d+)/
    );
    return found ? found[1] : "";
}

function iconSet<G extends BaseType>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    button: Selection<G, any, HTMLElement, any>,
    src: string
): void {
    button.html(src);
}

class GameBoard {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    graphDiv: Selection<HTMLDivElement, any, HTMLElement, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navDiv: Selection<HTMLDivElement, any, HTMLElement, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tagDiv: Selection<HTMLDivElement, any, HTMLElement, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    svgDiv: Selection<HTMLDivElement, any, HTMLElement, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boardDiv: Selection<HTMLDivElement, any, HTMLElement, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kifDiv: Selection<HTMLDivElement, any, HTMLElement, any>;
    gameObj?: GameObj;
    color = "";
    yaxis = "";
    _lastFetch = NaN;
    _lastGame?: GameObj;
    _lastCsa = "";
    enabled = true;
    uniqid = "";
    kifuStore?: KifuStore;
    constructor(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        boardSetDiv: Selection<HTMLDivElement, any, HTMLElement, any>
    ) {
        this.uniqid =
            new Date().valueOf().toString(36) +
            Math.floor(Math.random() * 4503599627370496).toString(36);
        this.graphDiv = boardSetDiv;
        this.navDiv = boardSetDiv.append("div").attr("class", "nav");
        this.tagDiv = boardSetDiv.append("div").attr("class", "tag");
        this.svgDiv = boardSetDiv.append("div").attr("class", "svggraph");
        this.boardDiv = boardSetDiv
            .append("div")
            .attr("class", "board")
            .attr("id", this.uniqid);
        this.kifDiv = boardSetDiv.append("div").attr("class", "kif");
    }
    async fetchGameTrig(force: boolean, ms = 10000): Promise<void> {
        if (force) {
            try {
                await this.fetchGame(true);
            } catch (e) {
                console.log(e);
                this.fetchGameTrig(false, ms);
            }
        } else {
            setTimeout(async () => {
                try {
                    await this.fetchGame(false);
                } catch (e) {
                    console.log(e);
                    this.fetchGameTrig(false, ms);
                }
            }, ms);
        }
    }
    async fetchGame(force: boolean): Promise<void> {
        if (
            !this.gameObj ||
            !this.gameObj.gameId.match(/^(?:[\w.-]+\+){4}\d+$/) ||
            !this.enabled ||
            (this._lastFetch + 8500 > Date.now() &&
                this._lastGame &&
                this._lastGame.gameId === this.gameObj.gameId &&
                !force)
        ) {
            return;
        }
        if (this._lastGame && this._lastGame.gameId !== this.gameObj.gameId) {
            this._lastCsa = "";
        }
        const urlStr = url.resolve(
            location.href,
            gameBoardProp.url(this.gameObj.gameId)
        );
        const urlOrgStr = url.resolve(
            location.href,
            (gameBoardProp.urlOrg ?? gameBoardProp.url)(this.gameObj.gameId)
        );
        const csaPromise = await fetch(urlStr);
        const csa = await csaPromise.text();
        /*
        // special move行のマルチステートメントコメントを複数行に分割
        // json-kifu-format の不具合暫定対策
        // https://github.com/na2hiro/json-kifu-format/issues/31#issuecomment-660633980
        const csa = (await csaPromise.text()).replace(
            /(\n%[^,\n]+),('[^\n]+\n)(T[^\n]+\n)?/g,
            (m0, m1, m2, m3) => `${m1}\n${m3}${m2}`
        );
        */

        if (
            !force &&
            this.kifuStore &&
            this._lastGame &&
            this._lastGame.gameId === this.gameObj.gameId &&
            this._lastCsa === csa
        ) {
            this._lastFetch = Date.now();
            if (
                !this.kifuStore.player.kifu.moves.some((v) =>
                    v.comments?.some((str) => str.startsWith("$END_TIME:"))
                )
            ) {
                this.fetchGameTrig(false);
            }
            return;
        }

        // ナビゲーションバー
        this.navDiv.selectAll("*").remove();
        if (navigator.clipboard) {
            const copyButton = this.navDiv
                .append("button")
                .attr("title", "現在表示中の棋譜をクリップボードにコピー")
                .on("click", () => {
                    navigator.clipboard.writeText(csa);
                });
            iconSet(copyButton, copySvg);
        }
        if (navigator.clipboard) {
            const linkButton = this.navDiv
                .append("button")
                .attr("title", "棋譜URLをクリップボードにコピー")
                .on("click", () => {
                    navigator.clipboard.writeText(urlOrgStr);
                });
            iconSet(linkButton, linkSvg);
        }
        if (navigator.clipboard) {
            const photoButton = this.navDiv
                .append("button")
                .attr(
                    "title",
                    "形勢グラフをクリップボードにコピー(Chromeのみ対応)"
                )
                .on("click", () => {
                    const svgArray = this.graphDiv
                        .select<SVGElement>("svg")
                        .nodes();
                    if (svgArray.length) {
                        const svg = svgArray[0];
                        const svgUrl = `data:image/svg+xml;charset=utf-8;base64,${btoa(
                            unescape(
                                encodeURIComponent(
                                    new XMLSerializer().serializeToString(svg)
                                )
                            )
                        )}`;
                        const canvas = document.createElement("canvas");
                        canvas.height = Math.max(svg.clientHeight, 480);
                        canvas.width = Math.round(
                            (canvas.height / svg.clientHeight) * svg.clientWidth
                        );
                        const ctx = canvas.getContext("2d");
                        const image = new Image(canvas.width, canvas.height);
                        image.onload = (): void => {
                            ctx?.drawImage(
                                image,
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );
                            if (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (global as any).ClipboardItem &&
                                navigator.clipboard.write
                            ) {
                                canvas.toBlob(async (blob) => {
                                    if (blob) {
                                        await navigator.clipboard.write([
                                            new ClipboardItem({
                                                [blob.type]: blob,
                                            }),
                                        ]);
                                    }
                                });
                            } else {
                                navigator.clipboard.writeText(
                                    canvas.toDataURL()
                                );
                            }
                        };
                        image.src = svgUrl;
                    }
                });
            iconSet(photoButton, photoSvg);
        }
        const tweetButton = gameBoardProp.tweetPropFn
            ? this.navDiv.append("button")
            : undefined;
        if (tweetButton) {
            tweetButton
                .attr("title", "Twitterで共有")
                .attr("class", "tweet")
                .on("click", () => {
                    if (
                        !this.gameObj ||
                        !this.kifuStore ||
                        !gameBoardProp.tweetPropFn
                    ) {
                        return;
                    }
                    const tweetProp = gameBoardProp.tweetPropFn({
                        gameId: this.gameObj.gameId,
                        gameName: this.gameObj.gameName,
                        tesuu: this.kifuStore.player.tesuu,
                        move:
                            this.kifuStore.player.tesuu !== 0
                                ? JKFPlayer.moveToReadableKifu(
                                      this.kifuStore.player.kifu.moves[
                                          this.kifuStore.player.tesuu
                                      ]
                                  )
                                : "",
                    });
                    window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            tweetProp.text
                        )}${
                            tweetProp.url
                                ? `&url=${encodeURIComponent(tweetProp.url)}`
                                : ""
                        }${
                            tweetProp.hashtags
                                ? `&hashtags=${encodeURIComponent(
                                      tweetProp.hashtags
                                  )}`
                                : ""
                        }${
                            tweetProp.via
                                ? `&via=${encodeURIComponent(tweetProp.via)}`
                                : ""
                        }`,
                        "_blank"
                    );
                });
            iconSet(tweetButton, tweetSvg);
        }
        const redoButton = this.navDiv
            .append("button")
            .attr("title", "現在表示中の棋譜を再読み込み")
            .on("click", async () => {
                this.fetchGameTrig(true);
            });
        iconSet(redoButton, rotateSvg);
        this.navDiv
            .append("span")
            .attr("class", "navText")
            .text(this.gameObj.gameName);

        // tag bar
        {
            this.tagDiv.selectAll("*").remove();
            getTags(JKFPlayer.parseCSA(csa))
                .filter((tag) => !tag.hide)
                .forEach((tag) => {
                    this.tagDiv
                        .append("button")
                        .attr("title", JSON.stringify(tag, undefined, 2))
                        .text(`${tag.name.ja_JP}:${tag.tesuu}`)
                        .on("click", () => {
                            this.kifuStore?.player.goto(tag.tesuu);
                        });
                });
        }

        if (this.kifuStore) {
            // 盤面の更新

            // 現盤面の表示手数取得
            const lastPly = this.kifuStore.player.tesuu;
            const lastMaxPly = this.kifuStore.player.kifu.moves.length - 1;

            this.kifuStore.loadKifuSync(csa);

            if (
                lastPly &&
                lastPly !== lastMaxPly &&
                this._lastGame &&
                this.gameObj &&
                this._lastGame.gameId === this.gameObj.gameId
            ) {
                this.kifuStore.player.goto(lastPly);
            } else {
                this.kifuStore.player.go(Infinity);
            }

            if (!gameBoardProp.mobxEnable) {
                this.drawGraph(this.kifuStore.player);
            }
        } else {
            // 盤面の初期読み込み
            const kifuStore = await KifuForJS.loadString(csa, this.uniqid);
            this.kifuStore = kifuStore;
            // this.kifuStore.player.go(Infinity);

            // player.go(Infinity) すると何故か処理が非常に重いので代わりに棋譜送りボタンを押す
            this.boardDiv
                .select<HTMLButtonElement>("button[data-go=Infinity]")
                .node()
                ?.click();

            if (gameBoardProp.mobxEnable) {
                // グラフ更新トリガ
                KifuForJS.mobx.autorun(() => {
                    const player = this.kifuStore?.player;
                    const tesuu = this.kifuStore?.player.tesuu;
                    // 遅延更新：盤面の表示手数を動かす場合、1手毎にイベントが発生するため更新を遅延させて途中のイベントをなるべく無視する
                    setTimeout(() => {
                        // 遅延呼び出し元と現在の値が異なる場合、グラフの描画更新を見送り
                        if (
                            player &&
                            this.kifuStore &&
                            this.kifuStore.player === player &&
                            this.kifuStore.player.tesuu === tesuu
                        ) {
                            this.drawGraph(player);
                        }
                    }, 100);
                });
            }
            this.drawGraph(this.kifuStore.player);
        }

        // 棋譜保存ボタンの有効化＆イベント付与
        this.boardDiv
            .select<HTMLButtonElement>("button[class=dl]")
            .attr("disabled", false)
            .property("disabled", false)
            .on("click", () => {
                window.open(urlOrgStr, "_blank");
            });

        // 自動更新間隔セレクタの無効化
        this.boardDiv
            .select<HTMLSelectElement>("select.autoload")
            .attr("disabled", true)
            .property("disabled", true);

        // 自動更新間隔セレクタの値設定
        if (
            !this.kifuStore.player.kifu.moves.some((v) =>
                v.comments?.some((str) => str.startsWith("$END_TIME:"))
            )
        ) {
            this.boardDiv.select("select.autoload").property("value", "30");
            this.fetchGameTrig(false);
        } else {
            this.boardDiv.select("select.autoload").property("value", "NaN");
        }

        this._lastFetch = Date.now();
        this._lastGame = this.gameObj;
        this._lastCsa = csa;
    }

    async drawGraph(player: JKFPlayer): Promise<void> {
        if (!this.gameObj || !this.kifuStore) {
            return;
        }

        // 時間フォーマット
        const timeFmt = (v: ITimeFormat): string =>
            (v.h ? `${v.h}:` + `0${v.m}:`.slice(-3) : `${v.m}:`) +
            `0${v.s}`.slice(-2);
        // gameid から持ち時間読み取り
        const timeManMatch = this.gameObj.gameId.match(
            /^[\w.-]+\+[\w.-]+-(\d+)-(\d+)(F)?\+/
        );
        const timeMan: TimeMan = timeManMatch
            ? {
                  base: Number.parseInt(timeManMatch[1]),
                  increment:
                      timeManMatch[3] === "F"
                          ? Number.parseInt(timeManMatch[2])
                          : 0,
                  byoyomi:
                      timeManMatch[3] === "F"
                          ? 0
                          : Number.parseInt(timeManMatch[2]),
              }
            : {
                  base: 0,
                  increment: 0,
                  byoyomi: 0,
              };
        const remainTimeSec = (
            i: number,
            v: { now: ITimeFormat; total: ITimeFormat }
        ): number => {
            const limit =
                timeMan.base + timeMan.increment * (Math.max(i - 1, 0) >> 1);
            const now = 3600 * (v.now.h ?? 0) + 60 * v.now.m + v.now.s;
            const total = 3600 * (v.total.h ?? 0) + 60 * v.total.m + v.total.s;
            return Math.max(limit - total, -now) + timeMan.byoyomi;
        };
        const remainTimeStr = (
            i: number,
            v: { now: ITimeFormat; total: ITimeFormat }
        ): string => {
            const remain = Math.max(remainTimeSec(i, v), 0);
            const h = Math.floor(remain / 3600);
            const m = Math.floor((remain - 3600 * h) / 60);
            const s = remain - 3600 * h - 60 * m;
            return timeFmt({ h, m, s });
        };

        const graphWidth = Math.max(
            player.kifu.moves.length -
                (player.kifu.moves[player.kifu.moves.length - 1].special
                    ? 1
                    : 0),
            player.tesuu + 1,
            50
        );
        const maxPly = Math.max(player.kifu.moves.length - 1, player.tesuu, 50);

        const remainTimes = player.kifu.moves.map((v, i) =>
            v.time ? remainTimeStr(i, v.time) : ""
        );
        const remainTimesB = remainTimes.filter(
            (v, i) => i > 0 && i % 2 === 1 && v !== ""
        );
        const remainTimesW = remainTimes.filter(
            (v, i) => i > 0 && i % 2 === 0 && v !== ""
        );

        // 形勢グラフ
        this.svgDiv.selectAll("*").remove();
        const _svgdiv = this.svgDiv.node() as HTMLDivElement;
        doWrite(
            _svgdiv,
            Object.assign<
                Partial<SvgScoreGraphProp>,
                Partial<SvgScoreGraphProp>
            >(
                Object.assign<
                    Partial<SvgScoreGraphProp>,
                    Partial<SvgScoreGraphProp>,
                    Partial<SvgScoreGraphProp> | undefined,
                    Partial<SvgScoreGraphProp> | undefined
                >(
                    {
                        width: graphWidth,
                        maxPly,
                        tesuu: player.tesuu,
                    },
                    (gameBoardProp.svgPropFn ?? (() => ({})))({
                        movesLength: player.kifu.moves.length,
                        lastIsSpecial: !!player.kifu.moves[
                            player.kifu.moves.length - 1
                        ].special,
                        gameId: this.gameObj.gameId,
                        tesuu: player.tesuu,
                    }),
                    colorSet[this.color],
                    yaxisSet[this.yaxis]
                ),
                {
                    score: player.kifu.moves.map((v) =>
                        v.comments
                            ? v.comments.reduce((p, c) => {
                                  const matches = c.match(/^\*\* (-?\d+)/);
                                  return matches ? parseFloat(matches[1]) : p;
                              }, NaN)
                            : NaN
                    ),
                    comment: player.kifu.moves.map((v, i) =>
                        [
                            [
                                i !== 0
                                    ? `${i}${JKFPlayer.moveToReadableKifu(v)}`
                                    : "",
                                v.time
                                    ? `${timeFmt(v.time.now)} / 累計 ${timeFmt(
                                          v.time.total
                                      )} / 残り ${remainTimeStr(i, v.time)}`
                                    : "",
                            ]
                                .filter((s) => s)
                                .join(" "),
                        ]
                            .filter((s) => s)
                            .concat(v.comments ?? [])
                            .join("\n")
                    ),
                    timePar: player.kifu.moves.map((v, i) =>
                        v.time
                            ? remainTimeSec(i, v.time) / timeMan.base
                            : Number.NaN
                    ),
                    remainTimeB:
                        remainTimesB.length > 0
                            ? remainTimesB[remainTimesB.length - 1]
                            : "",
                    remainTimeW:
                        remainTimesW.length > 0
                            ? remainTimesW[remainTimesW.length - 1]
                            : "",
                    plyCallback: (ply: number): void => {
                        this.graphDiv
                            .select("select.kifulist")
                            .property("value", `${ply}`)
                            ?.dispatch("change", {
                                bubbles: true,
                                cancelable: false,
                                detail: {},
                            });
                    },
                }
            )
        );

        // 棋譜テキスト
        if (gameBoardProp.kifuVisible) {
            this.kifDiv.selectAll("*").remove();
            const par = this.kifDiv.append("p");
            for (const hentry of Object.entries(player.kifu.header)) {
                par.append("span").text(`${hentry[0]}：${hentry[1]}`);
                par.append("br");
            }
            player.kifu.moves.forEach((v, i) => {
                if (i !== 0) {
                    par.append("span")
                        .attr("style", "white-space:nowrap")
                        .attr(
                            "title",
                            [`${i}${JKFPlayer.moveToReadableKifu(v)}`]
                                .concat(
                                    v.time
                                        ? [
                                              `${timeFmt(
                                                  v.time.now
                                              )} / 累計 ${timeFmt(
                                                  v.time.total
                                              )} / 残り ${remainTimeStr(
                                                  i,
                                                  v.time
                                              )}`,
                                          ]
                                        : [],
                                    v.comments ?? []
                                )
                                .join("\n")
                        )
                        .text(
                            JKFPlayer.moveToReadableKifu(v)
                                .replace("☗", "▲")
                                .replace("☖", "△")
                        );
                    par.append("span").text(" ");
                    if (
                        v.comments?.some((str) => str.startsWith("$END_TIME:"))
                    ) {
                        this.kifDiv
                            .append("pre")
                            .attr("class", "reason")
                            .text(v.comments?.join("\n"));
                    }
                }
            });
        }
    }
}

if (gameBoardProp.mode === "multi") {
    window.addEventListener("load", () => {
        const body = select("body");
        const selectColor = body.append("select").attr("id", "selectcolor");
        selectColor.append("option").attr("value", "default").text("default");
        selectColor.append("option").attr("value", "white").text("white");
        selectColor.append("option").attr("value", "black").text("black");
        selectColor.append("option").attr("value", "aqua").text("aqua");
        const selectYAxis = body.append("select").attr("id", "selectyaxis");
        selectYAxis.attr(
            "title",
            "{\n  'pSigmoid': (score) => Math.asin(Math.atan(score * ((Math.PI * Math.PI) / 4800)) * (2 / Math.PI)) * (2 / Math.PI),\n  'atan': (score) => Math.atan(score * (Math.PI / 2400)) * (2 / Math.PI),\n  'tanh': (score) => Math.tanh(score / 1200),\n  'linear1000': (score) => Math.min(Math.max(score / 1000, -1), +1),\n  'linear1200': (score) => Math.min(Math.max(score / 1200, -1), +1),\n  'linear2000': (score) => Math.min(Math.max(score / 2000, -1), +1),\n  'linear3000': (score) => Math.min(Math.max(score / 3000, -1), +1),\n}"
        );
        selectYAxis.append("option").attr("value", "default").text("default");
        selectYAxis
            .append("option")
            .attr("value", "pseudoSigmoid")
            .text("pSigmoid");
        selectYAxis.append("option").attr("value", "atan").text("atan");
        selectYAxis.append("option").attr("value", "tanh").text("tanh");
        selectYAxis
            .append("option")
            .attr("value", "linear1200")
            .text("linear1200");
        selectYAxis
            .append("option")
            .attr("value", "linear1000")
            .text("linear1000");
        selectYAxis
            .append("option")
            .attr("value", "linear2000")
            .text("linear2000");
        selectYAxis
            .append("option")
            .attr("value", "linear3000")
            .text("linear3000");
        const reloadButton = body
            .append("button")
            .attr("title", "棋譜リストの再読み込み");
        iconSet(reloadButton, refreshSvg);

        let boards: GameBoard[] = [];
        const boardsSetGroupDiv = body
            .append("div")
            .attr("class", "boardset-container");

        const listLoad = async (): Promise<void> => {
            const logPromise = await fetch(gameBoardProp.urlList);
            const log = await logPromise.text();
            const gameList = gameBoardProp
                .logParser(log)
                .filter(
                    (x, i, self) =>
                        self.map((s) => s.gameId).lastIndexOf(x.gameId) === i
                )
                .sort(
                    (a, b) =>
                        parseFloat(a.gameId.substring(a.gameId.length - 14)) -
                        parseFloat(b.gameId.substring(b.gameId.length - 14))
                );
            if (gameList.length === 0) {
                return;
            }
            const gameIdToDtValue = (gameid: string): number => {
                return new Date(
                    Number.parseInt(
                        gameid.substring(
                            gameid.length - 14,
                            gameid.length - 10
                        ),
                        10
                    ),
                    Number.parseInt(
                        gameid.substring(gameid.length - 10, gameid.length - 8),
                        10
                    ),
                    Number.parseInt(
                        gameid.substring(gameid.length - 8, gameid.length - 6),
                        10
                    ),
                    Number.parseInt(
                        gameid.substring(gameid.length - 6, gameid.length - 4),
                        10
                    ),
                    Number.parseInt(
                        gameid.substring(gameid.length - 4, gameid.length - 2),
                        10
                    ),
                    Number.parseInt(
                        gameid.substring(gameid.length - 2, gameid.length),
                        10
                    )
                ).valueOf();
            };
            const lastGameIdDtValue = gameIdToDtValue(
                gameList[gameList.length - 1].gameId
            );
            const gameListFiltered = gameList.filter(
                (e) =>
                    lastGameIdDtValue - gameIdToDtValue(e.gameId) <=
                    (gameBoardProp.multiViewSpan ?? 2400000)
            );
            boards.forEach((b) => {
                const g = gameListFiltered.filter(
                    (g) => b.gameObj?.gameId === g.gameId
                );
                if (g.length > 0) {
                    b.gameObj = g[0];
                    b.fetchGameTrig(true);
                } else {
                    b.enabled = false;
                    b.graphDiv.remove();
                }
            });
            boards = boards.filter((b) => b.enabled);
            gameListFiltered
                .filter(
                    (g) => !boards.some((b) => b.gameObj?.gameId === g.gameId)
                )
                .forEach((g) => {
                    const boardSetDiv = new GameBoard(
                        boardsSetGroupDiv
                            .insert("div", ":first-child")
                            .attr("class", "boardset")
                    );
                    boardSetDiv.gameObj = g;
                    boardSetDiv.fetchGameTrig(true);
                    boards.push(boardSetDiv);
                });
        };
        reloadButton.on("click", () => {
            listLoad();
        });
        selectColor.on("change", () => {
            boards.forEach((e) => {
                e.color = selectColor.property("value");
                e.fetchGameTrig(true);
            });
        });
        selectYAxis.on("change", () => {
            boards.forEach((e) => {
                e.yaxis = selectYAxis.property("value");
                e.fetchGameTrig(true);
            });
        });

        listLoad();
    });
} else if (gameBoardProp.mode === "single") {
    window.addEventListener("load", () => {
        const body = select("body");
        const selectGame = body.append("select").attr("id", "selectgame");
        const selectColor = body.append("select").attr("id", "selectcolor");
        selectColor.append("option").attr("value", "default").text("default");
        selectColor.append("option").attr("value", "white").text("white");
        selectColor.append("option").attr("value", "black").text("black");
        selectColor.append("option").attr("value", "aqua").text("aqua");
        const selectYAxis = body.append("select").attr("id", "selectyaxis");
        selectYAxis.attr(
            "title",
            "{\n  'pSigmoid': (score) => Math.asin(Math.atan(score * ((Math.PI * Math.PI) / 4800)) * (2 / Math.PI)) * (2 / Math.PI),\n  'atan': (score) => Math.atan(score * (Math.PI / 2400)) * (2 / Math.PI),\n  'tanh': (score) => Math.tanh(score / 1200),\n  'linear1000': (score) => Math.min(Math.max(score / 1000, -1), +1),\n  'linear1200': (score) => Math.min(Math.max(score / 1200, -1), +1),\n  'linear2000': (score) => Math.min(Math.max(score / 2000, -1), +1),\n  'linear3000': (score) => Math.min(Math.max(score / 3000, -1), +1),\n}"
        );
        selectYAxis.append("option").attr("value", "default").text("default");
        selectYAxis
            .append("option")
            .attr("value", "pseudoSigmoid")
            .text("pSigmoid");
        selectYAxis.append("option").attr("value", "atan").text("atan");
        selectYAxis.append("option").attr("value", "tanh").text("tanh");
        selectYAxis
            .append("option")
            .attr("value", "linear1200")
            .text("linear1200");
        selectYAxis
            .append("option")
            .attr("value", "linear1000")
            .text("linear1000");
        selectYAxis
            .append("option")
            .attr("value", "linear2000")
            .text("linear2000");
        selectYAxis
            .append("option")
            .attr("value", "linear3000")
            .text("linear3000");
        const reloadButton = body
            .append("button")
            .attr("title", "棋譜リストの再読み込み");
        iconSet(reloadButton, refreshSvg);

        const boardSetDiv = body.append("div").attr("class", "boardset");
        const boardPart = new GameBoard(boardSetDiv);
        boardPart.color = select("body")
            .select("#selectcolor")
            .property("value");
        boardPart.yaxis = select("body")
            .select("#selectyaxis")
            .property("value");
        let gameList: GameObj[] = [];
        const listLoad = async (): Promise<void> => {
            const logPromise = await fetch(gameBoardProp.urlList);
            const log = await logPromise.text();
            gameList = gameList
                .concat(gameBoardProp.logParser(log))
                .filter(
                    (x, i, self) =>
                        self.map((s) => s.gameId).lastIndexOf(x.gameId) === i
                )
                .sort(
                    (a, b) =>
                        parseFloat(a.gameId.substring(a.gameId.length - 14)) -
                        parseFloat(b.gameId.substring(b.gameId.length - 14))
                );
            selectGame.selectAll("*").remove();
            gameList.forEach((o) => {
                selectGame
                    .append("option")
                    .attr("value", o.gameId)
                    .text(o.gameName);
            });
            const gameIdHash = getGameIdHash();
            if (gameIdHash) {
                selectGame.property("value", gameIdHash);
                boardPart.gameObj = {
                    gameId: gameIdHash,
                    gameName: gameIdHash,
                };
                gameList.forEach((e) => {
                    if (e.gameId === gameIdHash) {
                        boardPart.gameObj = e;
                    }
                });
                boardPart.fetchGameTrig(true);
            } else if (gameList.length) {
                const lastGameId = gameList[gameList.length - 1].gameId;
                window.location.hash = `#${lastGameId}`;
                selectGame.property("value", lastGameId);
                boardPart.gameObj = {
                    gameId: lastGameId,
                    gameName: lastGameId,
                };
                gameList.forEach((e) => {
                    if (e.gameId === lastGameId) {
                        boardPart.gameObj = e;
                    }
                });
                boardPart.fetchGameTrig(true);
            }
        };
        selectGame.on("change", () => {
            const gameId = selectGame.property("value");
            const newHash = `#${gameId}`;
            if (window.location.hash !== newHash) {
                window.location.hash = newHash;
            }
            boardPart.gameObj = { gameId, gameName: gameId };
            gameList.forEach((e) => {
                if (e.gameId === gameId) {
                    boardPart.gameObj = e;
                }
            });
            boardPart.fetchGameTrig(true);
        });
        reloadButton.on("click", () => {
            window.location.hash = "";
            listLoad();
        });
        selectColor.on("change", () => {
            boardPart.color = selectColor.property("value");
            boardPart.fetchGameTrig(true);
        });
        selectYAxis.on("change", () => {
            boardPart.yaxis = selectYAxis.property("value");
            boardPart.fetchGameTrig(true);
        });
        listLoad();
        window.addEventListener("hashchange", (ev) => {
            if (ev.isTrusted) {
                const gameId = getGameIdHash();
                if (gameId) {
                    selectGame.property("value", gameId);
                    boardPart.gameObj = { gameId, gameName: gameId };
                    gameList.forEach((e) => {
                        if (e.gameId === gameId) {
                            boardPart.gameObj = e;
                        }
                    });
                    boardPart.fetchGameTrig(true);
                }
            }
        });
    });
} else {
    window.addEventListener("load", async () => {
        if (!gameBoardProp.gameId) {
            return;
        }
        const body = select("body");

        const boardSetDiv = body.append("div").attr("class", "boardset");
        const boardPart = new GameBoard(boardSetDiv);
        boardPart.gameObj = {
            gameId: gameBoardProp.gameId,
            gameName: gameBoardProp.gameName ?? "",
        };
        await boardPart.fetchGameTrig(true);
        boardPart.kifuStore?.player.goto(gameBoardProp.tesuu ?? Infinity);
    });
}
