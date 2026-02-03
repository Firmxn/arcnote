import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../state/auth.store';

interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
    const { user, isGuest, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading) {
            // If not logged in AND not a guest, redirect to login
            if (!user && !isGuest) {
                // Determine if we should redirect to login
                // We don't want to redirect if we are already there (handled by routes, but safe to check)
                navigate('/login', { replace: true, state: { from: location } });
            }
        }
    }, [user, isGuest, isLoading, navigate, location]);

    if (isLoading) {
        // Simple loading spinner or splash
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    // Render children if authenticated or guest
    if (user || isGuest) {
        return <>{children}</>;
    }

    return null;
};
