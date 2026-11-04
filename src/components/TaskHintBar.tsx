import { useState } from 'react'
import { taskInstructions } from '../data/experimentTasks'
import { useExperiment } from './ExperimentFlow'

export function TaskHintBar() {
  const { taskId, recordTaskHintToggle } = useExperiment()
  const [expanded, setExpanded] = useState(false)
  const task = taskInstructions[taskId]

  function toggle() {
    const nextExpanded = !expanded
    setExpanded(nextExpanded)
    recordTaskHintToggle(nextExpanded ? 'open' : 'close')
  }

  return <aside className={`task-hint-bar${expanded ? ' is-expanded' : ''}`} data-experiment-ui="true">
    <div className="task-hint-summary">
      <strong>현재 {task.title}</strong>
      <button type="button" onClick={toggle} aria-expanded={expanded} aria-controls="task-hint-details">
        안내 {expanded ? '접기 ▲' : '보기 ▼'}
      </button>
    </div>
    {expanded && <p id="task-hint-details">{task.prompt}</p>}
  </aside>
}
