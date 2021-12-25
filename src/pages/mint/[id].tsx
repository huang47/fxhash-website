import { GetServerSideProps, NextPage } from "next"
import Head from "next/head"
import { Spacing } from "../../components/Layout/Spacing"
import layout from "../../styles/Layout.module.scss"
import cs from "classnames"
import { SectionHeader } from "../../components/Layout/SectionHeader"
import ClientOnly from "../../components/Utils/ClientOnly"
import { UserGuard } from "../../components/Guards/UserGuard"
import { GenerativeToken, GenTokFlag } from "../../types/entities/GenerativeToken"
import client from "../../services/ApolloClient"
import { gql } from "@apollo/client"
import { Mint } from "../../containers/Mint/Mint"
import { truncateEnd } from "../../utils/strings"
import { ipfsGatewayUrl } from "../../services/Ipfs"
import { TitleHyphen } from "../../components/Layout/TitleHyphen"
import { GenerativeFlagBanner } from "../../containers/Generative/FlagBanner"


interface Props {
  token: GenerativeToken
}

const MintPage: NextPage<Props> = ({ token }) => {
  // get the display url for og:image
  const displayUrl = token.metadata?.displayUri && ipfsGatewayUrl(token.metadata?.displayUri)

  return (
    <>
      <Head>
        <title>fxhash — mint from {token.name}</title>
        <meta key="og:title" property="og:title" content={`fxhash — mint from ${token.name}`}/> 
        <meta key="description" name="description" content={truncateEnd(token.metadata?.description || "", 200, "")}/>
        <meta key="og:description" property="og:description" content={truncateEnd(token.metadata?.description || "", 200, "")}/>
        <meta key="og:type" property="og:type" content="website"/>
        <meta key="og:image" property="og:image" content={displayUrl || "https://www.fxhash.xyz/images/og/og1.jpg"}/>
      </Head>

      <GenerativeFlagBanner token={token} />

      {!([GenTokFlag.MALICIOUS, GenTokFlag.HIDDEN].includes(token.flag)) && (
        <>
          <Spacing size="6x-large"/>

          <section>
            <SectionHeader>
              <TitleHyphen>mint unique <em>{token.name}</em></TitleHyphen>
            </SectionHeader>

            <Spacing size="x-large"/>

            <main className={cs(layout['padding-big'])}>
              <ClientOnly>
                <UserGuard>
                  <Mint token={token} />
                </UserGuard>
              </ClientOnly>
            </main>
          </section>
        </>
      )}

      <Spacing size="6x-large" />
      <Spacing size="6x-large" />
      <Spacing size="6x-large" />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const idStr = context.params?.id
  let token = null

  if (idStr) {
    const id = parseInt(idStr as string)
    if (id === 0 || id) {
      const { data, error } = await client.query({
        query: gql`
          query Query($id: Float!) {
            generativeToken(id: $id) {
              id
              name
              flag
              metadata
              metadataUri
              price
              supply
              balance
              enabled
              royalties
              author {
                id
                name
                avatarUri
              }
            }
          }
        `,
        fetchPolicy: "no-cache",
        variables: { id }
      })
      if (data) {
        token = data.generativeToken
      }
    }
  }

  return {
    props: {
      token: token,
    },
    notFound: !token
  }
}

export default MintPage