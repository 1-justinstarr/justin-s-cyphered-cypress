import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'

import ipc from '../lib/ipc'
import { isFileJSON } from '../lib/utils'
import { configFileFormatted } from '../lib/config-file-formatted'

const openProjectIdHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen({
    url: 'https://on.cypress.io/what-is-a-project-id',
    params: {
      utm_medium: 'Settings Tab',
      utm_campaign: 'Project ID',
    },
  })
}

const ProjectId = observer(({ project }) => {
  if (!project.id) return null

  return (
    <div data-cy="project-id">
      <a href='#' className='learn-more' onClick={openProjectIdHelp}>
        <i className='fas fa-info-circle' />{' '}
        Learn more
      </a>
      <p className='text-muted'>This projectId should be in your {configFileFormatted(project.configFile)} and checked into source control.
        It identifies your project and should not be changed.
      </p>
      <pre className='line-nums copy-to-clipboard'>
        <a className="action-copy" onClick={() => ipc.setClipboardText(document.querySelector('[data-cy="project-id"] pre').innerText)}>
          <Tooltip
            title='Copy to clipboard'
            placement='top'
            className='cy-tooltip'
          >
            <i className='fas fa-clipboard' />
          </Tooltip>
        </a>
        {
          isFileJSON(project.configFile) ?
            <>
              <span>{'{'}</span>
              <span>{`  "projectId": "${project.id}"`}</span>
              <span>{'}'}</span>
            </>
            :
            <>
              <span>{'module.exports = {'}</span>
              <span>{`  projectId: "${project.id}"`}</span>
              <span>{'}'}</span>
            </>
        }
      </pre>
    </div>
  )
})

export default ProjectId
