/*
 * @Author: chenzhongsheng
 * @Date: 2024-08-12 17:51:34
 * @Description: Coding something
 */
import {runTasks, runAsyncTasks, withResolve} from '../src';
function fib (n) {
    if (n <= 1) {
        return n;
    } else {
        return fib(n - 1) + fib(n - 2);
    }
}
function test () {
    const {ready, resolve} = withResolve();
    const time = Math.round(Math.random() * 10);
    setTimeout(() => {
        resolve(time);
    }, time);
    return ready;
}

function get (id: string) {
    return document.getElementById(id)!;
}

get('startTasks').onclick = () => {
    const time = Date.now();
    get('result').innerText = '2000 Tasks is Running...';
    runTasks([
        ...new Array(2000).fill(() => fib(25))
    ]).then((d) => {
        get('result').innerText = `2000 Tasks done in ${Date.now() - time}ms. Open DevTool to view Details`;
        console.log(d);
    });
};
get('startAsyncTasks').onclick = () => {
    const time = Date.now();
    get('result').innerText = '2000 Async Tasks is Running...';
    runAsyncTasks([
        ...new Array(2000).fill(() => test())
    ], 100).then((d) => {
        get('result').innerText = `2000 Async Tasks done in ${Date.now() - time}ms. Open DevTool to view Details`;
        console.log(d);
    });
};


get('startTasks2').onclick = () => {
    const time = Date.now();
    get('result').innerText = '2000 Tasks is Running...';
    console.log([
        ...new Array(2000).fill(() => fib(25))
    ].map(fn => fn()));
    get('result').innerText = `2000 Tasks done in ${Date.now() - time}ms. Open DevTool to view Details`;
};