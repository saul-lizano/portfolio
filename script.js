document.documentElement.classList.add('js-enabled');

const storyPanels = [...document.querySelectorAll('.story-panel')];
const navigationLinks = [...document.querySelectorAll('.nav-links a')];
const navigationStops = [...document.querySelectorAll(
    '.story-panel, .section-shell, .education-card, .work-card, .certifications-card, .skills-grid, .site-footer'
)];

function getCurrentStopIndex() {
    const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const viewportStart = window.scrollY + scrollPadding + 1;
    return navigationStops.reduce((current, stop, index) => {
        const documentTop = stop.getBoundingClientRect().top + window.scrollY;
        return documentTop <= viewportStart ? index : current;
    }, 0);
}

let scrollAnimationFrame = 0;
let originalScrollBehavior = null;

function cancelScrollAnimation() {
    if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame);
    scrollAnimationFrame = 0;

    if (originalScrollBehavior !== null) {
        document.documentElement.style.scrollBehavior = originalScrollBehavior;
        originalScrollBehavior = null;
    }
}

function scrollToStop(index) {
    const stop = navigationStops[index];
    if (!stop) return;

    cancelScrollAnimation();
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollPadding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const maxScroll = root.scrollHeight - window.innerHeight;
    const targetY = Math.max(0, Math.min(
        stop.getBoundingClientRect().top + window.scrollY - scrollPadding,
        maxScroll
    ));
    const startY = window.scrollY;
    const distance = targetY - startY;

    if (reducedMotion || Math.abs(distance) < 1) {
        window.scrollTo(0, targetY);
        return;
    }

    const duration = Math.min(900, Math.max(560, Math.abs(distance) * 0.9));
    const startTime = performance.now();
    originalScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';

    function animateScroll(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const easedProgress = progress * progress * (3 - 2 * progress);
        window.scrollTo(0, startY + distance * easedProgress);

        if (progress < 1) {
            scrollAnimationFrame = requestAnimationFrame(animateScroll);
            return;
        }

        window.scrollTo(0, targetY);
        root.style.scrollBehavior = originalScrollBehavior;
        originalScrollBehavior = null;
        scrollAnimationFrame = 0;
    }

    scrollAnimationFrame = requestAnimationFrame(animateScroll);
}

function moveToStop(direction, currentIndex = getCurrentStopIndex()) {
    if (!navigationStops.length) return;
    const targetIndex = Math.max(0, Math.min(currentIndex + direction, navigationStops.length - 1));
    scrollToStop(targetIndex);
}

document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) return;
    if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.matches('input, textarea, select'))) return;
    if (!navigationStops.length) return;

    if (event.key === 'Home' || event.key === 'End') {
        if (event.cancelable) event.preventDefault();
        const targetIndex = event.key === 'Home' ? 0 : navigationStops.length - 1;
        scrollToStop(targetIndex);
        return;
    }

    event.preventDefault();
    moveToStop(event.key === 'ArrowDown' || event.key === 'PageDown' ? 1 : -1);
});

let touchStart = null;
let touchStartStopIndex = 0;
let touchGestureHandled = false;
document.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) {
        touchStart = null;
        return;
    }

    touchStart = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
    };
    touchStartStopIndex = getCurrentStopIndex();
    touchGestureHandled = false;
}, { passive: true });

document.addEventListener('touchmove', event => {
    if (!touchStart || event.touches.length !== 1 || touchGestureHandled) return;
    const deltaX = touchStart.x - event.touches[0].clientX;
    const deltaY = touchStart.y - event.touches[0].clientY;
    if (Math.abs(deltaY) < 24 || Math.abs(deltaY) <= Math.abs(deltaX)) return;

    if (event.cancelable) event.preventDefault();
    touchGestureHandled = true;
    moveToStop(deltaY > 0 ? 1 : -1, touchStartStopIndex);
}, { passive: false });

function resetTouchGesture() {
    touchStart = null;
}

document.addEventListener('touchend', resetTouchGesture, { passive: true });
document.addEventListener('touchcancel', resetTouchGesture, { passive: true });

if (storyPanels.length) {
    const activatePanel = panel => {
        storyPanels.forEach(item => item.classList.toggle('is-active', item === panel));
    };

    storyPanels[0].classList.add('is-active');

    if ('IntersectionObserver' in window) {
        const showcase = document.querySelector('.showcase');
        if (showcase) {
            const sceneVisibilityObserver = new IntersectionObserver(([entry]) => {
                document.documentElement.classList.toggle('showcase-outside', !entry.isIntersecting);
            });
            sceneVisibilityObserver.observe(showcase);
        }

        const storyObserver = new IntersectionObserver(entries => {
            const visiblePanels = entries.filter(entry => entry.isIntersecting);
            if (!visiblePanels.length) return;
            const viewportCenter = window.innerHeight / 2;
            const activeEntry = visiblePanels.reduce((closest, entry) => {
                const bounds = entry.target.getBoundingClientRect();
                const distance = Math.abs(bounds.top + bounds.height / 2 - viewportCenter);
                return distance < closest.distance ? { entry, distance } : closest;
            }, { entry: visiblePanels[0], distance: Infinity }).entry;
            activatePanel(activeEntry.target);
        }, { threshold: 0, rootMargin: '-40% 0px -40% 0px' });
        storyPanels.forEach(panel => storyObserver.observe(panel));

        const sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navigationLinks.forEach(link => {
                    link.classList.toggle('is-current', link.hash === `#${entry.target.id}`);
                });
            });
        }, { rootMargin: '-35% 0px -55% 0px' });

        document.querySelectorAll('main section[id], .story-panel[id]').forEach(section => sectionObserver.observe(section));
    }
} else {
    storyPanels.forEach(panel => panel.classList.add('is-active'));
}
