import { Pencil, User } from "lucide-react"
import type { Character } from "@/client/types.gen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface CharacterCardProps {
  character: Character
  isLoading?: boolean
  onEdit?: () => void
}

export function CharacterCard({
  character,
  isLoading,
  onEdit,
}: CharacterCardProps) {
  if (isLoading) {
    return <CharacterCardSkeleton />
  }

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4 text-muted-foreground" />
            {character.name || "Unnamed Character"}
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
          {character.gender && (
            <Badge variant="secondary" className="text-xs">
              {character.gender}
            </Badge>
          )}
          {character.age && (
            <Badge variant="outline" className="text-xs">
              {character.age} years old
            </Badge>
          )}
        </div>

        {(character.body_build ||
          character.face ||
          character.hair ||
          character.clothes) && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {character.body_build && (
              <p>
                <span className="font-medium">Build:</span>{" "}
                {character.body_build}
              </p>
            )}
            {character.face && (
              <p>
                <span className="font-medium">Face:</span> {character.face}
              </p>
            )}
            {character.hair && (
              <p>
                <span className="font-medium">Hair:</span> {character.hair}
              </p>
            )}
            {character.clothes && (
              <p>
                <span className="font-medium">Clothes:</span>{" "}
                {character.clothes}
              </p>
            )}
          </div>
        )}

        {character.reference_image_url && (
          <div className="mt-2 aspect-[3/4] overflow-hidden rounded-md bg-muted">
            <img
              src={character.reference_image_url}
              alt={character.name || "Character"}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CharacterCardSkeleton() {
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
        <Skeleton className="aspect-[3/4] w-full" />
      </CardContent>
    </Card>
  )
}
