package com.arcnote.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import java.io.File;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Surgical Clean: Delete Service Worker and Cache Storage directories
        // This removes the "Persistent" parts of the PWA without touching IndexedDB (User Data)
        try {
            File dataDir = new File(getApplicationInfo().dataDir);
            
            // Common paths for WebView data (Chromium based)
            // We target specific folders that hold the Service Worker and Cache Storage
            String[] pathsToDelete = {
                "app_webview/Default/Service Worker", // Modern WebView
                "app_webview/Default/CacheStorage",
                "app_webview/Default/ScriptCache",
                "app_webview/Service Worker",         // Older/Alternative layouts
                "app_webview/CacheStorage",
                "app_webview/ScriptCache"
            };
            
            for (String path : pathsToDelete) {
                File target = new File(dataDir, path);
                if (target.exists()) {
                    deleteRecursive(target);
                    System.out.println("🧹 Native Surgical Clean: Deleted " + target.getAbsolutePath());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Enable edge-to-edge
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        }
        
        // Make navigation bar transparent
        Window window = getWindow();
        window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
        window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);
        
        // For Android 10+ (API 29+), enable contrast enforcement
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
        }
        
    }

    // Helper to recursively delete files/folders
    private void deleteRecursive(File fileOrDirectory) {
        if (fileOrDirectory.isDirectory()) {
            File[] children = fileOrDirectory.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursive(child);
                }
            }
        }
        fileOrDirectory.delete();
    }
}
