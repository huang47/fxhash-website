import { ipfsGatewayUrl } from '../../services/Ipfs'
import { useLazyImage } from '../../utils/hookts'
import { Loader } from '../Utils/Loader'
import style from './Artwork.module.scss'

interface Props {
  ipfsUri?: string
  url?: string
  alt?: string
  loading?: string|boolean
}

export function ArtworkPreview({
  ipfsUri,
  url,
  alt = "Generative Token preview",
  loading = false,
}: Props) {
  const U = url || (ipfsUri && ipfsGatewayUrl(ipfsUri)) || null
  const loaded = useLazyImage(U)

  return (
    <div className={style.container}>
      {U && loaded && <img src={U} alt={alt} />}
      {loading && !loaded && <Loader color="white" />}
    </div>
  )
}