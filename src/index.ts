
export interface IAsyncResult<T> {
    start: number,
    elapse: number,
    result: T,
    success: boolean,
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
    {
        max = 10,
        retryTime = 2,
        timeout = 10000,
        onSingleTaskDone,
    }: {
        max?: number,
        retryTime?: number,
        timeout?: number,
        onSingleTaskDone?: (data: {result: T, index: number, success: boolean})=>{abort?: boolean, data?: T}|void,
    } = {}
): Promise<IAsyncResult<T>[]> {
    const length = tasks.length;
    if (length === 0) return Promise.resolve([]);

    const {ready, resolve} = withResolve();
    const results: IAsyncResult<T>[] = [];

    let runIndex = 0;
    let finishCount = 0;

    const runSingle = (task: (()=>Promise<any>)) => {
        const {ready, resolve} = withResolve<{success: boolean, result: any}>();
        const timer = setTimeout(() => {
            resolve({success: false, result: null});
        }, timeout);

        let tryCount = 0;
        const run = (fallback: any) => {
            tryCount ++;
            task().then((result) => {
                clearTimeout(timer);
                resolve({success: true, result});
            }).catch(() => {
                if (tryCount < retryTime) {
                    run(fallback);
                } else {
                    fallback();
                }
            });
        };
        run(() => {
            clearTimeout(timer);
            resolve({success: false, result: null});
        });
        return ready;
    };

    const runNextTask = async () => {
        const task = tasks[runIndex];
        const index = runIndex;
        runIndex ++;
        const start = Date.now();
        const runResult = await runSingle(task);

        const success = runResult.success;
        let result = runResult.result;

        const customResult = onSingleTaskDone?.({success, result, index});

        if (customResult) {
            const {abort, data} = customResult;
            if (abort === false) {
                resolve([]);
                return;
            }
            if (data) result = data;
        }

        const elapse = Date.now() - start;
        results[index] = {start, result, elapse, success};
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

    const n = Math.min(max, length);
    for (let i = 0; i < n; i++) {
        runNextTask();
    }

    return ready;
}

export interface IResult<T> extends Omit<IAsyncResult<T>, 'success'> {
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

const endMark = Symbol('');

// 作用是确保同步和异步逻辑可以分别处理，如 writeFile和writeFileSync
export function runTaskQueue<T = any> (
    fns: ((prev: any, end: <T>(v?: T)=>T)=>any)[],
): T|Promise<T> {

    let isAsync = false;
    let prev: any;
    let resolve: (v: T)=>any;
    let ready: Promise<T>;

    let finish = false;

    const end = (v: any) => {
        finish = true;
        prev = v;
        return v;
    };

    const next = () => {
        const fn = fns.shift();
        if (!fn) return resolve?.(prev);

        let result = fn(prev, end);

        if (result?.[endMark]) {
            result = result.value;
            finish = true;
        }

        if (finish) return resolve?.(result);

        const _next = (result: any) => {
            prev = result;
            next();
        };
        if (result instanceof Promise) {
            if (!isAsync) {
                isAsync = true;
                const p = withResolve();
                ready = p.ready;
                resolve = p.resolve;
            }
            result.then(_next);
        } else {
            _next(result);
        }
    };
    next();
    // @ts-ignore
    return isAsync ? ready : prev;
}

runTaskQueue.end = (value: any) => ({
    [endMark]: true,
    value,
});

export function withResolve<T=any> () {
    let resolve: (value?: T|PromiseLike<T>)=>any = () => {}, reject: (error?: any)=>any = () => {};
    const ready = new Promise<T>((_resolve, _reject) => {
        // @ts-ignore
        resolve = _resolve;
        reject = _reject;
    });
    return {ready, resolve, reject};
}

// 对异步任务的执行做超时兜底
export function runTaskBackup<Data = any> ({
    task,
    timeout,
    time = 200,
}: {
    task: () => Promise<Data>,
    timeout?: (() => Promise<Data>|Data)|Data,
    time?: number,
}) {
    const {ready, resolve} = withResolve<Data>();
    const timer = setTimeout(async () => {
        let data: Data;
        if (typeof timeout !== 'undefined') {
            if (typeof timeout === 'function') {
                // @ts-ignore
                data = timeout();
                if (data instanceof Promise) {
                    data = await data;
                }
            } else {
                data = timeout;
            }
        }
        // @ts-ignore
        resolve(data);
    }, time);
    task().then((data) => {
        clearTimeout(timer);
        resolve(data);
    });
    return ready;
}