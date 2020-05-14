const fs = require('fs')
const http = require('http')
const https = require('https')
const parse = require('url').parse

const request = (method, url, headers, body = null) =>
	new Promise((resolve, reject) => {
		const connect = (url.startsWith('https://') ? https.request : http.request)
		(Object.assign(parse(url), { method, headers: Object.assign({ host: parse(url).host }, headers) }, url.includes('ruguoapp.com') ? { hostname: '54.223.78.95' } : null))
		.on('response', response => resolve(response))
		.on('error', error => reject(error))
		body && body.readable ? body.pipe(connect) : connect.end(body)
	})
	.then(response =>
		[201, 301, 302, 303, 307, 308].includes(response.statusCode)
			? request(method, parse(url).resolve(response.headers.location), headers, body)
			: Object.assign(response, {
				body: () => read(response),
				json: () => read(response).then(body => JSON.parse(body))
			})
	)

const read = stream =>
	new Promise((resolve, reject) => {
		const chunks = []
		stream
		.on('data', chunk => chunks.push(chunk))
		.on('end', () => resolve(Buffer.concat(chunks)))
		.on('error', error => reject(error))
	})

const form = (data, boundary) => {
	const CRLF = '\r\n'
	const string = data.filter(item => item.type !== 'file')
	const file = data.filter(item => item.type === 'file')

	const tunnel = (input, output) => new Promise((resolve, reject) => {
		input.pipe(output, { end: false })
		input.on('end', () => resolve())
		input.on('error', error => reject(error))
	})
	const chain = stream => {
		const item = file.shift()
		if (!item) return Promise.resolve()
		else {
			stream.write([`--${boundary}`, `Content-Disposition: form-data; name="${item.key}"; filename="${item.value}"`, `Content-Type: ${item.mime || 'application/octet-stream'}`, '', ''].join(CRLF))
			return tunnel(fs.createReadStream(item.value), stream).then(() => {
				stream.write(CRLF)
				return chain(stream, boundary)
			})
		}
	}

	return { // fake stream
		readable: true,
		pipe: stream => {
			string.forEach(item =>
				stream.write([`--${boundary}`, `Content-Disposition: form-data; name="${item.key}"`, '', item.value, ''].join(CRLF))
			)
			chain(stream).then(() => stream.end([`--${boundary}--`, ''].join(CRLF)))
		}
	}
}

request.read = read
request.form = form
module.exports = request