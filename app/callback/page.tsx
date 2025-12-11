'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCasdoorSdk, sdkConfig } from '@/lib/casdoor';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

export default function CallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const sdk = getCasdoorSdk();
        sdk.exchangeForAccessToken()
            .then(async (res) => {
                if (res && res.access_token) {
                    //Get Token
                    localStorage.setItem('casdoor_token', res.access_token);
                    return sdk.getUserInfo(res.access_token);
                }
            })
            .then((res) => {
                router.push('/');
                if (res) {
                    localStorage.setItem('casdoor_user', JSON.stringify(res));
                    toast.success(`欢迎回来！${res.name || res.id || 'Annonymous'}`);
                }
                // Storage Token
                // Cookies.set("casdoorUser", JSON.stringify(res));
            }).catch((err) => {
                console.error('登录失败', err);
                toast.error('登录失败: ' + (err.message || err.toString()));
            });
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center h-screen w-full bg-background gap-3">
            <div className="text-lg font-medium">正在登录……</div>
            <Loader className="h-5 w-5 animate-spin" />
        </div>
    );
}
