import * as React from 'react'
import { getMDXComponent } from 'mdx-bundler/client'
import { LoaderFunction, useLoaderData } from 'remix'
import { getMdx } from '~/server/mdx.server'
import { getSlides } from '~/server/getSlides.server'
import { useNavigate } from 'react-router-dom'
import useKeyboardNavigation from '~/client/useKeyboardNavigation'

export type LoaderData = {
  slide: {
    code: string
    frontmatter: {
      [key: string]: any
    }
    previousSlideNr?: number
    nextSlideNr?: number
  }
  numberOfSlides: number
}

const isNumeric = (value: any): value is number | string => !isNaN(parseFloat(value)) && isFinite(value)

export const loader: LoaderFunction = async ({ params }): Promise<LoaderData> => {
  if (!isNumeric(params.slideNr)) {
    throw new Response(`Not Found: slideNr '${params.slideNr}' should be numeric`, {
      status: 404,
    })
  }

  const slideNr = parseInt(params.slideNr)

  const slides = await getSlides()
  const slide = slides.find((slide) => slide.nr === slideNr)

  if (!slide)
    throw new Response(`Not Found: slideNr ${slideNr} could not be found`, {
      status: 404,
    })

  const mdx = await getMdx(slide.mdxContent)

  return { slide: { ...slide, ...mdx }, numberOfSlides: slides.length }
}

export default () => {
  const {
    slide: { code, previousSlideNr, nextSlideNr },
  } = useLoaderData<LoaderData>()

  const navigate = useNavigate()

  const goToNextSlide = React.useCallback(() => {
    if (!nextSlideNr) return
    navigate(`/slides/${nextSlideNr}`)
  }, [navigate, nextSlideNr])
  const goToPreviousSlide = React.useCallback(() => {
    if (!previousSlideNr) return
    navigate(`/slides/${previousSlideNr}`)
  }, [navigate, previousSlideNr])

  useKeyboardNavigation(goToNextSlide, goToPreviousSlide)

  const Component = React.useMemo(() => getMDXComponent(code), [code])

  return <Component />
}
