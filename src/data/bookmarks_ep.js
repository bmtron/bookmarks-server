const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const BookmarksService = require('../BookmarksService')
const serializeBookmarks = bookmark => ({
    id: bookmark.id,
    url: xss(bookmark.url),
    title: xss(bookmark.title),
    rating: bookmark.rating,
    description: xss(bookmark.description)
})
bookmarksRouter.route('/')
.get((req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
    .then(bookmarks => {
        let newBookmarks = bookmarks.map(bm => {
            return serializeBookmarks(bm)
        })
        res.json(newBookmarks)
    })
    .catch(next)
})
.post(bodyParser, (req, res, next) => {
    const { url, title, rating, description } = req.body
    const newBookmark = {url, title, rating, description}
    for (const [key, value] of Object.entries(newBookmark)) {
        if (value == null) {
            logger.error(`${key} is required`)
            return res.status(400).json({
                error: { message: `Error: '${key}' missing in request body`}
            })
        }
    }
    if(isNaN(rating) || rating < 1 || rating > 5) {
        logger.error(`Rating must be a number between 1 and 5`)
        return res.status(400).json({
            error: { message: `Error: Rating is invalid. Must be a number between 1 and 5`}
        })
    }
    const website = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/
    const regex = new RegExp(website)
    if(!url.match(regex)) {
        logger.error('URL must have valid format')
        return res.status(400).send('Invalid URL')
    }
    const knexInstance = req.app.get('db')
    BookmarksService.insertBookmark(knexInstance, newBookmark)
        .then(bookmark => {
            let newBm = serializeBookmarks(bookmark)
            res.status(201)
            .location(`/api/bookmarks/${bookmark.id}`)
            .json(newBm)
        })
        .catch(next)
})
bookmarksRouter.route('/:id')
.all((req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarksService.getById(knexInstance, req.params.id)
    .then(bookmark => {
        if(!bookmark) {
            res.status(404).json(
                {error : { message: `Bookmark not found`}}
            )
        }
        res.bookmark = bookmark
        next()
    })
    .catch(next)
})
.get((req, res, next) => {
    res.json(serializeBookmarks(res.bookmark))
})
.delete((req, res, next) => {
    
    const knexInstance = req.app.get('db')
    BookmarksService.deleteBookmark(knexInstance, req.params.id)
    .then(() => {
        res.status(204).end()
        }
    ).catch(next)
})
.patch(bodyParser, (req, res, next) => {
    const {title, url, rating, description} = req.body
    const bookmarkToUpdate = {title, url, rating, description}
    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if(numberOfValues === 0) {
        return res.status(400).json({
            error: {
                message: `Request body must contain either 'title', 'url', 'rating' or 'description'`
            }
        })
    }
    BookmarksService.updateBookmark(
        req.app.get('db'),
        req.params.id,
        bookmarkToUpdate
    )
    .then(item => {
        res.status(204).end()
    })
    .catch(next)
})
module.exports = bookmarksRouter;
