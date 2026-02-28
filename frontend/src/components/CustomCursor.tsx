"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const trailRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dot = dotRef.current;
        const trail = trailRef.current;
        if (!dot || !trail) return;

        let mouseX = 0;
        let mouseY = 0;
        let dotX = 0;
        let dotY = 0;
        let trailX = 0;
        let trailY = 0;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        // Smooth animation loop for both dot and trail
        const animate = () => {
            // Dot follows cursor with slight smoothing
            dotX += (mouseX - dotX) * 0.5;
            dotY += (mouseY - dotY) * 0.5;
            dot.style.left = `${dotX}px`;
            dot.style.top = `${dotY}px`;

            // Trail follows cursor with more lag
            trailX += (mouseX - trailX) * 0.12;
            trailY += (mouseY - trailY) * 0.12;
            trail.style.left = `${trailX}px`;
            trail.style.top = `${trailY}px`;

            requestAnimationFrame(animate);
        };

        // Detect hoverable elements
        const onMouseOver = (e: Event) => {
            const target = e.target as HTMLElement;
            const isHoverable =
                target.tagName === "A" ||
                target.tagName === "BUTTON" ||
                target.closest("a") ||
                target.closest("button") ||
                target.classList.contains("glass-card");

            if (isHoverable) {
                dot.classList.add("hovering");
                trail.classList.add("hovering");
            }
        };

        const onMouseOut = () => {
            dot.classList.remove("hovering");
            trail.classList.remove("hovering");
        };

        window.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseover", onMouseOver);
        document.addEventListener("mouseout", onMouseOut);
        requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseover", onMouseOver);
            document.removeEventListener("mouseout", onMouseOut);
        };
    }, []);

    return (
        <>
            {/* Pointer cursor — SVG arrow shape */}
            <div ref={dotRef} className="custom-cursor">
                <svg
                    width="24"
                    height="28"
                    viewBox="0 0 24 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M2 2L2 22L8 16L14 26L18 24L12 14L20 14L2 2Z"
                        fill="#F0B90B"
                        stroke="#8B6914"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            {/* Trailing glow ring */}
            <div ref={trailRef} className="cursor-trail" />
        </>
    );
}
