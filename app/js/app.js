/* ============================================================
 * app.js — UI逻辑：导入 / 列表 / 预览缩放平移 / 导出
 * ============================================================ */
(function () {
  "use strict";

  var state = {
    stations: [],
    kit: null,
    errors: [],
    warnings: [],
    current: -1
  };
  var view = { zoom: 1, x: 0, y: 0 };
  var dispOpts = { showPlan: true, showTable: true, showDim: true };

  /* 三期：设计院图型列表 */
  var SHEET_NAMES = [
    "基站图（一二期示意）", "机房布置平面图", "综合柜立面图", "机房导线路由布置示意图",
    "天馈线系统安装示意图", "工艺要求及施工安全措施说明图（一）", "工艺要求及施工安全措施说明图（二）"
  ];

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $("paper"), wrap = $("canvasWrap");

  /* ---------- 示例数据（与模板一致） ---------- */
  var DEMO_MASTER_HEAD = ["基站名称*","所在地址","经度","纬度","站型","塔型*","塔高(米)*","支承物高度(米)","平台数","本网RAN类型","建设单位","勘察人","勘察日期","备注","图号前缀","项目名称","站点性质","机房位置","综合柜尺寸"];
  var DEMO_MASTER = [
    ["示范站A-城东工业园","XX市XX区城东街道创业大道1号",119.123456,30.123456,"宏站","单管塔",45,"",2,"5G NR","中国电信","张三","2026-09-20","示例数据，可直接修改","2025HACT0001-002-WX-LY","2025年极简站","极简站改造","机房一层","600X600X2000"],
    ["示范站B-滨江路","XX市XX区滨江路88号",119.135,30.118,"宏站","角钢塔",55,"",3,"4G/5G","中国电信","张三","2026-09-20","示例：电信+移动共站，含NB-IoT","","","改造","",""],
    ["示范站C-高新区科技园","XX市XX区科技大道66号",119.142,30.13,"宏站","三管塔",40,"",2,"5G NR","中国电信","李四","2026-09-21","","","","","",""],
    ["示范站D-青山林场","XX市XX区青山镇林场山顶",119.088,30.155,"宏站","拉线塔",30,"",1,"4G/5G","中国电信","李四","2026-09-21","山顶站","","","","",""],
    ["示范站E-车站广场","XX市XX区车站广场西侧",119.15,30.12,"宏站","H杆",25,"",1,"5G NR","中国电信","王五","2026-09-22","","","","","",""],
    ["示范站F-人民医院楼顶","XX市XX区人民路100号住院部",119.147,30.125,"宏站","楼顶抱杆",6,24,3,"4G/5G","中国电信","王五","2026-09-22","楼顶站：支承物高度填楼高","","","CRAN搬迁","无线机房（三层）",""],
    ["示范站G-实验小学楼顶","XX市XX区学苑路2号教学楼",119.128,30.132,"宏站","楼顶平台",8,15,1,"5G NR","中国电信","赵六","2026-09-22","楼顶站","","","改造","",""],
    ["示范站H-湿地公园","XX市XX区湿地公园东门",119.115,30.14,"宏站","美化塔(树形)",35,"",1,"4G/5G","中国电信","赵六","2026-09-23","景观要求站址","","","","",""],
    ["示范站J-水塔站","XX市XX区老水厂院内",119.109,30.148,"宏站","美化塔(水塔)",28,"",1,"5G NR","中国电信","赵六","2026-09-23","旧水塔改建站","","","","",""],
    ["示范站I-预留站","XX市XX区规划路12号",119.152,30.14,"宏站","角钢塔",50,"",3,"5G NR","中国电信","","","示例：无安装明细，仅画塔体","","","","",""]
  ];
  var DEMO_DETAIL_HEAD = ["基站名称*","平台序号*","平台标高(米)*","抱杆编号*","运营商*","RAN制式","天线数量*","方位角(°)","天线型号","备注","天线状态"];
  var DEMO_DETAIL = [
    ["示范站A-城东工业园",1,25,"P1","中国电信","4G",1,60,"RRU5258","","原有"],
    ["示范站A-城东工业园",1,25,"P2","中国联通","5G NR",2,210,"","他网：仅标注名称",""],
    ["示范站A-城东工业园",2,35,"P1","中国电信","5G NR",2,0,"AAU5613","","新增"],
    ["示范站A-城东工业园",2,35,"P2","中国电信","5G NR",2,120,"AAU5613","","新增"],
    ["示范站A-城东工业园",2,35,"P3","中国移动","4G",3,240,"","他网：仅标注名称",""],
    ["示范站B-滨江路",1,30,"P1","中国电信","NB-IoT",1,180,"","","原有"],
    ["示范站B-滨江路",2,40,"P1","中国移动","4G",3,90,"","他网",""],
    ["示范站B-滨江路",3,48,"P1","中国电信","5G NR",2,0,"AAU","","新增"],
    ["示范站B-滨江路",3,48,"P2","中国电信","5G NR",2,120,"AAU","","新增"],
    ["示范站B-滨江路",3,48,"P3","中国电信","5G NR",2,240,"AAU","","新增"],
    ["示范站C-高新区科技园",1,22,"P1","中国电信","4G",3,60,"","","原有"],
    ["示范站C-高新区科技园",1,22,"P2","中国联通","4G",3,200,"","他网",""],
    ["示范站C-高新区科技园",2,30,"P1","中国电信","5G NR",2,0,"AAU","","新增"],
    ["示范站C-高新区科技园",2,30,"P2","中国电信","5G NR",2,120,"AAU","","新增"],
    ["示范站C-高新区科技园",2,30,"P3","中国电信","5G NR",2,240,"AAU","","新增"],
    ["示范站D-青山林场",1,25,"P1","中国电信","5G NR",2,0,"","","新增"],
    ["示范站D-青山林场",1,25,"P2","中国电信","4G",2,180,"","","原有"],
    ["示范站E-车站广场",1,23,"P1","中国电信","5G NR",2,90,"","","新增"],
    ["示范站E-车站广场",1,23,"P2","中国电信","4G",2,270,"","","原有"],
    ["示范站F-人民医院楼顶",1,28,"P1","中国移动","5G NR",2,90,"","他网：楼顶抱杆1",""],
    ["示范站F-人民医院楼顶",2,30,"P1","中国电信","5G NR",2,0,"","楼顶抱杆2","新增"],
    ["示范站F-人民医院楼顶",3,30,"P1","中国电信","4G",1,180,"","楼顶抱杆3","原有"],
    ["示范站G-实验小学楼顶",1,23,"P1","中国电信","5G NR",2,0,"","","新增"],
    ["示范站G-实验小学楼顶",1,23,"P2","中国电信","5G NR",2,120,"","","新增"],
    ["示范站G-实验小学楼顶",1,23,"P3","中国电信","5G NR",2,240,"","","新增"],
    ["示范站H-湿地公园",1,30,"P1","中国电信","5G NR",2,0,"","树冠内隐藏天线","新增"],
    ["示范站H-湿地公园",1,30,"P2","中国电信","4G",2,180,"","","原有"],
    ["示范站J-水塔站",1,22,"P1","中国电信","5G NR",2,0,"","水柜下部抱杆","新增"],
    ["示范站J-水塔站",1,22,"P2","中国电信","4G",2,180,"","","原有"]
  ];

  /* ---------- 状态与列表 ---------- */
  function handleParsed(result, srcName) {
    state.stations = result.stations;
    state.kit = result.kit || null;
    state.errors = result.errors;
    state.warnings = result.warnings;
    state.current = state.stations.length ? 0 : -1;

    renderList();
    renderCheckPanel();

    var ant = 0;
    state.stations.forEach(function (s) { ant += window.DataModel.antennaTotal(s); });
    $("statLine").textContent = "共 " + state.stations.length + " 站 · 天线 " + ant + " 面" + (srcName ? " · " + srcName : "");

    $("btnExportPng").disabled = !state.stations.length;
    $("btnExportAll").disabled = !state.stations.length;
    $("btnExportDxf").disabled = !state.stations.length;
    $("btnExportDxfAll").disabled = !state.stations.length;
    $("btnExportKitDxf").disabled = !state.stations.length;
    $("btnExportKitPng").disabled = !state.stations.length;
    $("sheetSel").disabled = !state.stations.length;

    if (state.stations.length) {
      $("emptyTip").classList.add("hidden");
      $("canvasWrap").classList.remove("hidden");
      select(0);
      setStatus("已载入 " + state.stations.length + " 个基站" + (state.errors.length ? "，存在 " + state.errors.length + " 个错误" : ""));
    } else {
      $("emptyTip").classList.remove("hidden");
      $("canvasWrap").classList.add("hidden");
      setStatus(state.errors[0] || "无有效数据");
    }
  }

  function renderList() {
    var kw = $("searchBox").value.trim().toLowerCase();
    var ul = $("stationList");
    ul.innerHTML = "";
    state.stations.forEach(function (st, i) {
      if (kw && st.name.toLowerCase().indexOf(kw) < 0) return;
      var li = document.createElement("li");
      if (i === state.current) li.className = "active";
      var ant = window.DataModel.antennaTotal(st);
      li.innerHTML =
        '<div class="nm">' + esc(st.name) + (st.warns.length ? ' <span class="warn">△' + st.warns.length + '</span>' : '') + "</div>" +
        '<div class="meta"><span class="tag">' + esc(st.towerLabel) + '</span>' +
        '<span>' + st.height + 'm</span><span>平台' + st.platforms.length + '</span><span>天线' + ant + '面</span></div>';
      li.onclick = function () { select(i); };
      ul.appendChild(li);
    });
  }

  function renderCheckPanel() {
    var panel = $("checkPanel"), ul = $("checkList");
    var items = [];
    state.errors.forEach(function (e) { items.push('<li class="err">✕ ' + esc(e) + "</li>"); });
    state.warnings.forEach(function (w) { items.push("<li>△ " + esc(w) + "</li>"); });
    if (!items.length) { panel.classList.add("hidden"); return; }
    panel.classList.remove("hidden");
    $("checkTitle").textContent = "校验结果（错误 " + state.errors.length + " · 提示 " + state.warnings.length + "）";
    ul.innerHTML = items.join("");
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function select(i) {
    state.current = i;
    var st = state.stations[i];
    if (!st) return;
    var sheetIdx = parseInt($("sheetSel").value, 10) || 0;
    if (sheetIdx > 0) {
      renderSheetPreview(st, sheetIdx - 1);
      setStatus("正在查看（设计院模板）：" + st.name + " · " + SHEET_NAMES[sheetIdx]);
    } else {
      canvas.style.width = ""; canvas.style.height = "";
      window.DrawCore.renderStation(st, canvas, 2, Object.assign({ index: i }, dispOpts));
      setStatus("正在查看：" + st.name + "（" + (i + 1) + "/" + state.stations.length + "）");
    }
    applyView(true);
    renderList();
  }

  /* 三期：设计院图型预览 */
  function renderSheetPreview(st, sheetIdx) {
    try {
      var r = window.SheetKit.buildSheet(st, state.kit, sheetIdx);
      var off = document.createElement("canvas");
      off.width = 2600; off.height = 1835;
      window.SheetKit.renderPreview(r.paper, off);
      canvas.width = off.width; canvas.height = off.height;
      canvas.getContext("2d").drawImage(off, 0, 0);
      /* A3 横向比例显示 */
      canvas.style.width = "880px";
      canvas.style.height = Math.round(880 / (window.SheetKit.consts.SW / window.SheetKit.consts.SH)) + "px";
    } catch (e) {
      setStatus("图型预览失败：" + e.message);
    }
  }

  function setStatus(msg) { $("stLeft").textContent = msg; }

  /* ---------- 缩放平移 ---------- */
  function applyView(reset) {
    if (reset) { view.zoom = fitZoom(); view.x = 0; view.y = 0; }
    canvas.style.transform =
      "translate(calc(-50% + " + view.x + "px), calc(-50% + " + view.y + "px)) scale(" + view.zoom + ")";
  }
  function fitZoom() {
    var r = wrap.getBoundingClientRect();
    var hw = canvas.width / 2, hh = canvas.height / 2;
    return Math.min((r.width - 60) / hw, (r.height - 40) / hh, 1.6);
  }

  wrap.addEventListener("wheel", function (e) {
    e.preventDefault();
    var f = e.deltaY < 0 ? 1.12 : 0.89;
    view.zoom = Math.max(0.25, Math.min(6, view.zoom * f));
    applyView(false);
  }, { passive: false });

  var dragging = false, sx = 0, sy = 0;
  wrap.addEventListener("mousedown", function (e) {
    dragging = true; sx = e.clientX - view.x; sy = e.clientY - view.y;
    wrap.classList.add("dragging");
  });
  window.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    view.x = e.clientX - sx; view.y = e.clientY - sy;
    applyView(false);
  });
  window.addEventListener("mouseup", function () {
    dragging = false; wrap.classList.remove("dragging");
  });
  wrap.addEventListener("dblclick", function () { applyView(true); });

  /* ---------- 导入 ---------- */
  $("btnImport").onclick = function () { $("fileInput").click(); };
  $("fileInput").onchange = function () {
    var f = this.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        handleParsed(window.DataModel.parseWorkbook(wb), f.name);
      } catch (err) {
        setStatus("导入失败：" + err.message);
        alert("导入失败：" + err.message);
      }
      $("fileInput").value = "";
    };
    reader.readAsArrayBuffer(f);
  };

  $("btnLoadDemo").onclick = function () {
    var wb = {
      SheetNames: ["基站主表", "安装明细表"],
      Sheets: {
        "基站主表": XLSX.utils.aoa_to_sheet([DEMO_MASTER_HEAD].concat(DEMO_MASTER)),
        "安装明细表": XLSX.utils.aoa_to_sheet([DEMO_DETAIL_HEAD].concat(DEMO_DETAIL))
      }
    };
    var result = window.DataModel.parseWorkbook(wb);
    handleParsed(result, "内置示例");
  };

  $("searchBox").oninput = renderList;
  $("sheetSel").onchange = function () { if (state.current >= 0) select(state.current); };

  /* ---------- 导出 ---------- */
  function safeName(s) { return String(s).replace(/[\\\/:*?"<>|]/g, "_"); }

  function download(blob, filename) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  function renderToBlob(st, i, scale) {
    return new Promise(function (resolve, reject) {
      var off = document.createElement("canvas");
      try {
        window.DrawCore.renderStation(st, off, scale, Object.assign({ index: i }, dispOpts));
        off.toBlob(function (b) { b ? resolve(b) : reject(new Error("toBlob失败")); }, "image/png");
      } catch (e) { reject(e); }
    });
  }

  $("btnExportPng").onclick = function () {
    var i = state.current, st = state.stations[i];
    if (!st) return;
    renderToBlob(st, i, 3).then(function (b) {
      download(b, safeName(st.name) + "-基站图.png");
      setStatus("已导出：" + st.name + "-基站图.png");
    }).catch(function (e) { setStatus("导出失败：" + e.message); });
  };

  $("btnExportAll").onclick = function () {
    if (!state.stations.length) return;
    if (state.stations.length > 60 && !confirm("共 " + state.stations.length + " 个基站，批量出图可能需要一些时间，继续？")) return;
    var btn = $("btnExportAll");
    btn.disabled = true; btn.textContent = "出图中 0/" + state.stations.length;
    var zip = new JSZip();
    var seq = Promise.resolve();
    state.stations.forEach(function (st, i) {
      seq = seq.then(function () {
        return renderToBlob(st, i, 2.5).then(function (b) {
          zip.file(safeName(st.name) + ".png", b);
          btn.textContent = "出图中 " + (i + 1) + "/" + state.stations.length;
          setStatus("批量出图：" + (i + 1) + "/" + state.stations.length + " " + st.name);
        }).catch(function (e) {
          zip.file(safeName(st.name) + "-错误.txt", "生成失败：" + e.message);
        });
      });
    });
    seq.then(function () {
      return zip.generateAsync({ type: "blob" });
    }).then(function (blob) {
      var d = new Date();
      var ds = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
      download(blob, "基站图纸-" + state.stations.length + "站-" + ds + ".zip");
      setStatus("批量导出完成：" + state.stations.length + " 张图纸已打包");
    }).catch(function (e) {
      setStatus("批量导出失败：" + e.message);
    }).finally(function () {
      btn.disabled = false; btn.textContent = "批量导出全部PNG(zip)";
    });
  };

  /* ---------- 显示开关 ---------- */
  ["chkPlan", "chkTable", "chkDim"].forEach(function (id, i) {
    $(id).onchange = function () {
      dispOpts.showPlan = $("chkPlan").checked;
      dispOpts.showTable = $("chkTable").checked;
      dispOpts.showDim = $("chkDim").checked;
      if (state.current >= 0) select(state.current);
    };
  });

  /* ---------- 导出：DXF ---------- */
  function buildDxf(st, i, opts) {
    var off = document.createElement("canvas");
    var paper = window.DrawCore.renderStation(st, off, 1, Object.assign({ index: i }, opts));
    return window.Dxf.build(paper, st, Object.assign({ index: i }, opts));
  }

  $("btnExportDxf").onclick = function () {
    var i = state.current, st = state.stations[i];
    if (!st) return;
    try {
      var dxf = buildDxf(st, i, dispOpts);
      download(new Blob([dxf], { type: "application/dxf" }), safeName(st.name) + "-基站图.dxf");
      setStatus("已导出 DXF：" + st.name + "-基站图.dxf（1:1 毫米制）");
    } catch (e) { setStatus("DXF 导出失败：" + e.message); }
  };

  $("btnExportDxfAll").onclick = function () {
    if (!state.stations.length) return;
    if (state.stations.length > 100 && !confirm("共 " + state.stations.length + " 个基站，批量生成 DXF 需要一些时间，继续？")) return;
    var btn = $("btnExportDxfAll");
    btn.disabled = true; btn.textContent = "DXF出图中 0/" + state.stations.length;
    var zip = new JSZip();
    var seq = Promise.resolve();
    state.stations.forEach(function (st, i) {
      seq = seq.then(function () {
        try {
          zip.file(safeName(st.name) + ".dxf", buildDxf(st, i, dispOpts));
        } catch (e) {
          zip.file(safeName(st.name) + "-错误.txt", "DXF 生成失败：" + e.message);
        }
        btn.textContent = "导出DXF " + (i + 1) + "/" + state.stations.length;
        setStatus("DXF 批量出图：" + (i + 1) + "/" + state.stations.length + " " + st.name);
      });
    });
    seq.then(function () { return zip.generateAsync({ type: "blob" }); })
      .then(function (blob) {
        var d = new Date();
        var ds = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
        download(blob, "基站DXF图纸-" + state.stations.length + "站-" + ds + ".zip");
        setStatus("DXF 批量导出完成：" + state.stations.length + " 张图纸已打包");
      })
      .catch(function (e) { setStatus("DXF 批量导出失败：" + e.message); })
      .finally(function () { btn.disabled = false; btn.textContent = "批量导出DXF(zip)"; });
  };

  /* ---------- 三期：设计院整套图纸导出 ---------- */
  function buildKitSheets(st, i) {
    return window.SheetKit.buildAll(st, i, state.kit);
  }

  $("btnExportKitDxf").onclick = function () {
    if (!state.stations.length) return;
    var btn = $("btnExportKitDxf");
    btn.disabled = true; btn.textContent = "整套出图中 0/" + state.stations.length;
    var zip = new JSZip();
    var seq = Promise.resolve();
    state.stations.forEach(function (st, i) {
      seq = seq.then(function () {
        try {
          var folder = zip.folder(safeName(st.name));
          buildKitSheets(st, i).forEach(function (s) {
            folder.file(pad2(s.seq) + "-" + s.name + ".dxf", s.dxf);
          });
        } catch (e) {
          zip.file(safeName(st.name) + "-错误.txt", "整套生成失败：" + e.message);
        }
        btn.textContent = "整套出图 " + (i + 1) + "/" + state.stations.length;
        setStatus("设计院整套 DXF：" + (i + 1) + "/" + state.stations.length + " " + st.name);
      });
    });
    seq.then(function () { return zip.generateAsync({ type: "blob" }); })
      .then(function (blob) {
        var d = new Date();
        var ds = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
        download(blob, "设计院整套DXF-" + state.stations.length + "站-" + ds + ".zip");
        setStatus("整套 DXF 导出完成：每站 6 张图纸已按站打包");
      })
      .catch(function (e) { setStatus("整套 DXF 导出失败：" + e.message); })
      .finally(function () { btn.disabled = false; btn.textContent = "整套设计院DXF(zip)"; });
  };

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function renderSheetToBlob(st, sheetIdx, scale) {
    return new Promise(function (resolve, reject) {
      try {
        var r = window.SheetKit.buildSheet(st, state.kit, sheetIdx);
        var off = document.createElement("canvas");
        off.width = Math.round(2600 * (scale || 1));
        off.height = Math.round(1835 * (scale || 1));
        window.SheetKit.renderPreview(r.paper, off);
        off.toBlob(function (b) { b ? resolve({ blob: b, name: r.name }) : reject(new Error("toBlob失败")); }, "image/png");
      } catch (e) { reject(e); }
    });
  }

  $("btnExportKitPng").onclick = function () {
    if (!state.stations.length) return;
    var btn = $("btnExportKitPng");
    btn.disabled = true;
    var total = state.stations.length * 6, done = 0;
    btn.textContent = "PNG出图中 0/" + total;
    var zip = new JSZip();
    var seq = Promise.resolve();
    state.stations.forEach(function (st, i) {
      var folder = zip.folder(safeName(st.name));
      for (var s = 0; s < 6; s++) {
        (function (sheetIdx) {
          seq = seq.then(function () {
            return renderSheetToBlob(st, sheetIdx, 1).then(function (r) {
              folder.file(pad2(sheetIdx + 1) + "-" + r.name + ".png", r.blob);
            }).catch(function (e) {
              folder.file(pad2(sheetIdx + 1) + "-错误.txt", "生成失败：" + e.message);
            }).then(function () {
              done++;
              btn.textContent = "PNG出图 " + done + "/" + total;
              if (done % 6 === 0) setStatus("整套 PNG：" + st.name + " 完成");
            });
          });
        })(s);
      }
    });
    seq.then(function () { return zip.generateAsync({ type: "blob" }); })
      .then(function (blob) {
        var d = new Date();
        var ds = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
        download(blob, "设计院整套PNG-" + state.stations.length + "站-" + ds + ".zip");
        setStatus("整套 PNG 导出完成：每站 6 张图纸");
      })
      .catch(function (e) { setStatus("整套 PNG 导出失败：" + e.message); })
      .finally(function () { btn.disabled = false; btn.textContent = "整套设计院PNG(zip)"; });
  };

  /* ---------- 弹窗 ---------- */
  $("btnHelp").onclick = function () { $("helpModal").classList.remove("hidden"); };
  document.querySelectorAll("[data-close]").forEach(function (b) {
    b.onclick = function () { $(b.getAttribute("data-close")).classList.add("hidden"); };
  });
  document.querySelectorAll(".modal").forEach(function (m) {
    m.addEventListener("click", function (e) { if (e.target === m) m.classList.add("hidden"); });
  });

  /* 启动 */
  setStatus("就绪 · 建议先点「载入示例数据」体验");
})();
