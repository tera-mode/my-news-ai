import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './firebase';

// Upload file to Firebase Storage
export const uploadFile = async (
  file: File,
  path: string
): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

// Upload image with automatic path generation
export const uploadImage = async (
  file: File,
  folder: 'articles' | 'profiles' | 'thumbnails' = 'articles'
): Promise<string> => {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const fileName = `${timestamp}.${extension}`;
  const path = `images/${folder}/${fileName}`;
  
  return uploadFile(file, path);
};

// Delete file from Firebase Storage
export const deleteFile = async (downloadURL: string): Promise<void> => {
  const storageRef = ref(storage, downloadURL);
  await deleteObject(storageRef);
};

// Get all files in a folder
export const getFilesInFolder = async (folderPath: string): Promise<string[]> => {
  const folderRef = ref(storage, folderPath);
  const result = await listAll(folderRef);
  
  const urls: string[] = [];
  for (const item of result.items) {
    const url = await getDownloadURL(item);
    urls.push(url);
  }
  
  return urls;
};

// Generate unique file path
export const generateFilePath = (
  fileName: string,
  folder: string = 'misc'
): string => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const baseName = fileName.split('.')[0];
  return `${folder}/${baseName}_${timestamp}.${extension}`;
};
