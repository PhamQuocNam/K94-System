import { MapPin, Pencil } from "lucide-react"
import type { Setting } from "@/client/types.gen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface SettingCardProps {
  setting: Setting
  isLoading?: boolean
  onEdit?: () => void
}

export function SettingCard({ setting, isLoading, onEdit }: SettingCardProps) {
  if (isLoading) {
    return <SettingCardSkeleton />
  }

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {setting.name || "Unnamed Location"}
          </CardTitle>
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
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {setting.time_of_day && (
            <Badge variant="secondary" className="text-xs">
              {setting.time_of_day}
            </Badge>
          )}
          {setting.weather && (
            <Badge variant="outline" className="text-xs">
              {setting.weather}
            </Badge>
          )}
        </div>

        {setting.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {setting.description}
          </p>
        )}

        {setting.art_style && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Style:</span> {setting.art_style}
          </p>
        )}

        {setting.reference_image_url && (
          <div className="mt-2 aspect-video overflow-hidden rounded-md bg-muted">
            <img
              src={setting.reference_image_url}
              alt={setting.name || "Setting"}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SettingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card>
  )
}
