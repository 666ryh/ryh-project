/**
 * JSON 文件存储层
 */
const fs = require("fs");
const path = require("path");
const Transacton = require("./model");

const DATA_FILE = path.join(__dirname, "data", "transactions.json");
const CSV_FILE = path.join(__dirname, "..", "data", "data.csv");

class JsonStorage {
    constructor() {
        this._cache = [];
        this._nextId = 1;
        this._load();
        if (this._cache.length === 0) {
            this._loadCSV();
        }
    }

    /**
     * 保存一条交易记录
     */
    save(transaction) {
        transaction.id = this._nextId++;
        this._cache.push(transaction);
        try {
            this._write();
        } catch (e) {
            // 忽略写入失败
        }
    }

    /**
     * 返回所有记录
     */
    findAll() {
        return [...this._cache];
    }

    /**
     * 按 ID 查询
     */
    findById(id) {
        return this._cache.find(t => t.id === id) || null;
    }

    /**
     * 按日期范围查询
     */
    findByDateRange(startDate, endDate) {
        return this._cache.filter(t => t.date >= startDate && t.date <= endDate);
    }

    /**
     * 按分类查询
     */
    findByCategory(category) {
        return this._cache.filter(t => (t.category || t.catgory) === category);
    }

    /**
     * 删除记录
     */
    delete(id) {
        const idx = this._cache.findIndex(t => t.id === id);
        if (idx >= 0) {
            this._cache.splice(idx, 1);
            this._write();
            return true;
        }
        return false;
    }

    /**
     * 更新记录
     */
    update(id, updated) {
        const idx = this._cache.findIndex(t => t.id === id);
        if (idx >= 0) {
            updated.id = id;
            this._cache[idx] = updated;
            this._write();
            return true;
        }
        return false;
    }

    _load() {
        try {
            if (!fs.existsSync(DATA_FILE)) return;
            const raw = fs.readFileSync(DATA_FILE, "utf-8");
            const items = JSON.parse(raw);
            this._cache = items.map(item => Transacton.fromJSON(item));
            if (this._cache.length > 0) {
                this._nextId = Math.max(...this._cache.map(t => t.id)) + 1;
            }
        } catch (e) {
            // FIX: 旧 JSON 数据加载失败时不抛出异常，保证程序仍可从 CSV 继续初始化
        }
    }

    _loadCSV() {
        try {
            if (!fs.existsSync(CSV_FILE)) return;
            const raw = fs.readFileSync(CSV_FILE, "utf-8");
            const lines = raw.split(/\r?\n/).filter(line => line.trim());
            if (lines.length <= 1) return;

            const items = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const cols = line.split(",");
                if (cols.length < 6) continue;

                const id = Number(cols[0]);
                const type = cols[1].trim();
                const amount = Number(cols[2]);
                const category = cols[3].trim();
                const note = cols[4].trim();
                const date = cols.slice(5).join(",").trim();

                if (!id || !type || Number.isNaN(amount) || !category || !date) continue;
                if (type !== "income" && type !== "expense") continue;
                if (!/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(date)) continue;

                const normalizedDate = date.includes("/") ? date.replace(/\//g, "-") : date;
                const normalizedCategory = category.trim();
                items.push(new Transacton(id, type, amount, normalizedCategory, note, normalizedDate));
            }

            this._cache = items;
            if (this._cache.length > 0) {
                this._nextId = Math.max(...this._cache.map(t => t.id)) + 1;
            }
            this._write();
        } catch (e) {
            // FIX: CSV 初始化失败时保持空缓存，避免启动阶段崩溃
        }
    }

    _write() {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const json = JSON.stringify(this._cache.map(t => t.toJSON()), null, 2);
        fs.writeFileSync(DATA_FILE, json, "utf-8");
    }
}

module.exports = JsonStorage;
