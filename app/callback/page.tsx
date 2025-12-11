'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCasdoorSdk, sdkConfig } from '@/lib/casdoor';

export default function CallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const sdk = getCasdoorSdk();
        sdk.exchangeForAccessToken()
            .then((res) => {
                if (res && res.access_token) {
                    //Get Token
                    localStorage.setItem('casdoor_token', res.access_token);
                    return sdk.getUserInfo(res.access_token);
                }
            })
            .then((res) => {
                router.push('/');
                localStorage.setItem('casdoor_user', JSON.stringify(res));
                console.log('User info:', res);
                // Storage Token
                // Cookies.set("casdoorUser", JSON.stringify(res));
            });
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center h-screen w-full bg-background">
            <div className="text-lg font-medium">Logging in...</div>
        </div>
    );
}
