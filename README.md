<!--
 * @Author: theajack
 * @Date: 2023-05-09 22:31:06
 * @Description: Coding something
-->
# [TaskRunner](https://github.com/theajack/task)

## A simple concurrent task execution library that supports both synchronous and asynchronous operations.

[Demo](https://theajack.github.io/task) | [Demo Code](https://github.com/theajack/task/blob/main/dev/index.ts)


### Install

```
npm i task-runner-lib
```

or

```html
<script src='https://cdn.jsdelivr.net/npm/task-runner-lib'></script>
<script>window.TaskRunner</script>
```

### Usage

runTasks

```js
import {runTasks} from 'task-runner-lib';

runTasks(
    new Array(2000).fill(() => fib(25)),
    (result) => {
        console.log('single task done', result);
    }
).then(results=>{
    console.log(results);
});

function fib (n) {
    if (n <= 1) {
        return n;
    } else {
        return fib(n - 1) + fib(n - 2);
    }
}
```

runAsyncTasks

```js
import {runAsyncTasks, withResolve} from 'task-runner-lib';

runAsyncTasks(
    new Array(2000).fill(() => asyncTask()),
    100, // Maximum concurrency number， default is 10
    (result) => {
        console.log('single task done', result);
    }
).then((results) => {
    console.log(results);
});

function asyncTask () {
    const {ready, resolve} = withResolve();
    const time = Math.round(Math.random() * 10);
    setTimeout(() => {
        resolve(time);
    }, time);
    return ready;
}

```

runTaskQueue

```js
import {runAsyncTasks, withResolve} from 'task-runner-lib';

function asyncFn () {
    return Promise.resolve('asyncFn');
}
function syncFn () {
    return 'syncFn';
}

async function testAsync () {
    return _a([
        asyncFn,
        asyncFn,
    ]);
}
function testSync () {
    return _a([
        syncFn,
        syncFn,
    ]);
}
function _a (args) {
    return runTaskQueue([
        () => args[0](),
        (prev) => {
            console.log('a', prev);
            return args[1]();
        },
        (prev) => {
            console.log('b', prev);
            return 1;
        },
    ]);
}
```

declaration

```ts
export declare function runAsyncTasks<T = any>(
    tasks: (() => Promise<T>)[], 
    max?: number, 
    onSingleTaskDone?: (result: T, index: number) => void
): Promise<IAsyncResult<T>[]>;

export declare function runTasks<T = any>(
    tasks: (() => T)[], 
    onSingleTaskDone?: (result: T, index: number) => void
): Promise<IResult<T>[]>;

export declare function runTaskQueue<T = any>(
    queue: ((prev: any, end: <T>(v?: T) => T) => any)[]
): T | Promise<T>;
export declare namespace runTaskQueue {
	var end: (value: any) => {
		[endMark]: boolean;
		value: any;
	};
}

export interface IAsyncResult<T> {
	start: number;
	elapse: number;
	result: T;
}
export interface IResult<T> extends IAsyncResult<T> {
	round: number;
}
```
