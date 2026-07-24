const {
  chromium,
} = require("/Users/vojto/Code/Active/focustask/node_modules/playwright")

// A new project is an untitled row; its name is typed into the inline
// rename that a double-click opens.
async function createProject(page, name) {
  await page.getByRole("button", { name: "New project" }).click()
  const row = page.locator('nav[aria-label="Projects"] > *').last()
  await row.dblclick()
  const input = row.locator("input")
  await input.fill(name)
  await input.press("Enter")
}

// "New task" appends an untitled row already in inline edit mode, so the
// title goes straight into the open input.
async function createTask(pane, title) {
  await pane.getByRole("button", { name: "New task" }).click()
  const input = pane.locator('ul > li input:not([type="checkbox"])')
  await input.fill(title)
  await input.press("Enter")
  await pane.getByText(title).waitFor()
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`))
  page.on("console", (m) => {
    {
      if (m.type() === "error") errors.push(`console: ${m.text()}`)
      if (m.text().startsWith("[dnd]")) console.log(m.text())
    }
  })

  await page.goto("http://localhost:5174")
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText("No project selected").waitFor()

  // Setup: Today has two tasks; project "Website" has one
  const panes = page.locator("main > section")
  const todayPane = panes.nth(0)
  for (const title of ["Alpha", "Beta"]) {
    await createTask(todayPane, title)
  }
  await createProject(page, "Website")
  const projectPane = panes.nth(1)
  await projectPane.locator("h1", { hasText: "Website" }).waitFor()
  await createTask(projectPane, "Dragged")

  // Drag "Dragged" into Today's LEFT PADDING at the height of row 1 ("Alpha").
  // Old behavior: lands at the bottom. Expected: lands at the top (before
  // Alpha), because the collision snaps to the nearest row.
  const source = await projectPane.getByText("Dragged").boundingBox()
  const paneBox = await todayPane.boundingBox()
  const alphaBox = await todayPane
    .locator("li", { hasText: "Alpha" })
    .boundingBox()
  const targetX = paneBox.x + 12 // inside the pane, left padding — no row here
  const targetY = alphaBox.y + 4 // upper part of the first row's height

  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(source.x + 20, source.y + 10, { steps: 4 })
  await page.mouse.move(targetX, targetY, { steps: 15 })
  await page.waitForTimeout(150)
  await page.mouse.up()
  // Wait out the drop animation so the floating copy of the dragged row
  // ([data-dnd-dragging]) is gone before reading the row order.
  await page
    .locator("[data-dnd-placeholder]")
    .waitFor({ state: "detached", timeout: 2000 })
    .catch(() => {})
  await page.waitForTimeout(200)

  const order = await todayPane
    .locator("ul > li:not([data-dnd-dragging])")
    .allInnerTexts()
  const names = order.map((text) => text.split("\n")[0].trim())
  console.log("today order after padding drop:", JSON.stringify(names))
  console.log("landed at top (not bottom):", names[0].startsWith("Dragged"))

  console.log("errors:", errors.length === 0 ? "none" : errors)
  await browser.close()
  process.exit(names[0].startsWith("Dragged") && errors.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
