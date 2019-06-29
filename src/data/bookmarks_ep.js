const express = require('express')

const uuid = require('uuid/v4')
const logger = require('../logger')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const bookmarks = require('./bookmarks')

bookmarksRouter.route('/bookmarks').get((req, res) => {
    res.json(bookmarks)
})
.post(bodyParser, (req, res) => {
    const { url, title, rating, description } = req.body

    if(!url) {
        logger.error('URL is required')
        return res.status(400).send('Invalid data')
    }
    if(!title) {
        logger.error('Title is required')
        return res.status(400).send('Invalid data')
    }
    if(!rating) {
        logger.error('Rating is required')
        return res.status(400).send('Invalid data')
    }
    if(!description) {
        logger.error('Description is required')
        return res.status(400).send('Invalid data')
    }
    if(isNaN(rating)) {
        logger.error('Rating must be a valid number')
        return res.status(400).send('Invalid data')
    }
    if(rating > 5 || rating < 1) {
        logger.error('Rating must be between 1 and 5')
        return res.status(400).send('Invalid data')
    }
    const website = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/
    const regex = new RegExp(website)
    if(!url.match(regex)) {
        logger.error('URL must have valid format')
        return res.status(400).send('Invalid URL')
    }
    const id = uuid()
    const bookmark = {
        id,
        url,
        title,
        rating,
        description
    }
    bookmarks.push(bookmark)
    logger.info(`Bookmark with id ${id} created`)
    res.status(201).location(`http://localhost:8000/bookmarks/${id}`).json(bookmark)
})
bookmarksRouter.route('/bookmarks/:id')
.get((req, res) => {
    const { id } = req.params
    const bookmark = bookmarks.find(bm => bm.id == id) 

    if (!bookmark) {
        logger.error(`Bookmark with id ${id} not found`)
        return res.status(404).send('Bookmark not found')
    }
    res.json(bookmark)
})
.delete((req, res) => {
    const { id } = req.params
    const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id)

    if (bookmarkIndex === -1) {
        logger.error(`Bookmark with id ${id} not found`)
        return res.status(404).send('Not found')
    }
    bookmarks.splice(bookmarkIndex, 1)
    logger.info(`Bookmark with id ${id} deleted`)
    res.send('Item Deleted')
    res.status(204).end()
})
module.exports = bookmarksRouter;
