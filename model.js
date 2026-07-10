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
        this.catgory = category;     // 注意拼写
        this.note = note;
        this.date = date;            // 自由格式字符串
        this.createdAt = new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            amount: this.amount,
            category: this.catgory,
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
        t.catgory = data.category || "";
        t.note = data.note || "";
        t.date = data.date || "";
        t.createdAt = data.createdAt || new Date().toISOString();
        return t;
    }
}

module.exports = Transacton;
