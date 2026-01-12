import { useState, useEffect } from 'react';

export const useKeyboardStatus = () => {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            // Detect keyboard by checking if viewport height decreased significantly
            // visualViewport is more reliable on modern mobile browsers
            const viewportHeight = window.visualViewport?.height || window.innerHeight;

            // Threshold: if viewport is < 75% of total height, assume keyboard is open
            // Note: on Android, window.innerHeight might resize, but on iOS strictly visualViewport resizes.
            // We check against the initial window height or screen height ideally, but responsive height is tricky.
            // A simple heuristic is: is the current visual height significantly smaller than screen height?

            const screenHeight = window.screen.height;
            // Use screen.availHeight on desktop, but on mobile screen.height is usually constant

            // Fix: window.innerHeight changes on Android when keyboard opens (unless in edge-to-edge??)
            // With edge-to-edge enabled, we rely on visualViewport.

            const isOpen = viewportHeight < screenHeight * 0.75;
            setIsKeyboardOpen(isOpen);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }
        window.addEventListener('resize', handleResize);

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return isKeyboardOpen;
};
