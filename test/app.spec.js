
const app = require('../src/app')

describe('App', () => {
    it('GET / responsds with 200 containing hello world', () => {
        return supertest(app)
        .get('/')
        .expect(200, 'Hello, boilerplate!')
    })
})