// Custom Cursor with Rotation Animation
(function () {
    'use strict';

    // Cursor state
    let mouseX = -100;
    let mouseY = -100;
    let cursorX = -100;
    let cursorY = -100;
    let prevX = 0;
    let prevY = 0;
    let rotation = 0;
    let targetRotation = 0;

    // Configuration
    const LERP_FACTOR = 0.2; // Smoothness of cursor follow (0-1, lower = smoother)
    const ROTATION_LERP = 0.13; // Smoothness of rotation (0-1, lower = smoother)
    const SCALE_HOVER = 1.5; // Scale when hovering over interactive elements
    const SCALE_CLICK = 0.8; // Scale when clicking

    let cursorElement = null;
    let isHovering = false;
    let isClicking = false;

    // Initialize cursor
    function init() {
        // Create cursor element
        cursorElement = document.createElement('div');
        cursorElement.className = 'custom-cursor';
        document.body.appendChild(cursorElement);

        // Event listeners
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);

        // Add hover listeners to interactive elements
        addHoverListeners();

        // Start animation loop
        requestAnimationFrame(animate);
    }

    // Mouse move handler
    function onMouseMove(e) {
        mouseX = e.clientX - 13;
        mouseY = e.clientY - 13;
    }

    // Mouse down handler
    function onMouseDown() {
        isClicking = true;
        cursorElement.classList.add('clicking');
    }

    // Mouse up handler
    function onMouseUp() {
        isClicking = false;
        cursorElement.classList.remove('clicking');
    }

    // Add hover listeners to interactive elements
    function addHoverListeners() {
        const interactiveSelectors = 'a, button, input, textarea, select, [role="button"], .mud-button, .mud-icon-button';

        // Use event delegation for better performance
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches(interactiveSelectors) || e.target.closest(interactiveSelectors)) {
                isHovering = true;
                cursorElement.classList.add('hovering');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.matches(interactiveSelectors) || e.target.closest(interactiveSelectors)) {
                isHovering = false;
                cursorElement.classList.remove('hovering');
            }
        });
    }

    // Calculate rotation based on movement direction
    function calculateRotation(dx, dy) {
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            // Calculate angle in degrees and add 90 to make arrow point in direction of movement
            let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

            // Normalize angle to prevent jumps (find shortest rotation path)
            let diff = angle - targetRotation;

            // Normalize difference to -180 to 180 range
            while (diff > 180) diff -= 360;
            while (diff < -180) diff += 360;

            // Apply the normalized difference
            return targetRotation + diff;
        }
        return targetRotation; // Keep current rotation if not moving
    }

    // Linear interpolation
    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Animation loop
    function animate() {
        // Smooth cursor position
        cursorX = lerp(cursorX, mouseX, LERP_FACTOR);
        cursorY = lerp(cursorY, mouseY, LERP_FACTOR);

        // Calculate movement delta
        const dx = mouseX - prevX;
        const dy = mouseY - prevY;

        // Update target rotation based on movement
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            targetRotation = calculateRotation(dx, dy);
        }

        // Smooth rotation
        rotation = lerp(rotation, targetRotation, ROTATION_LERP);

        // Apply transforms
        let scale = 1;
        if (isHovering) scale = SCALE_HOVER;
        if (isClicking) scale = SCALE_CLICK;

        cursorElement.style.transform = `
            translate(${cursorX}px, ${cursorY}px) 
            rotate(${rotation}deg) 
            scale(${scale})
        `;

        // Update previous position
        prevX = mouseX;
        prevY = mouseY;

        requestAnimationFrame(animate);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
