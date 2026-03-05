(function () {
    'use strict';

    let currentSection = 0;
    let isAnimating = false;
    let sections = [];
    const ANIMATION_DURATION = 400;
    const WHEEL_THRESHOLD = 30;
    let accumulatedDelta = 0;
    let wheelTimeout = null;

    function init() {
        sections = Array.from(document.querySelectorAll('section'));
        if (sections.length === 0) return;

        // Disable default scroll, we manage it
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        document.documentElement.style.touchAction = 'none';

        const container = getScrollContainer();
        if (container && container !== window) {
            container.style.overflow = 'hidden';
            container.style.touchAction = 'none';
        }

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('resize', onResize);

        // Touch support
        let touchStartY = 0;
        let touchStartTime = 0;
        document.body.addEventListener('touchstart', function (e) {
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: false });

        document.body.addEventListener('touchmove', function (e) {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        document.body.addEventListener('touchend', function (e) {
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;
            const elapsed = Date.now() - touchStartTime;

            // Lower threshold for quick swipes
            const threshold = elapsed < 300 ? 30 : 50;

            if (Math.abs(diff) > threshold) {
                handleSnap(diff > 0 ? 1 : -1);
            }
        });

        currentSection = 0;
        positionSections();
        showSection(0, false);

        // Initialize AOS if loaded
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                once: false
            });
        }
    }

    function getScrollContainer() {
        return document.querySelector('.mud-main-content') || document.documentElement;
    }

    function positionSections() {
        // Measure each section's real height
        sections.forEach(function (section) {
            section.style.position = '';
            section.style.overflow = '';
        });
    }

    function getSectionNaturalHeight(index) {
        return sections[index] ? sections[index].scrollHeight : 0;
    }

    function isTallSection(index) {
        return getSectionNaturalHeight(index) > window.innerHeight + 5;
    }

    function showSection(index, smooth) {
        if (index < 0 || index >= sections.length) return;

        const section = sections[index];
        const top = section.offsetTop;

        window.scrollTo({
            top: top,
            behavior: smooth ? 'smooth' : 'instant'
        });
    }

    // Track internal scroll of tall sections
    let internalScrollTop = 0;

    function scrollToSection(index, direction) {
        if (index < 0 || index >= sections.length) return;
        if (isAnimating) return;

        isAnimating = true;
        currentSection = index;
        internalScrollTop = 0;

        const section = sections[index];

        // If going backwards to a tall section, scroll to its bottom
        if (direction === -1 && isTallSection(index)) {
            const maxScroll = section.scrollHeight - window.innerHeight;
            internalScrollTop = maxScroll;

            // Scroll so the bottom of the section is visible
            const targetTop = section.offsetTop + maxScroll;
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: section.offsetTop, behavior: 'smooth' });
        }

        setTimeout(function () {
            isAnimating = false;
            refreshAOS();
        }, ANIMATION_DURATION);
    }

    function refreshAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    function handleSnap(direction) {
        if (isAnimating) return;

        const section = sections[currentSection];
        if (!section) return;

        if (isTallSection(currentSection)) {
            const maxScroll = section.scrollHeight - window.innerHeight;

            if (direction > 0) {
                // Scrolling down in tall section
                if (internalScrollTop < maxScroll - 5) {
                    internalScrollTop = Math.min(internalScrollTop + window.innerHeight * 0.7, maxScroll);
                    isAnimating = true;
                    window.scrollTo({
                        top: section.offsetTop + internalScrollTop,
                        behavior: 'smooth'
                    });
                    setTimeout(function () { isAnimating = false; }, ANIMATION_DURATION);
                    return;
                }
            } else {
                // Scrolling up in tall section
                if (internalScrollTop > 5) {
                    internalScrollTop = Math.max(internalScrollTop - window.innerHeight * 0.7, 0);
                    isAnimating = true;
                    window.scrollTo({
                        top: section.offsetTop + internalScrollTop,
                        behavior: 'smooth'
                    });
                    setTimeout(function () { isAnimating = false; }, ANIMATION_DURATION);
                    return;
                }
            }
        }

        // Snap to next/prev section
        if (direction > 0 && currentSection < sections.length - 1) {
            scrollToSection(currentSection + 1, 1);
        } else if (direction < 0 && currentSection > 0) {
            scrollToSection(currentSection - 1, -1);
        }
    }

    function onWheel(e) {
        e.preventDefault();

        if (isAnimating) return;

        accumulatedDelta += e.deltaY;
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(function () { accumulatedDelta = 0; }, 200);

        if (Math.abs(accumulatedDelta) < WHEEL_THRESHOLD) return;

        var direction = accumulatedDelta > 0 ? 1 : -1;
        accumulatedDelta = 0;

        handleSnap(direction);
    }

    function onKeyDown(e) {
        if (isAnimating) return;

        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            e.preventDefault();
            handleSnap(1);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            handleSnap(-1);
        } else if (e.key === 'Home') {
            e.preventDefault();
            scrollToSection(0, 1);
        } else if (e.key === 'End') {
            e.preventDefault();
            scrollToSection(sections.length - 1, 1);
        }
    }

    function onResize() {
        // Recalculate on resize
        if (sections[currentSection]) {
            internalScrollTop = 0;
            showSection(currentSection, false);
        }
    }

    // Public API: scroll to section by id
    window.scrollToSectionById = function (id) {
        var target = sections.findIndex(function (s) { return s.id === id; });
        if (target >= 0 && target !== currentSection) {
            var dir = target > currentSection ? 1 : -1;
            scrollToSection(target, dir);
        }
    };

    // Wait for Blazor to render sections
    var observer = new MutationObserver(function () {
        var newSections = document.querySelectorAll('section');
        if (newSections.length > 0) {
            observer.disconnect();
            setTimeout(init, 100);
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    } else {
        var existing = document.querySelectorAll('section');
        if (existing.length > 0) {
            setTimeout(init, 100);
        } else {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
})();
