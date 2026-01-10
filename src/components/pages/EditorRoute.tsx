import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePagesStore } from '../../state/pages.store';
import { PageEditor } from './PageEditor';

export const EditorRoute = () => {
    const { pageId } = useParams();
    const { pages, setCurrentPage } = usePagesStore();

    useEffect(() => {
        if (pageId && pages.length > 0) {
            const page = pages.find(p => p.id === pageId);
            if (page) {
                setCurrentPage(page);
            }
        }
    }, [pageId, pages, setCurrentPage]);

    // Show nothing while pages are loading
    if (pages.length === 0) {
        return null;
    }

    // Find the requested page
    const targetPage = pages.find(p => p.id === pageId);

    // If page not found
    if (!targetPage) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-white dark:bg-gray-950 text-text-neutral dark:text-text-secondary">
                <div className="text-lg font-medium mb-2">Page not found</div>
                <div className="text-sm opacity-70">The page you are looking for does not exist or has been deleted.</div>
            </div>
        );
    }

    // Render Editor
    return <PageEditor page={targetPage} />;
};
