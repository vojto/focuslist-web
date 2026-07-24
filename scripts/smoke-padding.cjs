const { chromium } = require("/Users/vojto/Code/Active/focustask/node_modules/playwright")

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`))
  page.on("console", (m) => {
    { if (m.type() === "error") errors.push(`console: ${m.text()}`); if (m.text().startsWith("[dnd]")) console.log(m.text()) }
  })

  await page.goto("http://localhost:5174")
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText("No project selected").waitFor()

  // Setup: Today has two tasks; project "Website" has one
  const panes = page.locator("main > section")
  const todayPane = panes.nth(0)
  for (const title of ["Alpha", "Beta"]) {
    await todayPane.getByRole("button", { name: "New task" }).click()
    await page.getByPlaceholder("Task name").fill(title)
    await page.getByRole("button", { name: "Create" }).click()
    await todayPane.getByText(title).waitFor()
  }
  await page.getByRole("button", { name: "New project" }).click()
  await page.getByPlaceholder("Project name").fill("Website")
  await page.getByRole("button", { name: "Create" }).click()
  const projectPane = panes.nth(1)
  await projectPane.locator("h1", { hasText: "Website" }).waitFor()
  await projectPane.getByRole("button", { name: "New task" }).click()
  await page.getByPlaceholder("Task name").fill("Dragged")
  await page.getByRole("button", { name: "Create" }).click()
  await projectPane.getByText("Dragged").waitFor()

  // Drag "Dragged" into Today's LEFT PADDING at the height of row 1 ("Alpha").
  // Old behavior: lands at the bottom. Expected: lands at the top (before
  // Alpha), because the collision snaps to the nearest row.
  const source = await projectPane.getByText("Dragged").boundingBox()
  const paneBox = await todayPane.boundingBox()
  const alphaBox = await todayPane.locator("li", { hasText: "Alpha" }).boundingBox()
  const targetX = paneBox.x + 12 // inside the pane, left padding — no row here
  const targetY = alphaBox.y + 4 // upper part of the first row's height

  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2)
  await page.mouse.down()
  await page.mouse.move(source.x + 20, source.y + 10, { steps: 4 })
  await page.mouse.move(targetX, targetY, { steps: 15 })
  await page.waitForTimeout(150)
  await page.mouse.up()
  await page.waitForTimeout(200)

  const order = await todayPane.locator("ul > li").allInnerTexts()
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
