import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useTrafficSource() {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const source = searchParams.get('utm_source');
        const medium = searchParams.get('utm_medium');
        const campaign = searchParams.get('utm_campaign');
        const referrer = document.referrer;

        // If UTM parameters are present, they take precedence and overwrite previous source
        if (source) {
            sessionStorage.setItem('marketing_source', source);
            if (medium) sessionStorage.setItem('marketing_medium', medium);
            if (campaign) sessionStorage.setItem('marketing_campaign', campaign);
            return;
        }

        // If no UTM, but we have a referrer and NO existing source, capture referrer
        // We generally don't want to overwrite an existing 'marketing_source' (e.g. from an ad) 
        // with an internal referrer or a payment gateway referrer during the same session.
        const currentSource = sessionStorage.getItem('marketing_source');
        if (!currentSource && referrer) {
            let derivedSource = 'referrer_other';
            const lowerRef = referrer.toLowerCase();

            if (lowerRef.includes('naver')) derivedSource = 'naver_search';
            else if (lowerRef.includes('google')) derivedSource = 'google_search';
            else if (lowerRef.includes('daum')) derivedSource = 'daum_search';
            else if (lowerRef.includes('instagram')) derivedSource = 'instagram';
            else if (lowerRef.includes('facebook')) derivedSource = 'facebook';
            else if (lowerRef.includes(window.location.hostname)) return; // Ignore internal clicks

            sessionStorage.setItem('marketing_source', derivedSource);
        }

    }, [searchParams]);

    return {
        // Helper to get the current source for form submission
        getSource: () => sessionStorage.getItem('marketing_source') || 'direct'
    };
}
