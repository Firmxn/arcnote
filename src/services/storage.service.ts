import { supabase } from '../data/supabase';
import { nanoid } from 'nanoid';

/**
 * Service untuk handle storage operations (Supabase Storage)
 */
export const storageService = {
    /**
     * Upload image to Supabase Storage
     * @param file File image to upload
     * @returns Public URL of the uploaded image
     */
    async uploadImage(file: File): Promise<string> {
        try {
            // Validasi file type
            if (!file.type.startsWith('image/')) {
                throw new Error('File must be an image');
            }

            // Validasi size (optional, misal max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Image size too large (max 5MB)');
            }

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${nanoid()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase bucket 'images'
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
};
