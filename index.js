import { extname } from 'path'
import { readFileSync, readdirSync } from 'fs'
import { deleteSync } from 'del'
import matter from 'gray-matter'
import puppeteer from 'puppeteer'
import browserSync from 'browser-sync'
import options from './index.config.js'
const bs = browserSync.create()

// * === fs ===
function getFileList() {
	return readdirSync(options.postDir, { withFileTypes: true })
		.filter(dirent => dirent.isFile() && extname(dirent.name) === `.${options.postExt}`)
		.map(dirent => {
			const filePath = `${options.postDir}/${dirent.name}`
			return {
				_basename: dirent.name.replace(new RegExp(`\.${options.postExt}$`), ''),
				...getMetadata(filePath)
			}
		})
}

// * === del ===
function deleteExisting() {
	deleteSync(`${options.ogDir}/*`)
	console.log(`✅ Deleted existing files in ${options.ogDir}`)
}

// * === gray-matter ===
function getMetadata(filePath) {
	const mdContent = readFileSync(filePath, 'utf-8')
	return matter(mdContent).data
}

// * === browser-sync ===
async function startServer() {
	return bs.init({
		server: {
			baseDir: options.srcDir
		},
		tunnel: false,
		port: options.bsPort,
		open: false,
		notify: false,
		minify: false
	})
}

async function stopServer() {
	return bs.cleanup()
}

// * === puppeteer ===
async function preparePuppeteer() {
	const browser = await puppeteer.launch({
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	})
	const page = await browser.newPage()
	await page.setViewport({
		width: options.ogImageWidth,
		height: options.ogImageHeight,
		deviceScaleFactor: 1
	})
	await page.goto(`http://localhost:${options.bsPort}/${options.generatorDirName}/`, {
		waitUntil: 'networkidle0',
		timeout: 100 * 1000
	})
	await page.evaluateHandle('document.fonts.ready')
	return { page, browser }
}

async function generateImage(page, data) {
	await page.evaluate(({ title, ogImageURL }) => {
		const titleElem = document.querySelector('#title')
		titleElem.innerText = title

		const ogImageOld = document.querySelector('#ogImage')
		const mainElem = document.querySelector('main')
		return new Promise(resolve => {
			ogImageOld.remove()
			const ogImageNew = document.createElement('img')
			ogImageNew.id = 'ogImage'
			ogImageNew.src = ogImageURL
			ogImageNew.onload = () => resolve()
			ogImageNew.onerror = () => {
				ogImageNew.style.display = 'none'
				return resolve()
			}
			mainElem.append(ogImageNew)
		})
	}, data)

	const fname = `${data._basename}.${options.ogImageExt}`
	await page.focus('body')
	await page.screenshot({
		path: `${options.ogDir}/${fname}`
	})
	console.log(`- ${options.ogDir}/${fname}`)
}

async function generateImages() {
	const list = getFileList()
	console.log(`✅ Generated file list`)

	await startServer()
	console.log('✅ Created a new server')

	const { page, browser } = await preparePuppeteer()
	console.log('✅ Created a new page')

	console.log('📷 Hold on. Taking screenshots')
	for (let item of list) await generateImage(page, item)

	console.log('✅ Disposing the browser...')

	await browser.close()
	console.log('✅ Disposing the server...')
	await stopServer()

	console.log('🎉 Great!')
	return true
}

async function main() {
	deleteExisting()
	await generateImages()
}

main()
