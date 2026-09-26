import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { UploadFlow } from "@/components/upload/upload-flow";

export default async function UploadPage() {
  const user = await getCurrentUser();
  return <UploadFlow userId={user.id} />;
}
