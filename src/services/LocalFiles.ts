import fs from "fs"
import path from "path"
import matter from "gray-matter"
import remarkToc from "remark-toc"
import remarkParse from "remark-parse"
import { unified } from "unified"
import remarkRehype from "remark-rehype"
import rehypeFormat from "rehype-format"
import rehypeStringify from "rehype-stringify"
import slug from "rehype-slug"
import rehypeHighlight from "rehype-highlight"

/**
 * The LocalFiles service provide a way to get the contents of the files on the local system
 * for it to be processed by the rest of the application
 * More specifically, it provides an interface to get the articles written as markdown in the
 * src/articles/ folder  != ...
 */

const articlesDir = path.join(process.cwd(), "src", "articles")

export function getArticles() {
  // get the file names in the directory
  const filenames = fs.readdirSync(articlesDir)
  // create the array of articles to return
  const articlesData = filenames.map(name => {
    // id is derived from the filename
    const id = name.replace(/\.md$/, '')
    // read contents
    const contents = fs.readFileSync(path.join(articlesDir, name), "utf-8")
    // use gray-matter to parse the metadata
    const metadata = matter(contents)
    // return id & data
    return {
      id,
      ...metadata.data
    }
  })
  return articlesData
}

export function getArticleIds() {
  // get the file names in the directory
  const filenames = fs.readdirSync(articlesDir)
  // return a list of params for getStaticPaths
  return filenames.map(name => {
    return {
      params: {
        id: name.replace(/\.md$/, "")
      }
    }
  })
}

export async function getArticleData(id: string) {
  const fullPath = path.join(articlesDir, `${id}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)
  const processed = await unified()
    .use(remarkParse)
    .use(remarkToc, {
      maxDepth: 1,
    })
    .use(remarkRehype)
    .use(slug)
    .use(rehypeHighlight)
    .use(rehypeFormat)
    .use(rehypeStringify)
    .process(matterResult.content)

  const contentHtml = processed.toString()

  return {
    id,
    ...matterResult.data,
    contentHtml
  }
}


/**
 * TODO: REMOVE WHAT'S ABOVE
 */

const docDir = path.join(process.cwd(), "src", "doc")
const docJsonPath = path.join(docDir, "doc.json")

/**
 * Define an article within the doc page
 */
export interface IDocArticle {
  title: string
  link: string
}

/**
 * Defines a category within the doc page
 */
export interface IDocCategory {
  title: string
  icon: string
  link: string
  articles: IDocArticle[]
}

export interface IDocPage {
  title: string
  description: string
  categories: IDocCategory[]
}

/**
 * Parses the /about/about.json file to get the structure of the about section
 */
export async function getDocDefinition(): Promise<IDocPage> {
  const docFile = fs.readFileSync(docJsonPath, "utf8")
  return JSON.parse(docFile)
}

/**
 * Returns a list of parameters for getStaticPaths given the structure of the
 * about file
 */
export async function getDocIds() {
  const file = await getDocDefinition()
  let ids: any[] = []
  for (const cat of file.categories) {
    ids = ids.concat(cat.articles.map(article => ({
      params: {
        category: cat.link,
        article: article.link
      }
    })))
  }
  return ids
}

/**
 * Given a category link (ie ID) and an article link (ie ID), outputs the contents
 * of the file formatted in HTML using a markdown preprocessor
 */
export async function getArticle(category: string, article: string) {
  try {
    const filePath = path.join(docDir, category, `${article}.md`)
    const fileContents = fs.readFileSync(filePath, 'utf8')
  
    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents)
    const processed = await unified()
      .use(remarkParse)
      .use(remarkToc, {
        maxDepth: 1,
      })
      .use(remarkRehype)
      .use(slug)
      .use(rehypeHighlight)
      .use(rehypeFormat)
      .use(rehypeStringify)
      .process(matterResult.content)
  
    const contentHtml = processed.toString()
  
    return {
      id: `/${category}/${article}`,
      ...matterResult.data,
      contentHtml
    }
  }
  catch {
    return null
  }
}