// ============================================
// BOOK MANAGEMENT REST API
// Complete CRUD Operations with In-Memory Storage
// ============================================

// Import required modules
const express = require("express");

// Create Express application
const app = express();

// ============================================
// MIDDLEWARE
// ============================================
// Parse JSON bodies from incoming requests
app.use(express.json());

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// DATA STORAGE (In-Memory)
// ============================================
// Array to store books (acts as our database)
let books = [];

// Counter for generating unique IDs
let nextId = 1;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Find a book by ID
 * @param {number} id - Book ID to find
 * @returns {object|null} - Book object and index or null
 */
function findBookById(id) {
  const index = books.findIndex((book) => book.id === id);
  if (index === -1) {
    return null;
  }
  return {
    book: books[index],
    index: index,
  };
}

/**
 * Validate book data
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @returns {object} - Validation result
 */
function validateBookData(title, author) {
  const errors = [];

  // Check if fields exist
  if (title === undefined || author === undefined) {
    return {
      isValid: false,
      errors: ["Title and author are required fields"],
    };
  }

  // Check data types
  if (typeof title !== "string") {
    errors.push("Title must be a string");
  }
  if (typeof author !== "string") {
    errors.push("Author must be a string");
  }

  // Check for empty strings after trimming
  if (typeof title === "string" && title.trim() === "") {
    errors.push("Title cannot be empty");
  }
  if (typeof author === "string" && author.trim() === "") {
    errors.push("Author cannot be empty");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

// ============================================
// ROUTE HANDLERS
// ============================================

/**
 * GET /books
 * Purpose: Retrieve all books
 * Response: 200 OK with array of books
 */
app.get("/books", (req, res) => {
  console.log("📖 GET /books - Retrieving all books");

  // Return empty array if no books, otherwise return all books
  res.status(200).json({
    success: true,
    count: books.length,
    data: books,
  });
});

/**
 * GET /books/:id
 * Purpose: Get a single book by ID
 * Response: 200 OK with book or 404 if not found
 */
app.get("/books/:id", (req, res) => {
  const id = parseInt(req.params.id);

  console.log(`📖 GET /books/${id} - Retrieving single book`);

  // Validate ID
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: "Invalid book ID format. ID must be a number.",
    });
  }

  // Check if ID is positive
  if (id <= 0) {
    return res.status(400).json({
      success: false,
      error: "Book ID must be a positive number.",
    });
  }

  const result = findBookById(id);

  if (!result) {
    return res.status(404).json({
      success: false,
      error: `Book with ID ${id} not found.`,
    });
  }

  res.status(200).json({
    success: true,
    data: result.book,
  });
});

/**
 * POST /books
 * Purpose: Add a new book
 * Request Body: { "title": "Book Title", "author": "Author Name" }
 * Response: 201 Created with the new book
 */
app.post("/books", (req, res) => {
  console.log("📝 POST /books - Adding new book");

  // Extract data from request body
  const { title, author } = req.body;

  // Validate book data
  const validation = validateBookData(title, author);

  if (!validation.isValid) {
    console.log("❌ Validation failed:", validation.errors);
    return res.status(400).json({
      success: false,
      errors: validation.errors,
      example: {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
      },
    });
  }

  // Trim whitespace
  const trimmedTitle = title.trim();
  const trimmedAuthor = author.trim();

  // Create new book object with metadata
  const newBook = {
    id: nextId++,
    title: trimmedTitle,
    author: trimmedAuthor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to books array
  books.push(newBook);

  console.log(
    `✅ Book added: ID ${newBook.id} - "${newBook.title}" by ${newBook.author}`,
  );

  // Send response with created book
  res.status(201).json({
    success: true,
    message: "Book created successfully",
    data: newBook,
  });
});

/**
 * PUT /books/:id
 * Purpose: Update an existing book
 * Request Body: { "title": "New Title", "author": "New Author" }
 * Response: 200 OK with updated book or 404 if not found
 */
app.put("/books/:id", (req, res) => {
  // Get ID from URL parameter and convert to number
  const id = parseInt(req.params.id);

  console.log(`📝 PUT /books/${id} - Updating book`);

  // Validate ID
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: "Invalid book ID format. ID must be a number.",
    });
  }

  // Check if ID is positive
  if (id <= 0) {
    return res.status(400).json({
      success: false,
      error: "Book ID must be a positive number.",
    });
  }

  // Get update data from request body
  const { title, author } = req.body;

  // Find the book
  const result = findBookById(id);

  // Check if book exists
  if (!result) {
    return res.status(404).json({
      success: false,
      error: `Book with ID ${id} not found.`,
    });
  }

  // Check if at least one field is provided
  if (!title && !author) {
    return res.status(400).json({
      success: false,
      error: "Provide at least one field to update (title or author).",
      example: {
        title: "Updated Title",
        author: "Updated Author",
      },
    });
  }

  // Track what was updated
  const updatedFields = [];

  // Update title if provided
  if (title !== undefined) {
    if (typeof title !== "string") {
      return res.status(400).json({
        success: false,
        error: "Title must be a string.",
      });
    }
    if (title.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Title cannot be empty.",
      });
    }
    books[result.index].title = title.trim();
    updatedFields.push("title");
  }

  // Update author if provided
  if (author !== undefined) {
    if (typeof author !== "string") {
      return res.status(400).json({
        success: false,
        error: "Author must be a string.",
      });
    }
    if (author.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Author cannot be empty.",
      });
    }
    books[result.index].author = author.trim();
    updatedFields.push("author");
  }

  // Update the updatedAt timestamp
  books[result.index].updatedAt = new Date().toISOString();

  console.log(
    `✅ Book updated: ID ${id} - Updated fields: ${updatedFields.join(", ")}`,
  );

  // Send response with updated book
  res.status(200).json({
    success: true,
    message: "Book updated successfully",
    updatedFields: updatedFields,
    data: books[result.index],
  });
});

/**
 * DELETE /books/:id
 * Purpose: Remove a book
 * Response: 200 OK with confirmation or 404 if not found
 */
app.delete("/books/:id", (req, res) => {
  // Get ID from URL parameter and convert to number
  const id = parseInt(req.params.id);

  console.log(`🗑️ DELETE /books/${id} - Deleting book`);

  // Validate ID
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: "Invalid book ID format. ID must be a number.",
    });
  }

  // Check if ID is positive
  if (id <= 0) {
    return res.status(400).json({
      success: false,
      error: "Book ID must be a positive number.",
    });
  }

  // Find the book
  const result = findBookById(id);

  // Check if book exists
  if (!result) {
    return res.status(404).json({
      success: false,
      error: `Book with ID ${id} not found.`,
    });
  }

  // Get book details for confirmation message
  const deletedBook = {
    id: id,
    title: books[result.index].title,
    author: books[result.index].author,
  };

  // Remove book from array
  books.splice(result.index, 1);

  console.log(`✅ Book deleted: ID ${id} - "${deletedBook.title}"`);

  // Send response with confirmation
  res.status(200).json({
    success: true,
    message: "Book deleted successfully",
    data: deletedBook,
  });
});

/**
 * DELETE /books
 * Purpose: Delete all books (utility endpoint)
 * Response: 200 OK with confirmation
 */
app.delete("/books", (req, res) => {
  console.log("🗑️ DELETE /books - Deleting all books");

  const count = books.length;

  // Store deleted books info for response
  const deletedBooks = [...books];

  // Clear the books array
  books = [];

  // Reset the ID counter
  nextId = 1;

  console.log(`✅ All books deleted (${count} books removed)`);

  res.status(200).json({
    success: true,
    message: "All books deleted successfully",
    count: count,
    data: deletedBooks,
  });
});

/**
 * GET /books/search/:query
 * Purpose: Search books by title or author
 * Response: 200 OK with matching books
 */
app.get("/books/search/:query", (req, res) => {
  const query = req.params.query.toLowerCase();

  console.log(`🔍 GET /books/search/${query} - Searching books`);

  if (!query || query.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Search query cannot be empty",
    });
  }

  const results = books.filter(
    (book) =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query),
  );

  res.status(200).json({
    success: true,
    query: req.params.query,
    count: results.length,
    data: results,
  });
});

// ============================================
// ROOT ROUTE
// ============================================
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Book Management API",
    version: "1.0.0",
    description: "A complete REST API for managing books",
    endpoints: {
      "GET /": "API information",
      "GET /books": "Get all books",
      "GET /books/:id": "Get a specific book",
      "GET /books/search/:query": "Search books by title or author",
      "POST /books": "Create a new book",
      "PUT /books/:id": "Update a book",
      "DELETE /books/:id": "Delete a specific book",
      "DELETE /books": "Delete all books",
    },
    documentation: "Send requests to http://localhost:3001/books",
    server: `http://localhost:3001`,
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler for undefined routes
app.use("*", (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      "GET /": "API information",
      "GET /books": "Get all books",
      "GET /books/:id": "Get a specific book (replace :id with number)",
      "GET /books/search/:query":
        "Search books (replace :query with search term)",
      "POST /books": "Create a new book (send JSON with title and author)",
      "PUT /books/:id": "Update a book (send JSON with fields to update)",
      "DELETE /books/:id": "Delete a specific book",
      "DELETE /books": "Delete all books",
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// START SERVER
// ============================================

// USING PORT 3001 TO AVOID EADDRINUSE ERROR
const PORT = 3001;

// Start the server
const server = app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 BOOK MANAGEMENT API SERVER");
  console.log("=".repeat(60));
  console.log(`✅ Server is running on: http://localhost:${PORT}`);
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log("\n📚 Available Endpoints:");
  console.log(`   🌐 GET    → http://localhost:${PORT}/`);
  console.log(`   📖 GET    → http://localhost:${PORT}/books`);
  console.log(`   📖 GET    → http://localhost:${PORT}/books/:id`);
  console.log(`   🔍 GET    → http://localhost:${PORT}/books/search/:query`);
  console.log(`   📝 POST   → http://localhost:${PORT}/books`);
  console.log(`   📝 PUT    → http://localhost:${PORT}/books/:id`);
  console.log(`   🗑️ DELETE → http://localhost:${PORT}/books/:id`);
  console.log(`   🗑️ DELETE → http://localhost:${PORT}/books`);
  console.log("\n📝 Sample Book Object:");
  console.log("   {");
  console.log('     "title": "The Great Gatsby",');
  console.log('     "author": "F. Scott Fitzgerald"');
  console.log("   }");
  console.log("\n🔧 Quick Test Commands:");
  console.log(`   Get all books:    curl http://localhost:${PORT}/books`);
  console.log(
    `   Add a book:       curl -X POST http://localhost:${PORT}/books -H "Content-Type: application/json" -d "{\\"title\\":\\"The Hobbit\\",\\"author\\":\\"J.R.R. Tolkien\\"}"`,
  );
  console.log("=".repeat(60) + "\n");
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});

// Export for testing
module.exports = { app, server };
