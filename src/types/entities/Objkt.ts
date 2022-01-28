import { ObjktMetadata, TokenFeature } from "../Metadata"
import { Action } from "./Action"
import { GenerativeToken } from "./GenerativeToken"
import { Offer } from "./Offer"
import { User } from "./User"

export interface Objkt {
  id: number
  issuer: GenerativeToken
  owner?: User|null
  assigned?: boolean
  generationHash?: string
  duplicate?: boolean
  iteration?: number
  tags: string[]
  name?: string
  slug?: string
  metadata?: ObjktMetadata
  features?: TokenFeature[] | null
  rarity?: number|null
  metadataUri: string
  royalties: number
  offer?: Offer|null
  actions: Action[]
  createdAt: string
  updatedAt: string
  assignedAt: string|null
}

export enum EObjktFeatureType {
  BOOLEAN              = "BOOLEAN",
  STRING               = "STRING",
  NUMBER               = "NUMBER",
}

export interface IObjktFeatureFilter {
  name: string
  values: string[]
  type: EObjktFeatureType
}

export function objktFeatureType(value: any): EObjktFeatureType {
  const type = typeof value
  if (type === "boolean") return EObjktFeatureType.BOOLEAN
  else if (type === "number") return EObjktFeatureType.NUMBER
  else return EObjktFeatureType.STRING
  
}