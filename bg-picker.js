var BgPicker = (function () {
    var STORAGE_KEY = 'liquid-glass-custom-bg';

    var MSG_FAILED = "Couldn't load that image. Check the link points straight to an image file.";
    var MSG_TIMEOUT = 'The image took too long to load.';
    var MSG_CORS =
        "That site doesn't let other pages use its images in WebGL. Download the image and use Upload, or try it in the SVG version.";
    var MSG_NOT_IMAGE = 'That file is not an image.';

    var TEMPLATES = [
        {
            label: 'Interior',
            thumb: './backgrounds/thumbs/default.jpg',
            url: './backgrounds/default.avif',
        },
        {
            label: '1',
            thumb: './backgrounds/thumbs/image1.jpg',
            url: './backgrounds/image1.jpg',
        },
        {
            label: '2',
            thumb: './backgrounds/thumbs/image2.jpg',
            url: './backgrounds/image2.jpg',
        },
        {
            label: '3',
            thumb: './backgrounds/thumbs/image3.jpg',
            url: './backgrounds/image3.jpg',
        },
        {
            label: '4',
            thumb: './backgrounds/thumbs/image4.jpg',
            url: './backgrounds/image4.jpg',
        },
    ];

    var _onApply = null;
    var _defaultUrl = '';
    var _currentUrl = '';
    var _requireCors = false;
    var _uploadedUrl = '';
    var _thumbEls = [];
    var _customThumb = null;
    var _urlInput = null;
    var _goBtn = null;
    var _errorEl = null;

    function isLocalOnly(url) {
        return /^(blob|data):/i.test(url || '');
    }

    function savedUrl() {
        try {
            return localStorage.getItem(STORAGE_KEY) || '';
        } catch (e) {
            return '';
        }
    }

    function saveUrl(url) {
        if (isLocalOnly(url)) return;
        try {
            if (url && url !== _defaultUrl) {
                localStorage.setItem(STORAGE_KEY, url);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {}
    }

    function showError(msg) {
        if (!_errorEl) return;
        _errorEl.textContent = msg;
        _errorEl.hidden = !msg;
    }

    function clearError() {
        showError('');
    }

    function loadImage(url, cors) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            var done = false;
            if (cors) img.crossOrigin = 'anonymous';
            var timer = setTimeout(function () {
                if (done) return;
                done = true;
                img.src = '';
                var err = new Error(MSG_TIMEOUT);
                err.timeout = true;
                reject(err);
            }, 12000);
            img.onload = function () {
                if (done) return;
                done = true;
                clearTimeout(timer);
                resolve(url);
            };
            img.onerror = function () {
                if (done) return;
                done = true;
                clearTimeout(timer);
                reject(new Error(MSG_FAILED));
            };
            img.src = url;
        });
    }

    function validateImage(url) {
        return loadImage(url, true).catch(function (err) {
            if (err.timeout) throw err;
            return loadImage(url, false).then(function () {
                if (_requireCors) {
                    var corsErr = new Error(MSG_CORS);
                    corsErr.cors = true;
                    throw corsErr;
                }
                return url;
            });
        });
    }

    function setActive(url) {
        _currentUrl = url;
        _thumbEls.forEach(function (obj) {
            var on = obj.url === url;
            obj.el.classList.toggle('active', on);
            obj.el.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var isTemplate = TEMPLATES.some(function (t) {
            return t.url === url;
        });
        if (!isTemplate && url) {
            _customThumb.src = url;
            _customThumb.parentElement.classList.add('visible');
            _customThumb.classList.add('active');
        } else {
            _customThumb.parentElement.classList.remove('visible');
            _customThumb.classList.remove('active');
        }
    }

    function applyUrl(url, skipSave) {
        clearError();
        return Promise.resolve()
            .then(function () {
                return _onApply(url);
            })
            .then(function () {
                setActive(url);
                if (!skipSave) saveUrl(url);
                return true;
            })
            .catch(function (err) {
                showError((err && err.message) || MSG_FAILED);
                return false;
            });
    }

    function handleCustomUrl() {
        var url = _urlInput.value.trim();
        if (!url) return;
        clearError();
        _goBtn.disabled = true;
        validateImage(url)
            .then(function () {
                return applyUrl(url).then(function (ok) {
                    if (ok) _urlInput.value = '';
                });
            })
            .catch(function (err) {
                showError(err.message);
            })
            .then(function () {
                _goBtn.disabled = false;
            });
    }

    function handleFile(file) {
        if (!file) return;
        if (!/^image\//.test(file.type)) {
            showError(MSG_NOT_IMAGE);
            return;
        }
        var url = URL.createObjectURL(file);
        clearError();
        validateImage(url)
            .then(function () {
                return applyUrl(url, true);
            })
            .then(function (ok) {
                if (!ok) {
                    URL.revokeObjectURL(url);
                    return;
                }
                if (_uploadedUrl) URL.revokeObjectURL(_uploadedUrl);
                _uploadedUrl = url;
            })
            .catch(function (err) {
                URL.revokeObjectURL(url);
                showError(err.message);
            });
    }

    function resetToDefault() {
        _urlInput.value = '';
        saveUrl('');
        applyUrl(_defaultUrl, true);
    }

    function hasFiles(e) {
        return !!e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') !== -1;
    }

    function initDrop() {
        var depth = 0;
        window.addEventListener('dragenter', function (e) {
            if (!hasFiles(e)) return;
            e.preventDefault();
            depth++;
            document.body.classList.add('drop-active');
        });
        window.addEventListener('dragover', function (e) {
            if (!hasFiles(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        window.addEventListener('dragleave', function (e) {
            if (!hasFiles(e)) return;
            depth = Math.max(0, depth - 1);
            if (!depth) document.body.classList.remove('drop-active');
        });
        window.addEventListener('drop', function (e) {
            if (!hasFiles(e)) return;
            e.preventDefault();
            depth = 0;
            document.body.classList.remove('drop-active');
            handleFile(e.dataTransfer.files[0]);
        });
    }

    function makeThumbPressable(img, onPress) {
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.addEventListener('click', onPress);
        img.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPress();
            }
        });
    }

    function buildUI(container) {
        var grid = document.createElement('div');
        grid.className = 'bg-thumbs';

        TEMPLATES.forEach(function (tmpl) {
            var img = document.createElement('img');
            img.className = 'bg-thumb';
            img.src = tmpl.thumb || tmpl.url;
            img.alt = 'Background ' + tmpl.label;
            img.title = tmpl.label;
            img.draggable = false;
            img.loading = 'lazy';
            img.decoding = 'async';
            makeThumbPressable(img, function () {
                applyUrl(tmpl.url);
            });

            img.addEventListener('error', function () {
                img.style.display = 'none';
            });
            grid.appendChild(img);
            _thumbEls.push({ el: img, url: tmpl.url });
        });

        var customWrap = document.createElement('span');
        customWrap.className = 'bg-thumb-custom';
        _customThumb = document.createElement('img');
        _customThumb.className = 'bg-thumb';
        _customThumb.alt = 'Custom';
        _customThumb.title = 'Custom image';
        _customThumb.draggable = false;
        customWrap.appendChild(_customThumb);
        grid.appendChild(customWrap);
        _thumbEls.push({ el: _customThumb, url: '__custom__' });

        container.appendChild(grid);

        var row = document.createElement('div');
        row.className = 'bg-url-row';

        _urlInput = document.createElement('input');
        _urlInput.type = 'text';
        _urlInput.id = 'bg-url';
        _urlInput.placeholder = 'Paste image URL…';
        _urlInput.setAttribute('aria-label', 'Image URL');
        _urlInput.inputMode = 'url';
        _urlInput.autocomplete = 'off';
        _urlInput.spellcheck = false;
        _urlInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') handleCustomUrl();
        });
        _urlInput.addEventListener('input', clearError);
        row.appendChild(_urlInput);

        _goBtn = document.createElement('button');
        _goBtn.type = 'button';
        _goBtn.className = 'bg-btn';
        _goBtn.textContent = 'Load';
        _goBtn.addEventListener('click', handleCustomUrl);
        row.appendChild(_goBtn);

        container.appendChild(row);

        var actions = document.createElement('div');
        actions.className = 'bg-url-row';

        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.hidden = true;
        fileInput.addEventListener('change', function () {
            handleFile(fileInput.files && fileInput.files[0]);
            fileInput.value = '';
        });
        actions.appendChild(fileInput);

        var uploadBtn = document.createElement('button');
        uploadBtn.type = 'button';
        uploadBtn.className = 'bg-btn bg-btn-wide';
        uploadBtn.textContent = 'Upload image';
        uploadBtn.addEventListener('click', function () {
            fileInput.click();
        });
        actions.appendChild(uploadBtn);

        var resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'bg-btn reset';
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', resetToDefault);
        actions.appendChild(resetBtn);

        container.appendChild(actions);

        var hint = document.createElement('p');
        hint.className = 'bg-hint';
        hint.textContent = 'Or drop an image anywhere on the page.';
        container.appendChild(hint);

        _errorEl = document.createElement('p');
        _errorEl.className = 'bg-error';
        _errorEl.setAttribute('role', 'alert');
        _errorEl.hidden = true;
        container.appendChild(_errorEl);
    }
    function init(opts) {
        _onApply = opts.onApply;
        _defaultUrl = opts.defaultUrl;
        _requireCors = !!opts.requireCors;

        var container = document.getElementById('bg-picker');
        if (!container) return;

        buildUI(container);
        initDrop();

        var shared = opts.initialUrl || '';
        var stored = savedUrl();
        var first = shared || stored;
        if (first && first !== _defaultUrl) {
            validateImage(first)
                .then(function () {
                    return applyUrl(first, !shared);
                })
                .catch(function (err) {
                    if (!shared && !err.cors) saveUrl('');
                    applyUrl(_defaultUrl, true).then(function () {
                        if (shared || err.cors) showError(err.message);
                    });
                });
        } else {
            applyUrl(_defaultUrl, true);
        }
    }

    function getShareUrl() {
        if (!_currentUrl || _currentUrl === _defaultUrl || isLocalOnly(_currentUrl)) return '';
        return _currentUrl;
    }

    return { init: init, showError: showError, getShareUrl: getShareUrl };
})();
