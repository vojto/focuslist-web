const {
  chromium,
} = require("/Users/vojto/Code/Active/focustask/node_modules/playwright")

// Mid-drag the dragged row floats out of the flow ([data-dnd-dragging],
// position:fixed) while a cloned stand-in ([data-dnd-placeholder]) marks the
// slot, so the in-flow row order is the lis without the floating one.
async function rowOrder(pane) {
  const texts = await pane
    .locator("ul > li:not([data-dnd-dragging])")
    .evaluateAll((els) => els.map((el) => (el.textContent ?? "").trim()))
  return texts.map((t) => t.replace(/Delete$/, "").trim())
}

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
    if (m.type() === "error") errors.push(`console: ${m.text()}`)
  })
  const failures = []
  const check = (label, ok) => {
    console.log(label + ":", ok)
    if (!ok) failures.push(label)
  }

  await page.goto("http://localhost:5174")
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText("No project selected").waitFor()

  const panes = page.locator("main > section")
  const todayPane = panes.nth(0)
  for (const title of ["One", "Two", "Three", "Four"]) {
    await createTask(todayPane, title)
  }
  await createProject(page, "Website")
  const projectPane = panes.nth(1)
  await createTask(projectPane, "Dragged")

  const source = await projectPane.getByText("Dragged").boundingBox()
  const paneBox = await todayPane.boundingBox()

  // Pick up and cross near the TOP edge of the app into the today pane
  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(source.x + 20, source.y + 10, { steps: 4 })
  await page.mouse.move(paneBox.x + paneBox.width / 2, paneBox.y + 30, {
    steps: 12,
  })
  await page.waitForTimeout(150)
  let order = await rowOrder(todayPane)
  check("gap at TOP after crossing near upper edge", order[0] === "Dragged")

  // Drag down to the lower half of "Two" → gap should be right after Two
  const twoBox = await todayPane.locator("li", { hasText: "Two" }).boundingBox()
  await page.mouse.move(
    twoBox.x + twoBox.width / 2,
    twoBox.y + twoBox.height - 6,
    { steps: 8 },
  )
  await page.waitForTimeout(150)
  order = await rowOrder(todayPane)
  check("gap after 'Two' when hovering its lower half", order[2] === "Dragged")

  // Drag into the BOTTOM padding → gap should be last
  await page.mouse.move(
    paneBox.x + paneBox.width / 2,
    paneBox.y + paneBox.height - 80,
    { steps: 8 },
  )
  await page.waitForTimeout(150)
  order = await rowOrder(todayPane)
  check("gap at BOTTOM in lower padding", order[order.length - 1] === "Dragged")

  // Back up to the top padding — the reported "stuck at second" case
  await page.mouse.move(paneBox.x + 14, paneBox.y + 40, { steps: 8 })
  await page.waitForTimeout(150)
  order = await rowOrder(todayPane)
  check("gap back at TOP in upper-left padding", order[0] === "Dragged")

  // Drop — final order must match the last gap
  await page.mouse.up()
  await page.waitForTimeout(200)
  order = await rowOrder(todayPane)
  check("dropped where the gap was (top)", order[0] === "Dragged")

  // Same-list reorder: drag "One" below "Three"
  const oneBox = await todayPane.locator("li", { hasText: "One" }).boundingBox()
  await page.mouse.move(
    oneBox.x + oneBox.width / 2,
    oneBox.y + oneBox.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(oneBox.x + 20, oneBox.y + 12, { steps: 4 })
  const threeBox = await todayPane
    .locator("li", { hasText: "Three" })
    .boundingBox()
  await page.mouse.move(
    threeBox.x + threeBox.width / 2,
    threeBox.y + threeBox.height - 6,
    { steps: 10 },
  )
  await page.waitForTimeout(150)
  await page.mouse.up()
  await page.waitForTimeout(200)
  order = await rowOrder(todayPane)
  check(
    "same-list reorder One after Three",
    JSON.stringify(order) ===
      JSON.stringify(["Dragged", "Two", "Three", "One", "Four"]),
  )

  console.log("errors:", errors.length === 0 ? "none" : errors)
  await browser.close()
  process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
