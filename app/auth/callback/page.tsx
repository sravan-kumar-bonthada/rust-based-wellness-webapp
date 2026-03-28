'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const orgId = searchParams.get('org_id');
        const role = searchParams.get('role');

        if (token) {
            localStorage.setItem('token', token);
            if (orgId) localStorage.setItem('org_id', orgId);
            if (role) localStorage.setItem('role', role);

            // Redirect to dashboard
            router.push('/dashboard');
        } else {
            router.push('/login?error=auth_failed');
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Authenticating...</h1>
            <p className="text-slate-500 font-medium">Please wait while we set up your workspace session.</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">
                Loading...
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
