import style from "./SettingsGroup.module.scss"
import cs from "classnames"
import { PropsWithChildren } from "react"

interface Props {
  title: string
}
export function SettingsGroup({
  title,
  children,
}: PropsWithChildren<Props>) {
  return (
    <div className={cs(style.root)}>
      <div className={cs(style.title)}>{ title }</div>
      <div className={cs(style.content)}>{ children }</div>
    </div>
  )
}