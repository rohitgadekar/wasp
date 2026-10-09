// // src/hooks/useTitle.ts
// import { useEffect } from 'react';

// export const useTitle = (title: string, description?: string) => {
//     useEffect(() => {
//         // Set document title
//         const fullTitle = title ? `${title} • Wasp` : 'Wasp';
//         document.title = fullTitle;

//         // Update og:title
//         let ogTitle = document.querySelector('meta[property="og:title"]');
//         if (!ogTitle) {
//             ogTitle = document.createElement('meta');
//             ogTitle.setAttribute('property', 'og:title');
//             document.head.appendChild(ogTitle);
//         }
//         ogTitle.setAttribute('content', fullTitle);

//         // Update meta description
//         if (description) {
//             let metaDesc = document.querySelector('meta[name="description"]');
//             if (!metaDesc) {
//                 metaDesc = document.createElement('meta');
//                 metaDesc.setAttribute('name', 'description');
//                 document.head.appendChild(metaDesc);
//             }
//             metaDesc.setAttribute('content', description);

//             let ogDesc = document.querySelector('meta[property="og:description"]');
//             if (!ogDesc) {
//                 ogDesc = document.createElement('meta');
//                 ogDesc.setAttribute('property', 'og:description');
//                 document.head.appendChild(ogDesc);
//             }
//             ogDesc.setAttribute('content', description);
//         }

//         return () => {
//             document.title = 'Wasp'; // fallback on unmount
//         };
//     }, [title, description]);
// };



// src/hooks/useTitle.ts
import { useEffect } from 'react';

export const useTitle = (title?: string, description?: string, badge?: string) => {
    useEffect(() => {
        const fullTitle = title ? `${title} • Wasp` : 'Wasp';
        document.title = fullTitle;

        // og:title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', fullTitle);

        // description + og:description
        if (description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', description);

            let ogDesc = document.querySelector('meta[property="og:description"]');
            if (!ogDesc) {
                ogDesc = document.createElement('meta');
                ogDesc.setAttribute('property', 'og:description');
                document.head.appendChild(ogDesc);
            }
            ogDesc.setAttribute('content', description);
        }

        // Dynamic OG Image
        const params = new URLSearchParams();
        if (title) params.set('title', title);
        if (description) params.set('description', description);
        if (badge) params.set('badge', badge);

        const ogImageUrl = `${window.location.origin}/api/og?${params.toString()}`;

        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
            ogImage = document.createElement('meta');
            ogImage.setAttribute('property', 'og:image');
            document.head.appendChild(ogImage);
        }
        ogImage.setAttribute('content', ogImageUrl);

        // og:url
        let ogUrl = document.querySelector('meta[property="og:url"]');
        if (!ogUrl) {
            ogUrl = document.createElement('meta');
            ogUrl.setAttribute('property', 'og:url');
            document.head.appendChild(ogUrl);
        }
        ogUrl.setAttribute('content', window.location.href);

        // Twitter
        let twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (!twitterImage) {
            twitterImage = document.createElement('meta');
            twitterImage.setAttribute('name', 'twitter:image');
            document.head.appendChild(twitterImage);
        }
        twitterImage.setAttribute('content', ogImageUrl);

        let twitterCard = document.querySelector('meta[name="twitter:card"]');
        if (!twitterCard) {
            twitterCard = document.createElement('meta');
            twitterCard.setAttribute('name', 'twitter:card');
            document.head.appendChild(twitterCard);
        }
        twitterCard.setAttribute('content', 'summary_large_image');

        return () => {
            document.title = 'Wasp';
        };
    }, [title, description, badge]);
};