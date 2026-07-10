/**
 * 加密 JSON 文件存储层
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Transacton = require("./model");

const DATA_FILE = path.join(__dirname, "data", "transactions.enc");
const LEGACY_FILE = path.join(__dirname, "data", "transactions.json");
const CSV_FILE = path.join(__dirname, "..", "data", "data.csv");
const AUTH_FILE = path.join(__dirname, "data", "auth.json");
const AUTH_SALT_FILE = path.join(__dirname, "data", "auth.salt");
const ITERATIONS = 10000;

class JsonStorage {
    constructor(password = null) {
        this._cache = [];
        this._nextId = 1;
        this._password = password;
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

    hasAuth() {
        return fs.existsSync(AUTH_FILE) && fs.existsSync(AUTH_SALT_FILE);
    }

    getAuthUsername() {
        if (!fs.existsSync(AUTH_FILE)) return "";
        try {
            const auth = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
            return auth.username || "";
        } catch (e) {
            return "";
        }
    }

    createAuth(username, password) {
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = this._hashPassword(password, salt);
        const dir = path.dirname(AUTH_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(AUTH_FILE, JSON.stringify({ username, hash }, null, 2), "utf-8");
        fs.writeFileSync(AUTH_SALT_FILE, salt, "utf-8");
    }

    verifyAuth(username, password) {
        if (!this.hasAuth()) return false;
        const auth = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
        if (auth.username !== username) return false;
        const salt = fs.readFileSync(AUTH_SALT_FILE, "utf-8");
        return auth.hash === this._hashPassword(password, salt);
    }

    updatePassword(username, oldPassword, newPassword) {
        if (!this.verifyAuth(username, oldPassword)) return false;
        this.createAuth(username, newPassword);
        return true;
    }

    _hashPassword(password, salt) {
        return crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256").toString("hex");
    }

    _deriveKey(password, salt) {
        return crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
    }

    _encrypt(plainText) {
        const iv = crypto.randomBytes(12);
        const salt = crypto.randomBytes(16);
        const key = this._deriveKey(this._password || "", salt);
        const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
        const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
        const tag = cipher.getAuthTag();
        return JSON.stringify({
            salt: salt.toString("hex"),
            iv: iv.toString("hex"),
            tag: tag.toString("hex"),
            data: encrypted.toString("hex")
        }, null, 2);
    }

    _decrypt(payload) {
        const parsed = JSON.parse(payload);
        const salt = Buffer.from(parsed.salt, "hex");
        const iv = Buffer.from(parsed.iv, "hex");
        const tag = Buffer.from(parsed.tag, "hex");
        const data = Buffer.from(parsed.data, "hex");
        const key = this._deriveKey(this._password || "", salt);
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    }

    _load() {
        try {
            if (this._password && fs.existsSync(DATA_FILE)) {
                const raw = fs.readFileSync(DATA_FILE, "utf-8");
                const text = this._decrypt(raw);
                const items = JSON.parse(text);
                this._cache = items.map(item => Transacton.fromJSON(item));
                if (this._cache.length > 0) {
                    this._nextId = Math.max(...this._cache.map(t => t.id)) + 1;
                }
                return;
            }

            if (fs.existsSync(LEGACY_FILE)) {
                const raw = fs.readFileSync(LEGACY_FILE, "utf-8");
                const items = JSON.parse(raw);
                this._cache = items.map(item => Transacton.fromJSON(item));
                if (this._cache.length > 0) {
                    this._nextId = Math.max(...this._cache.map(t => t.id)) + 1;
                }
                return;
            }
        } catch (e) {
            // FIX: 加密数据或旧数据加载失败时不抛出异常，保证程序可继续启动
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
        const payload = this._password ? this._encrypt(json) : json;
        fs.writeFileSync(DATA_FILE, payload, "utf-8");
    }
}

module.exports = JsonStorage;
