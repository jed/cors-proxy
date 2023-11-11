export default {
	async fetch(request) {
		let response

		let isOptions = request.method === 'OPTIONS'
		let hasOrigin = request.headers.has('origin')
		let hasMethod = request.headers.has('access-control-request-method')
		let hasHeaders = request.headers.has('access-control-request-headers')
		let isPreflight = isOptions && hasOrigin && hasMethod && hasHeaders
		if (isPreflight) {
			let methods = request.headers.get('access-control-request-method')
			let headers = request.headers.get('access-control-request-headers')
			response = new Response(null, {status: 204})
			response.headers.set('access-control-allow-methods', methods)
			response.headers.set('access-control-allow-headers', headers)
		}

		else {
			let url = new URL(request.url)

			let hasHost = request.headers.has('x-forwarded-host')
			let hasProto = request.headers.has('x-forwarded-proto')
			let isProxy = hasHost && hasProto
			if (isProxy) {
				url.protocol = request.headers.get('x-forwarded-proto')
				url.host = request.headers.get('x-forwarded-host')

				request = new Request(request)
				request.headers.delete('x-forwarded-proto')
				request.headers.delete('x-forwarded-host')

				response = await fetch(url, request)
				response = new Response(response.body, response)
				response.headers.append('vary', 'origin')
			}

			else {
				response = new Response(`export function fetch(a,b){a=new Request(a,b);b=new URL(a.url);if(b.origin!==location.origin){a.headers.set('x-forwarded-host',b.host);a.headers.set('x-forwarded-proto',b.protocol);b.host='${url.host}'}return self.fetch(b,a)}`)
				response.headers.set('content-type', 'text/javascript')
			}
		}

		let origin = request.headers.get('origin')
		response.headers.set('access-control-allow-origin', origin)
		return response
	}
}
