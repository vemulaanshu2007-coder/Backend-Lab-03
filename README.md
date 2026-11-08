# Lab 3: REST API, query parameters, validation, debugging

**Name:** [Your name]  
**Registration number:** [Your registration number]  
**Class & Section:** [Your section]  
**Subject:** Backend Development Fundamentals

## Live link
Not deployed yet. Add the public deployment URL here after deployment. If deployment is not possible, explain why and include Postman screenshots for every endpoint.

## Objective
Build a REST API for books with search, sorting, pagination, price filtering, input validation and correct HTTP status codes.

## Requirements
- Node.js 18 or later
- npm
- Postman
- VS Code (recommended)

## Installation and running

```bash
npm install
npm start
```

The server runs at `http://localhost:3000`.

The SQLite database file `books.db` is created automatically when the application starts. Do not commit `node_modules` or generated database files unless your faculty specifically asks for them.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | API welcome message |
| GET | `/books` | List books with optional search, sort, pagination and price filters |
| POST | `/books` | Add a book |
| PUT | `/books/:id` | Update a book |
| DELETE | `/books/:id` | Delete a book |

### GET query parameters

| Parameter | Default | Description |
|---|---|---|
| `search_q` | empty | Partial title search |
| `order_by` | `id` | `id`, `title`, `author` or `price` |
| `order` | `ASC` | `ASC` or `DESC` |
| `limit` | `10` | Number of records (1-100) |
| `offset` | `0` | Number of records to skip |
| `min_price` | none | Minimum price |
| `max_price` | none | Maximum price |

Examples:

```text
GET http://localhost:3000/books
GET http://localhost:3000/books?search_q=fire
GET http://localhost:3000/books?order_by=price&order=DESC
GET http://localhost:3000/books?limit=5&offset=0
GET http://localhost:3000/books?min_price=100&max_price=500
```

### POST and PUT JSON body

```json
{
  "title": "Wings of Fire",
  "author": "A.P.J. Abdul Kalam",
  "price": 250
}
```

## Expected status codes

- `200`: successful GET, PUT or DELETE
- `201`: book created
- `400`: invalid input or query parameter
- `404`: book or route not found
- `500`: unexpected server error

## Postman test checklist

- [ ] GET all books
- [ ] POST a valid book (201)
- [ ] POST with missing title (400)
- [ ] POST with text instead of numeric price (400)
- [ ] GET with partial title search
- [ ] GET with sorting in ascending and descending order
- [ ] GET with limit and offset
- [ ] GET with minimum and maximum price
- [ ] GET with invalid `order_by` (400)
- [ ] GET with invalid `order` (400)
- [ ] PUT an existing book (200)
- [ ] PUT a missing book ID (404)
- [ ] DELETE an existing book (200)
- [ ] DELETE a missing book ID (404)

## Debugging notes

Record the actual issue, its cause and the fix after testing. Lab topics include:
- `EADDRINUSE`: another process is already using the selected port.
- Wrong import path: check the file name and relative path.
- Table-name typo: make sure SQL uses the actual `books` table name.
- Missing `await`: when using asynchronous database methods, wait for the returned promise before using its result. This project uses `better-sqlite3`, whose database methods are synchronous, so `await` is not required for these database calls.

## Screenshots

Create a `screenshots/` folder and save Postman screenshots there. Add each screenshot below using Markdown, for example:

```md
![POST book success](screenshots/post-book-success.png)
```

## Notes: problems faced and how they were solved

[Write the errors you actually encountered and the steps you took to solve them.]

## GitHub submission

Place this folder as `lab-03/` inside your course repository. Add the public repository link here when ready.
