import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useState } from "react"
import { DefaultService } from "@/client"
import type { ProjectPublic } from "@/client"
import {
  DeleteProjectDialog,
  EditProjectDialog,
  ProjectActions,
} from "@/components/Projects"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/_layout/projects/")({
  component: ProjectsPage,
  head: () => ({
    meta: [{ title: "Projects - Story to Video" }],
  }),
})

function ProjectsPage() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => DefaultService.listProjects(),
  })

  const projects = projectsData?.data || []

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectPublic | null>(
    null,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your story-to-video projects
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-muted-foreground">
              <Plus className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No projects yet</h3>
              <p className="text-sm mt-2">
                Create your first project to start transforming stories into
                videos
              </p>
            </div>
            <Button asChild>
              <Link to="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="line-clamp-1">
                  {project.title || "Untitled Project"}
                </CardTitle>
                <ProjectActions
                  projectId={project.id}
                  onEdit={() => {
                    setSelectedProject(project)
                    setEditDialogOpen(true)
                  }}
                  onDelete={() => {
                    setSelectedProject(project)
                    setDeleteDialogOpen(true)
                  }}
                />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {project.description || "No description"}
                </p>
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link to="/projects/$id" params={{ id: project.id }}>
                    View Project →
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProject && (
        <>
          <EditProjectDialog
            projectId={selectedProject.id}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            currentTitle={selectedProject.title}
            currentDescription={selectedProject.description}
          />
          <DeleteProjectDialog
            projectId={selectedProject.id}
            projectTitle={selectedProject.title || "Untitled Project"}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      )}
    </div>
  )
}
