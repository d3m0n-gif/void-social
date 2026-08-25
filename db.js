const { Pool } = require("pg");

const pool = new Pool({
connectionString: process.env.DATABASE_URL,

// Render PostgreSQL normally uses SSL.
ssl: process.env.NODE_ENV === "production"
? { rejectUnauthorized: false }
: false
});

pool.on("error", (err) => {
console.error("Unexpected PostgreSQL error:", err);
});

async function query(text, params) {
return pool.query(text, params);
}

async function testDatabase() {
try {
const result = await pool.query("SELECT NOW() AS time");

```
console.log("======================================");
console.log(" PostgreSQL connected");
console.log(` Database time: ${result.rows[0].time}`);
console.log("======================================");

return true;
```

} catch (error) {
console.error("PostgreSQL connection failed:");
console.error(error.message);

```
return false;
```

}
}

module.exports = {
pool,
query,
testDatabase
};
