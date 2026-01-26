declare module '@capacitor/app' {
    export interface AppPlugin {
        /**
         * Force exit the app.
         */
        exitApp(): Promise<void>;

        /**
         * Listen for the back button event (Android only).
         */
        addListener(
            eventName: 'backButton',
            listenerFunc: (data: { canGoBack: boolean }) => void
        ): Promise<{ remove: () => void }>;
    }

    const App: AppPlugin;
    export { App };
}
