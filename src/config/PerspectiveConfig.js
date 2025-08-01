// Perspective and visual effects configuration
export const PerspectiveConfig = {
    // Background perspective effects
    backdrop: {
        scaleIncrease: 1.1,            // More room for movement (5% → 10%)
        perspectiveRange: 0.1,         // Much more noticeable (0.06 → 0.1)
        backgroundShiftMultiplier: 60,  // Much stronger background movement (36 → 60)
        rotationMultiplier: 0.003,     // Much more subtle rotation
        animationDuration: 1000,       // Slightly faster response
        animationEasing: 'Sine.easeInOut'
    },

    // Enemy perspective effects
    enemies: {
        shiftMultiplier: 15,           // More enemy movement (9.6 → 15)
        animationDuration: 1000,       // Match backdrop timing
        animationEasing: 'Sine.easeInOut'
    },

    // Enemy breathing/idle animations
    breathing: {
        scaleAmount: 0.04,             // More noticeable breathing (4% scale change)
        verticalMovement: 8,           // Subtle up/down movement in pixels
        duration: 2400,                // Breathing cycle duration in ms (increased by 0.2 factor)
        easing: 'Sine.easeInOut',
        delay: {
            min: 0,
            max: 200                   // Much shorter delay so breathing starts quickly
        }
    },

    // Camera/viewport effects
    camera: {
        targetingZoom: 1.024,          // Subtle zoom when targeting (increased by 0.2 factor from 1.02)
        targetingPan: 0.006,           // Subtle camera pan (increased by 0.2 factor from 0.005)
        zoomDuration: 600,             // Zoom animation duration
        panDuration: 600               // Pan animation duration
    }
};
