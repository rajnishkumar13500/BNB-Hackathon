"use client";

import { useEffect } from "react";

export function ScrollAnimator() {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("scroll-visible");
                        // Don't unobserve — allows re-triggering if needed
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );

        // Observe all elements with scroll-reveal class
        const elements = document.querySelectorAll(".scroll-reveal");
        elements.forEach((el) => observer.observe(el));

        // MutationObserver for dynamically added elements
        const mutationObs = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        if (node.classList.contains("scroll-reveal")) {
                            observer.observe(node);
                        }
                        node.querySelectorAll?.(".scroll-reveal").forEach((el) => {
                            observer.observe(el);
                        });
                    }
                });
            });
        });

        mutationObs.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            mutationObs.disconnect();
        };
    }, []);

    return null;
}
