import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './client';

export async function uploadMissionPhoto(
  familyId: string,
  missionId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `mission-photos/${familyId}/${missionId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
