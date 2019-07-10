
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
            rating: 5
        },
        {
            id: 2,
            title: 'Test 2',
            url: 'test url 2',
            description: 'junk content',
            rating: 5
        },
        {
            id: 3,
            title: 'Test 3',
            url: 'test url 3',
            description: 'junk content',
            rating: 5
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
    describe(`GET all bookmarks with xss attack`, () => {
        context(`given one of the bookmarks contains xss content`, () => {
            const maliciousBookmark = {
                id: 5,
                title: 'Blah Title <script>alert("xss");</script>',
                url: 'blah url',
                rating: 4,
                description: `Bad Image <img src="https://does.not.exist.h" onerror="alert(document.cookie);">`
            }
            beforeEach('add malicious bookmark into db', () => {
                return db.into('bookmarks_info').insert(maliciousBookmark)
            })
            it(`sanitizes the bookmark`, () => {
                return supertest(app)
                .get('/bookmarks')
                .expect(200)
                .expect(res => {
                    let badBookmark = res.body.find(item => item.id === maliciousBookmark.id)
                    expect(badBookmark.title).to.eql('Blah Title &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(badBookmark.url).to.eql(maliciousBookmark.url)
                    expect(badBookmark.rating).to.eql(maliciousBookmark.rating)
                    expect(badBookmark.description).to.eql(`Bad Image <img src="https://does.not.exist.h">`)
                    expect(badBookmark.id).to.eql(maliciousBookmark.id)
                })
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
    describe(`GET /bookmarks/:bookmark_id`, () => {
        context(`there is an xss attack`, () => {
            const maliciousBookmark = {
                id: 5,
                title: 'Blah Title <script>alert("xss");</script>',
                url: 'blah url',
                rating: 4,
                description: `Bad Image <img src="https://does.not.exist.h" onerror="alert(document.cookie);">`
            }
            beforeEach(`insert malicious bookmark into db`, () => {
                return db.into('bookmarks_info').insert(maliciousBookmark)
            })
            it(`sanitizes the bookmark`, () => {
                const bookmarkId = maliciousBookmark.id
                return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.id).to.eql(maliciousBookmark.id)
                    expect(res.body.title).to.eql('Blah Title &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(res.body.url).to.eql(maliciousBookmark.url)
                    expect(res.body.rating).to.eql(maliciousBookmark.rating)
                    expect(res.body.description).to.eql(`Bad Image <img src="https://does.not.exist.h">`)
                })
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
                    message: `Bookmark not found`
                }})
            })
        })
    })
    describe(`POST /bookmarks`, () => {
        it('creates a bookmark, responding with 201 and the bookmark', function() {
            const newBookmark = {
                title: 'Test',
                url: 'https://www.reddit.com',
                rating: 5,
                description: 'This is test'
            }
            return supertest(app)
            .post('/bookmarks')
            .send(newBookmark)
            .expect(201)
            .expect(res => {
                expect(res.body.title).to.eql(newBookmark.title)
                expect(res.body.url).to.eql(newBookmark.url)
                expect(res.body.rating).to.eql(newBookmark.rating)
                expect(res.body.description).to.eql(newBookmark.description)
                expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
            })
            .then(postRes => {
                supertest(app)
                .get(`/bookmarks/${postRes.body.id}`)
                .expect(postRes.body)
            })
        })
    })
    describe(`POST xss attack`, () => {
        context(`Given the posted bookmark has xss attack`, () => {
            const maliciousBookmark = {
                title: 'Blah Title <script>alert("xss");</script>',
                url: 'https://www.reddit.com',
                rating: 4,
                description: `Bad Image <img src="https://does.not.exist.h" onerror="alert(document.cookie);">`
            }
            it(`sanitizes the bookmark`, () => {
                return supertest(app)
                .post('/bookmarks')
                .send(maliciousBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql('Blah Title &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(res.body.url).to.eql(maliciousBookmark.url)
                    expect(res.body.rating).to.eql(maliciousBookmark.rating)
                    expect(res.body.description).to.eql(`Bad Image <img src="https://does.not.exist.h">`)
                    expect(res.body).to.have.property('id')
                })
            })
        })
    })
    describe(`DELETE /bookmarks/:bookmark_id`, () => {
        context(`Given the database has bookmarks`, () => {
            beforeEach(`add data to table`, () => {
                return db.into('bookmarks_info').insert(testBookmark)
            })
            it(`returns 204 and deletes the bookmark`, () => {
                const bmID = 2
                const expectedBookmarks = testBookmark.filter(item => item.id !== bmID)

                return supertest(app)
                .delete(`/bookmarks/${bmID}`)
                .expect(204)
                .then(res => {
                    
                    supertest(app)
                    .get('/bookmarks')
                    .expect(expectedBookmarks)
                })
            })

        })
        context(`Given the bookmark doesn't exist`, () => {
            it(`Returns 404`, () => {
                const bmId = 123333333
                return supertest(app)
                    .delete(`/bookmarks/${bmId}`)
                    .expect(404, {
                        error: { message: 'Bookmark not found'}
                    })
            })
        })
    })
})