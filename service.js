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
        const all = this.storage.findAll();
        const prefix = `${year}-${String(month).padStart(2, "0")}`;
        let income = 0;
        let expense = 0;

        for (const t of all) {
            if (!t.date || !t.date.startsWith(prefix)) continue;
            const cents = Math.round(t.amount * 100);
            if (t.type === "income") {
                income += cents;
            } else if (t.type === "expense") {
                expense += cents;
            }
        }

        return {
            income,
            expense,
            net: income - expense
        };
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
                const category = t.catgory || t.category || "未分类";
                categoryTotals[category] = (categoryTotals[category] || 0) + cents;
                totalExpense += cents;
            }
        }

        const result = [];
        for (const [cat, amount] of Object.entries(categoryTotals)) {
            result.push({
                category: cat,
                amount: amount,
                percentage: totalExpense === 0 ? 0 : Number(((amount / totalExpense) * 100).toFixed(2))
            });
        }
        return result;
    }

    /**
     * 导出 CSV
     */
    exportCSV(filepath) {
        const fs = require("fs");
        const all = this.storage.findAll();
        const lines = ["日期,类型,金额,分类,备注"];

        for (const t of all) {
            lines.push([
                t.date || "",
                t.type || "",
                t.amount,
                t.category || t.catgory || "",
                t.note || ""
            ].join(","));
        }

        fs.writeFileSync(filepath, lines.join("\n"), "utf-8");
    }
}


module.exports = AccountService;
