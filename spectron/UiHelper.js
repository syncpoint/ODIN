import assert from 'assert'

export async function clickElementById (app, id) {
  try {
    assert.equal(await app.client.waitForExist(id, 5000), true, `element exists: ${id}`)
    await app.client.$(id).click()
  } catch (error) {
    assert.fail(`Failed to perform click on: ${id} ` + error)
  }
}

export async function elementsOfList (app, id, childTag) {
  try {
    assert.equal(await app.client.waitForExist(id, 5000), true, `element exists: ${id}`)
    return await app.client.$(id).$$(childTag)
  } catch (error) {
    assert.fail(`Failed to perform click on: ${id}` + error)
  }
}
