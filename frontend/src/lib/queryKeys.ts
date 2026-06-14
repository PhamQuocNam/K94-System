export const queryKeys = {
  users: {
    all: ["users"] as const,
    me: ["currentUser"] as const,
  },
  items: {
    all: ["items"] as const,
  },
  projects: {
    all: ["projects"] as const,
    detail: (id: string) => ["projects", id] as const,
  },
  storyboards: {
    all: ["storyboards"] as const,
    byProject: (projectId: string) => ["storyboards", projectId] as const,
  },
}
