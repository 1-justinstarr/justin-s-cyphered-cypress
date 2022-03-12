import globby from 'globby'
import type { TestingType } from '@packages/types'
import {
  FilePart,
  formatMigrationFile,
  getComponentFolder,
  getComponentTestFilesGlobs,
  getIntegrationFolder,
  getIntegrationTestFilesGlobs,
  isDefaultTestFiles,
  regexps,
} from '.'
import type { MigrationFile } from '../MigrationDataSource'
import type { LegacyCypressConfigJson } from '..'

export interface MigrationSpec {
  relative: string
  usesDefaultFolder: boolean
  usesDefaultTestFiles: boolean
  testingType: TestingType
}

interface GetSpecs {
  component: MigrationSpec[]
  integration: MigrationSpec[]
}

export function substitute (part: FilePart): FilePart {
  // nothing to substitute, just a regular
  // part of the file
  if (!('group' in part)) {
    return part
  }

  // cypress/integration -> cypress/e2e
  if (part.group === 'folder' && part.text === 'integration') {
    return { ...part, text: 'e2e' }
  }

  // basic.spec.js -> basic.cy.js
  if (part.group === 'preExtension') {
    return { ...part, text: '.cy.' }
  }

  // support/index.js -> support/e2e.js
  if (part.group === 'supportFileName' && part.text === 'index') {
    return { ...part, text: 'e2e' }
  }

  return part
}

export function applyMigrationTransform (
  spec: MigrationSpec,
): MigrationFile {
  let regexp: RegExp

  if (spec.testingType === 'e2e' && spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // e2e, cypress/integration, **/* (default testFiles)
    regexp = new RegExp(regexps.e2e.before.defaultFolderDefaultTestFiles)
  } else if (spec.testingType === 'e2e' && !spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // e2e, custom-folder, **/* (default testFiles)
    regexp = new RegExp(regexps.e2e.before.customFolderDefaultTestFiles)
  } else if (spec.testingType === 'e2e' && spec.usesDefaultFolder && !spec.usesDefaultTestFiles) {
    // e2e, cypress/integration , **/*.spec.ts (custom testFiles)
    regexp = new RegExp(regexps.e2e.before.defaultFolderCustomTestFiles)
  } else if (spec.testingType === 'component' && spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // component, cypress/component , (default testFiles)
    regexp = new RegExp(regexps.component.before.defaultFolderDefaultTestFiles)
  } else if (spec.testingType === 'component' && !spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // component, cypress/custom-component , (default testFiles)
    regexp = new RegExp(regexps.component.before.customFolderDefaultTestFiles)
  } else {
    // custom folder AND test files pattern
    // should be impossible, we should not call this function in the first place.
    throw Error(`Cannot use applyMigrationTransform on a project with a custom folder and custom testFiles.`)
  }

  const partsBeforeMigration = formatMigrationFile(spec.relative, regexp)
  const partsAfterMigration = partsBeforeMigration.map((part) => {
    // avoid re-renaming files with the right preExtension
    // it would make a myFile.cy.cy.js file
    if (part.highlight
      && part.group === 'preExtension'
      && /\.cy\.([j|t]s[x]?|coffee)$/.test(spec.relative)) {
      return part
    }

    return substitute(part)
  })

  return {
    testingType: spec.testingType,
    before: {
      relative: spec.relative,
      parts: partsBeforeMigration,
    },
    after: {
      relative: partsAfterMigration.map((x) => x.text).join(''),
      parts: partsAfterMigration,
    },
  }
}

export async function getSpecs (projectRoot: string, config: LegacyCypressConfigJson): Promise<GetSpecs> {
  const integrationFolder = getIntegrationFolder(config)
  const integrationTestFiles = getIntegrationTestFilesGlobs(config)

  const componentFolder = getComponentFolder(config)
  const componentTestFiles = getComponentTestFilesGlobs(config)

  let integrationSpecs: MigrationSpec[] = []
  let componentSpecs: MigrationSpec[] = []

  const globs = integrationFolder
    ? integrationFolder === 'cypress/integration'
      ? ['**/*.{js,ts,jsx,tsx,coffee}'].map((glob) => `${integrationFolder}/${glob}`)
      : integrationTestFiles.map((glob) => `${integrationFolder}/${glob}`)
    : []

  let specs = integrationFolder
    ? (await globby(globs, { onlyFiles: true, cwd: projectRoot }))
    : []

  const fullyCustom = integrationFolder !== 'cypress/integration' && !isDefaultTestFiles(config, 'integration')

  // we cannot do a migration if either integrationFolder is false,
  // or if both the integrationFolder and testFiles are custom.
  if (fullyCustom) {
    integrationSpecs = []
  } else {
    integrationSpecs = specs.map((relative) => {
      return {
        relative,
        usesDefaultFolder: integrationFolder === 'cypress/integration',
        usesDefaultTestFiles: isDefaultTestFiles(config, 'integration'),
        testingType: 'e2e',
      }
    })
  }

  if (componentFolder === false || !isDefaultTestFiles(config, 'component')) {
    componentSpecs = []
  } else {
    const globs = componentTestFiles.map((glob) => {
      return `${componentFolder}/${glob}`
    })

    componentSpecs = (await globby(globs, { onlyFiles: true, cwd: projectRoot })).map((relative) => {
      return {
        relative,
        usesDefaultFolder: componentFolder === 'cypress/component',
        usesDefaultTestFiles: isDefaultTestFiles(config, 'component'),
        testingType: 'component',
      }
    })
  }

  return {
    component: componentSpecs,
    integration: integrationSpecs,
  }
}