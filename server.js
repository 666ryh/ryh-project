/**
 * 数据同步服务端
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "server-data.json");

function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return {
                updatedAt: new Date().toISOString(),
                records: []
            };
        }

        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(raw);
    } catch (e) {
        return {
            updatedAt: new Date().toISOString(),
            records: []
        };
    }
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8"
    });
    res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => {
            body += chunk;
            if (body.length > 1024 * 1024) {
                reject(new Error("Payload too large"));
                req.destroy();
            }
        });
        req.on("end", () => resolve(body));
        req.on("error", reject);
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, { ok: true, service: "account-sync-server" });
        return;
    }

    if (req.method === "GET" && url.pathname === "/api/status") {
        const data = loadData();
        sendJson(res, 200, {
            recordCount: Array.isArray(data.records) ? data.records.length : 0,
            updatedAt: data.updatedAt || null
        });
        return;
    }

    if (req.method === "GET" && url.pathname === "/api/export") {
        const data = loadData();
        sendJson(res, 200, data);
        return;
    }

    if (req.method === "POST" && url.pathname === "/api/upload") {
        try {
            const body = await readBody(req);
            const payload = JSON.parse(body || "{}");
            const records = Array.isArray(payload.records) ? payload.records : [];
            const current = loadData();
            const merged = {
                updatedAt: new Date().toISOString(),
                records
            };
            if (payload.mode === "merge" && Array.isArray(current.records)) {
                const map = new Map();
                for (const item of current.records) {
                    if (item && item.id != null) {
                        map.set(item.id, item);
                    }
                }
                for (const item of records) {
                    if (item && item.id != null) {
                        map.set(item.id, item);
                    }
                }
                merged.records = Array.from(map.values());
            }
            saveData(merged);
            sendJson(res, 200, {
                success: true,
                recordCount: merged.records.length,
                updatedAt: merged.updatedAt
            });
        } catch (e) {
            sendJson(res, 400, { success: false, message: e.message });
        }
        return;
    }

    if (req.method === "POST" && url.pathname === "/api/pull") {
        try {
            const body = await readBody(req);
            const payload = body ? JSON.parse(body) : {};
            const data = loadData();
            sendJson(res, 200, {
                success: true,
                mode: payload.mode || "full",
                records: data.records || [],
                updatedAt: data.updatedAt || null
            });
        } catch (e) {
            sendJson(res, 400, { success: false, message: e.message });
        }
        return;
    }

    sendJson(res, 404, { success: false, message: "Not Found" });
});

server.listen(PORT, () => {
    console.log(`同步服务已启动，监听端口 ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
    console.log(`状态查询: http://localhost:${PORT}/api/status`);
});
