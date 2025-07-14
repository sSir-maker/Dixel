const Book = require('../models/book')

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures = require('../utils/apiFeatures');

// Create new book => /api/v1/admin/book/new

exports.newBook = catchAsyncErrors (async (req, res, next) => {

    req.body.user = req.user.id;

    const book = await Book.create(req.body);

    res.status(201).json({
        success: true,
        book
    })
})

// Get all books => /api/v1/books?keyword=
exports.getBooks = catchAsyncErrors (async (req, res, next) => {

    const resPerPage = 4;
    const bookCount = await Book.countDocuments();

    const apiFeatures = new APIFeatures(Book.find(), req.query)
        .search()
        .filter()
        .pagination(resPerPage)

    const books = await apiFeatures.query;

    res.status(200).json({
        success: true,
        count: books.length,
        bookCount,
        books  
    })
})


// Get a single book details => /api/v1/book/:id

exports.getSingleBook = catchAsyncErrors (async (req, res, next) => {

    //const book = await book.findById(req.params.id);

    const book = await Book.findById(req.params.id);

    if(!book) {
        return next(new ErrorHandler('Book not found', 404))
    }

    res.status(200).json({
        success: true,
        book
    })

})

// Update book => /api/v1/admin/book:id

exports.updateBook = catchAsyncErrors (async (req, res, next) => {

    let book = await Book.findById(req.params.id); 

    if(!book) {
        return next(new ErrorHandler('book not found', 404));
    }

    book = await Book.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        book 
    })

})

// Delete book  =>   /api/v1/admin/book/:id
exports.deleteBook = catchAsyncErrors (async (req, res, next) => {

    const book = await Book.findById(req.params.id);

    if(!book) {
        return next(new ErrorHandler('Book not found', 404));
    }

    await Book.deleteOne(book)

    res.status(200).json({
        success: true,
        message: 'Book is deleted.' 
    })

})