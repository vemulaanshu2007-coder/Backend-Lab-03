const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// SQLite database is created automatically in this project folder.
const db = new Database("books.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0)
  )
`);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Books REST API" });
});

// GET /books?search_q=...&order_by=title&order=ASC&limit=10&offset=0&min_price=100&max_price=500
app.get("/books", (req, res) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = "10",
      offset = "0",
      min_price,
      max_price
    } = req.query;

    const allowedColumns = ["id", "title", "author", "price"];
    const sortOrder = String(order).toUpperCase();

    if (!allowedColumns.includes(order_by)) {
      return res.status(400).json({ message: "Invalid order_by. Use id, title, author or price." });
    }
    if (!["ASC", "DESC"].includes(sortOrder)) {
      return res.status(400).json({ message: "Invalid order. Use ASC or DESC." });
    }

    const pageLimit = Number(limit);
    const pageOffset = Number(offset);
    if (!Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 100 ||
        !Number.isInteger(pageOffset) || pageOffset < 0) {
      return res.status(400).json({ message: "Limit must be 1-100 and offset must be 0 or greater." });
    }

    const conditions = [];
    const values = [];

    if (typeof search_q !== "string") {
      return res.status(400).json({ message: "search_q must be a single text value." });
    }
    if (search_q.trim()) {
      conditions.push("title LIKE ?");
      values.push(`%${search_q.trim()}%`);
    }

    const min = min_price === undefined ? undefined : Number(min_price);
    const max = max_price === undefined ? undefined : Number(max_price);

    if (min_price !== undefined && (!Number.isFinite(min) || String(min_price).trim() === "")) {
      return res.status(400).json({ message: "min_price must be numeric." });
    }
    if (max_price !== undefined && (!Number.isFinite(max) || String(max_price).trim() === "")) {
      return res.status(400).json({ message: "max_price must be numeric." });
    }
    if (min !== undefined && max !== undefined && min > max) {
      return res.status(400).json({ message: "min_price cannot be greater than max_price." });
    }
    if (min !== undefined && max !== undefined) {
      conditions.push("price BETWEEN ? AND ?");
      values.push(min, max);
    } else if (min !== undefined) {
      conditions.push("price >= ?");
      values.push(min);
    } else if (max !== undefined) {
      conditions.push("price <= ?");
      values.push(max);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    // order_by and order are allow-listed above; all user values use placeholders.
    const sql = `
      SELECT id, title, author, price
      FROM books
      ${whereClause}
      ORDER BY ${order_by} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const books = db.prepare(sql).all(...values, pageLimit, pageOffset);
    return res.status(200).json({
      message: "Books fetched successfully",
      count: books.length,
      books
    });
  } catch (error) {
    console.error("GET /books error:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// POST /books
app.post("/books", (req, res) => {
  try {
    const { title, author, price } = req.body || {};

    if (typeof title !== "string" || !title.trim() ||
        typeof author !== "string" || !author.trim() ||
        typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        message: "Valid title, author and non-negative numeric price are required."
      });
    }

    const result = db.prepare(
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)"
    ).run(title.trim(), author.trim(), price);

    const book = db.prepare("SELECT id, title, author, price FROM books WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({ message: "Book created successfully.", book });
  } catch (error) {
    console.error("POST /books error:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// PUT /books/:id
app.put("/books/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Book id must be a positive integer." });
    }

    const existingBook = db.prepare("SELECT id FROM books WHERE id = ?").get(id);
    if (!existingBook) {
      return res.status(404).json({ message: "Book not found." });
    }

    const { title, author, price } = req.body || {};
    if (typeof title !== "string" || !title.trim() ||
        typeof author !== "string" || !author.trim() ||
        typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        message: "Valid title, author and non-negative numeric price are required."
      });
    }

    db.prepare(
      "UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?"
    ).run(title.trim(), author.trim(), price, id);

    const book = db.prepare("SELECT id, title, author, price FROM books WHERE id = ?").get(id);
    return res.status(200).json({ message: "Book updated successfully.", book });
  } catch (error) {
    console.error("PUT /books/:id error:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// DELETE /books/:id
app.delete("/books/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Book id must be a positive integer." });
    }

    const result = db.prepare("DELETE FROM books WHERE id = ?").run(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: "Book not found." });
    }

    return res.status(200).json({ message: "Book deleted successfully." });
  } catch (error) {
    console.error("DELETE /books/:id error:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Consistent JSON response for invalid routes.
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Handle malformed JSON bodies.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON body." });
  }
  console.error(err);
  return res.status(500).json({ message: "Internal server error." });
});

const server = app.listen(PORT, () => {
  console.log(`Books API running at http://localhost:${PORT}`);
});

// Graceful shutdown closes the database connection.
process.on("SIGINT", () => {
  db.close();
  server.close(() => process.exit(0));
});
