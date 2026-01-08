import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define the keys we expect to use
export type AdminSettingKey =
    | 'home_title'
    | 'home_subtitle'
    | 'kakao_url'
    | 'main_banner_url'
    | 'notice_text'
    | 'about_intro_text'
    | 'about_main_image'
    | 'about_desc_title'
    | 'about_desc_body'
    | 'programs_intro_text'
    | 'programs_list'
    | 'center_logo'
    | 'center_name'
    | 'center_phone'
    | 'center_address'
    | 'center_map_url'
    | 'ai_posting_day'
    | 'ai_posting_time'
    | 'ai_next_topic';

export interface ProgramItem {
    id: string;
    title: string;
    eng: string;
    desc: string;
    targets: string[];
    icon_name: string;
}

export interface AdminSetting {
    key: string;
    value: string | null;
    updated_at: string | null;
}

export const useAdminSettings = () => {
    const [settings, setSettings] = useState<Record<string, string | null>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all settings
    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('admin_settings') as any)
                .select('*');

            if (error) throw error;

            if (data) {
                const settingsMap: Record<string, string | null> = {};
                data.forEach((item: any) => {
                    settingsMap[item.key] = item.value;
                });
                setSettings(settingsMap);
            }
        } catch (err: any) {
            console.error('Error fetching admin settings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Update a specific setting
    const updateSetting = async (key: AdminSettingKey, value: string) => {
        try {
            const { error } = await (supabase
                .from('admin_settings') as any)
                .upsert({
                    key,
                    value,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Optimistic update
            setSettings(prev => ({
                ...prev,
                [key]: value
            }));

            return { success: true };
        } catch (err: any) {
            console.error(`Error updating setting ${key}:`, err);
            return { success: false, error: err.message };
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchSettings();
    }, []);

    const getSetting = (key: AdminSettingKey) => settings[key] || '';

    return {
        settings,
        loading,
        error,
        getSetting,
        updateSetting,
        refresh: fetchSettings
    };
};
