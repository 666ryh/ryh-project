const assert = require("assert");
const AccountService = require("./service");

function run() {
    const service = new AccountService();
    const summary = service.getMonthlySummary(2025, 1);

    assert.strictEqual(summary.income, 908650);
    assert.strictEqual(summary.expense, 509240);
    assert.strictEqual(summary.net, 399410);

    const category = service.getCategoryBreakdown(2025, 1);
    assert.ok(category.length > 0);
    assert.strictEqual(category[0].category, "房租");

    console.log("测试通过：月度统计与分类统计结果正确");
}

run();
