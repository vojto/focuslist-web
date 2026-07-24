const { chromium } = require("/Users/vojto/Code/Active/focustask/node_modules/playwright")

const shots = "/private/tmp/claude-501/-Users-vojto-Code-Active-focuslist/098ab9c9-775b-4b99-9f6a-0292ff0862ce/scratchpad"

async function drag(page, from, to, { cancel = false } = {}) {
  const a = await from.boundingBox()
  const b = await to.boundingBox()
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2 + 4, { steps: 4 })
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 15 })
  await page.waitForTimeout(150)
  if (cancel) {
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)
  }
  await page.mouse.up()
  // Wait out the drop animation: until it ends the dragged row floats
  // ([data-dnd-dragging]) next to its cloned stand-in, so text locators
  // would see rows twice.
  await page
    .locator("[data-dnd-placeholder]")
    .waitFor({ state: "detached", timeout: 2000 })
    .catch(() => {})
  await page.waitForTimeout(150)
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`))
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`)
  })

  await page.goto("http://localhost:5174")
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText("No project selected").waitFor()

  // Setup: project "Website" with two tasks, one task on Today
  await page.getByRole("button", { name: "New project" }).click()
  await page.getByPlaceholder("Project name").fill("Website")
  await page.getByRole("button", { name: "Create" }).click()
  const panes = page.locator("main > section")
  const todayPane = panes.nth(0)
  const projectPane = panes.nth(1)
  await projectPane.locator("h1", { hasText: "Website" }).waitFor()

  for (const title of ["Design homepage", "Write copy"]) {
    await projectPane.getByRole("button", { name: "New task" }).click()
    await page.getByPlaceholder("Task name").fill(title)
    await page.getByRole("button", { name: "Create" }).click()
    await projectPane.getByText(title).waitFor()
  }
  await todayPane.getByRole("button", { name: "New task" }).click()
  await page.getByPlaceholder("Task name").fill("Review PRs")
  await page.getByRole("button", { name: "Create" }).click()
  await todayPane.getByText("Review PRs").waitFor()
  console.log("setup done")

  // 1. Drag "Design homepage" from project onto Today's row
  await drag(page, projectPane.getByText("Design homepage"), todayPane.getByText("Review PRs"))
  await todayPane.getByText("Design homepage").waitFor({ timeout: 2000 })
  const badge = await todayPane.locator("li", { hasText: "Design homepage" }).getByText("Website").count()
  console.log("cross-pane drag ok; project badge shown:", badge > 0)

  // 2. Reload — the move must persist
  await page.reload()
  await todayPane.getByText("Design homepage").waitFor()
  console.log("persisted after reload")

  // 3. Drag "Write copy" toward Today but press Escape — must stay in project
  await drag(page, projectPane.getByText("Write copy"), todayPane.getByText("Review PRs"), { cancel: true })
  const inProject = await projectPane.getByText("Write copy").count()
  const inToday = await todayPane.getByText("Write copy").count()
  console.log("escape cancel ok:", inProject === 1 && inToday === 0)

  // 4. Drag "Design homepage" back to the project pane's empty area (below rows)
  await drag(page, todayPane.getByText("Design homepage"), projectPane.locator("h1", { hasText: "Website" }))
  await page.waitForTimeout(200)
  const backInProject = await projectPane.getByText("Design homepage").count()
  console.log("drag back to project ok:", backInProject === 1)

  await page.screenshot({ path: `${shots}/smoke-dnd.png` })
  console.log("errors:", errors.length === 0 ? "none" : errors)
  await browser.close()
  process.exit(errors.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error("SMOKE FAILED:", e.message)
  process.exit(1)
})
