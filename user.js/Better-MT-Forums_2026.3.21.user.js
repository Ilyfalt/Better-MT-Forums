// ==UserScript==
// @name         Better MT Forums
// @namespace    https://github.com/Ilyfalt/Better-MT-Forums
// @version      2026-03-21
// @description  让MT论坛更好!
// @author       青春向上
// @author       Xtne (Ilyfalt)
// @match        *://bbs.binmt.cc/forum-*.html*
// @match        *://bbs.binmt.cc/forum.php?*fid=*
// @match        *://bbs.binmt.cc/forum.php?*mod=guide*
// @match        *://bbs.binmt.cc/forum.php?*mod=post*
// @match        *://bbs.binmt.cc/forum.php?*tid=*
// @match        *://bbs.binmt.cc/*thread-*.html*
// @match        *://bbs.binmt.cc/search.php?*searchid=*
// @match        *://bbs.binmt.cc/home.php?*do=thread*
// @match        *://bbs.binmt.cc/home.php?*do=friend*
// @match        *://bbs.binmt.cc/home.php?*do=favorite*
// @match        *://bbs.binmt.cc/home.php?*do=following*
// @match        *://bbs.binmt.cc/home.php?*do=follower*
// @match        *://bbs.binmt.cc/home.php?*do=wall*
// @match        *://bbs.binmt.cc/home.php?*do=notice*
// @match        *://bbs.binmt.cc/home.php?*view=visitor*
// @match        *://bbs.binmt.cc/home.php?*view=trace*
// @match        *://bbs.binmt.cc/home.php?*ac=friend*
// @match        *://bbs.binmt.cc/home.php?*ac=credit*
// @match        *://bbs.binmt.cc/home.php?*view=blacklist*
// @icon         https://bbs.binmt.cc/favicon.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // CONFIG
    const KEY = {
        QUICK_INPUT: 'QuickInput',
        MENU_ITEMS: 'MenuItems',
        POST_CACHE: 'Post_Cache',
    };

    // 自动下一页配置
    const PAGE_CFG = {
        postList:    '.comiis_forumlist>ul',
        commentList: '.comiis_postlist',
        friendList:  '.comiis_userlist01',
        wallList:    '.comiis_plli',
        creditList:  '.comiis_credits_log>ul',
        noticeList:  '.comiis_notice_list>ul',
        favoriteList:'.comiis_mysclist>ul',
        unknownPage: 999,
        loadThreshold: 1500,
        requestTimeout: 3000,
    };

    // 菜单默认配置（isShow 控制初始是否可见）
    const DEFAULT_MENU = [
        { name: '↶',   isShow: true  }, { name: '↷',     isShow: true  },
        { name: '选择', isShow: true  }, { name: '预览',   isShow: true  },
        { name: '插图', isShow: true  }, { name: '粗体',   isShow: true  },
        { name: '删线', isShow: true  }, { name: '斜体',   isShow: true  },
        { name: '下划', isShow: true  }, { name: '链接',   isShow: true  },
        { name: '分割', isShow: true  }, { name: '代码',   isShow: true  },
        { name: '颜色', isShow: true  }, { name: '字号',   isShow: true  },
        { name: '图片', isShow: true  }, { name: '隐藏',   isShow: true  },
        { name: '更多', isShow: true  },
        // 点击"更多"后可见
        { name: '常用语',  isShow: false }, { name: '彩虹字体', isShow: false },
        { name: '对齐',    isShow: false }, { name: '邮箱',     isShow: false },
        { name: '引用',    isShow: false }, { name: '媒体',     isShow: false },
        { name: 'QQ',      isShow: false }, { name: '背景色',   isShow: false },
        { name: 'Eruda',   isShow: false }, { name: '移除标签', isShow: false },
        { name: '阻止离开',isShow: false }, { name: '原布局',   isShow: false },
        { name: '帖子缓存',isShow: false },
    ];

    const DEFAULT_QUICK_INPUT = [
        { name: '添加', value: 'add' },
        { name: '删除', value: 'delete' },
    ];

    // STYLES
    function injectStyles() {
        const css = `
/* 工具栏 */
.mt-bar{display:flex;overflow-x:auto;overflow-y:hidden;padding:4px 6px;background:#fff;
    border:1px solid #e0e0e0;border-radius:4px;gap:4px;margin-top:4px;scrollbar-width:none}
.mt-bar::-webkit-scrollbar{display:none}

/* Chip 按钮 */
.mt-chip{display:inline-flex;align-items:center;justify-content:center;padding:0 10px;
    height:28px;min-width:28px;font-size:12px;font-family:'Roboto',system-ui,sans-serif;
    font-weight:500;color:#424242;background:transparent;border:1px solid #e0e0e0;
    border-radius:14px;cursor:pointer;white-space:nowrap;outline:none;text-decoration:none;
    user-select:none;transition:background .12s,border-color .12s;line-height:1}
.mt-chip:hover{background:#f5f5f5;border-color:#bdbdbd}
.mt-chip:active{background:#e0e0e0}

/* 遮罩层 */
.mt-overlay{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:9998;
    display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}

/* 对话框卡片 */
.mt-dialog{background:#fff;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.18);
    width:320px;max-height:82vh;display:flex;flex-direction:column;overflow:hidden;
    font-family:'Roboto',system-ui,sans-serif}
.mt-dialog-wide{width:480px;max-width:96vw}
.mt-dialog-title{padding:20px 20px 12px;font-size:16px;font-weight:500;color:#1c1b1f;flex-shrink:0}
.mt-dialog-body{flex:1;overflow-y:auto;scrollbar-width:thin}
.mt-dialog-actions{display:flex;justify-content:flex-end;gap:4px;padding:12px 16px;flex-shrink:0}

/* 列表项 */
.mt-list-item{display:flex;align-items:center;padding:10px 16px;cursor:pointer;
    transition:background .1s;font-size:14px;color:#212121;gap:10px}
.mt-list-item:hover{background:#f5f5f5}
.mt-list-item.mt-selected{background:#f0f0f0;color:#212121}
.mt-list-item input[type=radio]{accent-color:#212121;flex-shrink:0}

/* 文本按钮 */
.mt-btn-text{background:none;border:none;padding:8px 12px;border-radius:20px;cursor:pointer;
    font-size:14px;font-weight:500;color:#212121;transition:background .12s;font-family:inherit}
.mt-btn-text:hover{background:#f0f0f0}

/* 填充按钮 */
.mt-btn-filled{background:#212121;color:#fff;border:none;padding:8px 20px;border-radius:20px;
    cursor:pointer;font-size:14px;font-weight:500;transition:background .12s;font-family:inherit}
.mt-btn-filled:hover{background:#424242}

/* 输入框 */
.mt-input{width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:4px;
    font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s}
.mt-input:focus{border-color:#212121}

/* 可编辑 div */
.mt-editable{min-height:80px;padding:10px 12px;border:1px solid #e0e0e0;border-radius:4px;
    outline:none;font-size:14px;word-break:break-all;transition:border-color .15s}
.mt-editable:focus{border-color:#212121}

/* Range 滑块 */
.mt-range{width:100%;accent-color:#212121;cursor:pointer}

/* 分割线 */
.mt-divider{border:none;border-top:1px solid #f0f0f0;margin:0}

/* 自动下一页标记 */
.mt-page-mark{text-align:center;padding:8px 0;margin:6px 0;font-size:13px;color:#757575;list-style:none}
.mt-page-link{color:#424242;cursor:pointer}
.mt-page-link:hover{text-decoration:underline}
.mt-load-prev{color:#424242;cursor:pointer;margin-left:6px}
.mt-load-prev:hover{text-decoration:underline}
.mt-retry-btn{color:#424242;cursor:pointer;margin-left:6px}
.mt-retry-btn:hover{text-decoration:underline}

/* 借鉴一下 & share */
.mt-ref-link,.mt-share-link{color:#424242;cursor:pointer;font-size:13px;
    font-weight:normal;position:relative;z-index:1}
.mt-ref-link{margin-left:8px}
.mt-share-link{margin-left:8px}
.mt-ref-link:hover,.mt-share-link:hover{text-decoration:underline}

/* 代码块复制按钮（伪元素） */
.comiis_blockcode{position:relative !important}
.comiis_blockcode::before{content:"复制";position:absolute !important;right:10px !important;
    top:1em !important;transform:translateY(-50%) !important;color:#212121 !important;
    font-size:13px !important;font-weight:500 !important;pointer-events:auto !important;cursor:pointer}
`;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // UTILS

    // localStorage 读写
    const store = {
        get(key, def) {
            try { return JSON.parse(localStorage.getItem(key)) ?? this._init(key, def); }
            catch { return this._init(key, def); }
        },
        set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
        _init(key, def) { this.set(key, def); return def; },
    };

    // HSL/RGB 互转
    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
        const f = t => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q-p)*6*t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q-p)*(2/3-t)*6;
            return p;
        };
        return [f(h+1/3), f(h), f(h-1/3)].map(v => Math.round(v * 255));
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r,g,b), min = Math.min(r,g,b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g-b)/d + (g < b ? 6 : 0); break;
                case g: h = (b-r)/d + 2; break;
                case b: h = (r-g)/d + 4; break;
            }
            h /= 6;
        }
        return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
    }

    // 复制文本（兼容旧浏览器）
    function copyText(text) {
        const ta = document.createElement('textarea');
        Object.assign(ta.style, { position:'absolute', left:'-9999px', top:'-9999px' });
        ta.readOnly = true;
        ta.value = text.replace(/\xA0/g, ' ');
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        try { document.execCommand('copy'); } catch(e) {}
        ta.remove();
    }

    // 创建遮罩+对话框（基础工厂）
    function makeOverlay(dialogCls = '') {
        const overlay = document.createElement('div');
        overlay.className = 'mt-overlay';
        const dlg = document.createElement('div');
        dlg.className = `mt-dialog ${dialogCls}`;
        overlay.appendChild(dlg);
        dlg.addEventListener('click', e => e.stopPropagation());
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
        return { overlay, dlg };
    }

    // DIALOG COMPONENTS

    // 单选列表对话框
    function selectDia(options, callback, title = '请选择') {
        const name = `r${Date.now()}`;
        const { overlay, dlg } = makeOverlay();
        dlg.innerHTML = `
            <div class="mt-dialog-title">${title}</div>
            <hr class="mt-divider">
            <div class="mt-dialog-body">
                ${options.map((opt, i) => `
                <label class="mt-list-item${i===0?' mt-selected':''}">
                    <input type="radio" name="${name}" value="${opt.value ?? i}" ${i===0?'checked':''}>
                    <span ${opt.css ? `style="${opt.css}"` : ''}>${opt.name}</span>
                </label>`).join('')}
            </div>
            <hr class="mt-divider">
            <div class="mt-dialog-actions">
                <button class="mt-btn-text js-cancel">取消</button>
                <button class="mt-btn-filled js-ok">确定</button>
            </div>`;

        // 点击行自动选中对应 radio
        dlg.querySelectorAll('.mt-list-item').forEach(row => {
            row.addEventListener('click', () => {
                dlg.querySelectorAll('.mt-list-item').forEach(r => r.classList.remove('mt-selected'));
                row.classList.add('mt-selected');
                row.querySelector('input').checked = true;
            });
        });

        dlg.querySelector('.js-cancel').onclick = () => overlay.remove();
        dlg.querySelector('.js-ok').onclick = () => {
            const checked = dlg.querySelector(`input[name="${name}"]:checked`);
            if (checked) callback(checked.value);
            overlay.remove();
        };
    }

    // 多输入框对话框
    function inputDia(configs, callback) {
        const { overlay, dlg } = makeOverlay();
        dlg.innerHTML = `
            <div class="mt-dialog-title">输入</div>
            <hr class="mt-divider">
            <div class="mt-dialog-body" style="padding:8px 0">
                ${configs.map(c => `
                <div style="padding:8px 16px">
                    <div style="font-size:13px;color:#757575;margin-bottom:6px">${c.placeholder||'请输入'}</div>
                    <div class="mt-editable" contenteditable="true">${c.value||''}</div>
                </div>`).join('')}
            </div>
            <hr class="mt-divider">
            <div class="mt-dialog-actions">
                <button class="mt-btn-text js-cancel">取消</button>
                <button class="mt-btn-filled js-ok">确定</button>
            </div>`;

        dlg.querySelector('.js-cancel').onclick = () => overlay.remove();
        dlg.querySelector('.js-ok').onclick = () => {
            const vals = [...dlg.querySelectorAll('[contenteditable]')].map(el => el.textContent);
            callback(...vals);
            overlay.remove();
        };
    }

    // 预览/复制 对话框（isHtml=true 渲染 HTML，callback 存在时变为输入确认模式）
    function previewDia(content, { title = '预览', isHtml = false, callback = null } = {}) {
        const escape = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const body = isHtml ? content : `<pre style="white-space:pre-wrap;word-break:break-all;font-family:inherit;font-size:14px;margin:0">${escape(typeof content === 'object' ? JSON.stringify(content) : content)}</pre>`;
        const isInput = typeof callback === 'function';

        const { overlay, dlg } = makeOverlay('mt-dialog-wide');
        dlg.innerHTML = `
            <div class="mt-dialog-title">${title}</div>
            <hr class="mt-divider">
            <div class="mt-dialog-body js-body" style="padding:16px;min-height:80px;max-height:55vh;overflow-y:auto;
                ${isInput ? 'outline:none;cursor:text' : ''}"
                ${isInput ? 'contenteditable="true"' : ''}>${body}</div>
            <hr class="mt-divider">
            <div class="mt-dialog-actions">
                <button class="mt-btn-text js-cancel">取消</button>
                <button class="mt-btn-filled js-ok">${isInput ? '确定' : '复制'}</button>
            </div>`;

        dlg.querySelector('.js-cancel').onclick = () => overlay.remove();
        dlg.querySelector('.js-ok').onclick = () => {
            if (isInput) callback(dlg.querySelector('.js-body').textContent);
            else copyText(typeof content === 'string' ? content : JSON.stringify(content));
            overlay.remove();
        };
    }

    // 取色器对话框
    function showColorPicker(callback) {
        const uid = `cp${Date.now()}`;
        const { overlay, dlg } = makeOverlay('mt-dialog-wide');
        dlg.innerHTML = `
            <div class="mt-dialog-title">选择颜色</div>
            <hr class="mt-divider">
            <div class="mt-dialog-body" style="padding:16px">
                <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:14px">
                    <div id="${uid}-hue" style="width:28px;height:220px;border-radius:14px;flex-shrink:0;
                        position:relative;cursor:pointer;background:linear-gradient(to top,
                        hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),
                        hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))">
                        <div id="${uid}-hh" style="width:38px;height:10px;border-radius:5px;background:#fff;
                            border:2px solid #424242;position:absolute;left:-5px;top:0;pointer-events:none"></div>
                    </div>
                    <div style="flex:1;position:relative">
                        <canvas id="${uid}-panel" class="mt-cp-panel" width="220" height="220" style="cursor:crosshair;border-radius:6px;border:1px solid #e0e0e0;width:100%;display:block"></canvas>
                        <div id="${uid}-ch" style="width:16px;height:16px;border-radius:50%;border:2px solid #fff;
                            box-shadow:0 0 0 1px #000;position:absolute;top:0;left:0;pointer-events:none"></div>
                    </div>
                </div>
                <div style="margin-bottom:10px">
                    <div style="font-size:12px;color:#757575;margin-bottom:4px">Hex</div>
                    <input id="${uid}-hex" class="mt-input" value="#000000">
                </div>
                ${['R','G','B'].map((c,i) => `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                    <span style="font-size:12px;color:#757575;width:14px">${c}</span>
                    <input type="range" id="${uid}-${c.toLowerCase()}" class="mt-range" min="0" max="255" value="0">
                    <span id="${uid}-${c.toLowerCase()}v" style="font-size:12px;color:#424242;width:28px;text-align:right">0</span>
                </div>`).join('')}
            </div>
            <hr class="mt-divider">
            <div class="mt-dialog-actions">
                <button class="mt-btn-text js-cancel">取消</button>
                <button class="mt-btn-filled js-ok">确定</button>
            </div>`;

        const hueEl   = dlg.querySelector(`#${uid}-hue`);
        const hueHnd  = dlg.querySelector(`#${uid}-hh`);
        const canvas  = dlg.querySelector(`#${uid}-panel`);
        const cpHnd   = dlg.querySelector(`#${uid}-ch`);
        const hexInput= dlg.querySelector(`#${uid}-hex`);
        const sliders = ['r','g','b'].map(c => dlg.querySelector(`#${uid}-${c}`));
        const vals    = ['r','g','b'].map(c => dlg.querySelector(`#${uid}-${c}v`));

        let h = 0, s = 0, l = 0, savedHex = hexInput.value;

        const drawPanel = () => {
            const ctx = canvas.getContext('2d');
            const W = canvas.width, H = canvas.height;
            const img = ctx.createImageData(W, H);
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                const [r,g,b] = hslToRgb(h, (x/W)*100, ((H-y)/H)*100);
                const i = (y*W+x)*4;
                img.data[i]=r; img.data[i+1]=g; img.data[i+2]=b; img.data[i+3]=255;
            }
            ctx.putImageData(img, 0, 0);
        };
        const setHuePos = () => {
            hueHnd.style.top = `${hueEl.offsetHeight - (h/360)*hueEl.offsetHeight - 5}px`;
        };
        const setCpPos = () => {
            const W = canvas.offsetWidth, H = canvas.offsetHeight;
            cpHnd.style.left = `${(s/100)*W-8}px`;
            cpHnd.style.top  = `${H-(l/100)*H-8}px`;
        };
        const syncSliders = (r,g,b) => {
            sliders.forEach((sl,i) => sl.value = [r,g,b][i]);
            vals.forEach((v,i) => v.textContent = [r,g,b][i]);
        };
        const syncHex = (r,g,b) => {
            hexInput.value = `#${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
        };
        const refresh = () => {
            const [r,g,b] = hslToRgb(h,s,l);
            syncSliders(r,g,b); syncHex(r,g,b); drawPanel(); setCpPos();
        };

        // 通用拖拽处理
        const makeDrag = onMove => {
            let on = false;
            const start = e => { on = true; onMove(e); };
            const move  = e => { if (!on) return; e.preventDefault(); onMove(e); };
            const end   = () => on = false;
            return { start, move, end };
        };
        const clientPos = e => e.touches ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];

        const hueDrag = makeDrag(e => {
            const r = hueEl.getBoundingClientRect(), [,cy] = clientPos(e);
            h = Math.max(0, Math.min(360, 360-(cy-r.top)/r.height*360));
            setHuePos(); refresh();
        });
        const cpDrag = makeDrag(e => {
            const r = canvas.getBoundingClientRect(), [cx,cy] = clientPos(e);
            s = Math.max(0, Math.min(100, (cx-r.left)/r.width*100));
            l = Math.max(0, Math.min(100, (r.height-(cy-r.top))/r.height*100));
            setCpPos(); refresh();
        });

        ['mousedown','touchstart'].forEach(ev => {
            hueEl.addEventListener(ev,  hueDrag.start, { passive: false });
            canvas.addEventListener(ev, cpDrag.start,  { passive: false });
        });
        ['mousemove','touchmove'].forEach(ev => {
            document.addEventListener(ev, hueDrag.move, { passive: false });
            document.addEventListener(ev, cpDrag.move,  { passive: false });
        });
        ['mouseup','touchend'].forEach(ev => {
            document.addEventListener(ev, hueDrag.end);
            document.addEventListener(ev, cpDrag.end);
        });

        sliders.forEach(sl => sl.addEventListener('input', () => {
            const [r,g,b] = sliders.map(s => +s.value);
            [h,s,l] = rgbToHsl(r,g,b);
            vals.forEach((v,i)=>v.textContent=[r,g,b][i]);
            syncHex(r,g,b); setHuePos(); drawPanel(); setCpPos();
        }));

        let savedHexVal = hexInput.value;
        hexInput.addEventListener('focus', () => savedHexVal = hexInput.value);
        hexInput.addEventListener('input', e => {
            let v = e.target.value.replace(/[^#0-9a-fA-F]/g,'');
            if (v.indexOf('#') > 0) v = '#' + v.replace(/#/g,'');
            e.target.value = v.startsWith('#') ? v.slice(0,7) : v.slice(0,6);
            const hex = v.replace(/^#/,'');
            if (hex.length === 6) {
                const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
                [h,s,l] = rgbToHsl(r,g,b);
                syncSliders(r,g,b); setHuePos(); drawPanel(); setCpPos();
            }
        });
        hexInput.addEventListener('blur', () => {
            if (!/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) hexInput.value = savedHexVal;
        });

        dlg.querySelector('.js-cancel').onclick = () => overlay.remove();
        dlg.querySelector('.js-ok').onclick = () => { callback(hexInput.value); overlay.remove(); };

        requestAnimationFrame(() => { setHuePos(); drawPanel(); setCpPos(); });
    }

    // BBCODE -> HTML 预览
    function replaceText(text) {
        function escapeHtml(str) {
            if (typeof str !== 'string') return str;
            return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
        }

        // 提取 [code] 块，用占位符替换
        const codeBlocks = [];
        let processed = escapeHtml(text);
        processed = processed.replace(/\[code\]([\s\S]*?)\[\/code\]/g, (_, c) => {
            const html = `<div class="comiis_blockcode comiis_bodybg b_ok f_b"><div class="bg_f b_l"><ol>${
                c.split('\n').map(line => `<li style="list-style:auto">${line}</li>`).join('')
            }</ol></div></div>`;
            codeBlocks.push(html);
            return `__CODE_${codeBlocks.length-1}__`;
        });

        // [attachimg]
        processed = processed.replace(/\[attachimg\]([\s\S]+?)\[\/attachimg\]/g, (_, id) => {
            const img = document.getElementById(`aimg_${id}`);
            const src = img?.getAttribute('src') || '', title = img?.getAttribute('title') || (src ? '' : '该图片不存在');
            return `<span class="comiis_postimg vm"><img loading="lazy" id="aimg_${id}" src="${src}" alt="${title}" title="${title}"></span>`;
        });

        // [url]
        processed = processed.replace(/\[url(?:=([\s\S]*?))?\]([\s\S]*?)\[\/url\]/g, (_, u, t) => {
            const href = (u||t).trim(), label = u ? t.trim() : href;
            return `<a style='color:#424242' href="${href}" target="_blank">${label}</a>`;
        });

        // [color] [backcolor] [size]
        processed = processed.replace(/\[color=([\s\S]*?)\]([\s\S]*?)\[\/color\]/g, (_,c,t) => `<font color='${c}'>${t}</font>`);
        processed = processed.replace(/\[backcolor=([\s\S]*?)\]([\s\S]*?)\[\/backcolor\]/g, (_,c,t) => `<font style="background-color:${c}">${t}</font>`);
        processed = processed.replace(/\[size=([\s\S]*?)\]([\s\S]*?)\[\/size\]/g, (_,s,t) => `<font size="${s}">${t}</font>`);

        // [img]
        processed = processed.replace(/\[img(?:=([\s\S]+?))?\]([\s\S]*?)\[\/img\]/g, (_, sz, src) => {
            let w = '100%', h = '';
            if (sz) { const a = sz.split(','); w = a[0]||'100%'; h = a[1]||''; }
            return `<img loading="lazy" src="${src}" border="0" alt="" width="${w}" height="${h}" crossoriginNew="anonymous">`;
        });

        // [hide] [hide=x,n]
        processed = processed.replace(/\[hide\]([\s\S]*?)\[\/hide\]/g, (_,c) =>
            `<div class="comiis_quote bg_h f_c"><h2 class="f_a">本帖隐藏的内容: </h2>${c}</div>`);
        processed = processed.replace(/\[hide=[\s\S]*?\]([\s\S]*?)\[\/hide\]/g, (m) => {
            const r = m.match(/\[hide=([\s\S]*?)\]([\s\S]*?)\[\/hide\]/);
            const n = r ? (r[1].split(',')[1]||'') : '';
            return `<div class="comiis_quote bg_h f_c">以下内容需要积分高于 ${n} 才可浏览</div>`;
        });

        // [quote] [free] [b] [u] [i] [s]
        processed = processed.replace(/\[quote\]([\s\S]*?)\[\/quote\]/g, (_,c) =>
            `<div class="comiis_quote bg_h b_dashed f_c"><blockquote><font>回复</font> ${c}</blockquote></div>`);
        processed = processed.replace(/\[free\]([\s\S]*?)\[\/free\]/g, (_,c) =>
            `<div class="comiis_quote bg_h f_c"><blockquote>${c}</blockquote></div>`);
        processed = processed.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, (_,c) => `<strong>${c}</strong>`);
        processed = processed.replace(/\[u\]([\s\S]*?)\[\/u\]/g,  (_,c) => `<u>${c}</u>`);
        processed = processed.replace(/\[i\]([\s\S]*?)\[\/i\]/g,  (_,c) => `<i>${c}</i>`);
        processed = processed.replace(/\[s\]([\s\S]*?)\[\/s\]/g,  (_,c) => `<strike>${c}</strike>`);

        // 表情
        const smilies = processed.match(/\[([\s\S]+?)\]/g);
        if (smilies) smilies.forEach(item => {
            const src = getSmileyUrl(item);
            if (src) processed = processed.replace(item, `<img loading="lazy" style='max-height:22px' src="${src}" border="0" alt="" smilieid="">`);
        });

        // [media]
        processed = processed.replace(/\[media(?:=[\s\S]*?)?\]([\s\S]*?)\[\/media\]/g, (_, url) => {
            url = url.trim().replace(/[<>"]/g, '');
            let html = '';
            if (url.includes('bilibili.com') || url.includes('b23.tv')) {
                const m = url.match(/BV(\w+)|av(\d+)/i);
                if (m) {
                    const src = m[1] ? `https://player.bilibili.com/player.html?bvid=BV${m[1]}`
                                     : `https://player.bilibili.com/player.html?aid=${m[2]}`;
                    html = `<iframe src="${src}" width="100%" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`;
                }
            } else if (url.includes('youku.com')) {
                const m = url.split('?')[0].match(/id[_/]([a-zA-Z0-9_\-=]+)(?:\.html)?/i);
                if (m) html = `<iframe src="https://player.youku.com/embed/${m[1]}" width="100%" frameborder="0" allowfullscreen="true"></iframe>`;
            } else if (url.includes('v.qq.com')) {
                const m = url.match(/vid=([a-zA-Z0-9_\-]+)|\/([a-zA-Z0-9_\-]+)\.html/i);
                const vid = m ? (m[1]||m[2]) : '';
                if (vid) html = `<iframe src="https://v.qq.com/txp/iframe/player.html?vid=${vid}" width="100%" frameborder="0" allowfullscreen="true"></iframe>`;
            } else if (/\.(mp4|webm|flv)$/i.test(url)) {
                const ext = url.match(/\.(\w+)$/i)[1].toLowerCase();
                html = `<video width="100%" controls preload="none"><source src="${url}" type="video/${ext}">您的浏览器不支持HTML5视频</video>`;
            } else if (/\.(mp3|wav|ogg)$/i.test(url)) {
                const ext = url.match(/\.(\w+)$/i)[1].toLowerCase();
                html = `<audio width="100%" controls preload="none"><source src="${url}" type="audio/${ext}">您的浏览器不支持HTML5音频</audio>`;
            }
            return html || `<a style='color:#424242' href="${url}" target="_blank">${url}</a>`;
        });

        // [email] [align] [qq]
        processed = processed.replace(/\[email(?:=([\s\S]*?))?\]([\s\S]*?)\[\/email\]/g, (_, e, t) => {
            const addr=(e||t).trim(), label=e?t.trim():addr;
            return `<a style='color:#424242' href="mailto:${addr}">${label}</a>`;
        });
        processed = processed.replace(/\[align=([\s\S]*?)\]([\s\S]+?)\[\/align\]/g, (_,a,c) => `<div align="${a}">${c}</div>`);
        processed = processed.replace(/\[qq\]([\s\S]*?)\[\/qq\]/g, (_,q) =>
            `<a href="http://wpa.qq.com/msgrd?v=3&uin=${q}&site=[Discuz!]&from=discuz&menu=yes" target="_blank"><img loading="lazy" src="static/image/common/qq_big.gif" border="0"></a>`);

        // 表格
        processed = processed.replace(/\[td\]([\s\S]*?)\[\/td\]/g, (_,c) => `<td style='border:1px solid #E3EDF5'>${c}</td>`);
        processed = processed.replace(/\[tr\]([\s\S]*?)\[\/tr\]/g, (_,c) => `<tr>${c}</tr>`);
        processed = processed.replace(/\[table\]([\s\S]*?)\[\/table\]/g, (_,c) => `<table style='width:100%'>${c.replace(/\n/g,'')}</table>`);

        // [list]
        processed = processed.replace(/\[list(?:=([\s\S]*?))?\]([\s\S]+?)\[\/list\]/g, (_, model='', content) => {
            const typeMap = { a:'lower-alpha', A:'upper-alpha' };
            const style = typeMap[model] || (/[0-9]/.test(model) ? 'decimal' : model ? 'none' : 'disc');
            let items = content.split('[*]');
            if (items[0].trim() === '') items = items.slice(1);
            return `<ol type="${model||''}">${items.map(l => `<li style="list-style-type:${style}">${l}</li>`).join('')}</ol>`;
        });

        // 最终替换
        processed = processed.replace(/\[hr\]/g, '<hr class="l">').replace(/\[\*\]/g, '<li></li>').replace(/\n/g, '<br>');

        // 还原 code 块
        codeBlocks.forEach((html, i) => { processed = processed.replace(`__CODE_${i}__`, html); });
        return processed;
    }

    // 获取表情 URL（引用论坛全局变量）
    function getSmileyUrl(key) {
        const base = 'https://cdn-bbs.mt2.cn/static/image/smiley/';
        const arr = window.smilies_array || {};
        for (const type in arr) {
            if (!arr.hasOwnProperty(type)) continue;
            for (const page in arr[type]) {
                for (const smiley of arr[type][page]) {
                    if (smiley[1] === key) return `${base}${window.smilies_type?.[`_${type}`]?.[1]}/${smiley[2]}`;
                }
            }
        }
        return null;
    }

    // RAINBOW TEXT GENERATOR
    function rainbowTextGenerator(initialText, callback) {
        if (!initialText.trim()) initialText = '彩虹字体示例';
        const rgbToHex = (r,g,b) => `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1).toUpperCase()}`;

        const { overlay, dlg } = makeOverlay('mt-dialog-wide');
        dlg.innerHTML = `
            <div class="mt-dialog-title">彩虹字体生成</div>
            <hr class="mt-divider">
            <div class="mt-dialog-body" style="padding:16px">
                <div style="margin-bottom:12px">
                    <div style="font-size:13px;color:#757575;margin-bottom:6px">文字内容（点击编辑）</div>
                    <div class="js-container" style="position:relative;height:100px;cursor:pointer">
                        <textarea class="js-input mt-input" style="position:absolute;inset:0;resize:none;display:none;height:100%">${initialText}</textarea>
                        <div class="js-preview" style="position:absolute;inset:0;padding:10px 12px;border:1px solid #bdbdbd;border-radius:4px;overflow-y:auto;font-size:14px;white-space:pre-wrap;word-wrap:break-word"></div>
                    </div>
                </div>
                ${[['起始色相','js-hs',0,360,0,'°'],['颜色步长','js-hstep',1,120,30,'°'],
                   ['饱和度','js-sat',0,100,80,'%'],['亮度','js-lit',10,90,50,'%']].map(([label,cls,min,max,val,unit]) => `
                <div style="margin-bottom:12px">
                    <div style="display:flex;justify-content:space-between;font-size:13px;color:#424242;margin-bottom:4px">
                        <span>${label}</span><span class="${cls}-val">${val}${unit}</span>
                    </div>
                    <input type="range" class="mt-range ${cls}" min="${min}" max="${max}" value="${val}">
                </div>`).join('')}
            </div>
            <hr class="mt-divider">
            <div class="mt-dialog-actions" style="gap:8px">
                <button class="mt-btn-text js-random">随机</button>
                <button class="mt-btn-text js-cancel">取消</button>
                <button class="mt-btn-filled js-ok">确定</button>
            </div>`;

        const cont    = dlg.querySelector('.js-container');
        const input   = dlg.querySelector('.js-input');
        const preview = dlg.querySelector('.js-preview');
        const get = cls => dlg.querySelector(cls);

        const generate = () => {
            const text = input.value.trim();
            if (!text) { preview.innerHTML = '<span style="color:#999">请输入内容</span>'; return ''; }
            const hs=+get('.js-hs').value, step=+get('.js-hstep').value,
                  sat=+get('.js-sat').value, lit=+get('.js-lit').value;
            let html='', code='';
            for (let i=0; i<text.length; i++) {
                const hue=(hs+i*step)%360;
                const [r,g,b]=hslToRgb(hue,sat,lit);
                const hex=rgbToHex(r,g,b);
                html+=`<font color="${hex}">${text[i]}</font>`;
                code+=`[color=${hex}]${text[i]}[/color]`;
            }
            preview.innerHTML = html;
            return code;
        };

        const syncVals = () => {
            [['js-hs','°'],['js-hstep','°'],['js-sat','%'],['js-lit','%']].forEach(([cls,u]) => {
                get(`.${cls}-val`).textContent = get(`.${cls}`).value + u;
            });
        };

        // 切换编辑/预览
        cont.addEventListener('click', () => {
            if (input.style.display === 'none') { input.style.display='block'; preview.style.display='none'; input.focus(); }
        });
        input.addEventListener('blur', () => { input.style.display='none'; preview.style.display='block'; generate(); });

        dlg.querySelectorAll('input[type=range]').forEach(sl => sl.addEventListener('input', () => { syncVals(); generate(); }));

        get('.js-random').onclick = () => {
            get('.js-hs').value   = Math.floor(Math.random()*360);
            get('.js-hstep').value= Math.floor(Math.random()*60)+10;
            get('.js-sat').value  = Math.floor(Math.random()*50)+50;
            get('.js-lit').value  = Math.floor(Math.random()*40)+30;
            syncVals(); generate();
        };
        get('.js-cancel').onclick = () => overlay.remove();
        get('.js-ok').onclick = () => {
            if (input.style.display==='block') { input.style.display='none'; preview.style.display='block'; }
            callback(generate());
            overlay.remove();
        };

        syncVals(); generate();
    }

    // PICTURE MANAGEMENT TOOL
    let _picCurrentIdx = 0;

    function pictureManagementTool() {
        const textarea = document.querySelector('textarea');
        let images = [], overlayEl = null, observer = null;

        const collectImages = () => [...(document.querySelectorAll('#imglist img')||[])].reduce((acc, img) => {
            const m = img.id.match(/^aimg_(\d+)$/);
            if (m) acc.push({ id: img.id, src: img.src, number: m[1] });
            return acc.reverse ? acc : acc;
        }, []).reverse();

        const getInserted = () => {
            const out = [], re = /\[attachimg\](\d+)\[\/attachimg\]/g;
            let m;
            while ((m = re.exec(textarea.value))) out.push(m[1]);
            return out;
        };

        const doInsert = num => {
            const s = textarea.selectionStart, e = textarea.selectionEnd;
            const str = `[attachimg]${num}[/attachimg]`;
            textarea.value = textarea.value.slice(0,s) + str + textarea.value.slice(e);
            textarea.focus();
            textarea.setSelectionRange(s+str.length, s+str.length);
        };

        const render = () => {
            if (!overlayEl) return;
            images = collectImages();
            const inserted = getInserted();
            const thumbs  = overlayEl.querySelector('.js-thumbs');
            const preview = overlayEl.querySelector('.js-preview');
            const insertBtn = overlayEl.querySelector('.js-insert');

            thumbs.innerHTML = images.length
                ? images.map((img,i) => `
                    <div style="margin-bottom:8px;border-radius:4px;overflow:hidden;position:relative;cursor:pointer;
                        border:2px solid ${inserted.includes(img.number)?'#212121':'#e0e0e0'}">
                        <img src="${img.src}" style="width:100%;height:80px;object-fit:cover" data-index="${i}">
                        ${inserted.includes(img.number)?`<span style="position:absolute;top:2px;left:2px;background:#212121;color:#fff;font-size:10px;padding:1px 4px;border-radius:2px">已插</span>`:''}
                        <span class="js-del" data-number="${img.number}" style="position:absolute;bottom:2px;right:2px;background:#f44336;color:#fff;font-size:10px;padding:1px 4px;border-radius:2px;cursor:pointer;z-index:10">删</span>
                    </div>`).join('')
                : '<div style="text-align:center;padding:20px;color:#9e9e9e;font-size:13px">暂无图片</div>';

            if (images.length) {
                if (_picCurrentIdx >= images.length) _picCurrentIdx = 0;
                const cur = images[_picCurrentIdx];
                preview.innerHTML = `<div style="position:relative;max-width:100%;max-height:100%">
                    <img src="${cur.src}" style="max-width:100%;max-height:100%;object-fit:contain">
                    <button class="js-fullscreen mt-btn-filled" style="position:absolute;top:10px;right:10px;padding:4px 12px;font-size:12px;border-radius:14px">全屏</button>
                </div>`;
                preview.querySelector('.js-fullscreen').onclick = () => window.open(cur.src, '_blank');
            } else {
                preview.innerHTML = '<div style="color:#9e9e9e;font-size:14px">请先上传图片</div>';
                _picCurrentIdx = 0;
            }

            insertBtn.style.display = images.length ? '' : 'none';

            // 缩略图点击
            thumbs.querySelectorAll('[data-index]').forEach(el => {
                el.onclick = () => {
                    _picCurrentIdx = +el.dataset.index;
                    render();
                };
            });
            thumbs.querySelectorAll('.js-del').forEach(el => {
                el.onclick = e => {
                    e.stopPropagation();
                    document.querySelector(`#imglist span[aid="${el.dataset.number}"]`)?.click();
                    render();
                };
            });
        };

        // 单例：已有则复用
        let existing = document.getElementById('mt-pic-overlay');
        if (existing) { existing.style.display='flex'; render(); return; }

        const div = document.createElement('div');
        div.id = 'mt-pic-overlay';
        div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center';
        div.innerHTML = `
            <div style="width:95%;max-width:900px;height:80%;max-height:600px;background:#fff;border-radius:12px;
                display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.2)">
                <div style="padding:14px 18px;background:#fafafa;border-bottom:1px solid #f0f0f0;
                    display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:15px;font-weight:500;color:#212121">图片插入助手</span>
                </div>
                <div style="flex:1;display:flex;overflow:hidden">
                    <div style="width:80px;border-right:1px solid #f0f0f0;padding:6px;display:flex;flex-direction:column;box-sizing:border-box">
                        <button class="mt-btn-filled js-upload" style="margin-bottom:8px;padding:6px 4px;border-radius:8px;font-size:12px">上传</button>
                        <div class="js-thumbs" style="flex:1;overflow-y:auto"></div>
                    </div>
                    <div class="js-preview" style="flex:1;display:flex;align-items:center;justify-content:center;padding:8px"></div>
                </div>
                <div style="padding:12px 16px;background:#fafafa;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:8px">
                    <button class="mt-btn-text js-cancel">关闭</button>
                    <button class="mt-btn-filled js-insert" style="display:none">插入</button>
                </div>
            </div>`;

        overlayEl = div;
        document.body.appendChild(div);

        div.querySelector('.js-upload').onclick = () =>
            (document.querySelector('#imglist input') || document.querySelector('#filedata'))?.click();
        div.querySelector('.js-insert').onclick = () => {
            if (images.length) { doInsert(images[_picCurrentIdx]?.number); div.style.display='none'; }
        };
        div.querySelector('.js-cancel').onclick = () => { div.style.display='none'; };
        div.addEventListener('click', e => { if (e.target===div) div.style.display='none'; });

        // 监听 #imglist 变化
        const imgList = document.querySelector('#imglist');
        if (imgList && !observer) {
            observer = new MutationObserver(mutations => {
                const changed = mutations.some(m =>
                    [...m.addedNodes,...m.removedNodes].some(n=>n.tagName==='LI'));
                if (changed) render();
            });
            observer.observe(imgList, { childList:true, subtree:true });
        }

        render();
    }

    // MODULE: 发帖辅助工具
    function initPostingTool() {
        const textarea = document.querySelector('textarea');
        if (!textarea) return;

        // 只从 localStorage 读取 isShow 配置，按 name 合并到 DEFAULT_MENU
        // 避免旧版本遗留的 name 差异导致 switch 匹配失败
        const savedShow = store.get(KEY.MENU_ITEMS, []);
        const showMap = Object.fromEntries(savedShow.map(i => [i.name, i.isShow]));
        const menuItems = DEFAULT_MENU.map(i => ({
            ...i,
            isShow: i.name in showMap ? showMap[i.name] : i.isShow,
        }));

        // 工具栏
        const bar = document.createElement('div');
        bar.className = 'mt-bar';
        menuItems.filter(i => i.isShow).forEach(item => {
            const btn = document.createElement('a');
            btn.className = 'mt-chip';
            btn.textContent = item.name;
            btn.addEventListener('click', () => handleAction(item.name));
            bar.appendChild(btn);
        });

        // 注入位置：textarea 之后（保持原位置）
        textarea.parentNode.insertBefore(bar, textarea.nextSibling);

        let initialized = false;

        function ensureInit() {
            if (initialized) return;
            initialized = true;
            try { window.$('html').off('touchstart'); } catch(e) {}
            setInterval(() => {
                const ta = document.querySelector('textarea');
                if (ta?.value.length > 200) localStorage.setItem(KEY.POST_CACHE, ta.value);
            }, 30000);
        }

        function getSel() {
            const ta = document.querySelector('textarea');
            return { ta, start: ta.selectionStart, end: ta.selectionEnd, text: ta.value.substring(ta.selectionStart, ta.selectionEnd) };
        }

        function insertText(text) {
            if (text.length > 20000) { alert('插入字符超过20000，已取消'); return; }
            const el = document.querySelector('textarea');
            if (!el) return;
            el.focus();
            const s = el.selectionStart, e = el.selectionEnd;
            if (!document.execCommand('insertText', false, text)) {
                el.value = el.value.slice(0,s) + text + el.value.slice(e);
            }
            el.selectionStart = s;
            el.selectionEnd = s + text.length;
            const lh = parseInt(getComputedStyle(el).lineHeight) || 20;
            el.scrollTop = el.value.slice(0, el.selectionEnd).split('\n').length * lh - el.clientHeight / 2;
        }

        // 包裹标签：有选中文本则直接包裹，否则弹输入框
        function wrapTag(tag) {
            const { sel } = { sel: getSel().text };
            if (!getSel().text.trim()) {
                inputDia([{ placeholder: '请输入文字' }], v => insertText(`[${tag}]${v}[/${tag}]`));
            } else {
                insertText(`[${tag}]${getSel().text}[/${tag}]`);
            }
        }

        function handleAction(name) {
            ensureInit();
            const { ta, text: sel } = getSel();

            switch (name) {
                case '↶': document.execCommand('undo', false, null); break;
                case '↷': document.execCommand('redo', false, null); break;

                case '预览':
                    previewDia(replaceText(ta.value), { title: '内容预览', isHtml: true });
                    break;

                case '选择': {
                    const text = ta.value;
                    let L=null, R=null;
                    for (let i=ta.selectionStart-1; i>=0; i--) if (text[i]==='[') { L=i; break; }
                    for (let i=ta.selectionEnd; i<text.length; i++) if (text[i]===']') { R=i; break; }
                    ta.focus();
                    ta.selectionStart = L ?? 0;
                    ta.selectionEnd = R != null ? R+1 : text.length;
                    break;
                }

                case '常用语':
                    selectDia(store.get(KEY.QUICK_INPUT, DEFAULT_QUICK_INPUT), val => {
                        if (val === 'add') {
                            inputDia([{placeholder:'备注'},{placeholder:'内容'}], (n,v) => {
                                if (n.trim() && v.trim()) {
                                    const arr = store.get(KEY.QUICK_INPUT, DEFAULT_QUICK_INPUT);
                                    arr.unshift({ name: n, value: v });
                                    store.set(KEY.QUICK_INPUT, arr);
                                }
                            });
                        } else if (val === 'delete') {
                            selectDia(store.get(KEY.QUICK_INPUT, DEFAULT_QUICK_INPUT), v => {
                                if (v==='add' || v==='delete') return;
                                const arr = store.get(KEY.QUICK_INPUT, DEFAULT_QUICK_INPUT);
                                store.set(KEY.QUICK_INPUT, arr.filter(i => i.value !== v));
                            }, '选择要删除的常用语');
                        } else {
                            insertText(sel + val);
                        }
                    }, '选择常用语');
                    break;

                case '彩虹字体': rainbowTextGenerator(sel, code => insertText(code)); break;
                case '插图':    pictureManagementTool(); break;

                case '粗体': wrapTag('b'); break;
                case '斜体': wrapTag('i'); break;
                case '下划': wrapTag('u'); break;
                case '删线': wrapTag('s'); break;
                case '代码':  wrapTag('code');  break;
                case '隐藏':  wrapTag('hide');  break;
                case '引用': wrapTag('quote'); break;
                case '分割':    insertText(`[hr]${sel}`); break;

                case '图片':
                    if (!sel.trim()) inputDia([{placeholder:'图片链接'}], u => insertText(`[img]${u}[/img]`));
                    else insertText(`[img]${sel}[/img]`);
                    break;

                case '链接':
                    if (!sel.trim()) {
                        inputDia([{placeholder:'文字'},{placeholder:'链接（可选）'}], (t,u) =>
                            insertText(u.trim() ? `[url=${u}]${t}[/url]` : `[url]${t}[/url]`));
                    } else insertText(`[url]${sel}[/url]`);
                    break;

                case '邮箱':
                    if (!sel.trim()) {
                        inputDia([{placeholder:'文字'},{placeholder:'邮箱（可选）'}], (t,e) =>
                            insertText(e.trim() ? `[email=${e}]${t}[/email]` : `[email]${t}[/email]`));
                    } else insertText(`[email=${sel}]${sel}[/email]`);
                    break;

                case '媒体':
                    if (!sel.trim()) inputDia([{placeholder:'视频链接'}], u => insertText(`[media=x,500,375]${u}[/media]`));
                    else insertText(`[media=x,500,375]${sel}[/media]`);
                    break;

                case 'QQ':
                    if (!sel.trim()) inputDia([{placeholder:'QQ号'}], q => insertText(`[qq]${q}[/qq]`));
                    else insertText(`[qq]${sel}[/qq]`);
                    break;

                case '字号':
                    selectDia([1,2,3,4,5,6,7,8,9].map(n => ({
                        name: `${n}号`, value: `[size=${n}]${sel}[/size]`,
                        css: `font-size:${[8,10,12,14,18,24,35,35,35][n-1]}px`
                    })), v => insertText(v), '选择字号');
                    break;

                case '颜色':
                case '背景色': {
                    const tag = name === '颜色' ? 'color' : 'backcolor';
                    const prop = name === '颜色' ? 'color' : 'background';
                    const colors = ['black','white','red','green','blue','yellow','purple','orange',
                        'pink','gray','brown','cyan','magenta','olive','teal','navy','maroon','silver','gold'];
                    selectDia([
                        { name: '取色器', value: '__picker__' },
                        ...colors.map(c => ({ name: c, value: `[${tag}=${c}]${sel}[/${tag}]`, css: `${prop}:${c}` }))
                    ], v => {
                        if (v === '__picker__') showColorPicker(hex => insertText(`[${tag}=${hex}]${sel}[/${tag}]`));
                        else insertText(v);
                    }, '选择颜色');
                    break;
                }

                case '对齐':
                    selectDia([
                        { name: '左对齐', value: `[align=left]${sel}[/align]`   },
                        { name: '居中',   value: `[align=center]${sel}[/align]` },
                        { name: '右对齐', value: `[align=right]${sel}[/align]`  },
                    ], v => insertText(v), '选择对齐方式');
                    break;

                case '更多':
                    selectDia(menuItems.filter(i => !i.isShow).map(i => ({ name: i.name, value: i.name })),
                        v => handleAction(v), '隐藏功能');
                    break;

                case '移除标签':
                    inputDia([{placeholder:'输入标签名（如 color）'}], label => {
                        const esc = label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
                        ta.value = ta.value.replace(new RegExp(`\\[(?:\\/)?${esc}(?:=.*?)?\\]`,'gi'), '');
                    });
                    break;

                case '阻止离开':
                    window.addEventListener('beforeunload', e => { e.preventDefault(); e.returnValue=''; });
                    break;

                case '原布局': {
                    const il = document.querySelector('#imglist');
                    if (il) il.style.display = il.style.display==='block' ? 'none' : 'block';
                    break;
                }

                case '帖子缓存': {
                    const cache = localStorage.getItem(KEY.POST_CACHE) || '无缓存';
                    previewDia(cache, { title: '帖子缓存', callback: () => insertText(cache) });
                    break;
                }

                case 'Eruda': {
                    if (window.eruda) {
                        window._erudaOn = !window._erudaOn;
                        window._erudaOn ? eruda.init() : eruda.destroy();
                        return;
                    }
                    const sc = document.createElement('script');
                    sc.src = 'https://cdn.jsdelivr.net/npm/eruda';
                    sc.onload = () => { eruda.init(); window._erudaOn = true; };
                    document.head.appendChild(sc);
                    break;
                }

                default: alert('未知操作');
            }
        }
    }

    // 发帖页面布局优化
    function initPostingLayout() {
        const url = new URL(location.href);
        if (url.searchParams.get('mod') !== 'post') return;

        // 将图片区域移至发帖区，添加图片按钮
        const targetDiv = document.querySelector('#comiis_mh_sub>div');
        if (targetDiv) {
            const link = document.createElement('a');
            link.href = 'javascript:;';
            link.className = 'comiis_pictitle';
            link.innerHTML = '<i class="comiis_font"><em>图片</em></i><span style="display:none">0</span>';
            targetDiv.appendChild(link);

            const imgList = document.querySelector('#imglist');
            const postTab = document.querySelector('#comiis_post_tab');
            if (imgList && postTab) {
                imgList.style.display = 'none';
                postTab.appendChild(imgList);
            }
            link.addEventListener('click', () => pictureManagementTool());
        }

        // 提交按钮移至顶部
        const btnBoxList = document.querySelectorAll('.comiis_btnbox');
        const headerY = document.querySelector('.header_y');
        if (btnBoxList.length && headerY) {
            // h2 允许收缩，header_y 才能在右侧正常显示
            const h2 = headerY.closest('.comiis_head')?.querySelector('h2');
            if (h2) h2.style.minWidth = '0';
            Object.assign(headerY.style, {
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                flexShrink: '1', minWidth: '0', gap: '6px', paddingRight: '8px',
                // 稍微上移，避免贴着 header 底部
                transform: 'translateY(-2px)',
            });
            btnBoxList.forEach(box => {
                [...box.children].forEach(child => {
                    if (child.nodeType !== 1) return;
                    const bgCls = [...child.classList].find(c => c.startsWith('bg_'));
                    if (!bgCls) return;
                    const btn = document.createElement('div');
                    btn.className = bgCls;
                    btn.textContent = child.textContent.trim();
                    Object.assign(btn.style, {
                        padding: '3px 8px', whiteSpace: 'nowrap', cursor: 'pointer',
                    });
                    btn.addEventListener('click', () => child.click());
                    headerY.appendChild(btn);
                });
                box.style.display = 'none';
            });
        }

        // 自动计算并设置 textarea 高度
        (function () {
            window.textarea_scrollHeight = () => {};

            function calcHeight() {
                const form = document.querySelector('#postform>div');
                const ta = document.querySelector('#needmessage');
                if (!form || !ta) return;
                const h = Math.max(100, Math.floor(document.documentElement.clientHeight - (form.offsetHeight - ta.offsetHeight) - 50));
                Object.assign(ta.style, { height: h+'px', width:'100%', boxSizing:'border-box', margin:'0', padding:'4px' });
            }

            calcHeight();

            let resizeTimer;
            window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(calcHeight, 100); });

            // 监听 post_tab 高度变化（展开/折叠时重算）
            const tab = document.querySelector('#comiis_post_tab');
            if (tab) {
                let lastH = tab.clientHeight;
                new MutationObserver(() => {
                    if (tab.clientHeight !== lastH) { lastH = tab.clientHeight; calcHeight(); }
                }).observe(tab, { attributes:true, attributeFilter:['style','class'], childList:true, subtree:true });
            }
        })();
    }

    // MODULE: 自动下一页
    function initAutoNextPage() {
        const $ = window.jQuery;
        if (!$) return;

        const { mode, listSelector } = detectMode();
        let { currentPage, totalPage } = getPageInfo();
        let isLoading = false, isFailed = false;
        const observedMarkers = new Set();

        function detectMode() {
            const url = new URL(location.href);
            const segs = url.pathname.split('-');
            if (url.searchParams.get('fid') || (segs.length===3 && segs[0].endsWith('forum')))
                return { mode:'forum',    listSelector: PAGE_CFG.postList };
            if (url.searchParams.get('mod')==='guide')
                return { mode:'guide',    listSelector: PAGE_CFG.postList };
            if (url.pathname==='/search.php')
                return { mode:'search',   listSelector: PAGE_CFG.postList };
            if (url.searchParams.get('do')==='thread')
                return { mode:'home',     listSelector: PAGE_CFG.postList };
            if (url.searchParams.get('tid') || (segs.length===4 && segs[0].endsWith('thread')))
                return { mode:'thread',   listSelector: PAGE_CFG.commentList };
            if (['friend','following','follower'].includes(url.searchParams.get('do')) ||
                ['visitor','trace','blacklist'].includes(url.searchParams.get('view')) ||
                url.searchParams.get('ac')==='friend')
                return { mode:'friends',  listSelector: PAGE_CFG.friendList };
            if (url.searchParams.get('do')==='wall')
                return { mode:'wall',     listSelector: PAGE_CFG.wallList };
            if (url.searchParams.get('ac')==='credit')
                return { mode:'credit',   listSelector: PAGE_CFG.creditList };
            if (url.searchParams.get('do')==='notice')
                return { mode:'notice',   listSelector: PAGE_CFG.noticeList };
            if (url.searchParams.get('do')==='favorite')
                return { mode:'favorite', listSelector: PAGE_CFG.favoriteList };
            return { mode:'', listSelector:'' };
        }

        function getPageInfo() {
            const $sel = $('#dumppage');
            const total = $sel.length ? $sel.find('option').length : PAGE_CFG.unknownPage;
            const urlPage = parseInt(new URL(location.href).searchParams.get('page'));
            let cur = urlPage || ($sel.length ? parseInt($sel.find('option:selected').val()) : 1);
            if (!(cur >= 1)) cur = 1;
            return { currentPage: Math.floor(cur), totalPage: total };
        }

        function buildUrl(page, inajax) {
            const url = new URL(location.href);
            url.searchParams.set('page', page);
            inajax ? url.searchParams.set('inajax','1') : url.searchParams.delete('inajax');
            return url.toString();
        }

        function parseResponse(root) {
            if (listSelector === PAGE_CFG.commentList) return $(root);
            return $(`<div>${root}</div>`).find(listSelector).html() || '';
        }

        function addMarker({ pageNum=currentPage, loading, error, done }) {
            const $list = $(listSelector).first();
            if (!$list.length || (currentPage===1 && currentPage===pageNum)) return;
            $list.find('li:contains("加载中...")').remove();
            const totalTxt = totalPage !== PAGE_CFG.unknownPage ? `/共${totalPage}页` : '';
            const prepend = pageNum <= currentPage;

            let marker;
            if (loading) {
                marker = $(`<li class="mt-page-mark"><span class="mt-page-link">第${pageNum}页</span>${totalTxt} 加载中...</li>`);
            } else if (error) {
                const msg = (typeof error==='string' ? error : JSON.stringify(error)).slice(0,200);
                marker = $(`<li class="mt-page-mark retry-marker"><span class="mt-page-link">第${pageNum}页</span>${totalTxt}
                    加载失败<span class="mt-retry-btn">点击重试</span><p style="color:#f44336;font-size:12px;margin:4px 0 0"></p></li>`);
                marker.find('p').text(msg);
                marker.on('click', '.mt-retry-btn', function() {
                    isFailed = false; loadPage(pageNum); $(this).closest('.retry-marker').remove();
                });
            } else if (done) {
                marker = $(`<li class="mt-page-mark">已全部加载 <span class="mt-page-link">共${pageNum}页</span>
                    <a href="${buildUrl(1)}" class="mt-page-link" style="margin-left:6px">回到第1页</a></li>`);
                prepend === false;
            } else {
                marker = $(`<li class="mt-page-mark"><span class="mt-page-link">第${pageNum}页</span>${totalTxt}
                    ${prepend && pageNum!==1 ? '<span class="mt-load-prev">加载上一页</span>' : ''}</li>`);
                marker.on('click', '.mt-load-prev', function() {
                    if (isFailed) { alert('下一页加载出错，请先重试后再加载上一页'); return; }
                    loadPage(pageNum-1); $(this).remove();
                });
            }
            prepend ? $list.prepend(marker) : $list.append(marker);
        }

        function allLoaded(page=totalPage) {
            addMarker({ pageNum:page, done:true });
            $(window).off('scroll', handleScroll);
        }

        function loadPage(page) {
            if (isLoading || page>totalPage || page<1 || isFailed) return;
            addMarker({ pageNum:page, loading:true });
            isLoading = true;

            $.ajax({ type:'GET', url:buildUrl(page,true), dataType:'xml', timeout:PAGE_CFG.requestTimeout })
            .then(function(resp) {
                try {
                    const root = resp.lastChild.firstChild.nodeValue;
                    if (root == null) throw new Error('数据格式错误');

                    const html = parseResponse(root);
                    const $list = $(listSelector).first();

                    if (root.includes('本版块或指定的范围内尚无主题') || (!html && totalPage===PAGE_CFG.unknownPage)) {
                        allLoaded(currentPage); return;
                    }
                    if (!html) throw new Error('数据解析失败');

                    if (page < currentPage) {
                        $list.prepend(html); addMarker({ pageNum:page });
                    } else {
                        addMarker({ pageNum:page }); $list.append(html);
                        currentPage = page;
                    }

                    // 初始化新增元素的论坛功能
                    window.comiis_recommend_addkey?.();
                    window.comiis_user_gz_key?.();
                    if (window.popup?.init) window.popup.init();

                    // 为新标记注册 IntersectionObserver（用于更新地址栏页码）
                    $('.page-jump-link,.mt-page-link').closest('li').each(function() {
                        if (!observedMarkers.has(this) && !$(this).is(':first-child')) {
                            observedMarkers.add(this);
                            pageObserver.observe(this);
                        }
                    });

                    if (page >= totalPage || (!root.includes('下一页') && totalPage===PAGE_CFG.unknownPage)) allLoaded(page);
                } catch(e) { return $.Deferred().reject(e); }
            }).then(null, function(e) {
                try {
                    addMarker({ pageNum:page, error:e }); isFailed = true;
                } catch(_) {}
            }).always(() => isLoading = false);
        }

        function handleScroll() {
            if (isFailed || isLoading || currentPage>=totalPage) return;
            const scrollTop=$(window).scrollTop(), winH=$(window).height(), docH=$(document).height();
            if (docH-(scrollTop+winH) <= PAGE_CFG.loadThreshold) loadPage(currentPage+1);
        }

        // 阅读进度 -> 更新地址栏
        const pageObserver = new IntersectionObserver(entries => {
            entries.forEach(({ target, isIntersecting }) => {
                if (!isIntersecting) return;
                const link = target.querySelector('.mt-page-link, .page-jump-link');
                const m = link?.textContent?.match(/第(\d+)页/);
                if (!m) return;
                const newUrl = buildUrl(parseInt(m[1])-1);
                if (location.href !== newUrl) window.history.replaceState({}, document.title, newUrl);
            });
        }, { threshold: 0.8 });

        // 初始化各模式的额外处理
        if (listSelector === PAGE_CFG.postList) {
            // 帖子列表：点击条目在新标签打开
            document.addEventListener('click', e => {
                const box = e.target.closest('div.mmlist_li_box');
                if (!box) return;
                const link = [...box.querySelectorAll('a')].find(a => /thread-\d+.*\.html$/i.test(a.getAttribute('href')||''));
                if (link) { e.preventDefault(); e.stopImmediatePropagation(); window.open(link.getAttribute('href'),'_blank'); }
            }, true);
        } else if ([PAGE_CFG.friendList, PAGE_CFG.creditList, PAGE_CFG.noticeList, PAGE_CFG.favoriteList].includes(listSelector)) {
            // 阻止局部刷新，使用正常跳转
            $(document).on('click','a', function(e) {
                if (e.target.closest(listSelector)) return true;
                const href = $(this).attr('href');
                if (href && !href.includes('javascript:') && !href.includes('#')) {
                    e.stopImmediatePropagation(); e.preventDefault();
                    location.href = href; return false;
                }
            });
        }

        if (!$('.comiis_page').length || !mode || !listSelector) return;

        addMarker({ pageNum: currentPage });
        $('.comiis_page').css('display','none');
        $(window).scroll(handleScroll);
        if (currentPage >= totalPage) allLoaded(totalPage);

        // 页码跳转（点击页码标记）
        $(document).off('click','.mt-page-link, .page-jump-link').on('click','.mt-page-link, .page-jump-link', function() {
            const input = prompt(`跳转到哪页？（1-${totalPage}）`, currentPage);
            if (!input) return;
            const p = parseInt(input.trim());
            if (isNaN(p) || p<1 || p>totalPage) { alert(`请输入 1-${totalPage} 之间的数字`); return; }
            location.href = buildUrl(p);
        });
    }

    // HTML -> BBCODE
    function html2bbcode(html) {
        let bbcode = html;
        const codeBlocks = [];

        // 提取代码块
        bbcode = bbcode.replace(/<div class="comiis_blockcode[^>]*><div class="bg_f b_l"><ol>([\s\S]*?)<\/ol><\/div><\/div>/gi, (_, ol) => {
            let c = ol.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi,'$1\n').replace(/^\s*\n/gm,'');
            const entities = {'&nbsp;':' ','&lt;':'<','&gt;':'>','&amp;':'&'};
            Object.entries(entities).forEach(([k,v]) => c = c.replace(new RegExp(k,'gi'),v));
            c = c.replace(/<br[^>]*>/gi,'\n').replace(/<[a-zA-Z][^>]*>/gi,'').replace(/<\/[a-zA-Z][^>]*>/gi,'');
            codeBlocks.push(`[code]${c.trim()}[/code]`);
            return `__CODE_${codeBlocks.length-1}__`;
        });

        // 占位文本特殊字符
        const phMap = { '<':'__LT__', '>':'__GT__', '&':'__AMP__' };
        bbcode = bbcode.replace(/(?<!<[^>]*)([<>\\&])(?!.*?>)/gi, m => phMap[m]||m);

        // 各类标签转换
        bbcode = bbcode.replace(/<div class="comiis_quote bg_h b_dashed f_c"><blockquote><font[^>]*>回复<\/font> ([\s\S]*?)<\/blockquote><\/div>/gi,'[quote]$1[/quote]');
        bbcode = bbcode.replace(/<div class="comiis_quote bg_h f_c">以下内容需要积分高于 ([\d]+) 才可浏览<\/div>/gi,'[hide=,$1][/hide]');
        bbcode = bbcode.replace(/<div class="comiis_quote bg_h f_c"><h2[^>]*>本帖隐藏的内容: <\/h2>([\s\S]*?)<\/div>/gi,'[hide]$1[/hide]');
        bbcode = bbcode.replace(/<div class="comiis_quote bg_h f_c"><blockquote>([\s\S]*?)<\/blockquote><\/div>/gi,'[free]$1[/free]');

        // 表情（构建反查 map）
        const smileyMap = new Map();
        try {
            Object.keys(window.smilies_type||{}).forEach(key => {
                const [, dir] = window.smilies_type[key];
                const id = key.replace('_','');
                const pages = (window.smilies_array||{})[id] || {};
                Object.keys(pages).forEach(p => pages[p].forEach(([,tag,file]) => {
                    smileyMap.set(`https://cdn-bbs.mt2.cn/static/image/smiley/${dir}/${file}`, tag);
                }));
            });
        } catch(e) {}
        bbcode = bbcode.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, (m,src) => smileyMap.get(src) || m);

        // 图片
        bbcode = bbcode.replace(/<img[^>]*src="([^"]+)"[^>]*width="([^"]*)"[^>]*height="([^"]*)"[^>]*>/gi, (_,s,w,h) => `[img=${w||''},${h||''}]${s}[/img]`);
        bbcode = bbcode.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi,'[img]$1[/img]');

        // QQ / email / url
        bbcode = bbcode.replace(/<a[^>]*href="http:\/\/wpa\.qq\.com\/msgrd\?[^>]*uin=([^&]+)[^>]*>([\s\S]*?)<\/a>/gi,'[qq]$1[/qq]');
        bbcode = bbcode.replace(/<a[^>]*href="mailto:([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_,e,t) =>
            e.trim()===t.trim() ? `[email]${e.trim()}[/email]` : `[email=${e.trim()}]${t.trim()}[/email]`);
        bbcode = bbcode.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_,h,t) =>
            h.trim()===t.trim() ? `[url]${h.trim()}[/url]` : `[url=${h.trim()}]${t.trim()}[/url]`);

        // 文本样式
        bbcode = bbcode.replace(/<strong>([\s\S]*?)<\/strong>/gi,'[b]$1[/b]');
        bbcode = bbcode.replace(/<i>([\s\S]*?)<\/i>/gi,'[i]$1[/i]');
        bbcode = bbcode.replace(/<u>([\s\S]*?)<\/u>/gi,'[u]$1[/u]');
        bbcode = bbcode.replace(/<strike>([\s\S]*?)<\/strike>/gi,'[s]$1[/s]');

        // 颜色 / 背景 / 字号
        bbcode = bbcode.replace(/<font[^>]*color="([^"]+)"[^>]*>([\s\S]*?)<\/font>/gi,'[color=$1]$2[/color]');
        bbcode = bbcode.replace(/<font[^>]*style="background-color:([^;]+);?"[^>]*>([\s\S]*?)<\/font>/gi,'[backcolor=$1]$2[/backcolor]');
        bbcode = bbcode.replace(/<font[^>]*size="([^"]+)"[^>]*>([\s\S]*?)<\/font>/gi,'[size=$1]$2[/size]');
        bbcode = bbcode.replace(/<div[^>]*align="([^"]+)"[^>]*>([\s\S]*?)<\/div>/gi,'[align=$1]$2[/align]');

        // 媒体
        bbcode = bbcode.replace(/<ignore_js_op>[\s\S]*?<iframe\s+[^>]*?\bsrc\s*=\s*(["'])(.*?)\1[^>]*?>[\s\S]*?<\/ignore_js_op>/gi, (_,__,src) => {
            const m = src.match(/bvid=([A-Za-z0-9]+)/i);
            return `[media=x,500,375]${m?`https://b23.tv/BV${m[1]}`:src}[/media]`;
        });

        // 表格
        bbcode = bbcode.replace(/<td[^>]*>([\s\S]*?)<\/td>/gi,'[td]$1[/td]');
        bbcode = bbcode.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi,'[tr]$1[/tr]');
        bbcode = bbcode.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi,'[table]$1[/table]');

        // 列表
        bbcode = bbcode.replace(/<ul[^>]*type="([^"]+)"[^>]*class="([^"]+)"[^>]*>([\s\S]*?)<\/ul>/gi, (_,t,__,c) =>
            `[list=${t}]${c.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi,'[*]$1')}[/list]`);
        bbcode = bbcode.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_,c) =>
            `[list]${c.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi,'[*]$1')}[/list]`);

        // HR / 换行 / 清理标签
        bbcode = bbcode.replace(/<hr[^>]*class="l"[^>]*>/gi,'[hr]');
        bbcode = bbcode.replace(/&#(\d+);/gi, (_,n) => String.fromCharCode(n));
        bbcode = bbcode.replace(/&#x([0-9a-f]+);/gi, (_,h) => String.fromCharCode(parseInt(h,16)));
        bbcode = bbcode.replace(/<br[^>]*>/gi,'\n');
        bbcode = bbcode.replace(/<[a-zA-Z][^>]*>/gi,'').replace(/<\/[a-zA-Z][^>]*>/gi,'');

        // 还原占位符
        const revMap = Object.fromEntries(Object.entries(phMap).map(([c,p])=>[p,c]));
        Object.entries(revMap).forEach(([p,c]) => bbcode = bbcode.replace(new RegExp(p,'gi'),c));

        // 还原 code 块
        codeBlocks.forEach((c,i) => { bbcode = bbcode.replace(`__CODE_${i}__`, c); });

        // HTML 实体
        const entities = {'&nbsp;':' ','&amp;':'','&lt;':'<','&gt;':'>','&quot;':'"','&#32;':' ','&#160;':' ','&#xa0;':' '};
        Object.entries(entities).forEach(([k,v]) => bbcode = bbcode.replace(new RegExp(k,'gi'),v));

        return bbcode.replace(/\n{3,}/g,'\n\n').replace(/^\s+|\s+$/g,'');
    }

    // MODULE: 借鉴一下
    function initReference(tid) {
        let loading = false;
        const SELECT = 'div.comiis_messages.comiis_aimg_show.cl';

        // 代码块复制（事件委托）
        document.addEventListener('click', e => {
            const block = e.target.closest('.comiis_blockcode');
            if (!block) return;
            previewDia(block.textContent.trim(), { title: '复制代码' });
        });

        // 处理单个帖子 div
        function processPost(div) {
            try {
                const h2 = div.querySelector('div.comiis_postli_top.bg_f h2');
                const pid = div.id.match(/\d+/)[0];
                if (!h2 || h2.querySelector('[data-action="reference"]')) return;

                // 添加"借鉴一下"链接
                const refSpan = document.createElement('span');
                refSpan.dataset.action = 'reference';
                refSpan.className = 'mt-ref-link';
                refSpan.textContent = '[借鉴一下]';
                refSpan.addEventListener('click', async () => {
                    if (loading) return;
                    const content = await fetchLatest(tid, pid, div.querySelector(SELECT)?.innerHTML || '');
                    previewDia(html2bbcode(content), { title: 'BBCode 预览' });
                });
                h2.appendChild(refSpan);

                // 添加 share 链接
                const timesDiv = div.querySelector('div.comiis_postli_times.bg_f');
                const zhan = timesDiv?.querySelector('span.bottom_zhan.y');
                if (zhan && !timesDiv.querySelector('[data-action="share"]')) {
                    const shareSpan = document.createElement('span');
                    shareSpan.dataset.action = 'share';
                    shareSpan.className = 'mt-share-link y';
                    shareSpan.textContent = 'share';
                    shareSpan.addEventListener('click', () => {
                        previewDia(`https://bbs.binmt.cc/forum.php?mod=redirect&goto=findpost&ptid=${tid}&pid=${pid}`,
                            { title: '帖子链接' });
                    });
                    zhan.insertAdjacentElement('afterend', shareSpan);
                }
            } catch(e) { console.error('处理帖子时出错:', e); }
        }

        // 获取最新内容（优先服务端，失败降级本地）
        async function fetchLatest(tid, pid, fallback) {
            loading = true;
            try {
                const res = await fetch(`https://bbs.binmt.cc/forum.php?mod=viewthread&tid=${tid}&viewpid=${pid}&mobile=2&inajax=1`, { method:'GET' });
                if (!res.ok) throw new Error('HTTP Error');
                const xml = await res.text();
                const doc = new DOMParser().parseFromString(xml, 'text/xml');
                if (doc.querySelector('parseerror')) throw new Error('XML 解析失败');
                const root = doc.lastChild?.firstChild?.nodeValue;
                if (!root) throw new Error('数据为空');
                const tmp = document.createElement('div');
                tmp.innerHTML = root;
                const content = tmp.querySelector(SELECT)?.innerHTML || '';
                tmp.remove();
                if (!content) throw new Error('内容为空，降级使用本地');
                return content;
            } catch(e) {
                console.log(e.message);
                return fallback;
            } finally {
                loading = false;
            }
        }

        // 处理页面已有帖子
        const TARGET = 'div.comiis_postli.comiis_list_readimgs.nfqsqi';
        document.querySelectorAll(TARGET).forEach(processPost);

        // 动态加载帖子（无限滚动时触发）
        const processed = new WeakSet();
        new MutationObserver(mutations => {
            for (const m of mutations) {
                if (m.type === 'childList' && m.addedNodes.length) {
                    const el = m.target;
                    [el, ...el.querySelectorAll(TARGET)].forEach(node => {
                        if (node.matches?.(TARGET) && !processed.has(node)) {
                            processPost(node); processed.add(node);
                        }
                    });
                }
            }
        }).observe(document.body, { childList:true, subtree:true });
    }

    // INIT
    injectStyles();

    const url = new URL(location.href);
    const segs = url.pathname.split('-');
    const tid = url.searchParams.get('tid') ||
                (() => { const m = url.pathname.match(/thread-(\d+)-/); return m?.[1] ?? null; })();

    // 发帖辅助（有 textarea 的页面）
    if (document.querySelector('textarea')) {
        initPostingTool();
        initPostingLayout();
    }

    // 自动下一页（有 jQuery 的页面）
    if (window.jQuery) initAutoNextPage();

    // 借鉴一下（帖子页面）
    if (tid) initReference(tid);

})();
