'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sdkConfig } from '@/lib/casdoor';

export default function CallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (code) {
            // Exchange code for token
            const params = {
                grant_type: 'authorization_code',
                client_id: sdkConfig.clientId,
                client_secret: sdkConfig.clientSecret,
                code,
            };
            
            // Note: In a real production app with a client secret, this should be done on the server.
            // Here we assume a public client or that the user will move this to a server route if needed.
            fetch(`${sdkConfig.serverUrl}/api/login/oauth/access_token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            })
            .then(res => res.json())
            .then(data => {
                if (data.access_token) {
                    localStorage.setItem('casdoor_token', data.access_token);
                    // Get user info
                    // The endpoint might be /api/get-account or /api/userinfo depending on Casdoor version
                    // casdoor-js-sdk usually uses /api/get-account
                    return fetch(`${sdkConfig.serverUrl}/api/get-account?accessToken=${data.access_token}`);
                }
                throw new Error('No access token received');
            })
            .then(res => res.json())
            .then(res => {
                if (res.status === 'ok') {
                    localStorage.setItem('casdoor_user', JSON.stringify(res.data));
                    router.push('/');
                } else {
                    console.error('Failed to get user info:', res);
                    // Fallback or error handling
                    router.push('/');
                }
            })
            .catch(err => {
                console.error('Login failed', err);
                router.push('/');
            });
        } else {
            router.push('/');
        }
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center h-screen w-full bg-background">
            <div className="text-lg font-medium">Logging in...</div>
        </div>
    );
}
