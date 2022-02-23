import style from "./MintButton.module.scss"
import layout from "../../styles/Layout.module.scss"
import Link from "next/link"
import cs from "classnames"
import { GenerativeToken, GenTokFlag } from "../../types/entities/GenerativeToken"
import { Spacing } from "../Layout/Spacing"
import { Button, ButtonState } from "."
import { displayMutez } from "../../utils/units"
import { PropsWithChildren, useContext, useEffect, useMemo, useState } from "react"
import { Countdown } from "../Utils/Countdown"
import { distanceSecondsClamped } from "../../utils/time"
import { UserContext } from "../../containers/UserProvider"
import { ContractFeedback } from "../Feedback/ContractFeedback"
import { useContractCall } from "../../utils/hookts"
import { MintCall } from "../../types/ContractCalls"
import { DisplayTezos } from "../Display/DisplayTezos"

interface Props {
  token: GenerativeToken
  onReveal: (hash: string) => void
}
export function MintButton({
  token,
  onReveal,
  children,
}: PropsWithChildren<Props>) {
  const userContext = useContext(UserContext)
  // is the token hidden ?
  const isHidden = [GenTokFlag.MALICIOUS, GenTokFlag.HIDDEN].includes(token.flag) || token.balance === 0
  
  const lockEnd = useMemo(() => new Date(token.lockEnd), [token])
  
  // is the token locked ?
  const [isLocked, setIsLocked] = useState<boolean>(distanceSecondsClamped(new Date(), lockEnd) > 0)

  // is the token enabled ?
  const isEnabled = useMemo<boolean>(() => {
    // token is enabled if its state is enabled or if its disabled and author is the user
    return token.enabled || token.author.id === userContext.user?.id
  }, [token, userContext])

  // hook to interact with the contract
  const { state, loading, success, call, error, transactionHash } = 
    useContractCall<MintCall>(userContext.walletManager?.mintToken)

  const mint = () => {
    call({
      issuer_id: token.id,
      price: token.price
    })
  }

  const buttonClick = async () => {
    // if user is not connected, we request wallet sync
    if (!userContext.user) {
      await userContext.connect()
      mint()
    }
    else {
      mint()
    }
  }

  // whenever there is a transaction hash, we can tell the mint was
  // successful
  useEffect(() => {
    if (transactionHash) {
      onReveal(transactionHash)
    }
  }, [transactionHash])

  return (
    <div className={cs(style.root)}>
      <ContractFeedback
        state={state}
        error={error}
        success={success}
        loading={loading}
        className={cs(style.contract_feedback)}
      />

      {isLocked && (
        <>
          <strong>
            <span><i aria-hidden className="fas fa-lock"/> unlocks in </span>
            <Countdown
              until={lockEnd}
              onEnd={() => setIsLocked(false)}
            />
          </strong>
          <Spacing size="8px"/>
        </>
      )}

      {transactionHash && (
        <>
          <Link href={`/reveal/${token.id}/${transactionHash}`} passHref>
            <Button
              isLink
              color="secondary"
              iconComp={<i aria-hidden className="fas fa-arrow-right"/>}
              iconSide="right"
              size="regular"
            >
              reveal
            </Button>
          </Link>
          <Spacing size="regular"/>
        </>
      )}

      {!token.enabled && (
        <>
          <small>
            <span>Token is currently <strong>disabled</strong> by author</span>
            {isEnabled && (
              <span>
                <br/>
                But as the author, you can still mint
              </span>
            )}
          </small>
          <Spacing size="2x-small"/>
        </>
      )}
      
      <div className={cs(layout.buttons_inline, layout.flex_wrap, style.buttons_wrapper)}>
        {!isHidden && (
          <Button
            type="button"
            color="secondary"
            disabled={!isEnabled || isLocked}
            onClick={buttonClick}
            state={loading ? "loading" : "default"}
            size="regular"
          >
            mint iteration&nbsp;&nbsp;<DisplayTezos mutez={token.price} tezosSize="regular" formatBig={false} />
          </Button>
        )}

        {children}
      </div>
    </div>
  )
}