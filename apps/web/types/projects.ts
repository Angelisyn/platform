export interface Project {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  slug: string;
}

export interface UpdateProjectRequest {
  name?: string;
  slug?: string;
}
