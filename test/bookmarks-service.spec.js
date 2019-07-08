
const app = require('../src/app')
const BookmarksService = require('../src/BookmarksService')
const knex = require('knex')

describe('Bookmarks Service object', () => {
    let db
    const testBookmark = [
        {
            id: 1,
            title: 'Test 1',
            url: 'test url',
            description: 'junk content',
            rating: 1,
        },
        {
            id: 2,
            title: 'Test 2',
            url: 'test url 2',
            description: 'junk content',
            rating: 2
        },
        {
            id: 3,
            title: 'Test 3',
            url: 'test url 3',
            description: 'junk content',
            rating: 3
        }
    ];
    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })
    after(() => {
        db.destroy()
    })
    afterEach(() => db('bookmarks_info').truncate())
    before(() => db('bookmarks_info').truncate())

    describe('GET /bookmarks', () => {
        context('Given bookmarks_info has data', () => {
            beforeEach(() => {
                return db.into('bookmarks_info').insert(testBookmark)
            })
            it('getAllBookmarks() returns a status of 200 and all bookmarks', () => {
                return supertest(app)
                .get('/bookmarks')
                .expect(200, testBookmark)
            })
        })
    })
    describe('GET /bookmarks/:bookmark_id', () => {
        context('given that there are bookmarks in the database', () => {
            beforeEach(() => {
                return db.into('bookmarks_info').insert(testBookmark)
            })
            it('getById() returns 200 and the selected bookmark', () => {
                const bookmarkId = 3
                const expectedBookmark = testBookmark[bookmarkId - 1]
                return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .expect(200, expectedBookmark)
            })
        })
    })
    describe(`GET /bookmarks`, () => {
        context('given that the bookmarks_info table has no data', () => {
            it('returns 200 with an empty oject', () => {
                return supertest(app)
            .get(`/bookmarks`)
            .expect(200, [])
            })
        })
    })
    describe(`GET /bookmarks/:bookmark_id`, () => {
        context('given that the bookmark relating to the id doesnt exist', () => {
            it('returns 404 with an error message', () => {
                return supertest(app)
                .get(`/bookmarks/2`)
                .expect(404, {error: {
                    message: `Bookmark doesn't exist`
                }})
            })
        })
    })
})