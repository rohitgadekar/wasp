// src/hooks/useTitle.ts
import { useEffect } from 'react';

export const useTitle = (title: string, description?: string) => {
    useEffect(() => {
        // Set document title
        document.title = `${title} • Wasp`; // your app name

        // Optional: Update meta description
        if (description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', description);
        }

        return () => {
            document.title = 'Wasp'; // fallback on unmount
        };
    }, [title, description]);
};