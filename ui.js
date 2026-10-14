var LiquidUI = (function () {
    var MARGIN = 12;
    var MOBILE_QUERY = '(max-width: 600px)';

    var _adapter = null;
    var _panel = null;
    var _toggle = null;
    var _closeBtn = null;
    var _restorePos = null;
    var _animId = 0;

    var _controls = [];
    var _sizeIds = null;
    var _storageKey = '';
    var _sharedBg = '';
    var _shareExtras = null;
    var _limiting = false;
    var _saveTimer = 0;
    var _resizeQueued = false;

    function $(id) {
        return id ? document.getElementById(id) : null;
    }

    function fire(el) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function isMobile() {
        return window.matchMedia(MOBILE_QUERY).matches;
    }

    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function isChromium() {
        var uad = navigator.userAgentData;
        if (uad && uad.brands && uad.brands.some(function (b) { return /Chromium/.test(b.brand); })) return true;
        return /\bChrome\//.test(navigator.userAgent);
    }

    function viewport() {
        return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    }

    function inset(a, m) {
        return { left: a.left + m, top: a.top + m, right: a.right - m, bottom: a.bottom - m };
    }

    function panelOpen() {
        return !!_panel && _panel.classList.contains('open');
    }

    function freeArea() {
        var a = viewport();
        if (!panelOpen()) return a;
        if (isMobile()) {
            a.bottom = Math.max(0, window.innerHeight - _panel.offsetHeight);
        } else {
            var left = parseFloat(getComputedStyle(_panel).left) || 0;
            a.left = Math.min(a.right, left + _panel.offsetWidth);
        }
        return a;
    }

    function clampPos(x, y, w, h, a) {
        a = a || viewport();
        var maxX = a.right - w;
        var maxY = a.bottom - h;
        x = maxX < a.left ? (a.left + a.right - w) / 2 : Math.min(Math.max(x, a.left), maxX);
        y = maxY < a.top ? a.top : Math.min(Math.max(y, a.top), maxY);
        return { x: x, y: y };
    }

    function isInside(r, a) {
        return r.x >= a.left - 0.5 && r.y >= a.top - 0.5 && r.x + r.w <= a.right + 0.5 && r.y + r.h <= a.bottom + 0.5;
    }

    function stopAnim() {
        if (_animId) cancelAnimationFrame(_animId);
        _animId = 0;
    }

    function moveTo(x, y, animate) {
        if (!_adapter) return;
        stopAnim();
        if (!animate || prefersReducedMotion()) {
            _adapter.setPos(x, y);
            return;
        }
        var r = _adapter.getRect();
        var sx = r.x;
        var sy = r.y;
        var t0 = performance.now();
        var dur = 350;
        function step(now) {
            var t = Math.min(1, (now - t0) / dur);
            var e = 1 - Math.pow(1 - t, 3);
            _adapter.setPos(sx + (x - sx) * e, sy + (y - sy) * e);
            _animId = t < 1 ? requestAnimationFrame(step) : 0;
        }
        _animId = requestAnimationFrame(step);
    }

    function recenter(animate) {
        if (!_adapter) return;
        var r = _adapter.getRect();
        var a = freeArea();
        var p = clampPos((a.left + a.right - r.w) / 2, (a.top + a.bottom - r.h) / 2, r.w, r.h, a);
        moveTo(Math.round(p.x), Math.round(p.y), animate);
    }

    function keepInView() {
        if (!_adapter || _animId) return;
        var r = _adapter.getRect();
        var p = clampPos(r.x, r.y, r.w, r.h);
        if (p.x !== r.x || p.y !== r.y) _adapter.setPos(p.x, p.y);
    }

    function moveOutFromUnderPanel() {
        if (!_adapter) return;
        var r = _adapter.getRect();
        var free = freeArea();
        if (isInside(r, free)) return;
        var p = clampPos(r.x, r.y, r.w, r.h, inset(free, MARGIN));
        _restorePos = { x: r.x, y: r.y };
        moveTo(p.x, p.y, true);
    }

    function initDrag(el) {
        var activeId = null;
        var offX = 0;
        var offY = 0;
        var downX = 0;
        var downY = 0;
        var lastTap = -1000;

        el.addEventListener('pointerdown', function (e) {
            if (activeId !== null || e.button > 0) return;
            e.preventDefault();

            if (e.timeStamp - lastTap < 320 && Math.abs(e.clientX - downX) < 30 && Math.abs(e.clientY - downY) < 30) {
                lastTap = -1000;
                _restorePos = null;
                recenter(true);
                return;
            }
            lastTap = e.timeStamp;
            downX = e.clientX;
            downY = e.clientY;

            stopAnim();
            var r = _adapter.getRect();
            activeId = e.pointerId;
            offX = e.clientX - r.x;
            offY = e.clientY - r.y;
            try {
                el.setPointerCapture(e.pointerId);
            } catch (err) {}
        });

        el.addEventListener('pointermove', function (e) {
            if (e.pointerId !== activeId) return;
            e.preventDefault();
            var r = _adapter.getRect();
            var p = clampPos(e.clientX - offX, e.clientY - offY, r.w, r.h);
            _adapter.setPos(p.x, p.y);
            if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) _restorePos = null;
        });

        function end(e) {
            if (e.pointerId === activeId) activeId = null;
        }
        el.addEventListener('pointerup', end);
        el.addEventListener('pointercancel', end);
        el.addEventListener('lostpointercapture', end);
    }

    function setPanel(open) {
        if (!_panel || open === panelOpen()) return;
        var focusWasInside = _panel.contains(document.activeElement);

        _panel.classList.toggle('open', open);
        _toggle.classList.toggle('hidden', open);
        document.body.classList.toggle('panel-open', open);
        _panel.inert = !open;
        _toggle.inert = open;
        _toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

        if (open) {
            _closeBtn.focus({ preventScroll: true });
            moveOutFromUnderPanel();
        } else {
            if (_restorePos && _adapter) {
                var r = _adapter.getRect();
                var p = clampPos(_restorePos.x, _restorePos.y, r.w, r.h);
                moveTo(p.x, p.y, true);
            }
            _restorePos = null;
            if (focusWasInside) _toggle.focus({ preventScroll: true });
        }
    }

    function initPanel() {
        _panel = $('controls');
        _toggle = $('panel-toggle');
        _closeBtn = $('panel-close');
        if (!_panel || !_toggle || !_closeBtn) return;

        _panel.inert = true;
        _toggle.setAttribute('aria-expanded', 'false');
        _toggle.addEventListener('click', function () {
            setPanel(true);
        });
        _closeBtn.addEventListener('click', function () {
            setPanel(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && panelOpen()) setPanel(false);
        });
    }

    function setMax(el, max) {
        max = Math.max(+el.min, Math.floor(max));
        if (+el.max === max) return;
        var before = el.value;
        el.max = String(max);
        if (+el.value > max) el.value = String(max);
        if (el.value !== before) fire(el);
    }

    function applyLimits() {
        if (!_sizeIds || _limiting) return;
        var w = $(_sizeIds.w);
        var h = $(_sizeIds.h);
        var r = $(_sizeIds.r);
        if (!w || !h) return;
        _limiting = true;
        setMax(w, Math.min(+w.dataset.max, window.innerWidth - MARGIN * 2));
        setMax(h, Math.min(+h.dataset.max, window.innerHeight - MARGIN * 2));
        if (r) setMax(r, Math.min(+r.dataset.max, Math.min(+w.value, +h.value) / 2));
        _limiting = false;
    }

    function readStored() {
        try {
            return JSON.parse(localStorage.getItem(_storageKey) || 'null') || {};
        } catch (e) {
            return {};
        }
    }

    function writeStored() {
        try {
            var data = {};
            _controls.forEach(function (el) {
                data[el.id] = el.value;
            });
            localStorage.setItem(_storageKey, JSON.stringify(data));
        } catch (e) {}
    }

    function clearStored() {
        try {
            localStorage.removeItem(_storageKey);
        } catch (e) {}
    }

    function readHash() {
        var h = location.hash.replace(/^#/, '');
        if (!h) return null;
        try {
            return new URLSearchParams(h);
        } catch (e) {
            return null;
        }
    }

    function setValues(values) {
        _controls.forEach(function (el) {
            if (el.dataset.max) el.max = el.dataset.max;
        });
        Object.keys(values).forEach(function (id) {
            var el = $(id);
            if (el && _controls.indexOf(el) !== -1 && values[id] != null) el.value = values[id];
        });
        applyLimits();
        _controls.forEach(fire);
    }

    function shareUrl() {
        var p = new URLSearchParams();
        _controls.forEach(function (el) {
            if (el.value !== el.defaultValue) p.set(el.id, el.value);
        });
        var extras = _shareExtras ? _shareExtras() : null;
        if (extras) {
            Object.keys(extras).forEach(function (k) {
                if (extras[k]) p.set(k, extras[k]);
            });
        }
        var base = location.href.split('#')[0];
        var q = p.toString();
        return q ? base + '#' + q : base;
    }

    function resetSettings() {
        var values = {};
        _controls.forEach(function (el) {
            values[el.id] = el.defaultValue;
        });
        setValues(values);
        clearTimeout(_saveTimer);
        clearStored();
        recenter(true);
    }

    function applyPreset(btn) {
        var values = {};
        if (_sizeIds.w && btn.dataset.w) values[_sizeIds.w] = btn.dataset.w;
        if (_sizeIds.h && btn.dataset.h) values[_sizeIds.h] = btn.dataset.h;
        if (_sizeIds.r && btn.dataset.r) values[_sizeIds.r] = btn.dataset.r;
        setValues(values);
        _restorePos = null;
        recenter(true);
    }

    function copyText(text) {
        function fallback() {
            return new Promise(function (resolve, reject) {
                var prev = document.activeElement;
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
                document.body.appendChild(ta);
                ta.select();
                var ok = false;
                try {
                    ok = document.execCommand('copy');
                } catch (e) {}
                document.body.removeChild(ta);
                if (prev && prev.focus) prev.focus({ preventScroll: true });
                if (ok) resolve();
                else reject(new Error('Copy failed'));
            });
        }
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).catch(fallback);
        }
        return fallback();
    }

    function flash(btn, text) {
        if (!btn.dataset.label) btn.dataset.label = btn.textContent;
        btn.textContent = text;
        clearTimeout(btn._flashTimer);
        btn._flashTimer = setTimeout(function () {
            btn.textContent = btn.dataset.label;
        }, 1600);
    }

    function onResize() {
        if (_resizeQueued) return;
        _resizeQueued = true;
        requestAnimationFrame(function () {
            _resizeQueued = false;
            applyLimits();
            keepInView();
        });
    }
    function init(cfg) {
        _adapter = cfg.adapter || null;
        _sizeIds = cfg.sizeIds || null;
        _storageKey = cfg.storageKey || 'liquid-glass-settings';
        _shareExtras = cfg.shareExtras || null;
        _controls = (cfg.controls || []).map($).filter(Boolean);

        initPanel();
        if (cfg.dragHandle && _adapter) initDrag(cfg.dragHandle);

        if (_sizeIds) {
            [_sizeIds.w, _sizeIds.h, _sizeIds.r].forEach(function (id) {
                var el = $(id);
                if (el) el.dataset.max = el.max;
            });
        }

        var hash = readHash();
        var values = {};
        var fromHash = false;
        if (hash) {
            _controls.forEach(function (el) {
                if (hash.has(el.id)) {
                    values[el.id] = hash.get(el.id);
                    fromHash = true;
                }
            });
            _sharedBg = hash.get('bg') || '';
            if (fromHash || _sharedBg) history.replaceState(null, '', location.href.split('#')[0]);
        }
        if (!fromHash) values = readStored();
        setValues(values);
        if (fromHash) writeStored();

        _controls.forEach(function (el) {
            el.addEventListener('input', function () {
                clearTimeout(_saveTimer);
                _saveTimer = setTimeout(writeStored, 250);
            });
        });

        if (_sizeIds) {
            [_sizeIds.w, _sizeIds.h].forEach(function (id) {
                var el = $(id);
                if (!el) return;
                el.addEventListener('input', function () {
                    applyLimits();
                    keepInView();
                });
            });
        }

        Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (btn) {
            btn.addEventListener('click', function () {
                applyPreset(btn);
            });
        });

        var linkBtn = $('copy-link');
        if (linkBtn) {
            linkBtn.addEventListener('click', function () {
                copyText(shareUrl()).then(
                    function () {
                        flash(linkBtn, 'Link copied');
                    },
                    function () {
                        flash(linkBtn, 'Copy failed');
                    }
                );
            });
        }

        var resetBtn = $('reset-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                resetSettings();
                flash(resetBtn, 'Done');
            });
        }

        window.addEventListener('resize', onResize);
        recenter(false);
    }

    return {
        init: init,
        recenter: recenter,
        keepInView: keepInView,
        setPanel: setPanel,
        copyText: copyText,
        flash: flash,
        isChromium: isChromium,
        isMobile: isMobile,
        sharedBg: function () {
            return _sharedBg;
        },
    };
})();
