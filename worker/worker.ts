import { handleUnfurlRequest } from 'cloudflare-workers-unfurl'
import { AutoRouter, error, IRequest, cors } from 'itty-router'
import { handleAssetDownload, handleAssetUpload } from './assetUploads'

export { TldrawDurableObject } from './TldrawDurableObject'

const { preflight, corsify } = cors({
	origin: '*',
	allowMethods: ['GET', 'POST', 'OPTIONS'],
	allowHeaders: ['content-type'],
})

const router = AutoRouter<IRequest, [env: Env, ctx: ExecutionContext]>({
	before: [preflight],
	finally: [corsify],
	catch: (e) => {
		console.error(e)
		return error(e)
	},
})
	.get('/api/connect/:roomId', (request, env) => {
		const id = env.TLDRAW_DURABLE_OBJECT.idFromName(request.params.roomId)
		const room = env.TLDRAW_DURABLE_OBJECT.get(id)
		return room.fetch(request.url, { headers: request.headers, body: request.body })
	})
	.post('/api/uploads/:uploadId', handleAssetUpload)
	.get('/api/uploads/:uploadId', handleAssetDownload)
	.get('/api/unfurl', handleUnfurlRequest)
	.all('*', () => new Response('Not found', { status: 404 }))

export default {
	fetch: router.fetch,
}
