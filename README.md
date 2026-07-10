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

## 完整测试流程

### 1. 进入项目目录

```powershell
cd "C:\Users\ryh92\Desktop\实操\实操面试题\实操面试题\实操题\JS"
```

### 2. 启动主程序

```powershell
node main.js
```

### 3. 首次运行测试

如果想测试首次使用流程，先删除旧认证和加密文件：

```powershell
Remove-Item .\data\auth.json
Remove-Item .\data\auth.salt
Remove-Item .\data\transactions.enc
```

然后重新启动：

```powershell
node main.js
```

按提示输入用户名和口令，例如：

- 用户名：`admin`
- 口令：`admin123`

### 4. 登录测试

再次启动程序并输入用户名和口令，验证可以正常进入系统。

### 5. 口令错误测试

连续输入 3 次错误口令，验证程序会在失败 3 次后退出。

### 6. 核心命令测试

登录后依次测试以下命令：

```text
help
list
add income 500 工资 月底补贴 2025-07-10
add expense 88 餐饮 午饭 2025-07-10
delete 1
summary 2025 1
category 2025 1
export test_export.csv
passwd admin123 newpass newpass
exit
```

### 7. 加密文件测试

确认 `JS/data/` 目录下生成：

- `auth.json`
- `auth.salt`
- `transactions.enc`

### 8. 服务端测试

启动服务端：

```powershell
node server.js
```

然后访问：

- `http://localhost:3000/health`
- `http://localhost:3000/api/status`

### 9. 单元测试

运行：

```powershell
node test.js
```

预期输出：

```text
测试通过：月度统计与分类统计结果正确
```

## 设计思路

- 客户端继续使用文件存储方式，保持项目简单可运行
- 服务端使用 Node.js 原生 `http` 模块实现 REST 风格接口
- 服务端数据直接落盘为 `server-data.json`，避免引入额外数据库依赖
- 提供 `/api/status`、`/api/upload`、`/api/pull`、`/api/export` 接口，满足同步与查询需求
- 使用内置 `assert` 编写轻量测试，验证月度统计与分类统计结果
- 该实现偏轻量，便于面试现场快速展示同步思路和接口设计
