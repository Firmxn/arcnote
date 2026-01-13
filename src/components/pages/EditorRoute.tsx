import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePagesStore } from '../../state/pages.store';
import { PageEditor } from './PageEditor';

export const EditorRoute = () => {
    const { pageId } = useParams();
    const navigate = useNavigate();
    const { pages, setCurrentPage } = usePagesStore();

    useEffect(() => {
        if (pageId && pages.length > 0) {
            const page = pages.find(p => p.id === pageId);
            if (page) {
                setCurrentPage(page);
            } else {
                // Page not found, redirect to pages list
                navigate('/pages', { replace: true });
            }
        }
    }, [pageId, pages, setCurrentPage, navigate]);

    // Show nothing while pages are loading
    if (pages.length === 0) {
        return null;
    }

    // Find the requested page
    const targetPage = pages.find(p => p.id === pageId);

    // If page not found, redirect (handled in useEffect)
    if (!targetPage) {
        return null; // Will redirect via useEffect
    }

    // Render Editor
    return <PageEditor page={targetPage} />;
};
