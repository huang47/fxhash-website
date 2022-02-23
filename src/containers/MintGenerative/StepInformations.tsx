import style from "./StepInformations.module.scss"
import layout from "../../styles/Layout.module.scss"
import colors from "../../styles/Colors.module.css"
import cs from "classnames"
import { StepComponent } from "../../types/Steps"
import { useContext, useEffect, useState } from "react"
import { Formik } from "formik"
import * as Yup from "yup"
import useFetch, { CachePolicies } from "use-http"
import { MetadataError, MetadataResponse } from "../../types/Responses"
import { CaptureSettings, GenerativeTokenMetadata } from "../../types/Metadata"
import { CaptureMode, CaptureTriggerMode, GenTokenInformationsForm } from "../../types/Mint"
import { Form } from "../../components/Form/Form"
import { Field } from "../../components/Form/Field"
import { InputText } from "../../components/Input/InputText"
import { Spacing } from "../../components/Layout/Spacing"
import { InputTextarea } from "../../components/Input/InputTextarea"
import { Fieldset } from "../../components/Form/Fieldset"
import { Checkbox } from "../../components/Input/Checkbox"
import { Button } from "../../components/Button"
import { InputTextUnit } from "../../components/Input/InputTextUnit"
import { getIpfsSlash } from "../../utils/ipfs"
import { UserContext } from "../UserProvider"
import { useContractCall } from "../../utils/hookts"
import { MintGenerativeCallData } from "../../types/ContractCalls"
import { ContractFeedback } from "../../components/Feedback/ContractFeedback"
import { getMutezDecimalsNb, isPositive } from "../../utils/math"
import { tagsFromString } from "../../utils/strings"
import { stringToByteString } from "../../utils/convert"


const initialForm: Partial<GenTokenInformationsForm> = {
  name: "",
  description: "",
  childrenDescription: "",
  tags: "",
  editions: 1,
  enabled: false,
  price: undefined,
  royalties: undefined
}

const validation = Yup.object().shape({
  name: Yup.string()
    .min(3, "Min 3 characters")
    .max(42, "Max 42 characters")
    .required("Required"),
  description: Yup.string()
    .max(4096, "Max 4096 characters")
    .required("Required"),
  childrenDescription: Yup.string()
    .max(4096, "Max 4096 characters"),
  editions: Yup.number()
    .min(1, "At least 1 edition")
    .max(2500, "2500 editions max.")
    .required("Required"),
  price: Yup.number()
    .when("enabled", {
      is: true,
      then: Yup.number()
        .typeError("Valid number plz")
        .required("Price is required if token is enabled")
        .test(
          "positive",
          `Price must be >= ${parseFloat(process.env.NEXT_PUBLIC_GT_MIN_PRICE!)}`,
          isPositive
        ),
      otherwise: Yup.number()
        .typeError("Valid number plz")
        .test(
          "positive",
          `Price must be >= ${parseFloat(process.env.NEXT_PUBLIC_GT_MIN_PRICE!)}`,
          isPositive
        )
    }),
  royalties: Yup.number()
    .when("enabled", {
      is: true,
      then: Yup.number()
        .typeError("Valid number plz")
        .required("Royalties are required if token is enabled")
        .min(10, "Min 10%")
        .max(25, "Max 25%"),
      otherwise: Yup.number()
        .typeError("Valid number plz")
        .min(10, "Min 10%")
        .max(25, "Max 25%")
    })
})

export const StepInformations: StepComponent = ({ state, onNext }) => {
  const userCtx = useContext(UserContext)
  const user = userCtx.user!

  const [savedInfos, setSavedInfos] = useState<Partial<GenTokenInformationsForm>>()
  
  // hook to interact with file API metadata
  const { data: metaData, loading: metaLoading, error: metaError, post: metaPost } = 
    useFetch<MetadataResponse|MetadataError>(`${process.env.NEXT_PUBLIC_API_FILE_ROOT}/metadata`,
    { cachePolicy: CachePolicies.NO_CACHE })

  // this variable ensures that we can safely access its data regardless of the state of the queries
  const safeMetaData: MetadataResponse|false|undefined = !metaError && !metaLoading && (metaData as MetadataResponse)

  // hook to interact with the contract
  const { state: callState, loading: contractLoading, success, call, error: contractError } = 
    useContractCall<MintGenerativeCallData>(userCtx.walletManager!.mintGenerative)

  const uploadInformations = (formInformations: GenTokenInformationsForm) => {
    const capture: CaptureSettings = {
      mode: state.captureSettings!.mode!,
      triggerMode: state.captureSettings!.triggerMode!,
      gpu: state.captureSettings!.gpu,
    }
    // set settings based on the capture mode
    if (state.captureSettings!.mode === CaptureMode.VIEWPORT) {
      capture.resolution = {
        x: state.captureSettings!.resX!,
        y: state.captureSettings!.resY!,
      }
    }
    else if (state.captureSettings!.mode === CaptureMode.CANVAS) {
      capture.canvasSelector = state.captureSettings!.canvasSelector
    }
    // set settings based on the trigger mode
    if (state.captureSettings!.triggerMode === CaptureTriggerMode.DELAY) {
      capture.delay = state.captureSettings!.delay
    }
    else if (state.captureSettings!.triggerMode === CaptureTriggerMode.FN_TRIGGER) {
      // we don't need to add anything
    }

    const metadata: GenerativeTokenMetadata = {
      name: formInformations.name,
      description: formInformations.description,
      childrenDescription: formInformations.childrenDescription || formInformations.description,
      tags: tagsFromString(formInformations.tags),
      artifactUri: `${getIpfsSlash(state.cidUrlParams!)}?fxhash=${state.previewHash}`,
      displayUri: getIpfsSlash(state.cidPreview!),
      thumbnailUri: getIpfsSlash(state.cidThumbnail!),
      generativeUri: getIpfsSlash(state.cidUrlParams!),
      authenticityHash: state.authHash2!,
      previewHash: state.previewHash!,
      capture,
      settings: state.settings ?? null,
      symbol: "FXGEN",
      decimals: 0,
      version: "0.2"
    }
    setSavedInfos({
      name: formInformations.name,
      editions: formInformations.editions,
      enabled: formInformations.enabled,
      price: formInformations.price || 0,
      royalties: formInformations.royalties || 10
    })
    metaPost(metadata)
  }

  // when we receive metadata CID, we can initiate the call to contract
  useEffect(() => {
    if (safeMetaData && savedInfos) {
      const metadataCid = safeMetaData.cid
      // call the contract
      call({
        amount: savedInfos.editions!,
        enabled: savedInfos.enabled!,
        metadata: stringToByteString(getIpfsSlash(metadataCid)),
        price: Math.floor(savedInfos.price! * 1000000),
        royalties: Math.floor(savedInfos.royalties! * 10),
      })
    }
  }, [safeMetaData])

  // if contract lands success, go to the success screen
  useEffect(() => {
    if (success) {
      onNext({
        minted: true
      })
    }
  }, [success])

  // derived from state, to take account for both side-effects interactions
  const loading = metaLoading || contractLoading

  return (
    <div className={cs(style.container)}>
      <h5>Almost done 😮‍💨</h5>

      <Spacing size="3x-large"/>

      <Formik
        initialValues={initialForm}
        validationSchema={validation}
        onSubmit={(values) => {
          uploadInformations(values as GenTokenInformationsForm)
        }}
      >
        {({ values, handleChange, handleBlur, handleSubmit, errors }) => (
          <Form className={cs(layout.smallform, style.form)} onSubmit={handleSubmit}>
            <Field error={errors.name}>
              <label htmlFor="name">
                Name of the piece
                <small> (“ #N” will be added to the collected NFTs)</small>
              </label>
              <InputText
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!errors.name}
              />
            </Field>

            <Field error={errors.description}>
              <label htmlFor="description">
                Generative Token description
              </label>
              <InputTextarea
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!errors.description}
              />
            </Field>

            <Field error={errors.childrenDescription}>
              <label htmlFor="childrenDescription">
                Collected NFTs description
                <small>(leave empty if you want the same as Generative Token)</small>
              </label>
              <InputTextarea
                name="childrenDescription"
                value={values.childrenDescription}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!errors.childrenDescription}
              />
            </Field>

            <Field error={errors.tags}>
              <label htmlFor="tags">
                Tags
                <small>(comma separated)</small>
              </label>
              <InputText
                name="tags"
                value={values.tags}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!errors.tags}
              />
            </Field>

            <Field error={errors.editions}>
              <label htmlFor="editions">
                Number of editions
                <small>(how many NFT can be generated from your Token)</small>
              </label>
              <InputText
                type="number"
                name="editions"
                value={values.editions}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!errors.editions}
              />
            </Field>

            <Fieldset>
              <Field className={cs(style.checkbox)}>
                <Checkbox
                  name="enabled"
                  value={values.enabled!}
                  onChange={(_, event) => handleChange(event)}
                >
                  Can be collected now
                </Checkbox>
              </Field>
              <em className={cs(colors.gray)}>
                We suggest disabling the Generative Token first, and then check if it was minted properly (and only enable it if that's the case)
              </em>
              <Spacing size="regular"/>

              <Field error={errors.price}>
                <label htmlFor="price">
                  Price
                </label>
                <InputTextUnit
                  unit="tez"
                  type="text"
                  name="price"
                  value={values.price||""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!errors.price}
                />
              </Field>

              <Field error={errors.royalties}>
                <label htmlFor="royalties">
                  Royalties
                  <small>in %, between 10 and 25</small>
                </label>
                <InputTextUnit
                  unit="%"
                  type="text"
                  name="royalties"
                  value={values.royalties||""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!errors.royalties}
                />
              </Field>

              <small>you will be able to change those 3 fields after the token will be minted</small>
            </Fieldset>

            <Spacing size="3x-large"/>

            <ContractFeedback
              state={callState}
              loading={contractLoading}
              success={success}
              error={contractError}
              successMessage="Success !"
            />

            <Button
              type="submit"
              color="secondary"
              size="large"
              disabled={Object.keys(errors).length > 0}
              state={loading ? "loading" : "default"}
            >
              Mint Token
            </Button>
          </Form>
        )}
      </Formik>

      <Spacing size="3x-large"/>
      <Spacing size="3x-large"/>
      <Spacing size="3x-large"/>
    </div>
  )
}