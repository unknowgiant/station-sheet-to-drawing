# 基站表生图

纯前端 Web 应用：导入基站工程 Excel 数据，批量生成机房布置图、导线路由图、天馈线系统图等设计院风格图纸，支持 PNG / DXF 导出，全程本地离线运行。

- 双击 `app/index.html` 即可使用（当前为 v3.0）
- `app/js/`：绘图核心（draw-core）、DXF 生成（dxf）、图纸模板（sheet-templates）、铁塔模板（tower-templates）
- `基站数据模板.xlsx`：数据录入模板
- `设计院图纸模板数据总结.html`：真实站点模板数据调研资料

依赖：无外部服务，jszip、SheetJS 已内置于 `app/js/libs/`。

> AI生成
