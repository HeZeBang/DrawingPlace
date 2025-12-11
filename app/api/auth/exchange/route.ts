import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserSession from '@/models/UserSession';
import crypto from 'crypto';

// Server-side Casdoor config
const serverConfig = {
    serverUrl: process.env.NEXT_PUBLIC_CASDOOR_SERVER_URL || "https://door.casdoor.com",
    clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID || "client_id",
    clientSecret: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_SECRET || "client_secret",
    appName: process.env.NEXT_PUBLIC_CASDOOR_APP_NAME || "app_name",
    organizationName: process.env.NEXT_PUBLIC_CASDOOR_ORGANIZATION_NAME || "casbin"
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Verify Casdoor token and get user info via OIDC userinfo endpoint
        const userinfoUrl = `${serverConfig.serverUrl}/api/userinfo`;
        
        let userId: string | null = null;

        try {
            const userInfoResponse = await fetch(userinfoUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json();
                // OIDC userinfo returns 'sub' as the unique identifier
                userId = userInfo.sub || userInfo.id || userInfo.name;
            }
        } catch (e) {
            console.error("Failed to fetch userinfo", e);
        }

        if (!userId) {
            // Fallback: try /api/get-account which is Casdoor specific
            try {
                const accountUrl = `${serverConfig.serverUrl}/api/get-account`;
                const accountResponse = await fetch(accountUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (accountResponse.ok) {
                    const accountData = await accountResponse.json();
                    if (accountData.status === 'ok' && accountData.data) {
                        userId = accountData.data.id || accountData.data.name;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch account info", e);
            }
        }

        if (!userId) {
             return NextResponse.json({ error: 'Invalid Casdoor token' }, { status: 401 });
        }

        await dbConnect();

        await UserSession.deleteMany({ userId: userId });

        // Generate draw token
        const drawToken = crypto.randomBytes(32).toString('hex');

        await UserSession.create({
            userId: userId,
            token: drawToken,
            updatedAt: new Date()
        });

        console.log(`Generated new token for user ${userId}: ${drawToken}`);
        return NextResponse.json({ token: drawToken });

    } catch (error) {
        console.error('Token exchange error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
