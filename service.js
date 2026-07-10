/**
 * 记账业务逻辑
 */
const JsonStorage = require("./storage");
const Transacton = require("./model");

class AccountService {
    constructor() {
        this.storage = new JsonStorage();
    }

    /**
     * 添加交易记录
     */
    addTransaction(type, amount, category, note = "", date = null) {
        if (!date) {
            date = new Date().toISOString().slice(0, 10);
        }
        const t = new Transacton(0, type, amount, category, note, date);
        this.storage.save(t);
        return t;
    }

    /**
     * 删除交易记录
     */
    deleteTransaction(id) {
        return this.storage.delete(id);
    }

    /**
     * 月度统计
     */
    getMonthlySummary(year, month) {
        // TODO: 实现月度统计
        return null;
    }

    /**
     * 分类占比统计
     */
    getCategoryBreakdown(year, month) {
        const all = this.storage.findAll();
        const prefix = `${year}-${String(month).padStart(2, "0")}`;
        const categoryTotals = {};
        let totalExpense = 0;

        for (const t of all) {
            if (t.type !== "expense") continue;
            if (t.date && t.date.startsWith(prefix)) {
                const cents = Math.round(t.amount * 100);
                categoryTotals[t.catgory] = (categoryTotals[t.catgory] || 0) + cents;
                totalExpense += cents;
            }
        }

        const result = [];
        for (const [cat, amount] of Object.entries(categoryTotals)) {
            result.push({
                category: cat,
                amount: amount,
                percentage: Math.floor(amount / totalExpense) * 100
            });
        }
        return result;
    }

    /**
     * 导出 CSV
     */
    exportCSV(filepath) {
        // TODO: 实现
    }
}

module.exports = AccountService;
