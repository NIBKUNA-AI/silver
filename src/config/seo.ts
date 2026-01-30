export const seoConfig = {
    title: import.meta.env.VITE_SITE_TITLE || 'Zarada',
    description: import.meta.env.VITE_META_DESCRIPTION || '어르신의 건강하고 행복한 일상을 함께하는 재가요양 전문기관입니다.',
    ogImage: import.meta.env.VITE_OG_IMAGE || '/og-default.png',
    keywords: import.meta.env.VITE_META_KEYWORDS || '재가요양, 방문요양, 요양보호사, 노인돌봄, 장기요양',
    canonicalUrl: import.meta.env.VITE_CANONICAL_URL || 'https://zaradacenter.co.kr',
    naverVerification: import.meta.env.VITE_NAVER_VERIFICATION || '',
    googleVerification: import.meta.env.VITE_GOOGLE_VERIFICATION || '',
    phone: import.meta.env.VITE_CENTER_PHONE || '02-000-0000',
    address: import.meta.env.VITE_CENTER_ADDRESS || '서울특별시 송파구 석촌호수로 12길',
    geo: {
        lat: import.meta.env.VITE_CENTER_LAT || '37.5113',
        lng: import.meta.env.VITE_CENTER_LNG || '127.0982'
    },
    businessName: import.meta.env.VITE_BUSINESS_NAME || '재가요양센터'
};
