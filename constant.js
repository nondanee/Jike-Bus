// const headers = {
//     'platform': 'web',
//     'app-version': '5.3.0',
//     'accept': 'application/json',
//     'content-type': 'application/json'
// }

const headers = {
    'App-Version': '8.0.0',
    'ApplicationId': 'io.iftech.jellow',
    'Content-Type': 'application/json; charset=utf-8',
    'User-Agent': 'okhttp/4.0.1',
}

const endpoint = {
    // login
    'createSession': 'sessions.create',
    'waitLogin': 'sessions.wait_for_login',
    'confirmLogin': 'sessions.wait_for_confirmation',
    // 'tokenRefresh': 'app_auth_tokens.refresh',
    'tokenRefresh': '1.0/app_auth_tokens.refresh',
    // myself
    'myCollections': '1.0/users/collections/list',
    // main page info stream
    'newsFeed': '1.0/newsFeed/list',
    'newsFeedUnreadCount': '1.0/newsFeed/countUnreads',
    'followingUpdate': '1.0/personalUpdate/followingUpdates',
    // user
    'userProfile': '1.0/users/profile',
    'userPost': '1.0/personalUpdate/single',
    'userCreatedTopic': '1.0/customTopics/custom/listCreated',
    'userSubscribedTopic': '1.0/users/topics/listSubscribed',
    'userFollowing': '1.0/userRelation/getFollowingList',
    'userFollower': '1.0/userRelation/getFollowerList',
    // topic
    'topicSelected': '1.0/messages/history',
    'topicSquare': '1.0/squarePosts/list',
    // comment
    'listComment': '1.0/comments/listPrimary',
    'listCommentReply': '1.0/comments/list',
    // creation
    'createPost': '1.0/originalPosts/create',
    'deletePost': '1.0/originalPosts/remove',
    'extractLink': '1.0/readability/extract',
    'qiniuUpToken': '1.0/misc/qiniu_uptoken',
    // 'pictureUptoken': 'https://upload.jike.ruguoapp.com/token',
    // 'pictureUpload': 'https://up.qbox.me/',
    'pictureUpload': 'https://upload.qiniup.com',
    // interaction
    // 'like_it': '1.0/{_p_}/like',
    // 'unlike_it': '1.0/{_p_}/unlike',
    // 'collect_it': '1.0/{_p_}/collect',
    // 'uncollect_it': '1.0/{_p_}/uncollect',
    'createRepost': '1.0/reposts/add',
    'createComment': '1.0/comments/add',
    'deleteComment': '1.0/comments/remove',
    // search
    'searchTopic': '1.0/users/topics/search',
    'searchCollection': '1.0/users/collections/search',
    // recommend
    'recommendedTopic': '1.0/topics/recommendation/list',
}

module.exports = {headers, endpoint}