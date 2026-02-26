var BgPicker = (function () {
    var STORAGE_KEY = 'liquid-glass-custom-bg';

    var TEMPLATES = [
        {
            label: 'Interior',
            url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop',
        },
        {
            label: '1',
            thumb: './backgrounds/image1.jpg',
            url: './backgrounds/image1.jpg',
        },
        {
            label: '2',
            thumb: './backgrounds/image2.jpg',
            url: './backgrounds/image2.jpg',
        },
        {
            label: '3',
            thumb: './backgrounds/image3.jpg',
            url: './backgrounds/image3.jpg',
        },
        {
            label: '4',
            thumb: './backgrounds/image4.jpg',
            url: './backgrounds/image4.jpg',
        },
    ];

    var _onApply = null;
    var _defaultUrl = '';
    var _currentUrl = '';
    var _thumbEls = [];
    var _customThumb = null;
    var _urlInput = null;

    function savedUrl() {
        try {
            return localStorage.getItem(STORAGE_KEY) || '';
        } catch (e) {
            return '';
        }
    }

    function saveUrl(url) {
        try {
            if (url && url !== _defaultUrl) {
                localStorage.setItem(STORAGE_KEY, url);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {}
    }

    function validateImage(url) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            var timer = setTimeout(function () {
                img.src = '';
                reject(new Error('Image load timed out.'));
            }, 12000);
            img.onload = function () {
                clearTimeout(timer);
                resolve(url);
            };
            img.onerror = function () {
                clearTimeout(timer);
                reject(new Error('Failed to load image. The URL may be invalid, not an image, or blocked by CORS.'));
            };
            img.src = url;
        });
    }

    function setActive(url) {
        _currentUrl = url;
        _thumbEls.forEach(function (obj) {
            if (obj.url === url) {
                obj.el.classList.add('active');
            } else {
                obj.el.classList.remove('active');
            }
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
        _onApply(url);
        setActive(url);
        if (!skipSave) saveUrl(url);
    }

    function handleCustomUrl() {
        var url = _urlInput.value.trim();
        if (!url) return;
        validateImage(url)
            .then(function () {
                applyUrl(url);
                _urlInput.value = '';
            })
            .catch(function (err) {
                alert(err.message);
            });
    }

    function resetToDefault() {
        _urlInput.value = '';
        saveUrl('');
        applyUrl(_defaultUrl, true);
    }

    function buildUI(container) {
        var grid = document.createElement('div');
        grid.className = 'bg-thumbs';

        TEMPLATES.forEach(function (tmpl) {
            var img = document.createElement('img');
            img.className = 'bg-thumb';
            img.src = tmpl.thumb || tmpl.url;
            img.alt = tmpl.label;
            img.title = tmpl.label;
            img.draggable = false;
            img.addEventListener('click', function () {
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
        _customThumb.title = 'Custom URL';
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
        _urlInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') handleCustomUrl();
        });
        row.appendChild(_urlInput);

        var goBtn = document.createElement('button');
        goBtn.type = 'button';
        goBtn.className = 'bg-btn';
        goBtn.textContent = 'Load';
        goBtn.addEventListener('click', handleCustomUrl);
        row.appendChild(goBtn);

        var resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'bg-btn reset';
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', resetToDefault);
        row.appendChild(resetBtn);

        container.appendChild(row);
    }

    function init(opts) {
        _onApply = opts.onApply;
        _defaultUrl = opts.defaultUrl;

        var container = document.getElementById('bg-picker');
        if (!container) return;

        buildUI(container);

        var stored = savedUrl();
        if (stored) {
            validateImage(stored)
                .then(function () {
                    applyUrl(stored, true);
                })
                .catch(function () {
                    saveUrl('');
                    applyUrl(_defaultUrl, true);
                });
        } else {
            applyUrl(_defaultUrl, true);
        }
    }

    return { init: init };
})();
