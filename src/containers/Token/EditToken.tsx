import style from "./EditToken.module.scss"
import layout from "../../styles/Layout.module.scss"
import cs from "classnames"
import { GenerativeToken } from "../../types/entities/GenerativeToken"
import { SectionHeader } from "../../components/Layout/SectionHeader"
import { useContext, useEffect } from "react"
import { useRouter } from 'next/router'
import { UserContext } from "../UserProvider"
import { Spacing } from "../../components/Layout/Spacing"
import { Formik } from "formik"
import * as Yup from "yup"
import { Form } from "../../components/Form/Form"
import { Field } from "../../components/Form/Field"
import { Checkbox } from "../../components/Input/Checkbox"
import { InputTextUnit } from "../../components/Input/InputTextUnit"
import { ContractFeedback } from "../../components/Feedback/ContractFeedback"
import { Button } from "../../components/Button"
import { useContractCall } from "../../utils/hookts"
import { UpdateGenerativeCallData } from "../../types/ContractCalls"
import { TitleHyphen } from "../../components/Layout/TitleHyphen"
import { isPositive } from "../../utils/math"
import { BurnEditions } from "./BurnEditions"
import { BurnToken } from "./BurnToken"


interface Props {
  token: GenerativeToken
}

const validation = Yup.object().shape({
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
      otherwise: Yup.number().positive()
        .typeError("Valid number plz")
        .min(10, "Min 10%")
        .max(25, "Max 25%")
    })
})

export function EditToken({ token }: Props) {
  const userCtx = useContext(UserContext)
  const user = userCtx.user!
  const router = useRouter()

  const { state: callState, loading: contractLoading, success, call, error: contractError } = 
    useContractCall<UpdateGenerativeCallData>(userCtx.walletManager!.updateGenerativeToken)
  
  useEffect(() => {
    if (userCtx && userCtx.autoConnectChecked && token.author.id !== user.id) {
      router.replace("/")
    }
  }, [user])

  const callContract = (values: UpdateGenerativeCallData) => {
    call({
      price: Math.floor(values.price * 1000000),
      royalties: Math.floor(values.royalties * 10),
      enabled: values.enabled,
      issuer_id: token.id
    })
  }

  return (
    <>
      <section className={cs(layout['padding-small'])}>
        <SectionHeader>
          <TitleHyphen>edit token <em>{token.name}</em></TitleHyphen>
        </SectionHeader>

        <Spacing size="6x-large"/>

        <main className={cs(style.container, layout['padding-big'])}>
          <Formik
            initialValues={{
              price: token.price / 1000000,
              royalties: token.royalties / 10,
              enabled: token.enabled
            }}
            validationSchema={validation}
            onSubmit={(values) => {
              callContract(values as UpdateGenerativeCallData)
            }}
          >
            {({ values, handleChange, handleBlur, handleSubmit, errors }) => (
              <Form className={cs(style.form)} onSubmit={handleSubmit} autoComplete="off">
                <h4>Edit token settings</h4>

                <Field error={errors.price} errorPos="bottom-left">
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

                <Field error={errors.royalties} errorPos="bottom-left">
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

                <Field className={cs(style.checkbox)}>
                  <Checkbox
                    name="enabled"
                    value={values.enabled!}
                    onChange={(_, event) => handleChange(event)}
                  >
                    Can be collected now
                  </Checkbox>
                </Field>

                <Spacing size="3x-large"/>

                <ContractFeedback
                  state={callState}
                  loading={contractLoading}
                  success={success}
                  error={contractError}
                  successMessage="Your token is updated !"
                />

                <Button
                  type="submit"
                  color="secondary"
                  size="medium"
                  disabled={Object.keys(errors).length > 0}
                  state={contractLoading ? "loading" : "default"}
                >
                  update token settings
                </Button>
              </Form>
            )}
          </Formik>

          <div>
            <h4>Burn editions</h4>

            <BurnEditions token={token} />
          </div>
        </main>

        <Spacing size="6x-large"/>

        <section className={cs(layout['padding-big'])}>
          <BurnToken token={token} />
        </section>
      </section>

      <Spacing size="6x-large"/>
      <Spacing size="6x-large"/>
    </>
  )
}