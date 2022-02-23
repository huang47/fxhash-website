// import style from "./PlaceOffer.module.scss"
import { useContext } from "react"
import { Objkt } from "../../types/entities/Objkt"
import { User } from "../../types/entities/User"
import { UserContext } from "../UserProvider"
import { CancelOffer } from "./CancelOffer"
import { PlaceOffer } from "./PlaceOffer"


interface Props {
  objkt: Objkt
}

/**
 * This component should:
 *  - if user is owner:
 *    - has offer ? cancel offer
 *    - doesn't have offer ? place offer
 */
export function OfferControl({ objkt }: Props) {
  const userCtx = useContext(UserContext)
  const user = userCtx.user!
  const owner: User = (objkt.offer ? objkt.offer.issuer : objkt.owner)!

  return (
    <>
      {owner.id === user.id ? (
        objkt.offer ? (
          <CancelOffer offer={objkt.offer} />
        ):(
          <PlaceOffer objkt={objkt} />
        )
      ):null}
    </>
  )
}