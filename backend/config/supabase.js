const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const uploadImage = async (file, userId, imageIndex) => {
  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}_${imageIndex}_${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
};

module.exports = { supabase, uploadImage };