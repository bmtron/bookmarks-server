const BookmarksService = {
    getAllBookmarks(knex) {
        return knex.select('*').from('bookmarks_info')
    },
    insertBookmark(knex, newBookmark) {
        return knex.insert(newBookmark)
            .into('bookmarks_info')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex.from('bookmarks_info').select('*').where('id', id).first()
    },
    deleteBookmark(knex, id) {
        return knex('bookmarks_info')
           .where({id})
           .delete()
    },
    updateBookmark(knex, id, updatedBookmark) {
        return knex('bookmarks_info')
            .where({id})
            .update(updatedBookmark)
    }
}

module.exports = BookmarksService