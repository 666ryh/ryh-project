/**
 * 交易记录模型
 */
class Transacton {
    /**
     * @param {number} id
     * @param {string} type - "income" 或 "expense"
     * @param {number} amount - 金额（元），浮点数
     * @param {string} category - 分类
     * @param {string} note - 备注
     * @param {string} date - 日期字符串
     */
    constructor(id = 0, type = "expense", amount = 0.0, category = "", note = "", date = "") {
        this.id = id;
        this.type = type;
        this.amount = amount;        // 浮点数金额
        this.category = category;
        // FIX: 统一使用 category 字段，避免实体属性命名不一致导致后续逻辑混乱
        this.note = note;
        this.date = date;            // 自由格式字符串
        this.createdAt = new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            amount: this.amount,
            category: this.category,
            note: this.note,
            date: this.date,
            createdAt: this.createdAt
        };
    }

    static fromJSON(data) {
        const t = new Transacton();
        t.id = data.id || 0;
        t.type = data.type || "expense";
        t.amount = data.amount || 0;
        t.category = data.category || data.catgory || "";
        // FIX: 兼容旧数据中的 catgory 字段，保证历史记录可正常读取
        t.note = data.note || "";
        t.date = data.date || "";
        t.createdAt = data.createdAt || new Date().toISOString();
        return t;
    }
}

module.exports = Transacton;
