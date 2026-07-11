const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

if (!CLOUD_NAME) {
  throw new Error('Cloudinary configuration is missing.');
}

interface CloudinaryResource {
  public_id: string;
  version: number;
  format: string;
  created_at: string;
  type: string;
  bytes: number;
  width: number;
  height: number;
}

interface CloudinaryListResponse {
  resources: CloudinaryResource[];
  updated_at: string;
}

export interface CloudinaryLogo {
  id: string;
  name: string;
  url: string;
  version: number;
}

export const fetchLogosFromCloudinary = async (
  tagNames: string | string[]
): Promise<CloudinaryLogo[]> => {
  if (!CLOUD_NAME) {
    console.error('Cloudinary configuration is missing. Check your environment variables.');
    return [];
  }

  try {
    const rawTags = Array.isArray(tagNames) ? tagNames : [tagNames];
    const tags = rawTags.map(tag => encodeURIComponent(tag.trim()));

    const fetchPromises = tags.map(tag =>
      fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json`)
        .then(async (res) => {
          if (!res.ok) return [];
          const data: CloudinaryListResponse = await res.json();
          return Array.isArray(data.resources) ? data.resources : [];
        })
        .catch(() => [] as CloudinaryResource[])
    );

    const results = await Promise.all(fetchPromises);
    const allResources: CloudinaryResource[] = results.flat();

    if (allResources.length === 0) {
      return [];
    }

    const uniqueResources = Array.from(
      new Map<string, CloudinaryResource>(
        allResources.map(item => [item.public_id, item])
      ).values()
    );

    return uniqueResources.map((resource): CloudinaryLogo => {
      const fileName = resource.public_id.split('/').pop() || '';
      const sanitizedName = fileName.replace(/[<>]/g, '');

      return {
        id: resource.public_id,
        name: sanitizedName,
        url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v${resource.version}/${resource.public_id}.${resource.format}`,
        version: resource.version
      };
    });
  } catch {
    throw new Error('Failed to fetch resources securely.');
  }
};