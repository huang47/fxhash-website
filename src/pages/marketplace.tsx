import type { NextPage } from 'next'
import layout from '../styles/Layout.module.scss'
import cs from 'classnames'
import { Spacing } from '../components/Layout/Spacing'
import { SectionHeader } from '../components/Layout/SectionHeader'
import ClientOnly, { ClientOnlyEmpty } from '../components/Utils/ClientOnly'
import { ExploreGenerativeTokens } from '../containers/ExploreGenerativeTokens'
import { Marketplace } from '../containers/Marketplace'
import Head from 'next/head'
import { TitleHyphen } from '../components/Layout/TitleHyphen'
import { MarketplaceTabs } from '../containers/Marketplace/Tabs'
import { CollectionRanks } from '../containers/Stats/Ranks/CollectionRanks'
import { HeaderRanks } from '../components/Stats/HeaderRanks'



const MarketplacePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>fxhash — marketplace</title>
        <meta key="og:title" property="og:title" content="fxhash — marketplace"/> 
        <meta key="description" name="description" content="Collect and trade your NFTs generated on fxhash"/>
        <meta key="og:description" property="og:description" content="Collect and trade your NFTs generated on fxhash"/>
        <meta key="og:type" property="og:type" content="website"/>
        <meta key="og:image" property="og:image" content="https://www.fxhash.xyz/images/og/og1.jpg"/>
      </Head>

      <Spacing size="3x-large" />
      
      <HeaderRanks>
        <CollectionRanks/>
      </HeaderRanks>
      
      <Spacing size="6x-large" />

      <section>
        <MarketplaceTabs active={0} />

        <ClientOnlyEmpty>
          <Marketplace />
        </ClientOnlyEmpty>
      </section>

      <Spacing size="6x-large" />
      <Spacing size="6x-large" />
      <Spacing size="6x-large" />
    </>
  )
}

export default MarketplacePage
