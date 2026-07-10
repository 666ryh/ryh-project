# 个人记账本 — JavaScript (Node.js) 版

## 运行

```bash
node main.js
```

## 同步服务端

```bash
node server.js
```

## 项目结构

```
JS/
├── README.md
├── main.js
├── model.js
├── storage.js
├── service.js
├── server.js
└── data/
```

## 测试

```bash
node test.js
```

## 设计思路

- 客户端继续使用文件存储方式，保持项目简单可运行
- 服务端使用 Node.js 原生 `http` 模块实现 REST 风格接口
- 服务端数据直接落盘为 `server-data.json`，避免引入额外数据库依赖
- 提供 `/api/status`、`/api/upload`、`/api/pull`、`/api/export` 接口，满足同步与查询需求
- 使用内置 `assert` 编写轻量测试，验证月度统计与分类统计结果
- 该实现偏轻量，便于面试现场快速展示同步思路和接口设计
