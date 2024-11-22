
export interface IAsyncResult<T> {
    start: number,
    elapse: number,
    result: T,
}
// 如果不支持，则模拟实现。兼容nodejs
if (typeof globalThis.requestIdleCallback === 'undefined') {
    // @ts-ignore
    globalThis.requestIdleCallback = function (callback) {
        const startTime = Date.now();
        return setTimeout(function () {
            callback({
                didTimeout: false,
                timeRemaining: function () {
                    return Math.max(0, 16 - (Date.now() - startTime));
                }
            });
        }, 0);
    };

    globalThis.cancelIdleCallback = function (id) {
        clearTimeout(id);
    };
}


export async function runAsyncTasks<T = any> (
    tasks: (()=>Promise<T>)[],
    max = 10,
    onSingleTaskDone?: (result: T, index: number)=>void,
): Promise<IAsyncResult<T>[]> {
    const length = tasks.length;
    if (length === 0) return Promise.resolve([]);

    const {ready, resolve} = withResolve();
    const results: IAsyncResult<T>[] = [];

    let runIndex = 0;
    let finishCount = 0;

    const runNextTask = async () => {
        const task = tasks[runIndex];
        const index = runIndex;
        runIndex ++;
        const start = Date.now();
        const result = await task();
        onSingleTaskDone?.(result, index);
        const elapse = Date.now() - start;
        results[index] = {start, result, elapse};
        finishCount ++;
        if (finishCount === length) {
            resolve(results);
            return;
        }
        if (runIndex >= length) {
            return;
        }
        runNextTask();
    };

    for (let i = 0; i < max; i++) {
        runNextTask();
    }

    return ready;
}

export interface IResult<T> extends IAsyncResult<T> {
    round: number,
}

export function runTasks<T = any> (
    tasks: (()=>T)[],
    onSingleTaskDone?: (result: T, index: number)=>void,
): Promise<IResult<T>[]> {
    const length = tasks.length;
    if (length === 0) return Promise.resolve([]);

    const {ready, resolve} = withResolve();
    const results: IResult<T>[] = [];
    let round = 0;
    let runIndex = 0;
    const runTask = (time = 0) => {
        let prev = Date.now();
        while (time > 0) {
            const result = tasks[runIndex]();
            onSingleTaskDone?.(result, runIndex);
            runIndex ++;
            const now = Date.now();
            const elapse = now - prev;
            results.push({result, elapse, start: prev, round});
            if (runIndex >= length) {
                resolve(results);
                return;
            }
            prev = now;
            time -= elapse;
        }
        globalThis.requestIdleCallback((data) => {
            runTask(data.timeRemaining());
        });
        round ++;
    };
    runTask();
    return ready;
}

export function withResolve<T=any> () {
    let resolve: (value?: T|PromiseLike<T>)=>any = () => {}, reject: (error?: any)=>any = () => {};
    const ready = new Promise<T>((_resolve, _reject) => {
        // @ts-ignore
        resolve = _resolve;
        reject = _reject;
    });
    return {ready, resolve, reject};
}