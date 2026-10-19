/** One branch of the organization (for example Football or Cinema). */
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  imageUrl?: string | null;
}
