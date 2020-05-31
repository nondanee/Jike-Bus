const fs = require('fs')
const crypto = require('crypto')
const extension = require('path').extname

const request = require('./request.js')
const constant = require('./constant.js')

const JikeClient = (refreshToken, deviceId) => {

	const headers = Object.assign({}, constant.headers, { 'x-jike-device-id': deviceId || null })

	const query = (method, path, data) =>
		request(method, constant.host + '/' + path, headers, JSON.stringify(data))
		.then(response => 
			response.statusCode === 401 ? refresh().then(() => query(method, path, data)) : response.json()
		)

	const refresh = () =>
		request('GET', constant.host + '/' + constant.endpoint.tokenRefresh, { 'x-jike-refresh-token': refreshToken, 'x-jike-device-id': deviceId || null })
		.then(response => {
			if (response.statusCode === 200) {
				refreshToken = response.headers['x-jike-refresh-token']
				headers['x-jike-access-token'] = response.headers['x-jike-access-token']
			}
			else{
				return Promise.reject(new Error('TOKEN_FAILED: login required'))
			}
		})

	const meta = link => 
		query('POST', constant.endpoint.extractLink, { link })
		.then(({ data }) => data)
	
	const storage = task => {
		const boundary = `--------------------${crypto.randomBytes(8).toString('hex')}`
		const mime = path => ({ '.jpg': 'image/jpeg' ,'.png': 'image/png', '.gif': 'image/gif' }[extension(path).toLowerCase().replace('jpeg', 'jpg')])
		const hash = path => new Promise((resolve, reject) => {
			const digest = crypto.createHash('md5').setEncoding('hex')
			fs.createReadStream(path).pipe(digest)
			.on('error', error => reject(error))
			.once('finish', () => resolve(digest.read()))
		})
		// return request('GET', constant.endpoint.pictureUptoken + '?bucket=jike')
		return Promise.all(task.map(hash))
		.then(values => query('GET', constant.endpoint.qiniuUpToken + '?md5=' + encodeURIComponent(values.join(','))))
		.then(data => Promise.all(
			task
			.map(path =>
				fs.existsSync(path)
					? [
						{ key: 'token', value: data.uptoken }, 
						{ key: 'file', value: path, type: 'file', mime: mime(path) }
					]
					: Promise.reject(new Error('ENOENT: file does not exist'))
			)
			.map(data => 
				request('POST', constant.endpoint.pictureUpload, { 'content-type': `multipart/form-data; boundary=${boundary}` }, request.form(data, boundary))
				.then(response => response.json())
				.then(body => body.error
					? Promise.resolve(JSON.parse(body.error))
					.then(error => request('POST', error.callback_url, { 'content-type': error.callback_bodyType }, error.callback_body))
					.then(response => response.json())
					: body
				)
			)
		))
		.then(data => data.map(item => item.key))
	}

	const Flow = (path, parameter) => {
		const flow = []
		const load = () =>
			query('POST', path, parameter)
			.then(data => {
				if (data.loadMoreKey || flow.length > 1000) {
					parameter.loadMoreKey = data.loadMoreKey
				}
				else {
					parameter.loadMoreKey = null
					flow.loadMore = null
					flow.loadAll = null
				}
				Array.prototype.push.apply(flow, data.data)
				if (data.hotComments) Array.prototype.push.apply(flow.hot, data.hotComments)
			})
	
		flow.hot = []
		flow.loadMore = () => load().then(() => flow)
		flow.loadAll = () => {
			const goon = () => load().then(() => parameter.loadMoreKey ? goon() : null)
			return goon().then(() => flow)
		}
		return load().then(() => flow)
	}

	const validate = (message, limit = []) => {
		const { id, type, targetType } = (message = message || {})
		const mapping = {
			'OFFICIAL_MESSAGE': 'officialMessages',
			'ORIGINAL_POST': 'originalPosts',
			// 'QUESTION': Question, ???
			// 'ANSWER': Answer, ???
			'REPOST': 'reposts',
			'COMMENT': 'comments',
		}
	
		if (!id) return Promise.reject(new Error('BAD_MESSAGE: missing message id'))
		if (!Object.keys(mapping).filter(key => !limit.length || limit.includes(key)).includes(type)) return Promise.reject(new Error('BAD_MESSAGE: unsupported message type'))
		if (type === 'COMMENT' && !targetType) return Promise.reject(new Error('BAD_MESSAGE: missing message targetType'))
		message.urlType = mapping[type]
		return Promise.resolve(message)
	}

	const like = (message, action) =>
		validate(message)
		.then(({ id, targetType, urlType }) =>
			query('POST', `1.0/${urlType}/${action ? 'like' : 'unlike'}`, { id, targetType: urlType === 'comments' ? targetType : undefined })
		)

	const collect = (message, action) =>
		validate(message, ['OFFICIAL_MESSAGE', 'ORIGINAL_POST', 'REPOST'])
		.then(({ id, urlType }) =>
			query('POST', `1.0/${urlType}/${action ? 'collect' : 'uncollect'}`, { id })
		)
	
	return {
		getCollection:
			() => Flow(constant.endpoint.myCollections, { limit: 20 }),
		getNewsFeed:
			() => Flow(constant.endpoint.newsFeed, { trigger: 'user' }, true),
		getFollowingUpdate:
			() => Flow(constant.endpoint.followingUpdate, { trigger: 'user' }, true),
		getNewsFeedUnreadCount:
			() => query('GET', constant.endpoint.newsFeedUnreadCount),
		getUserProfile:
			username => query('GET', constant.endpoint.userProfile + `?username=${username || ''}`).then(data => data.user),
		getUserPost:
			username => Flow(constant.endpoint.userPost, { username, limit: 20 }),
		getUserCreatedTopic:
			username => Flow(constant.endpoint.userCreatedTopic, { username, limit: 20 }),
		getUserSubscribedTopic:
			username => Flow(constant.endpoint.userSubscribedTopic, { username, limit: 20 }),
		getUserFollowing:
			username => Flow(constant.endpoint.userFollowing, { username, limit: 20 }),
		getUserFollower:
			username => Flow(constant.endpoint.userFollower, { username, limit: 20 }),
		getTopicSelected:
			topic => Flow(constant.endpoint.topicSelected, { topic, limit: 20 }),
		getTopicSquare:
			topic => Flow(constant.endpoint.topicSquare, { topic, limit: 20 }),
		getComment:
			message =>
				validate(message)
				.then(({ id, type, targetType, urlType }) =>
					urlType === 'comments'
						? Flow(constant.endpoint.listCommentReply, { primaryCommentId: id, targetType: targetType, limit: 20, order: 'LIKES' })
						: Flow(constant.endpoint.listComment, { targetId: id, targetType: type, limit: 10 })
				),
		likeIt:
			message => like(message, true),
		unlikeIt:
			message => like(message, false),
		collectIt:
			message => collect(message, true),
		uncollectIt:
			message => collect(message, false),
		createPost:
			(content, options = {}) =>
				Promise.resolve()
				.then(() => {
					if (options.link && options.pictures) return Promise.reject(new Error('UNSUPPORTED_OPTIONS: link and pictures cannot coexist'))
					const payload = { content }
					if (options.topic) payload.submitToTopic = options.topic
					if (options.link) return meta(options.link).then(info => payload.linkInfo = info).then(() => payload)
					else if (options.pictures) return storage(options.pictures).then(keys => payload.pictureKeys = keys).then(() => payload)
					else return Promise.resolve(payload)
				})
				.then(payload => query('POST', constant.endpoint.createPost, payload)),
		createRepost:
			(content, message, options = {}) =>
				validate(message, ['OFFICIAL_MESSAGE', 'ORIGINAL_POST', 'REPOST'])
				.then(({ id, type }) => 
					query('POST', constant.endpoint.createRepost, {
						content,
						// syncComment: !!options.comment, // doesn't work
						targetId: id,
						targetType: type
					})
				),
		createComment:
			(content, message, options = {}) =>
				validate(message)
				.then(({ id, type }) => {
					const payload = {
						content,
						pictureKeys: [],
						syncToPersonalUpdates: !!options.repost,
						targetId: id,
						targetType: type,
					}
					if (options.pictures) return storage(options.pictures).then(keys => payload.pictureKeys = keys).then(() => payload)
					else return Promise.resolve(payload)
				})
				.then(payload => query('POST', constant.endpoint.createComment, payload)),
		deletePost:
			message => validate(message, ['ORIGINAL_POST', 'REPOST']).then(({ id }) => query('POST', constant.endpoint.deletePost, { id })),
		deleteComment:
			message => validate(message, ['COMMENT']).then(({ id, targetType }) => query('POST', constant.endpoint.deleteComment, { id, targetType })),
		searchTopic:
			keywords => Flow(constant.endpoint.searchTopic, { keywords, onlyUserPostEnabled: false, type: 'ALL' }),
		searchCollection:
			keywords => Flow(constant.endpoint.searchCollection, { keywords }),
		getRecommendedTopic:
			() => Flow(constant.endpoint.recommendedTopic, { categoryAlias: 'RECOMMENDATION' })
	}

}

module.exports = { JikeClient }