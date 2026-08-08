// Contact form handler (only if form exists)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function(e){
    e.preventDefault();
    const email = document.getElementById('email')?.value || '';
    const msgEl = document.getElementById('msg');
    if (msgEl) msgEl.textContent = `Thanks — we'll reach out to ${email}.`;
  });
}

// Q&A toggle behavior
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.qa-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      const id = btn.getAttribute('aria-controls');
      const content = document.getElementById(id);
      if (!content) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (!expanded) {
        btn.setAttribute('aria-expanded','true');
        content.setAttribute('aria-hidden','false');
        btn.classList.add('open');
        // expand
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        btn.setAttribute('aria-expanded','false');
        content.setAttribute('aria-hidden','true');
        btn.classList.remove('open');
        // animate close
        content.style.maxHeight = content.scrollHeight + 'px';
        requestAnimationFrame(function(){ content.style.maxHeight = '0'; });
        content.addEventListener('transitionend', function handler(e){
          if (e.propertyName === 'max-height') {
            content.style.maxHeight = '';
            content.removeEventListener('transitionend', handler);
          }
        });
      }
    });
  });

  // B-BAE page interactive file viewer & review protocol
  const bbFiles = Array.from(document.querySelectorAll('.bb-file'));
  if (bbFiles.length) {
    let currentIndex = 0;
    let currentRotation = 0;
    let currentZoom = 1.0;

    const viewerImg = document.getElementById('bbViewerImg');
    const viewerFrame = document.getElementById('bbViewerFrame');
    const captionEl = document.getElementById('bbViewerCaption');
    const counterEl = document.getElementById('bbDocCounter');
    const titleEl = document.getElementById('bbDocTitle');
    const btnZoomReset = document.getElementById('bbBtnZoomReset');

    function safeSrc(s) {
      if (!s) return '';
      try {
        // decode first if already partially encoded, then encodeURI cleanly
        const raw = decodeURIComponent(s);
        return encodeURI(raw);
      } catch(e) {
        return encodeURI(s);
      }
    }

    function updateImageTransform() {
      if (!viewerImg || !viewerFrame) return;

      const rot = ((currentRotation % 360) + 360) % 360;
      const fw = viewerFrame.clientWidth || 800;
      const fh = viewerFrame.clientHeight || 600;

      let rotationScale = 1.0;

      if (rot === 90 || rot === 270) {
        const nw = viewerImg.naturalWidth;
        const nh = viewerImg.naturalHeight;

        let cw = viewerImg.clientWidth;
        let ch = viewerImg.clientHeight;

        // If clientWidth/clientHeight aren't layout-ready yet, derive from natural dimensions & container
        if ((!cw || !ch || cw < 10 || ch < 10) && nw && nh) {
          const fitScale = Math.min(fw / nw, fh / nh);
          cw = nw * fitScale;
          ch = nh * fitScale;
        }

        if (cw > 0 && ch > 0) {
          const scaleForW = fw / ch;
          const scaleForH = fh / cw;
          rotationScale = Math.min(1.0, scaleForW, scaleForH);
        }
      }

      const finalScale = rotationScale * currentZoom;
      viewerImg.style.transform = `rotate(${rot}deg) scale(${finalScale})`;

      if (btnZoomReset) {
        btnZoomReset.textContent = Math.round(currentZoom * 100) + '%';
      }
    }

    function preloadAdjacent(idx) {
      const nextIdx = (idx + 1) % bbFiles.length;
      const prevIdx = (idx - 1 + bbFiles.length) % bbFiles.length;
      [nextIdx, prevIdx].forEach(function(i) {
        const src = bbFiles[i].getAttribute('data-src') || bbFiles[i].getAttribute('href');
        if (src) {
          const img = new Image();
          img.src = safeSrc(src);
        }
      });
    }

    function loadDoc(idx) {
      currentIndex = idx;
      const link = bbFiles[currentIndex];
      if (!link) return;

      // Active state in sidebar
      bbFiles.forEach(function(f, i){
        f.classList.toggle('active', i === currentIndex);
      });

      const src = link.getAttribute('data-src') || link.getAttribute('href');
      const filename = link.textContent.trim();
      const parentSection = link.closest('ul')?.previousElementSibling?.textContent?.trim() || '';

      // Default rotation flag
      const rotateFlag = (link.dataset && link.dataset.rotate) || link.getAttribute('data-rotate');
      let defaultRot = parseInt(rotateFlag, 10);
      if (isNaN(defaultRot)) {
        if (rotateFlag === 'left') defaultRot = 270;
        else if (rotateFlag === 'right') defaultRot = 90;
        else defaultRot = 0;
      }
      currentRotation = ((defaultRot % 360) + 360) % 360;
      currentZoom = 1.0;

      // UI text
      if (counterEl) counterEl.textContent = (currentIndex + 1) + ' / ' + bbFiles.length;
      if (titleEl) titleEl.textContent = parentSection ? (parentSection + ' — ' + filename) : filename;
      if (captionEl) captionEl.textContent = parentSection ? (parentSection + ' / ' + filename) : filename;

      if (viewerImg && viewerFrame) {
        viewerFrame.classList.add('loading');
        viewerFrame.classList.remove('error');

        // Reset transform during image transition
        viewerImg.style.transform = 'none';

        viewerImg.alt = filename;
        viewerImg.src = safeSrc(src);

        function onFinishLoad() {
          viewerFrame.classList.remove('loading');
          viewerFrame.classList.remove('error');
          updateImageTransform();
        }

        if (viewerImg.complete && viewerImg.naturalWidth > 0) {
          onFinishLoad();
        } else {
          viewerImg.onload = onFinishLoad;
        }

        viewerImg.onerror = function() {
          viewerFrame.classList.remove('loading');
          viewerFrame.classList.add('error');
          if (captionEl) {
            const href = safeSrc(src);
            captionEl.innerHTML = 'Không thể tải ' + filename + ' — <a href="' + href + '" target="_blank" rel="noopener">Mở trong tab mới</a> hoặc <a href="' + href + '" download>Tải xuống</a>';
          }
        };
      }

      preloadAdjacent(currentIndex);
    }

    // Controls Toolbar Handlers
    document.getElementById('bbBtnPrev')?.addEventListener('click', function(){
      loadDoc((currentIndex - 1 + bbFiles.length) % bbFiles.length);
    });
    document.getElementById('bbBtnNext')?.addEventListener('click', function(){
      loadDoc((currentIndex + 1) % bbFiles.length);
    });
    document.getElementById('bbBtnRotateLeft')?.addEventListener('click', function(){
      currentRotation = (currentRotation + 270) % 360;
      updateImageTransform();
    });
    document.getElementById('bbBtnRotateRight')?.addEventListener('click', function(){
      currentRotation = (currentRotation + 90) % 360;
      updateImageTransform();
    });
    document.getElementById('bbBtnZoomIn')?.addEventListener('click', function(){
      currentZoom = Math.min(3.0, currentZoom + 0.25);
      updateImageTransform();
    });
    document.getElementById('bbBtnZoomOut')?.addEventListener('click', function(){
      currentZoom = Math.max(0.4, currentZoom - 0.25);
      updateImageTransform();
    });
    document.getElementById('bbBtnZoomReset')?.addEventListener('click', function(){
      currentZoom = 1.0;
      updateImageTransform();
    });
    document.getElementById('bbBtnFullscreen')?.addEventListener('click', function(){
      openLightbox(currentIndex);
    });

    // Window resize recalculates transform bounds
    window.addEventListener('resize', updateImageTransform);

    // Sidebar file links click
    bbFiles.forEach(function(fileLink, idx){
      fileLink.addEventListener('click', function(e){
        e.preventDefault();
        loadDoc(idx);
      });
    });

    // Lightbox Modal
    const lightbox = document.getElementById('bbLightbox');
    const lightboxImg = document.getElementById('bbLightboxImg');
    const lightboxCaption = document.getElementById('bbLightboxCaption');
    const lbClose = document.querySelector('.bb-lb-close');
    const lbPrev = document.querySelector('.bb-lb-prev');
    const lbNext = document.querySelector('.bb-lb-next');

    function openLightbox(idx){
      currentIndex = idx;
      if (!lightbox) return;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden','false');
      const lbSrc = bbFiles[currentIndex].getAttribute('data-src') || bbFiles[currentIndex].getAttribute('href');
      const filename = bbFiles[currentIndex].textContent.trim();
      lightboxImg.src = safeSrc(lbSrc);
      lightboxImg.alt = filename;

      // rotation class
      lightboxImg.style.transform = `rotate(${currentRotation}deg)`;

      if (lightboxCaption) lightboxCaption.textContent = filename;
      lightboxImg.onerror = function(){
        if (lightboxCaption) {
          const href = safeSrc(lbSrc || '');
          lightboxCaption.innerHTML = 'Không thể tải ' + filename + ' — <a href="' + href + '" target="_blank" rel="noopener">Mở trong tab mới</a>';
        }
      };
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox(){
      if (!lightbox) return;
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden','true');
      lightboxImg.src = '';
      lightboxImg.style.transform = '';
      document.body.style.overflow = '';
    }

    if (viewerImg) {
      viewerImg.addEventListener('click', function(){ openLightbox(currentIndex); });
    }
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function(){ openLightbox((currentIndex - 1 + bbFiles.length) % bbFiles.length); });
    if (lbNext) lbNext.addEventListener('click', function(){ openLightbox((currentIndex + 1) % bbFiles.length); });

    if (lightbox) {
      lightbox.addEventListener('click', function(e){ if (e.target === lightbox) closeLightbox(); });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', function(e){
      if (lightbox && lightbox.classList.contains('open')) {
        if (e.key === 'ArrowLeft') openLightbox((currentIndex - 1 + bbFiles.length) % bbFiles.length);
        if (e.key === 'ArrowRight') openLightbox((currentIndex + 1) % bbFiles.length);
        if (e.key === 'Escape') closeLightbox();
      } else {
        if (e.key === 'ArrowLeft') loadDoc((currentIndex - 1 + bbFiles.length) % bbFiles.length);
        if (e.key === 'ArrowRight') loadDoc((currentIndex + 1) % bbFiles.length);
      }
    });

    // Auto-load first file
    loadDoc(0);
  }
});
