import axios from 'axios';

/**
 * Extrai o ID da pasta do Google Drive a partir de uma URL
 * Suporta formatos:
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
 */
export function extractDriveFolderId(url: string): string | null {
  try {
    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      return folderMatch[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting folder ID:', error);
    return null;
  }
}

/**
 * Interface para arquivo do Google Drive
 */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
  size: string;
}

/**
 * Lista arquivos de uma pasta do Google Drive
 * Usa a API pública do Google Drive (requer que a pasta seja pública)
 */
export async function listDriveFiles(folderId: string): Promise<DriveFile[]> {
  try {
    // Usando a API do Google Drive v3
    // Nota: Para pastas públicas, você pode usar uma API Key simples
    // Para pastas privadas, seria necessário OAuth 2.0
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY || process.env.GOOGLE_CLIENT_ID;
    
    if (!apiKey) {
      console.warn('Google Drive credentials not configured');
      return [];
    }

    const url = `https://www.googleapis.com/drive/v3/files`;
    const params = {
      q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType='image/jpeg' or mimeType='image/png' or mimeType='image/jpg')`,
      key: apiKey,
      fields: 'files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink,size)',
      orderBy: 'name',
    };

    const response = await axios.get(url, { params });
    
    if (response.data && response.data.files) {
      return response.data.files;
    }

    return [];
  } catch (error) {
    console.error('Error listing Drive files:', error);
    throw new Error('Failed to fetch files from Google Drive');
  }
}

/**
 * Gera URL de thumbnail do Google Drive
 */
export function getDriveThumbnailUrl(fileId: string, size: number = 400): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

/**
 * Gera URL de download direto do Google Drive
 */
export function getDriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Gera URL de visualização do Google Drive
 */
export function getDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Extrai número de ordem do nome do arquivo
 * Exemplo: "foto_001.jpg" -> 1, "IMG_0042.jpg" -> 42
 */
export function extractFileOrder(filename: string): number {
  // Tenta encontrar números no nome do arquivo
  const numbers = filename.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    // Pega o último número encontrado
    return parseInt(numbers[numbers.length - 1], 10);
  }
  // Se não encontrar número, usa hash do nome
  return filename.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

/**
 * Sincroniza fotos de uma pasta do Google Drive para o banco de dados
 */
export async function syncPhotosFromDrive(
  photoshootId: number,
  driveUrl: string,
  db: any
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const folderId = extractDriveFolderId(driveUrl);
    
    if (!folderId) {
      return { success: false, count: 0, error: 'Invalid Google Drive URL' };
    }

    // Lista arquivos do Drive
    const files = await listDriveFiles(folderId);
    
    if (files.length === 0) {
      return { success: false, count: 0, error: 'No images found in the folder or folder is not public' };
    }

    // Remove fotos antigas deste ensaio
    await db.deletePhotosByPhotoshoot(photoshootId);

    // Importa as novas fotos
    let count = 0;
    for (const file of files) {
      const fileOrder = extractFileOrder(file.name);
      
      await db.createPhoto({
        photoshootId,
        filename: file.name,
        originalUrl: getDriveViewUrl(file.id),
        thumbnailUrl: getDriveThumbnailUrl(file.id, 400),
        watermarkedUrl: getDriveThumbnailUrl(file.id, 800), // Maior para visualização
        fileOrder,
      });
      
      count++;
    }

    return { success: true, count };
  } catch (error: any) {
    console.error('Error syncing photos from Drive:', error);
    return { success: false, count: 0, error: error.message };
  }
}
