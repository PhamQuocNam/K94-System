import { expect, test } from "@playwright/test"
import { firstSuperuser, firstSuperuserPassword } from "./config.ts"
import { logInUser, logOutUser } from "./utils/user"

const randomProjectTitle = () =>
  `Project ${Math.random().toString(36).substring(7)}`
const randomProjectDescription = () =>
  `Description ${Math.random().toString(36).substring(7)}`
const randomStoryContent = () =>
  `Once upon a time in a magical forest, there lived a brave knight named Sir Arthur. One day, he received a mysterious letter from the king, summoning him to the castle. As he journeyed through the enchanted woods, he encountered a wise old owl who warned him of dangers ahead. Undeterred, Sir Arthur pressed on, his sword gleaming in the dappled sunlight filtering through the ancient trees.`

test.use({ storageState: "playwright/.auth/user.json" })

test.beforeEach(async ({ page }) => {
  await logInUser(page, firstSuperuser, firstSuperuserPassword)
})

test.afterEach(async ({ page }) => {
  await logOutUser(page)
})

test.describe("Projects Page", () => {
  test("displays projects list", async ({ page }) => {
    await page.goto("/projects")

    // Check if we're on the projects page
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible()

    // Check for the "New Project" button
    await expect(
      page.getByRole("button", { name: "New Project" }),
    ).toBeVisible()
  })

  test("creates a new project", async ({ page }) => {
    await page.goto("/projects")

    const projectTitle = randomProjectTitle()
    const projectDescription = randomProjectDescription()

    // Click New Project button
    await page.getByRole("button", { name: "New Project" }).click()

    // Fill in the form
    await page.getByTestId("title-input").fill(projectTitle)
    await page.getByTestId("description-input").fill(projectDescription)

    // Submit
    await page.getByRole("button", { name: "Create" }).click()

    // Should navigate to the new project page
    await page.waitForURL(/\/projects\/[a-f0-9-]+/)
    await expect(page.getByText(projectTitle)).toBeVisible()
  })

  test("validates project creation with empty title", async ({ page }) => {
    await page.goto("/projects")

    await page.getByRole("button", { name: "New Project" }).click()

    // Try to submit without title
    await page.getByRole("button", { name: "Create" }).click()

    // Should show validation error
    await expect(page.getByText("Title is required")).toBeVisible()
  })
})

test.describe("Project Detail Page", () => {
  test("creates storyboard and analyzes story", async ({ page }) => {
    await page.goto("/projects")

    const projectTitle = randomProjectTitle()

    // Create a new project first
    await page.getByRole("button", { name: "New Project" }).click()
    await page.getByTestId("title-input").fill(projectTitle)
    await page.getByTestId("description-input").fill(randomProjectDescription())
    await page.getByRole("button", { name: "Create" }).click()

    // Wait for project detail page
    await page.waitForURL(/\/projects\/[a-f0-9-]+/)

    // Should see "Create Storyboard" form
    await expect(page.getByText("Create Storyboard")).toBeVisible()
    await expect(
      page.getByText("Enter your story content to begin the analysis process"),
    ).toBeVisible()

    const storyContent = randomStoryContent()

    // Fill in storyboard form
    await page.getByTestId("content-textarea").fill(storyContent)
    await page.getByTestId("style-input").fill("Cinematic")

    // Submit storyboard
    await page.getByRole("button", { name: "Create & Continue" }).click()

    // Should now see Analyze Story button
    await expect(
      page.getByRole("button", { name: "Analyze Story" }),
    ).toBeVisible()

    // Click Analyze Story
    await page.getByRole("button", { name: "Analyze Story" }).click()

    // Wait for analysis to complete (check for tabs)
    await expect(page.getByText("Characters")).toBeVisible({ timeout: 60000 })
    await expect(page.getByText("Settings")).toBeVisible()
    await expect(page.getByText("Scenes")).toBeVisible()

    // Verify we have some results
    const charactersCount = await page
      .getByText(/Characters \(\d+\)/)
      .textContent()
    expect(charactersCount).toBeTruthy()
  })

  test("validates storyboard content minimum length", async ({ page }) => {
    await page.goto("/projects")

    // Create a project
    await page.getByRole("button", { name: "New Project" }).click()
    await page.getByTestId("title-input").fill(randomProjectTitle())
    await page.getByTestId("description-input").fill(randomProjectDescription())
    await page.getByRole("button", { name: "Create" }).click()

    await page.waitForURL(/\/projects\/[a-f0-9-]+/)

    // Try to submit with short content
    await page.getByTestId("content-textarea").fill("Too short")
    await page.getByRole("button", { name: "Create & Continue" }).click()

    // Should show validation error
    await expect(
      page.getByText(/Content must be at least 50 characters/),
    ).toBeVisible()
  })

  test("displays analyzed characters, settings, and scenes", async ({
    page,
  }) => {
    await page.goto("/projects")

    // Create project
    await page.getByRole("button", { name: "New Project" }).click()
    await page.getByTestId("title-input").fill(randomProjectTitle())
    await page.getByTestId("description-input").fill(randomProjectDescription())
    await page.getByRole("button", { name: "Create" }).click()

    await page.waitForURL(/\/projects\/[a-f0-9-]+/)

    // Create and analyze storyboard
    await page.getByTestId("content-textarea").fill(randomStoryContent())
    await page.getByTestId("style-input").fill("Anime")
    await page.getByRole("button", { name: "Create & Continue" }).click()
    await page.getByRole("button", { name: "Analyze Story" }).click()

    // Wait for analysis
    await expect(page.getByText("Characters")).toBeVisible({ timeout: 60000 })

    // Check Characters tab
    await page.getByRole("tab", { name: /Characters/ }).click()
    const characterCards = page.locator('[data-testid="character-card"]')
    await expect(characterCards.first()).toBeVisible({ timeout: 10000 })

    // Check Settings tab
    await page.getByRole("tab", { name: /Settings/ }).click()
    const settingCards = page.locator('[data-testid="setting-card"]')
    await expect(settingCards.first()).toBeVisible()

    // Check Scenes tab
    await page.getByRole("tab", { name: /Scenes/ }).click()
    const sceneCards = page.locator('[data-testid="scene-card"]')
    await expect(sceneCards.first()).toBeVisible()
  })

  test("can edit storyboard", async ({ page }) => {
    await page.goto("/projects")

    // Create project
    await page.getByRole("button", { name: "New Project" }).click()
    await page.getByTestId("title-input").fill(randomProjectTitle())
    await page.getByTestId("description-input").fill(randomProjectDescription())
    await page.getByRole("button", { name: "Create" }).click()

    await page.waitForURL(/\/projects\/[a-f0-9-]+/)

    // Create storyboard
    const initialContent = randomStoryContent()
    await page.getByTestId("content-textarea").fill(initialContent)
    await page.getByTestId("style-input").fill("Pixel Art")
    await page.getByRole("button", { name: "Create & Continue" }).click()

    // Click edit button on storyboard card
    await page.getByLabel("Edit").click()

    // Wait for dialog
    await expect(page.getByText("Edit Storyboard")).toBeVisible()

    // Update content
    const updatedContent = initialContent + " The adventure continued..."
    await page.getByTestId("edit-content-textarea").fill(updatedContent)
    await page.getByTestId("edit-style-input").fill("Watercolor")

    // Save
    await page.getByRole("button", { name: "Save" }).click()

    // Dialog should close
    await expect(page.getByText("Edit Storyboard")).not.toBeVisible()

    // Verify updated content is visible
    await expect(page.getByText(/The adventure continued/)).toBeVisible()
  })

  test("navigates back to projects list", async ({ page }) => {
    await page.goto("/projects")

    // Create project
    await page.getByRole("button", { name: "New Project" }).click()
    await page.getByTestId("title-input").fill(randomProjectTitle())
    await page.getByTestId("description-input").fill(randomProjectDescription())
    await page.getByRole("button", { name: "Create" }).click()

    await page.waitForURL(/\/projects\/[a-f0-9-]+/)

    // Click back button
    await page.getByRole("button", { name: "Back to Projects" }).click()

    // Should be back on projects list
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible()
    await page.waitForURL("/projects")
  })

  test("shows empty state when no analysis exists", async ({ page }) => {
    await page.goto("/projects")

    // Create project
    await page.getByRole("button", { name: "New Project" }).click()
    await page.getByTestId("title-input").fill(randomProjectTitle())
    await page.getByTestId("description-input").fill(randomProjectDescription())
    await page.getByRole("button", { name: "Create" }).click()

    await page.waitForURL(/\/projects\/[a-f0-9-]+/)

    // Create storyboard without analyzing
    await page.getByTestId("content-textarea").fill(randomStoryContent())
    await page.getByTestId("style-input").fill("Realistic")
    await page.getByRole("button", { name: "Create & Continue" }).click()

    // Should see empty state message
    await expect(page.getByText("No analysis yet")).toBeVisible()
    await expect(
      page.getByText(
        "Click Analyze Story to extract characters, settings, and scenes",
      ),
    ).toBeVisible()
  })
})

test.describe("Project Actions", () => {
  test("edits project details", async ({ page }) => {
    await page.goto("/projects")

    const projectTitle = randomProjectTitle()
    const updatedTitle = randomProjectTitle()

    // Create project
    await page.getByRole("button", { name: "New Project" }).click()
    await page.getByTestId("title-input").fill(projectTitle)
    await page.getByTestId("description-input").fill(randomProjectDescription())
    await page.getByRole("button", { name: "Create" }).click()

    await page.waitForURL(/\/projects\/[a-f0-9-]+/)

    // Navigate back to projects
    await page.getByRole("button", { name: "Back to Projects" }).click()

    // Find and click edit button for the project
    const projectCard = page.getByText(projectTitle)
    await expect(projectCard).toBeVisible()

    // Click the edit button (should be a dropdown menu item)
    await page
      .locator(`[data-testid="project-card"]`, { hasText: projectTitle })
      .getByRole("button")
      .click()
    await page.getByRole("menuitem", { name: "Edit" }).click()

    // Wait for edit dialog
    await expect(page.getByText("Edit Project")).toBeVisible()

    // Update title
    await page.getByTestId("edit-title-input").fill(updatedTitle)

    // Save
    await page.getByRole("button", { name: "Save" }).click()

    // Verify updated title is visible
    await expect(page.getByText(updatedTitle)).toBeVisible()
  })

  test("deletes project", async ({ page }) => {
    await page.goto("/projects")

    const projectTitle = randomProjectTitle()

    // Create project
    await page.getByRole("button", { name: "New Project" }).click()
    await page.getByTestId("title-input").fill(projectTitle)
    await page.getByTestId("description-input").fill(randomProjectDescription())
    await page.getByRole("button", { name: "Create" }).click()

    await page.waitForURL(/\/projects\/[a-f0-9-]+/)

    // Navigate back to projects
    await page.getByRole("button", { name: "Back to Projects" }).click()

    // Find and click delete button for the project
    const projectCard = page.getByText(projectTitle)
    await expect(projectCard).toBeVisible()

    await page
      .locator(`[data-testid="project-card"]`, { hasText: projectTitle })
      .getByRole("button")
      .click()
    await page.getByRole("menuitem", { name: "Delete" }).click()

    // Wait for delete confirmation dialog
    await expect(page.getByText("Delete Project")).toBeVisible()

    // Confirm deletion
    await page.getByRole("button", { name: "Delete" }).click()

    // Verify project is removed
    await expect(page.getByText(projectTitle)).not.toBeVisible()
  })
})
