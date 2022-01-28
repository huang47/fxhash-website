import style from "./SectionHeader.module.scss"
import layoutStyle from "../../styles/Layout.module.scss"
import cs from "classnames"
import { PropsWithChildren } from "react"

interface Props {
  layout?: "left" | "center"
}

export function SectionHeader({ 
  layout = "left",
  children,
}: PropsWithChildren<Props>) {
  return (
    <header className={cs(style.container, style[`layout_${layout}`], layoutStyle['padding-small'])}>
      { children }
    </header>
  )
}