/**
 * JSON 文件存储层
 */
const fs = require("fs");
const path = require("path");
const Transacton = require("./model");

const DATA_FILE = path.join(__dirname, "data", "transactions.json");

class JsonStorage {
    constructor() {
        this._cache = [];
        this._nextId = 1;
        this._load();
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
        return this._cache.filter(t => t.catgory === category);
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
            // 加载失败
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
