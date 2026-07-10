/**
 * 个人记账本 — 命令行入口
 */
const fs = require("fs");
const path = require("path");
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
printAll();
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
            handleAdd(parts.slice(1));
            break;
        case "list":
            printAll();
            break;
        case "delete":
            handleDelete(parts[1]);
            break;
        case "summary":
        case "stats":
            handleSummary(parts[1], parts[2]);
            break;
        case "category":
            handleCategory(parts[1], parts[2]);
            break;
        case "export":
            handleExport(parts[1]);
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
    console.log("  add      - 添加记录");
    console.log("  list     - 查看记录");
    console.log("  delete   - 删除记录");
    console.log("  summary  - 月度统计");
    console.log("  stats    - 月度统计");
    console.log("  category - 分类统计");
    console.log("  export   - 导出 CSV");
    console.log("  exit     - 退出");
}

function handleAdd(args) {
    if (args.length < 4) {
        console.log("用法：add <income|expense> <amount> <category> <note> [date]");
        return;
    }

    const type = args[0];
    const amount = Number(args[1]);
    const category = args[2];
    const date = args.length > 4 ? args[args.length - 1] : null;
    const note = args.slice(3, args.length > 4 ? -1 : undefined).join(" ");

    if (type !== "income" && type !== "expense") {
        console.log("类型必须是 income 或 expense");
        return;
    }

    if (Number.isNaN(amount)) {
        console.log("金额必须是数字");
        return;
    }

    const record = service.addTransaction(type, amount, category, note, date);
    console.log(`已添加记录：ID=${record.id}`);
}

function printAll() {
    const list = service.getAllTransactions();
    if (list.length === 0) {
        console.log("暂无记录");
        return;
    }

    for (const t of list) {
        console.log(`${t.id}\t${t.date}\t${t.type}\t${t.amount}\t${t.category || t.catgory || ""}\t${t.note || ""}`);
    }
}

function handleDelete(idText) {
    const id = Number(idText);
    if (Number.isNaN(id)) {
        console.log("请提供正确的 ID");
        return;
    }

    const ok = service.deleteTransaction(id);
    console.log(ok ? "删除成功" : "未找到该记录");
}

function handleSummary(yearText, monthText) {
    const year = Number(yearText);
    const month = Number(monthText);
    if (Number.isNaN(year) || Number.isNaN(month)) {
        console.log("用法：summary <year> <month>");
        return;
    }

    const summary = service.getMonthlySummary(year, month);
    console.log(`收入：${(summary.income / 100).toFixed(2)}`);
    console.log(`支出：${(summary.expense / 100).toFixed(2)}`);
    console.log(`净收入：${(summary.net / 100).toFixed(2)}`);
}

function handleCategory(yearText, monthText) {
    const year = Number(yearText);
    const month = Number(monthText);
    if (Number.isNaN(year) || Number.isNaN(month)) {
        console.log("用法：category <year> <month>");
        return;
    }

    const list = service.getCategoryBreakdown(year, month);
    if (list.length === 0) {
        console.log("暂无分类统计");
        return;
    }

    for (const item of list) {
        console.log(`${item.category}\t${(item.amount / 100).toFixed(2)}\t${item.percentage}%`);
    }
}

function handleExport(filePath) {
    const target = filePath || path.join(__dirname, "data", "export.csv");
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    service.exportCSV(target);
    console.log(`已导出到 ${target}`);
}
