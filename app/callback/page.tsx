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
            .then(async (res) => {
                if (res && res.access_token) {
                    //Get Token
                    localStorage.setItem('casdoor_token', res.access_token);

                    // Exchange for Draw Token
                    try {
                        const response = await fetch('/api/auth/exchange', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ token: res.access_token })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.token) {
                                console.log("Draw token received", data.token);
                                localStorage.setItem('draw_token', data.token);
                            }
                        }
                    } catch (e) {
                        console.error("Token exchange failed", e);
                    }

                    return sdk.getUserInfo(res.access_token);
                }
            })
            .then((res) => {
                router.push('/');
                if (res) {
                    localStorage.setItem('casdoor_user', JSON.stringify(res));
                    console.log('User info:', res);
                }
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
