  componentDidMount() { this.applyGlass(); }
  componentDidUpdate() { this.applyGlass(); }
  // Liquid glass: edge refraction = SVG displacement map over backdrop-filter
  // (approach from rdev/liquid-glass-react, MIT). Chromium only; Safari/Firefox keep the plain blur.
  applyGlass() {
    var ua = navigator.userAgent;
    if (!/Chrome\//.test(ua) || /Firefox\//.test(ua)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
    var self = this;
    requestAnimationFrame(function () {
      var host = document.getElementById('lg-defs');
      if (!host) {
        host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        host.setAttribute('id', 'lg-defs');
        host.setAttribute('width', '0');
        host.setAttribute('height', '0');
        host.setAttribute('aria-hidden', 'true');
        host.style.position = 'absolute';
        document.body.appendChild(host);
      }
      var els = document.querySelectorAll('[data-glass]');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
        if (!w || !h) continue;
        var r = Math.min(parseFloat(el.getAttribute('data-glass')) || 0, w / 2, h / 2);
        var edge = Math.min(parseFloat(el.getAttribute('data-glass-edge')) || 16, w / 2, h / 2);
        var scale = parseFloat(el.getAttribute('data-glass-scale')) || 36;
        var id = ['lg', w, h, Math.round(r), Math.round(edge), Math.round(scale)].join('-');
        if (!document.getElementById(id)) {
          var url = self.glassMap(w, h, r, edge);
          var ch = function (name, k, m) {
            return '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + (scale * k).toFixed(1) + '" xChannelSelector="R" yChannelSelector="G" result="d' + name + '"></feDisplacementMap>' +
              '<feColorMatrix in="d' + name + '" type="matrix" values="' + m + '" result="' + name + '"></feColorMatrix>';
          };
          host.insertAdjacentHTML('beforeend',
            '<filter id="' + id + '" x="0" y="0" width="' + w + '" height="' + h + '" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
            '<feImage href="' + url + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="none" result="map"></feImage>' +
            ch('r', 1, '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0') +
            ch('g', 0.95, '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0') +
            ch('b', 0.9, '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0') +
            '<feBlend in="r" in2="g" mode="screen" result="rg"></feBlend>' +
            '<feBlend in="rg" in2="b" mode="screen"></feBlend>' +
            '</filter>');
        }
        el.style.filter = 'url(#' + id + ')';
      }
    });
  }
  glassMap(w, h, r, edge) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    var hw = w / 2, hh = h / 2;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var px = x + 0.5 - hw, py = y + 0.5 - hh;
        var qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
        var sd = Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
        var dist = Math.max(-sd, 0), nx = 0, ny = 0;
        if (qx > 0 && qy > 0) { var L = Math.hypot(qx, qy) || 1; nx = qx / L; ny = qy / L; }
        else if (qx > qy) { nx = 1; } else { ny = 1; }
        nx *= px < 0 ? -1 : 1; ny *= py < 0 ? -1 : 1;
        var k = dist < edge ? Math.pow(1 - dist / edge, 2) : 0;
        var o = (y * w + x) * 4;
        d[o] = Math.round(127.5 - nx * k * 127);
        d[o + 1] = Math.round(127.5 - ny * k * 127);
        d[o + 2] = 128;
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }
