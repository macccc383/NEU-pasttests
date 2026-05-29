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

  // B-BAE page file viewer: load clicked file into viewer
  const bbFiles = Array.from(document.querySelectorAll('.bb-file'));
  if (bbFiles.length) {
    let currentIndex = 0;
    // helper to safely encode paths for use as image src
    function safeSrc(s){
      try{ return encodeURI(s); }catch(e){ return s; }
    }
    bbFiles.forEach(function(fileLink, idx){
      fileLink.addEventListener('click', function(e){
        e.preventDefault();
        const src = fileLink.getAttribute('data-src') || fileLink.getAttribute('href');
        const viewer = document.getElementById('bbViewerImg');
        const caption = document.getElementById('bbViewerCaption');
        if (viewer) {
          // apply rotation class if requested by the link
          const rotateFlag = (fileLink.dataset && fileLink.dataset.rotate) || fileLink.getAttribute('data-rotate');
          viewer.classList.toggle('bb-rotated-right', rotateFlag === '90' || rotateFlag === 'right');
          // set loading state, then set encoded src
          viewer.classList.remove('bb-img-error');
          viewer.classList.add('bb-img-loading');
          viewer.alt = fileLink.textContent.trim();
          viewer.src = safeSrc(src);
          viewer.onload = function(){ viewer.classList.remove('bb-img-loading'); viewer.classList.remove('bb-img-error'); };
          viewer.onerror = function(){
            viewer.classList.remove('bb-img-loading');
            viewer.classList.add('bb-img-error');
            if (caption) {
              const href = safeSrc(src);
              caption.innerHTML = 'Không thể tải ' + fileLink.textContent.trim() + ' — <a href="' + href + '" target="_blank" rel="noopener">Mở trong tab mới</a> hoặc <a href="' + href + '" download>Tải xuống</a>';
            }
          };
        }
        if (caption) caption.textContent = fileLink.textContent.trim();
        currentIndex = idx;
      });
    });

    // inline viewer click opens lightbox
    const inlineViewer = document.getElementById('bbViewerImg');
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
      lightboxImg.src = safeSrc(lbSrc);
      lightboxImg.alt = bbFiles[currentIndex].textContent.trim();
      // apply rotation class for lightbox image when needed
      const lbRotateFlag = (bbFiles[currentIndex].dataset && bbFiles[currentIndex].dataset.rotate) || bbFiles[currentIndex].getAttribute('data-rotate');
      lightboxImg.classList.toggle('bb-rotated-right', lbRotateFlag === '90' || lbRotateFlag === 'right');
      if (lightboxCaption) lightboxCaption.textContent = bbFiles[currentIndex].textContent.trim();
      lightboxImg.onerror = function(){
        if (lightboxCaption) {
          const href = safeSrc(lbSrc || '');
          lightboxCaption.innerHTML = 'Không thể tải ' + bbFiles[currentIndex].textContent.trim() + ' — <a href="' + href + '" target="_blank" rel="noopener">Mở trong tab mới</a>';
        }
      };
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox(){
      if (!lightbox) return;
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden','true');
      lightboxImg.src = '';
      lightboxImg.classList.remove('bb-rotated-right');
      document.body.style.overflow = '';
    }

    if (inlineViewer) {
      inlineViewer.style.cursor = 'zoom-in';
      inlineViewer.addEventListener('click', function(){ openLightbox(currentIndex); });
    }
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function(){ openLightbox((currentIndex-1+bbFiles.length)%bbFiles.length); });
    if (lbNext) lbNext.addEventListener('click', function(){ openLightbox((currentIndex+1)%bbFiles.length); });

    // close on backdrop click
    if (lightbox) {
      lightbox.addEventListener('click', function(e){ if (e.target === lightbox) closeLightbox(); });
    }

    // keyboard navigation
    document.addEventListener('keydown', function(e){
      if (lightbox && lightbox.classList.contains('open')) {
        if (e.key === 'ArrowLeft') openLightbox((currentIndex-1+bbFiles.length)%bbFiles.length);
        if (e.key === 'ArrowRight') openLightbox((currentIndex+1)%bbFiles.length);
        if (e.key === 'Escape') closeLightbox();
      }
    });

    // auto-open first file inline
    if (bbFiles[0]) bbFiles[0].click();
  }
});
