import { Film, Pencil } from "lucide-react"
import type { Scene } from "@/client/types.gen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface SceneCardProps {
  scene: Scene
  isLoading?: boolean
  onEdit?: () => void
}

export function SceneCard({ scene, isLoading, onEdit }: SceneCardProps) {
  if (isLoading) {
    return <SceneCardSkeleton />
  }

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Film className="h-4 w-4 text-muted-foreground" />
            {scene.title || `Scene ${scene.sequence_number}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              #{scene.sequence_number}
            </Badge>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {scene.narrative_description && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Narrative
            </p>
            <p className="text-sm line-clamp-3">
              {scene.narrative_description}
            </p>
          </div>
        )}

        {scene.visual_description && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Visual</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {scene.visual_description}
            </p>
          </div>
        )}

        {scene.title && (
          <Badge variant="secondary" className="text-xs">
            📍 {scene.title}
          </Badge>
        )}

        {scene.reference_image_url && (
          <div className="mt-2 aspect-video overflow-hidden rounded-md bg-muted">
            <img
              src={scene.reference_image_url}
              alt={scene.title || `Scene ${scene.sequence_number}`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SceneCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-8" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card>
  )
}
