/**
 * 个人记账本 — 命令行入口
 */
const readline = require("readline");
const AccountService = require("./service");

const service = new AccountService();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
});

console.log("=== 个人记账本 ===");
console.log("输入 help 查看命令列表");
rl.prompt();

rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
        rl.prompt();
        return;
    }

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
        case "help":
            printHelp();
            break;
        case "add":
            // TODO: 解析参数并添加记录
            console.log("功能待实现");
            break;
        case "list":
            // TODO: 列出记录
            console.log("功能待实现");
            break;
        case "delete":
            // TODO: 删除记录
            console.log("功能待实现");
            break;
        case "stats":
        case "summary":
            // TODO: 统计信息
            console.log("功能待实现");
            break;
        case "quit":
        case "exit":
            console.log("再见！");
            process.exit(0);
            break;
        default:
            console.log(`未知命令：${command}，输入 help 查看帮助`);
    }
    rl.prompt();
});

function printHelp() {
    console.log("命令列表：");
    console.log("  add     - 添加记录");
    console.log("  list    - 查看记录");
    console.log("  delete  - 删除记录");
    console.log("  summary - 月度统计");
    console.log("  stats   - 月度统计");
    console.log("  exit    - 退出");
}
