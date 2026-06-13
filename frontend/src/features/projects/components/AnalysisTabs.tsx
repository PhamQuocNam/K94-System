import { useState } from "react"
import type { Character, Scene, Setting, StoryBoard } from "@/client/types.gen"
import {
  CharacterCard,
  CharacterCardSkeleton,
  EditCharacterDialog,
  EditSceneDialog,
  EditSettingDialog,
  SceneCard,
  SceneCardSkeleton,
  SettingCard,
  SettingCardSkeleton,
} from "@/features/storyboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EntityList, SKELETON_COUNTS } from "@/routes/_layout/projects/$id/components"

interface AnalysisTabsProps {
  characters: Character[] | null
  charactersLoading: boolean
  settings: Setting[] | null
  settingsLoading: boolean
  scenes: Scene[] | null
  scenesLoading: boolean
  storyboard?: StoryBoard | null
}

export function AnalysisTabs({
  characters,
  charactersLoading,
  settings,
  settingsLoading,
  scenes,
  scenesLoading,
  storyboard,
}: AnalysisTabsProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  )
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null)
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false)
  const [settingDialogOpen, setSettingDialogOpen] = useState(false)
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false)

  const characterSkeletons = Array.from(
    { length: SKELETON_COUNTS.cards },
    (_, i) => <CharacterCardSkeleton key={i} />,
  )

  const settingSkeletons = Array.from(
    { length: SKELETON_COUNTS.cards },
    (_, i) => <SettingCardSkeleton key={i} />,
  )

  const sceneSkeletons = Array.from(
    { length: SKELETON_COUNTS.scenes },
    (_, i) => <SceneCardSkeleton key={i} />,
  )

  return (
    <>
      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="characters">
            Characters ({characters?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="settings">
            Settings ({settings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="scenes">
            Scenes ({scenes?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="space-y-4 mt-4">
          <EntityList
            items={characters || []}
            renderCard={(character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onEdit={() => {
                  setSelectedCharacter(character)
                  setCharacterDialogOpen(true)
                }}
              />
            )}
            skeleton={characterSkeletons}
            isLoading={charactersLoading}
            empty={!characters?.length}
            emptyMessage="No characters found"
            gridClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <EntityList
            items={settings || []}
            renderCard={(setting) => (
              <SettingCard
                key={setting.id}
                setting={setting}
                onEdit={() => {
                  setSelectedSetting(setting)
                  setSettingDialogOpen(true)
                }}
              />
            )}
            skeleton={settingSkeletons}
            isLoading={settingsLoading}
            empty={!settings?.length}
            emptyMessage="No settings found"
            gridClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          />
        </TabsContent>

        <TabsContent value="scenes" className="space-y-4 mt-4">
          <EntityList
            items={scenes || []}
            renderCard={(scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                onEdit={() => {
                  setSelectedScene(scene)
                  setSceneDialogOpen(true)
                }}
              />
            )}
            skeleton={sceneSkeletons}
            isLoading={scenesLoading}
            empty={!scenes?.length}
            emptyMessage="No scenes found"
            gridClassName="grid gap-4 md:grid-cols-2"
          />
        </TabsContent>
      </Tabs>

      {selectedCharacter && (
        <EditCharacterDialog
          character={selectedCharacter}
          open={characterDialogOpen}
          onOpenChange={(open) => {
            setCharacterDialogOpen(open)
            if (!open) setSelectedCharacter(null)
          }}
          storyboardStyle={storyboard?.style || undefined}
        />
      )}

      {selectedSetting && (
        <EditSettingDialog
          setting={selectedSetting}
          open={settingDialogOpen}
          onOpenChange={(open) => {
            setSettingDialogOpen(open)
            if (!open) setSelectedSetting(null)
          }}
          storyboardStyle={storyboard?.style ?? undefined}
        />
      )}

      {selectedScene && (
        <EditSceneDialog
          scene={selectedScene}
          open={sceneDialogOpen}
          onOpenChange={(open) => {
            setSceneDialogOpen(open)
            if (!open) setSelectedScene(null)
          }}
          storyboardStyle={storyboard?.style ?? undefined}
        />
      )}
    </>
  )
}
