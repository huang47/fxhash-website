import style from "./Activity.module.scss"
import cs from "classnames"
import { Action as ActionType, TokenActionType } from "../../types/entities/Action"
import { Action } from "./Action"
import { useMemo } from "react"


const ActionsPredecescence: Record<TokenActionType, number> = {
  NONE              : 0,
  UPDATE_STATE      : 0,
  BURN_SUPPLY       : 0,
  MINTED            : 0,
  MINTED_FROM       : 1,
  COMPLETED         : 20,
  TRANSFERED        : 10,
  OFFER             : 3,
  OFFER_CANCELLED   : 3,
  OFFER_ACCEPTED    : 3,
}

// group actions by timestamp, sort by type within group, then rebuild array
function sortActions(actions: ActionType[]): ActionType[] {
  // batch actions by timestamp
  const batches: Record<string, ActionType[]> = {}
  for (const action of actions) {
    if (!batches[action.createdAt]) 
      batches[action.createdAt] = []
    batches[action.createdAt].push(action)
  }
  // sort each batch, and rebuild the output array at the same time
  let ret: ActionType[] = []
  for (const k in batches) {
    batches[k] = batches[k].sort((a, b) => ActionsPredecescence[b.type] - ActionsPredecescence[a.type])
    ret = [...ret, ...batches[k]]
  }
  return ret
}

interface Props {
  actions: ActionType[]
  className?: string
  verbose?: boolean
}

export function Activity({ actions, className, verbose = false }: Props) {
  const sortedActions = useMemo(() => sortActions(actions), [actions])

  return (
    <section className={cs(style.container, className)}>
      {sortedActions?.length > 0 ? (
        sortedActions.map(action => (
          <Action key={action.id} action={action} verbose={verbose} />
        ))
      ):(
        <em>No activity yet</em>
      )}
    </section>
  )
}